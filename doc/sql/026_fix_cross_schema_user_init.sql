-- =====================================================
-- 026_fix_cross_schema_user_init.sql
-- 다른 스키마에서 가입한 유저가 trucker 프로젝트 접속 시
-- 프로필/슬롯/장비가 올바르게 초기화되도록 수정
-- 
-- 문제: auth.users는 Supabase 전체에서 공유되므로,
-- 다른 프로젝트(mmcheck 등)에서 이미 가입한 유저가 trucker 접속 시
-- handle_new_user 트리거가 실행되지 않음
-- 
-- 해결: v1_get_user_profile, v1_upsert_user_profile 함수에서
-- 신규 프로필 생성 시 슬롯과 기본 장비도 함께 생성
--
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/026_fix_cross_schema_user_init.sql
-- =====================================================

-- =====================================================
-- 1. v1_get_user_profile 수정 - 장비 지급 로직 추가
-- =====================================================
-- 참고: tbl_slots.user_id는 tbl_user_profile.public_profile_id를 참조함
CREATE OR REPLACE FUNCTION trucker.v1_get_user_profile(p_auth_user_id uuid)
RETURNS trucker.tbl_user_profile
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_profile trucker.tbl_user_profile;
    v_email TEXT;
    v_nickname TEXT;
    v_random_suffix TEXT;
    v_default_equipment RECORD;
BEGIN
    -- 1. 기존 프로필 조회
    SELECT * INTO v_profile FROM trucker.tbl_user_profile WHERE auth_user_id = p_auth_user_id;
    
    -- 2. 프로필이 없으면 자동 생성 (다른 스키마에서 가입한 유저 대응)
    IF v_profile IS NULL THEN
        -- auth.users에서 이메일 가져오기
        SELECT email INTO v_email FROM auth.users WHERE id = p_auth_user_id;
        
        -- 닉네임 생성
        v_nickname := split_part(COALESCE(v_email, 'trucker'), '@', 1);
        v_nickname := left(v_nickname, 20);
        v_random_suffix := floor(random() * 9000 + 1000)::text;
        v_nickname := v_nickname || '_' || v_random_suffix;
        
        -- 프로필 생성
        INSERT INTO trucker.tbl_user_profile (auth_user_id, nickname)
        VALUES (p_auth_user_id, v_nickname)
        RETURNING * INTO v_profile;
        
        -- 기본 슬롯 3개 생성 (첫 번째만 해금) - public_profile_id 사용
        INSERT INTO trucker.tbl_slots (user_id, index, is_locked) VALUES
            (v_profile.public_profile_id, 0, false),
            (v_profile.public_profile_id, 1, true),
            (v_profile.public_profile_id, 2, true)
        ON CONFLICT (user_id, index) DO NOTHING;
        
        -- 기본 장비 자동 지급 (is_default = true인 장비들)
        FOR v_default_equipment IN 
            SELECT id FROM trucker.tbl_equipments WHERE is_default = true AND is_active = true
        LOOP
            INSERT INTO trucker.tbl_user_equipments (user_id, equipment_id, is_equipped)
            VALUES (v_profile.public_profile_id, v_default_equipment.id, true)
            ON CONFLICT (user_id, equipment_id) DO NOTHING;
        END LOOP;
    ELSE
        -- 3. 프로필은 있지만 슬롯/장비가 없는 경우 복구 (기존 버그 대응)
        -- 슬롯이 없으면 생성 (public_profile_id 사용)
        IF NOT EXISTS (SELECT 1 FROM trucker.tbl_slots WHERE user_id = v_profile.public_profile_id) THEN
            INSERT INTO trucker.tbl_slots (user_id, index, is_locked) VALUES
                (v_profile.public_profile_id, 0, false),
                (v_profile.public_profile_id, 1, true),
                (v_profile.public_profile_id, 2, true)
            ON CONFLICT (user_id, index) DO NOTHING;
        END IF;
        
        -- 기본 장비가 없으면 지급
        IF NOT EXISTS (
            SELECT 1 FROM trucker.tbl_user_equipments 
            WHERE user_id = v_profile.public_profile_id
        ) THEN
            FOR v_default_equipment IN 
                SELECT id FROM trucker.tbl_equipments WHERE is_default = true AND is_active = true
            LOOP
                INSERT INTO trucker.tbl_user_equipments (user_id, equipment_id, is_equipped)
                VALUES (v_profile.public_profile_id, v_default_equipment.id, true)
                ON CONFLICT (user_id, equipment_id) DO NOTHING;
            END LOOP;
        END IF;
    END IF;
    
    RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_user_profile IS '특정 사용자의 프로필 정보를 조회합니다. 프로필이 없으면 슬롯/장비와 함께 자동 생성됩니다.';

-- =====================================================
-- 2. v1_upsert_user_profile 수정 - 신규 INSERT 시 슬롯/장비 생성
-- =====================================================
-- 참고: tbl_slots.user_id는 tbl_user_profile.public_profile_id를 참조함
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
    v_is_new_profile boolean := false;
    v_default_equipment RECORD;
