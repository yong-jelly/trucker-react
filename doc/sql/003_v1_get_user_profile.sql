-- =====================================================
-- 003_v1_get_user_profile.sql
-- 사용자 프로필(User Profile) 관련 API
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/003_v1_get_user_profile.sql
-- =====================================================

-- 1. 사용자 프로필 조회 (실제 함수: trucker 스키마)
CREATE OR REPLACE FUNCTION trucker.v1_get_user_profile(p_auth_user_id uuid)
RETURNS trucker.tbl_user_profile
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_profile trucker.tbl_user_profile;
BEGIN
    SELECT * INTO v_profile FROM trucker.tbl_user_profile WHERE auth_user_id = p_auth_user_id;
    RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_user_profile IS '특정 사용자의 프로필 정보를 조회합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_user_profile TO authenticated;

-- 2. 사용자 프로필 생성 또는 수정 (Upsert)
CREATE OR REPLACE FUNCTION trucker.v1_upsert_user_profile(
    p_auth_user_id uuid,
    p_profile jsonb
)
RETURNS trucker.tbl_user_profile
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_profile trucker.tbl_user_profile;
BEGIN
    INSERT INTO trucker.tbl_user_profile (
        auth_user_id,
        nickname,
        bio,
        avatar_url,
        telegram_chat_id,
        slack_webhook_url,
        notification_enabled,
        updated_at
    ) VALUES (
        p_auth_user_id,
        p_profile->>'nickname',
        p_profile->>'bio',
        p_profile->>'avatar_url',
        p_profile->>'telegram_chat_id',
        p_profile->>'slack_webhook_url',
        COALESCE((p_profile->>'notification_enabled')::boolean, true),
        now()
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        telegram_chat_id = EXCLUDED.telegram_chat_id,
        slack_webhook_url = EXCLUDED.slack_webhook_url,
        notification_enabled = EXCLUDED.notification_enabled,
        updated_at = now()
    RETURNING * INTO v_profile;

    RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION trucker.v1_upsert_user_profile IS '사용자 프로필을 생성하거나 수정합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_upsert_user_profile TO authenticated;
