-- ============================================================
-- 028_add_transaction_logging.sql
-- 장비 구매/지급 시 tbl_transactions에 거래 이력 기록 추가
-- 날짜: 2026-01-30
-- ============================================================

-- ============================================================
-- 1. v1_purchase_equipment 함수 수정
-- 장비 구매 시 EQUIPMENT_PURCHASE 타입으로 거래 이력 기록
-- ============================================================
CREATE OR REPLACE FUNCTION trucker.v1_purchase_equipment(p_user_id uuid, p_equipment_id text)
RETURNS TABLE(
    user_equipment_id uuid, 
    equipment_id text, 
    purchased_at timestamp with time zone, 
    is_equipped boolean, 
    name text, 
    description text, 
    image_filename text, 
    equipment_type text, 
    price bigint, 
    base_speed double precision, 
    max_speed double precision, 
    max_weight double precision, 
    max_volume double precision, 
    allowed_categories text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'trucker', 'public'
AS $$
DECLARE
    v_equipment RECORD;
    v_user_balance bigint;
    v_new_balance bigint;
    v_new_ue_id uuid;
BEGIN
    -- 1. 장비 정보 조회
    SELECT * INTO v_equipment FROM trucker.tbl_equipments WHERE id = p_equipment_id AND is_active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION '장비를 찾을 수 없거나 비활성화된 장비입니다.';
    END IF;

    -- 2. 이미 보유 중인지 확인
    IF EXISTS (SELECT 1 FROM trucker.tbl_user_equipments WHERE user_id = p_user_id AND equipment_id = p_equipment_id) THEN
        RAISE EXCEPTION '이미 보유 중인 장비입니다.';
    END IF;

    -- 3. 유저 잔액 확인
    SELECT balance INTO v_user_balance FROM trucker.tbl_user_profile WHERE public_profile_id = p_user_id;
    IF v_user_balance < v_equipment.price THEN
        RAISE EXCEPTION '잔액이 부족합니다. (필요: %, 보유: %)', v_equipment.price, v_user_balance;
    END IF;

    -- 4. 장비 구매 처리 (잔액 차감)
    UPDATE trucker.tbl_user_profile
    SET balance = balance - v_equipment.price,
        updated_at = now()
    WHERE public_profile_id = p_user_id
    RETURNING balance INTO v_new_balance;

    -- 5. 보유 장비 추가
    INSERT INTO trucker.tbl_user_equipments (
        user_id,
        equipment_id,
        purchased_at,
        is_equipped
    ) VALUES (
        p_user_id,
        p_equipment_id,
        now(),
        false -- 구매 시 바로 장착하지 않음
    )
    RETURNING id INTO v_new_ue_id;

    -- 6. 거래 이력 기록 (NEW: EQUIPMENT_PURCHASE)
    INSERT INTO trucker.tbl_transactions (user_id, type, amount, balance_after, description)
    VALUES (
        p_user_id,
        'EQUIPMENT_PURCHASE',
        -v_equipment.price,
        v_new_balance,
        '장비 구매: ' || v_equipment.name
    );

    -- 7. 결과 반환
    RETURN QUERY
    SELECT
        ue.id as user_equipment_id,
        ue.equipment_id,
        ue.purchased_at,
        ue.is_equipped,
        e.name,
        e.description,
        e.image_filename,
        e.equipment_type,
        e.price,
        e.base_speed,
        e.max_speed,
        e.max_weight,
        e.max_volume,
        e.allowed_categories
    FROM trucker.tbl_user_equipments ue
    JOIN trucker.tbl_equipments e ON e.id = ue.equipment_id
    WHERE ue.id = v_new_ue_id;
END;
$$;

-- ============================================================
-- 2. handle_new_user 트리거 함수 수정
-- 신규 유저 가입 시 기본 장비 지급과 함께 거래 이력 기록
-- ============================================================
CREATE OR REPLACE FUNCTION trucker.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    base_nickname TEXT;
    final_nickname TEXT;
    random_suffix TEXT;
    new_public_profile_id uuid;
    default_equipment RECORD;
BEGIN
    -- 1. 닉네임 생성
    base_nickname := split_part(NEW.email, '@', 1);
    IF base_nickname = '' OR base_nickname IS NULL THEN
        base_nickname := 'trucker';
    END IF;
    base_nickname := left(base_nickname, 20);
    random_suffix := floor(random() * 9000 + 1000)::text;
    final_nickname := base_nickname || '_' || random_suffix;

    -- 2. 프로필 생성 및 public_profile_id 획득
    INSERT INTO trucker.tbl_user_profile (auth_user_id, nickname)
    VALUES (NEW.id, final_nickname)
    RETURNING public_profile_id INTO new_public_profile_id;

    -- 3. 기본 슬롯 3개 생성 (첫 번째만 해금) - public_profile_id 사용
    INSERT INTO trucker.tbl_slots (user_id, index, is_locked) VALUES
        (new_public_profile_id, 0, false),
        (new_public_profile_id, 1, true),
        (new_public_profile_id, 2, true);

    -- 4. 기본 장비 자동 지급 (is_default = true인 장비들)
    FOR default_equipment IN
        SELECT id, name FROM trucker.tbl_equipments WHERE is_default = true AND is_active = true
    LOOP
        INSERT INTO trucker.tbl_user_equipments (user_id, equipment_id, is_equipped)
        VALUES (new_public_profile_id, default_equipment.id, true)
        ON CONFLICT (user_id, equipment_id) DO NOTHING;
        
        -- NEW: 거래 이력 기록 (EQUIPMENT_GRANTED)
        INSERT INTO trucker.tbl_transactions (user_id, type, amount, balance_after, description)
        VALUES (
            new_public_profile_id,
            'EQUIPMENT_GRANTED',
            0,
            0, -- 신규 유저의 초기 잔액은 0
            '기본 장비 지급: ' || default_equipment.name
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = trucker, public;

-- ============================================================
-- 3. v1_get_user_profile 함수 수정
-- 기존 유저의 기본 장비 복구 지급 시 거래 이력 기록
-- ============================================================
CREATE OR REPLACE FUNCTION trucker.v1_get_user_profile(p_auth_user_id uuid)
RETURNS trucker.tbl_user_profile
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'trucker', 'public'
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
            SELECT id, name FROM trucker.tbl_equipments WHERE is_default = true AND is_active = true
        LOOP
            INSERT INTO trucker.tbl_user_equipments (user_id, equipment_id, is_equipped)
            VALUES (v_profile.public_profile_id, v_default_equipment.id, true)
            ON CONFLICT (user_id, equipment_id) DO NOTHING;
            
            -- NEW: 거래 이력 기록 (EQUIPMENT_GRANTED)
            INSERT INTO trucker.tbl_transactions (user_id, type, amount, balance_after, description)
            VALUES (
                v_profile.public_profile_id,
                'EQUIPMENT_GRANTED',
                0,
                0, -- 신규 프로필의 초기 잔액은 0
                '기본 장비 지급: ' || v_default_equipment.name
            );
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
                SELECT id, name FROM trucker.tbl_equipments WHERE is_default = true AND is_active = true
            LOOP
                INSERT INTO trucker.tbl_user_equipments (user_id, equipment_id, is_equipped)
                VALUES (v_profile.public_profile_id, v_default_equipment.id, true)
                ON CONFLICT (user_id, equipment_id) DO NOTHING;
                
                -- NEW: 거래 이력 기록 (EQUIPMENT_GRANTED) - 복구 지급
                INSERT INTO trucker.tbl_transactions (user_id, type, amount, balance_after, description)
                VALUES (
                    v_profile.public_profile_id,
                    'EQUIPMENT_GRANTED',
                    0,
                    COALESCE(v_profile.balance, 0),
                    '기본 장비 지급: ' || v_default_equipment.name
                );
            END LOOP;
        END IF;
    END IF;

    RETURN v_profile;
END;
$$;
