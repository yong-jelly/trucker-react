-- =====================================================
-- 006_v1_get_user_slots.sql
-- 유저 슬롯 조회 API
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/006_v1_get_user_slots.sql
-- =====================================================

-- 유저의 슬롯 목록 조회
CREATE OR REPLACE FUNCTION trucker.v1_get_user_slots(p_user_id uuid)
RETURNS SETOF trucker.tbl_slots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    -- 프로필이 없으면 빈 결과 반환 (외래키 제약 조건 위반 방지)
    IF NOT EXISTS (SELECT 1 FROM trucker.tbl_user_profile WHERE auth_user_id = p_user_id) THEN
        RETURN;
    END IF;

    -- 슬롯이 없으면 자동 생성 (기존 유저 또는 트리거 미작동 대응)
    IF NOT EXISTS (SELECT 1 FROM trucker.tbl_slots WHERE user_id = p_user_id) THEN
        INSERT INTO trucker.tbl_slots (user_id, index, is_locked) VALUES
            (p_user_id, 0, false),
            (p_user_id, 1, true),
            (p_user_id, 2, true);
    END IF;

    RETURN QUERY
    SELECT * FROM trucker.tbl_slots
    WHERE user_id = p_user_id
    ORDER BY index ASC;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_user_slots IS '유저의 슬롯 목록을 조회합니다. 슬롯이 없으면 자동 생성합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_user_slots TO authenticated;
