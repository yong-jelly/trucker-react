-- =====================================================
-- 트럭커(Trucker) 데이터베이스 스키마 설계 (trucker 스키마)
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/schema.sql
-- =====================================================

-- 0. 스키마 생성 및 권한 부여
CREATE SCHEMA IF NOT EXISTS trucker;
GRANT USAGE ON SCHEMA trucker TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA trucker GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- 1. 사용자 프로필 테이블 (auth.users 연동)
CREATE TABLE IF NOT EXISTS trucker.tbl_user_profile (
    auth_user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    public_profile_id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL UNIQUE,
    nickname text NOT NULL,
    avatar_url text,
    balance bigint DEFAULT 1000 NOT NULL, -- 초기 자금 $1,000
    reputation integer DEFAULT 0 NOT NULL, -- 초기 평판 0
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    bio text,
    telegram_chat_id text,
    slack_webhook_url text,
    notification_enabled boolean DEFAULT true NOT NULL,
    CONSTRAINT tbl_user_profile_nickname_check CHECK (length(nickname) >= 2 AND length(nickname) <= 30),
    CONSTRAINT tbl_user_profile_bio_check CHECK (length(bio) <= 200)
);

-- 2. 슬롯 정보
CREATE TABLE IF NOT EXISTS trucker.tbl_slots (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES trucker.tbl_user_profile(auth_user_id) ON DELETE CASCADE NOT NULL,
    index integer NOT NULL, -- 슬롯 번호 (0, 1, 2...)
    is_locked boolean DEFAULT false NOT NULL,
    active_run_id uuid, -- 현재 운행 중인 Run ID (순환 참조 방지를 위해 UUID만 저장)
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, index)
);

