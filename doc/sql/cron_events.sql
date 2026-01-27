-- =====================================================
-- 서버사이드 이벤트 처리 로직 (pg_cron 연동)
-- 실행 방법:
--   psql ... -f doc/sql/cron_events.sql
-- 전제 조건:
--   pg_cron 확장이 활성화되어 있어야 합니다.
--   trucker 스키마와 테이블들이 생성되어 있어야 합니다.
-- =====================================================

-- 1. 이벤트 처리 함수 정의
CREATE OR REPLACE FUNCTION trucker.process_run_events()
RETURNS void AS $$
DECLARE
    run_record RECORD;
    config_prob jsonb;
    config_penalties jsonb;
    base_prob float;
    random_val float;
    event_type text;
    event_title text;
    event_desc text;
    penalty_amount bigint;
    delay_seconds integer;
BEGIN
    -- 시스템 설정 로드 (없으면 기본값 사용)
    BEGIN
        SELECT value INTO config_prob FROM trucker.tbl_system_config WHERE id = 'enforcement_base_prob';
        SELECT value INTO config_penalties FROM trucker.tbl_system_config WHERE id = 'enforcement_penalties';
    EXCEPTION WHEN OTHERS THEN
        -- 테이블이 없거나 오류 발생 시 기본값 설정
        config_prob := '{"normal": 0.05}';
        config_penalties := '{"document": 300, "bypass": 720, "evasion_success": 0, "evasion_fail": 1200}';
    END;
    
    -- NULL 체크
    IF config_prob IS NULL THEN config_prob := '{"normal": 0.05}'; END IF;
    IF config_penalties IS NULL THEN config_penalties := '{"document": 300, "bypass": 720, "evasion_success": 0, "evasion_fail": 1200}'; END IF;

    base_prob := (config_prob->>'normal')::float;

    -- 진행 중인 모든 운행에 대해 이벤트 체크
    FOR run_record IN 
        SELECT * FROM trucker.tbl_runs WHERE status = 'IN_TRANSIT'
    LOOP
        random_val := random();
        
        -- 단속 이벤트 발생 (기본 5%)
        -- 실제로는 과속 여부 등을 체크해야 하지만, 현재는 랜덤 확률만 적용
        IF random_val < base_prob THEN
            penalty_amount := 0;
            delay_seconds := 0;
            
            -- 자동 대응 로직
            IF run_record.selected_document_id IS NOT NULL THEN
                -- 1. 서류 제시 (가장 안전, 시간 소요 적음)
                event_type := 'POLICE';
                event_title := '단속 검문 (서류 제시)';
                event_desc := '필수 서류를 제시하여 무사히 통과했습니다.';
                delay_seconds := (config_penalties->>'document')::integer;
            ELSE
                -- 서류 없음 -> 우회 또는 돌파
                -- 여기서는 50:50 확률로 우회/돌파 결정 (또는 성향에 따라 다를 수 있음)
                IF random() < 0.5 THEN
                    -- 2. 우회 (시간 소요 큼, 안전)
                    event_type := 'POLICE';
                    event_title := '단속 우회';
                    event_desc := '검문소를 발견하고 우회로로 진입했습니다.';
                    delay_seconds := (config_penalties->>'bypass')::integer;
                ELSE
                    -- 3. 돌파 시도 (도박)
                    IF random() < 0.4 THEN -- 40% 성공
                        event_type := 'BONUS'; -- 긍정적 이벤트
                        event_title := '단속 돌파 성공';
                        event_desc := '과속으로 검문소를 따돌렸습니다! 시간을 절약했습니다.';
                        delay_seconds := (config_penalties->>'evasion_success')::integer;
                    ELSE
                        -- 실패
                        event_type := 'PENALTY';
                        event_title := '단속 적발 (돌파 실패)';
                        event_desc := '도주에 실패하여 벌금이 부과되었습니다.';
                        delay_seconds := 0; 
                        penalty_amount := (config_penalties->>'evasion_fail')::bigint;
                    END IF;
                END IF;
            END IF;

            -- 이벤트 로그 기록
            INSERT INTO trucker.tbl_event_logs (
                run_id, type, title, description, amount, eta_change_seconds, is_estimated
            ) VALUES (
                run_record.id, event_type, event_title, event_desc, -penalty_amount, delay_seconds, false
            );

            -- Run 상태 업데이트 (누적 패널티 및 ETA 반영)
            -- ETA가 늘어나면 마감 시간(deadline_at)은 그대로지만 도착 예정 시간이 늦어짐
            -- 여기서는 eta_seconds(남은 시간 아님, 총 소요 시간?) -> 스키마 정의상 eta_seconds는 '예상 소요 시간'
            -- 따라서 eta_seconds를 늘려주면 됨.
            UPDATE trucker.tbl_runs
            SET 
                accumulated_penalty = accumulated_penalty + penalty_amount,
                eta_seconds = eta_seconds + delay_seconds,
                current_risk = LEAST(current_risk + 0.05, 1.0) -- 단속 걸리면 위험도 약간 상승
            WHERE id = run_record.id;
            
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. pg_cron 스케줄링 등록
-- 주의: pg_cron 확장이 설치된 데이터베이스(주로 postgres)에서 실행해야 함
-- Supabase 대시보드의 SQL Editor에서 실행 권장

-- SELECT cron.schedule(
--     'process-run-events', -- job name
--     '* * * * *',          -- every minute
--     'SELECT trucker.process_run_events()'
-- );

-- 스케줄 확인
-- SELECT * FROM cron.job;

-- 스케줄 삭제
-- SELECT cron.unschedule('process-run-events');