BEGIN
    -- 기존 프로필 존재 여부 확인
    SELECT NOT EXISTS (
        SELECT 1 FROM trucker.tbl_user_profile WHERE auth_user_id = p_auth_user_id
    ) INTO v_is_new_profile;

    -- 프로필 UPSERT
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
    ON CONFLICT (auth_user_id) WHERE auth_user_id IS NOT NULL DO UPDATE SET
        nickname = EXCLUDED.nickname,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        telegram_chat_id = EXCLUDED.telegram_chat_id,
        slack_webhook_url = EXCLUDED.slack_webhook_url,
        notification_enabled = EXCLUDED.notification_enabled,
        updated_at = now()
    RETURNING * INTO v_profile;

    -- 신규 프로필인 경우 슬롯과 장비 생성 (public_profile_id 사용)
    IF v_is_new_profile THEN
        -- 기본 슬롯 3개 생성 (첫 번째만 해금)
        INSERT INTO trucker.tbl_slots (user_id, index, is_locked) VALUES
            (v_profile.public_profile_id, 0, false),
            (v_profile.public_profile_id, 1, true),
            (v_profile.public_profile_id, 2, true)
        ON CONFLICT (user_id, index) DO NOTHING;
        
        -- 기본 장비 자동 지급 (is_default = true인 장비들)
        FOR v_default_equipment IN 
            SELECT id FROM trucker.tbl_equipments WHERE is_default = true AND is_active = true
        LOOP
            INSERT INTO trucker.tbl_user_equipments (user_id, equipment_id, is_equipped)
            VALUES (v_profile.public_profile_id, v_default_equipment.id, true)
            ON CONFLICT (user_id, equipment_id) DO NOTHING;
        END LOOP;
    ELSE
        -- 기존 유저지만 슬롯/장비가 없는 경우 복구 (public_profile_id 사용)
        IF NOT EXISTS (SELECT 1 FROM trucker.tbl_slots WHERE user_id = v_profile.public_profile_id) THEN
            INSERT INTO trucker.tbl_slots (user_id, index, is_locked) VALUES
                (v_profile.public_profile_id, 0, false),
                (v_profile.public_profile_id, 1, true),
                (v_profile.public_profile_id, 2, true)
            ON CONFLICT (user_id, index) DO NOTHING;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM trucker.tbl_user_equipments 
            WHERE user_id = v_profile.public_profile_id
        ) THEN
            FOR v_default_equipment IN 
                SELECT id FROM trucker.tbl_equipments WHERE is_default = true AND is_active = true
            LOOP
                INSERT INTO trucker.tbl_user_equipments (user_id, equipment_id, is_equipped)
                VALUES (v_profile.public_profile_id, v_default_equipment.id, true)
                ON CONFLICT (user_id, equipment_id) DO NOTHING;
            END LOOP;
        END IF;
    END IF;

    RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION trucker.v1_upsert_user_profile IS '사용자 프로필을 생성하거나 수정합니다. 신규 생성 시 슬롯과 기본 장비도 함께 생성됩니다.';

-- =====================================================
-- 3. 기존 문제 유저 복구 (슬롯/장비 누락 유저)
-- 참고: tbl_slots.user_id는 tbl_user_profile.public_profile_id를 참조함
-- =====================================================

-- 3-1. 슬롯이 없는 유저에게 슬롯 생성 (public_profile_id 사용)
INSERT INTO trucker.tbl_slots (user_id, index, is_locked)
SELECT p.public_profile_id, 0, false
FROM trucker.tbl_user_profile p
WHERE NOT EXISTS (
    SELECT 1 FROM trucker.tbl_slots s WHERE s.user_id = p.public_profile_id
)
ON CONFLICT (user_id, index) DO NOTHING;

INSERT INTO trucker.tbl_slots (user_id, index, is_locked)
SELECT p.public_profile_id, 1, true
FROM trucker.tbl_user_profile p
WHERE NOT EXISTS (
    SELECT 1 FROM trucker.tbl_slots s WHERE s.user_id = p.public_profile_id AND s.index = 1
)
ON CONFLICT (user_id, index) DO NOTHING;

INSERT INTO trucker.tbl_slots (user_id, index, is_locked)
SELECT p.public_profile_id, 2, true
FROM trucker.tbl_user_profile p
WHERE NOT EXISTS (
    SELECT 1 FROM trucker.tbl_slots s WHERE s.user_id = p.public_profile_id AND s.index = 2
)
ON CONFLICT (user_id, index) DO NOTHING;

-- 3-2. 기본 장비가 없는 유저에게 장비 지급
INSERT INTO trucker.tbl_user_equipments (user_id, equipment_id, is_equipped)
SELECT 
    p.public_profile_id,
    e.id,
    true
FROM trucker.tbl_user_profile p
CROSS JOIN trucker.tbl_equipments e
WHERE e.is_default = true AND e.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM trucker.tbl_user_equipments ue 
    WHERE ue.user_id = p.public_profile_id AND ue.equipment_id = e.id
)
ON CONFLICT (user_id, equipment_id) DO NOTHING;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
DECLARE
    v_fixed_slots integer;
    v_fixed_equipments integer;
BEGIN
    SELECT COUNT(*) INTO v_fixed_slots 
    FROM trucker.tbl_user_profile p
    WHERE EXISTS (SELECT 1 FROM trucker.tbl_slots s WHERE s.user_id = p.auth_user_id);
    
    SELECT COUNT(*) INTO v_fixed_equipments 
    FROM trucker.tbl_user_profile p
    WHERE EXISTS (SELECT 1 FROM trucker.tbl_user_equipments ue WHERE ue.user_id = p.public_profile_id);
    
    RAISE NOTICE '=== 크로스 스키마 유저 초기화 버그 수정 완료 ===';
    RAISE NOTICE '슬롯 보유 유저: % 명', v_fixed_slots;
    RAISE NOTICE '장비 보유 유저: % 명', v_fixed_equipments;
END $$;