-- 3. 주문(오퍼) 정보
CREATE TABLE IF NOT EXISTS trucker.tbl_orders (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    category text NOT NULL, -- CONVENIENCE, CONSTRUCTION, EQUIPMENT, INTERNATIONAL, HEAVY_DUTY
    cargo_name text NOT NULL,
    weight float NOT NULL,
    volume float NOT NULL,
    distance float NOT NULL,
    base_reward bigint NOT NULL,
    limit_time_minutes integer NOT NULL,
    required_document_id text,
    required_equipment_type text DEFAULT 'BICYCLE' NOT NULL,
    start_lat float NOT NULL,
    start_lng float NOT NULL,
    end_lat float NOT NULL,
    end_lng float NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. 운행(Run) 정보
CREATE TABLE IF NOT EXISTS trucker.tbl_runs (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES trucker.tbl_user_profile(auth_user_id) ON DELETE CASCADE NOT NULL,
    order_id uuid REFERENCES trucker.tbl_orders(id) NOT NULL,
    slot_id uuid REFERENCES trucker.tbl_slots(id) NOT NULL,
    status text DEFAULT 'IN_TRANSIT' NOT NULL, -- IN_TRANSIT, COMPLETED, FAILED, CANCELLED
    start_at timestamp with time zone DEFAULT now() NOT NULL,
    eta_seconds integer NOT NULL,
    deadline_at timestamp with time zone NOT NULL,
    
    -- 출발 시 확정된 아이템 세팅
    selected_equipment_id text,
    selected_document_id text,
    selected_insurance_id text,
    
    -- 실시간 수치 (정기적 업데이트 또는 계산용)
    current_reward bigint NOT NULL,
    accumulated_penalty bigint DEFAULT 0 NOT NULL,
    accumulated_bonus bigint DEFAULT 0 NOT NULL,
    current_risk float DEFAULT 0.2 NOT NULL,
    current_durability integer DEFAULT 100 NOT NULL,
    current_fuel float DEFAULT 100.0 NOT NULL,
    
    completed_at timestamp with time zone
);

-- 5. 이벤트 로그 (영수증 라인 아이템)
CREATE TABLE IF NOT EXISTS trucker.tbl_event_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    run_id uuid REFERENCES trucker.tbl_runs(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL, -- SYSTEM, POLICE, ACCIDENT, MAINTENANCE, BONUS, PENALTY
    title text NOT NULL,
    description text,
    amount bigint DEFAULT 0 NOT NULL,
    eta_change_seconds integer DEFAULT 0 NOT NULL,
    is_estimated boolean DEFAULT false NOT NULL,
    timestamp timestamp with time zone DEFAULT now() NOT NULL
);

-- 6. 거래 내역 (Transaction History)
CREATE TABLE IF NOT EXISTS trucker.tbl_transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES trucker.tbl_user_profile(auth_user_id) ON DELETE CASCADE NOT NULL,
    run_id uuid REFERENCES trucker.tbl_runs(id) ON DELETE SET NULL,
    type text NOT NULL, -- REWARD, PENALTY, HIRE_COST, DEPOSIT, REFUND, UPGRADE
    amount bigint NOT NULL,
    balance_after bigint NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 7. 드라이버 고용 정보
CREATE TABLE IF NOT EXISTS trucker.tbl_hired_drivers (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    owner_id uuid REFERENCES trucker.tbl_user_profile(auth_user_id) ON DELETE CASCADE NOT NULL,
    driver_type text NOT NULL, -- NPC, USER
    driver_user_id uuid REFERENCES trucker.tbl_user_profile(auth_user_id), -- USER 타입일 경우
    name text NOT NULL,
    commission_rate float NOT NULL, -- 수수료 % (0.15 ~ 0.40)
    deposit_amount bigint NOT NULL, -- 예치금
    runs_completed integer DEFAULT 0 NOT NULL, -- 의무 기간 체크용
    is_active boolean DEFAULT true NOT NULL,
    hired_at timestamp with time zone DEFAULT now() NOT NULL,
    fired_at timestamp with time zone
);

-- 8. 시스템 설정 (System Config)
CREATE TABLE IF NOT EXISTS trucker.tbl_system_config (
    id text PRIMARY KEY,
    value jsonb NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);

-- 이벤트 확률 설정 예시
INSERT INTO trucker.tbl_system_config (id, value, description) VALUES
('enforcement_base_prob', '{"normal": 0.05, "speeding": 0.20}', '단속 기본 확률'),
('enforcement_penalties', '{"document": 300, "bypass": 720, "evasion_success": 0, "evasion_fail": 1200}', '단속 대응별 페널티'),
('evasion_success_rate', '0.40', '돌파 성공 확률')
ON CONFLICT (id) DO NOTHING;

-- RLS (Row Level Security) 설정
ALTER TABLE trucker.tbl_user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucker.tbl_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucker.tbl_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucker.tbl_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucker.tbl_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucker.tbl_hired_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucker.tbl_system_config ENABLE ROW LEVEL SECURITY;

-- 정책 설정 (본인 데이터만)
CREATE POLICY "Users can view their own profile" ON trucker.tbl_user_profile FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can insert their own profile" ON trucker.tbl_user_profile FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Users can update their own profile" ON trucker.tbl_user_profile FOR UPDATE USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can view their own slots" ON trucker.tbl_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own runs" ON trucker.tbl_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own event logs" ON trucker.tbl_event_logs FOR SELECT USING (EXISTS (SELECT 1 FROM trucker.tbl_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));
CREATE POLICY "Users can view their own transactions" ON trucker.tbl_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own hired drivers" ON trucker.tbl_hired_drivers FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can view system config" ON trucker.tbl_system_config FOR SELECT USING (true);

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_tbl_user_profile_updated_at 
BEFORE UPDATE ON trucker.tbl_user_profile 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 권한 부여 (테이블 레벨)
GRANT ALL ON ALL TABLES IN SCHEMA trucker TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA trucker TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA trucker TO anon, authenticated, service_role;

-- 신규 사용자 가입 시 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION trucker.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  base_nickname TEXT;
  final_nickname TEXT;
  random_suffix TEXT;
BEGIN
  base_nickname := split_part(NEW.email, '@', 1);
  IF base_nickname = '' OR base_nickname IS NULL THEN
    base_nickname := 'trucker';
  END IF;
  base_nickname := left(base_nickname, 20);
  random_suffix := floor(random() * 9000 + 1000)::text;
  final_nickname := base_nickname || '_' || random_suffix;

  INSERT INTO trucker.tbl_user_profile (auth_user_id, nickname)
  VALUES (NEW.id, final_nickname);
  RETURN NEW;
END;
$function$;

-- Auth 가입 시 자동 생성 트리거
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION trucker.handle_new_user();
