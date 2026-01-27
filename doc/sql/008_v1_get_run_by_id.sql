-- =====================================================
-- 008_v1_get_run_by_id.sql
-- 특정 운행 상세 조회 API
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/008_v1_get_run_by_id.sql
-- =====================================================

-- 특정 운행 상세 조회 (주문 정보 포함)
CREATE OR REPLACE FUNCTION trucker.v1_get_run_by_id(p_run_id uuid)
RETURNS TABLE (
    run_id uuid,
    user_id uuid,
    order_id uuid,
    slot_id uuid,
    status text,
    start_at timestamp with time zone,
    eta_seconds integer,
    deadline_at timestamp with time zone,
    selected_equipment_id text,
    selected_document_id text,
    selected_insurance_id text,
    current_reward bigint,
    accumulated_penalty bigint,
    accumulated_bonus bigint,
    current_risk float,
    current_durability integer,
    current_fuel float,
    -- 주문 정보
    order_title text,
    order_category text,
    order_cargo_name text,
    order_distance float,
    order_base_reward bigint,
    order_limit_time_minutes integer,
    order_start_lat float,
    order_start_lng float,
    order_end_lat float,
    order_end_lng float,
    order_required_equipment_type text,
    -- 슬롯 정보
    slot_index integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as run_id,
        r.user_id,
        r.order_id,
        r.slot_id,
        r.status,
        r.start_at,
        r.eta_seconds,
        r.deadline_at,
        r.selected_equipment_id,
        r.selected_document_id,
        r.selected_insurance_id,
        r.current_reward,
        r.accumulated_penalty,
        r.accumulated_bonus,
        r.current_risk,
        r.current_durability,
        r.current_fuel,
        -- 주문 정보
        o.title as order_title,
        o.category as order_category,
        o.cargo_name as order_cargo_name,
        o.distance as order_distance,
        o.base_reward as order_base_reward,
        o.limit_time_minutes as order_limit_time_minutes,
        o.start_lat as order_start_lat,
        o.start_lng as order_start_lng,
        o.end_lat as order_end_lat,
        o.end_lng as order_end_lng,
        o.required_equipment_type as order_required_equipment_type,
        -- 슬롯 정보
        s.index as slot_index
    FROM trucker.tbl_runs r
    JOIN trucker.tbl_orders o ON r.order_id = o.id
    JOIN trucker.tbl_slots s ON r.slot_id = s.id
    WHERE r.id = p_run_id;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_run_by_id IS '특정 운행의 상세 정보를 주문/슬롯 정보와 함께 조회합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_run_by_id TO authenticated;
