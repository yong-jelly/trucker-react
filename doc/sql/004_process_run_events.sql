-- =====================================================
-- 004_process_run_events.sql
-- 서버사이드 이벤트 처리 및 자동 정산 로직 (pg_cron 연동)
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/004_process_run_events.sql
-- =====================================================

-- 등록된 모든 크론 작업 목록 확인
-- SELECT * FROM cron.job;
-- 1. 이벤트 처리 및 자동 정산 함수
CREATE OR REPLACE FUNCTION trucker.process_run_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
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
    v_final_reward bigint;
BEGIN
    -- 시스템 설정 로드
    SELECT value INTO config_prob FROM trucker.tbl_system_config WHERE id = 'enforcement_base_prob';
    SELECT value INTO config_penalties FROM trucker.tbl_system_config WHERE id = 'enforcement_penalties';
    
    -- 기본값 설정
    IF config_prob IS NULL THEN config_prob := '{"normal": 0.05}'; END IF;
    IF config_penalties IS NULL THEN config_penalties := '{"document": 300, "bypass": 720, "evasion_success": 0, "evasion_fail": 1200}'; END IF;
    base_prob := (config_prob->>'normal')::float;

    -- 1) 진행 중인 모든 운행에 대해 이벤트 체크
    FOR run_record IN 
        SELECT * FROM trucker.tbl_runs WHERE status = 'IN_TRANSIT'
    LOOP
        -- A. 자동 정산 체크 (도착 시간 경과 여부)
        -- 현재 시간이 deadline_at(또는 start_at + eta_seconds)을 지났는지 확인
        -- 여기서는 단순화를 위해 now()가 start_at + eta_seconds를 지났으면 완료 처리
        IF now() >= (run_record.start_at + (run_record.eta_seconds || ' seconds')::interval) THEN
            -- 정산 로직 실행
            -- 지연 페널티 계산 (ActiveRun.tsx 로직 참고)
            penalty_amount := 0;
            IF now() > (run_record.start_at + (run_record.eta_seconds || ' seconds')::interval) THEN
                -- 지연 시간(분) 계산
                delay_seconds := extract(epoch from (now() - (run_record.start_at + (run_record.eta_seconds || ' seconds')::interval)))::integer;
                -- 1분당 0.2 페널티, 최대 50%
                penalty_amount := LEAST(
                    (run_record.current_reward * 0.5)::bigint,
                    (floor(delay_seconds / 60) * 0.2)::bigint
                );
            END IF;

            v_final_reward := run_record.current_reward - penalty_amount;

            -- v1_complete_run 함수 호출하여 정산 완료
            PERFORM trucker.v1_complete_run(
                run_record.id,
                v_final_reward,
                penalty_amount + run_record.accumulated_penalty,
                extract(epoch from (now() - run_record.start_at))::integer
            );
            
            CONTINUE; -- 정산 완료된 건은 이벤트 체크 건너뜀
        END IF;

        -- B. 랜덤 이벤트 체크 (단속 등)
        random_val := random();
        IF random_val < base_prob THEN
            penalty_amount := 0;
            delay_seconds := 0;
            
            IF run_record.selected_document_id IS NOT NULL THEN
                event_type := 'POLICE';
                event_title := '단속 검문 (서류 제시)';
                event_desc := '필수 서류를 제시하여 무사히 통과했습니다.';
                delay_seconds := (config_penalties->>'document')::integer;
            ELSE
                IF random() < 0.5 THEN
                    event_type := 'POLICE';
                    event_title := '단속 우회';
                    event_desc := '검문소를 발견하고 우회로로 진입했습니다.';
                    delay_seconds := (config_penalties->>'bypass')::integer;
                ELSE
                    IF random() < 0.4 THEN
                        event_type := 'BONUS';
                        event_title := '단속 돌파 성공';
                        event_desc := '과속으로 검문소를 따돌렸습니다! 시간을 절약했습니다.';
                        delay_seconds := (config_penalties->>'evasion_success')::integer;
                    ELSE
                        event_type := 'PENALTY';
                        event_title := '단속 적발 (돌파 실패)';
                        event_desc := '도주에 실패하여 벌금이 부과되었습니다.';
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

            -- Run 상태 업데이트
            UPDATE trucker.tbl_runs
            SET 
                accumulated_penalty = accumulated_penalty + penalty_amount,
                eta_seconds = eta_seconds + delay_seconds,
                current_risk = LEAST(current_risk + 0.05, 1.0)
            WHERE id = run_record.id;
        END IF;
    END LOOP;
END;
$$;

-- 2. pg_cron 스케줄링 등록 (Supabase 대시보드 SQL Editor에서 실행 권장)
-- DO $$
-- BEGIN
--     -- 기존 작업이 있다면 삭제
--     PERFORM cron.unschedule('process-run-events');
-- EXCEPTION WHEN OTHERS THEN
--     -- 작업이 없으면 무시
-- END $$;

-- SELECT cron.schedule(
--     'process-run-events',
--     '* * * * *', -- 매 분 실행
--     'SELECT trucker.process_run_events()'
-- );
