# 🛠 Error Log & Troubleshooting

이 문서는 프로젝트 개발 중 발생하는 주요 오류, 원인 분석 및 해결 과정을 기록합니다.

## 📝 작성 규칙 (Standard)

1. **분류(Category)**: `[DB]`, `[API]`, `[UI]`, `[AUTH]`, `[DEPLOY]` 등 대괄호로 시작
2. **상태(Status)**: `✅ Resolved`, `🚧 In Progress`, `❌ Won't Fix`
3. **구조**:
   - **Issue**: 발생한 현상 및 에러 메시지
   - **Cause**: 원인 분석 (필요 시 아스키 다이어그램 활용)
   - **Solution**: 해결 방법 및 적용 코드
   - **Date**: 기록 일시 (YYYY-MM-DD)

---

## 📂 이슈 목록

### [DB] 크로스 스키마 유저 초기화 버그 (슬롯/장비 미지급)
- **Status**: ✅ Resolved
- **Date**: 2026-01-29

#### 🔴 Issue
다른 Supabase 스키마(mmcheck 등)에서 이미 가입한 유저가 trucker 프로젝트에 처음 접속할 때 슬롯과 기본 장비가 지급되지 않음.

**증상:**
- 유저 "성용수": auth.users 생성일 2026-01-06, tbl_user_profile 생성일 2026-01-29 (23일 차이)
- 프로필은 생성되었으나 슬롯 0개, 장비 0개

#### 🔍 Cause
1. **auth.users 공유 문제**: Supabase에서 하나의 계정으로 여러 스키마를 운영할 때 auth.users는 공유됨
2. **트리거 미실행**: `handle_new_user` 트리거는 auth.users INSERT 시에만 실행됨. 다른 스키마에서 이미 가입한 유저는 auth.users에 이미 존재하므로 트리거가 실행되지 않음
3. **API 함수 누락**: `v1_get_user_profile`, `v1_upsert_user_profile` 함수에서 신규 프로필 생성 시 슬롯/장비 지급 로직이 없었음
4. **FK 참조 오류**: `tbl_slots.user_id`는 `tbl_user_profile.public_profile_id`를 참조하는데, 기존 코드에서 `auth_user_id`를 사용함

```
[다른 스키마에서 가입한 유저의 흐름]

mmcheck 가입 → auth.users INSERT → trucker.handle_new_user 트리거 실행 X (trucker 스키마 테이블 없음)
                                        ↓
trucker 첫 접속 → v1_get_user_profile 호출 → 프로필만 생성, 슬롯/장비 누락!
```

#### ✅ Solution
1. **v1_get_user_profile 수정**: 신규 프로필 생성 시 슬롯과 기본 장비도 함께 생성
2. **v1_upsert_user_profile 수정**: 동일하게 슬롯/장비 생성 로직 추가
3. **handle_new_user 수정**: `public_profile_id`를 사용하도록 수정
4. **기존 데이터 복구**: 슬롯/장비가 누락된 유저에게 자동 지급

**수정된 파일:**
- `doc/sql/003_v1_get_user_profile.sql`
- `doc/sql/023_create_equipment_tables.sql`
- `doc/sql/026_fix_cross_schema_user_init.sql` (신규)

---

### [DB] v1_upsert_user_profile ON CONFLICT 매칭 실패
- **Status**: ✅ Resolved
- **Date**: 2026-01-29

#### 🔴 Issue
`v1_upsert_user_profile` 호출 시 다음 에러 발생:
```json
{
    "code": "42P10",
    "message": "there is no unique or exclusion constraint matching the ON CONFLICT specification"
}
```

#### 🔍 Cause
PostgreSQL의 **Partial Unique Index**와 `ON CONFLICT` 구문의 불일치.

```text
[ Table: tbl_user_profile ]
      |
      |-- Index: idx_user_profile_auth_user_id (UNIQUE)
      |   WHERE auth_user_id IS NOT NULL  <-- [Partial Condition]
      |
[ SQL Query ]
      |
      |-- INSERT ... ON CONFLICT (auth_user_id)
          (Error: 매칭되는 완전한 Unique Constraint를 찾지 못함)
```

- 테이블에 생성된 인덱스가 `WHERE` 절을 포함한 **부분 인덱스(Partial Index)**인 경우, `ON CONFLICT` 선언부에도 동일한 `WHERE` 조건이 명시되어야 합니다.

#### 💡 Solution
`ON CONFLICT` 구문에 인덱스와 동일한 `WHERE` 조건을 추가하여 대상 인덱스를 명시적으로 지정.

```sql
-- 수정 전
ON CONFLICT (auth_user_id) DO UPDATE SET ...

-- 수정 후
ON CONFLICT (auth_user_id) WHERE auth_user_id IS NOT NULL DO UPDATE SET ...
```

---

### [DB] v1_create_run 외래 키 제약 조건 위반 (ID 불일치)
- **Status**: ✅ Resolved
- **Date**: 2026-01-29

#### 🔴 Issue
`v1_create_run` 호출 시 `tbl_runs` 테이블의 `user_id` 외래 키 제약 조건 위반 발생:
```json
{
    "code": "23503",
    "details": "Key (user_id)=(b75408a1-c1cf-43b6-b6f1-3b7288745b62) is not present in table \"tbl_user_profile\".",
    "message": "insert or update on table \"tbl_runs\" violates foreign key constraint \"tbl_runs_user_id_fkey\""
}
```

#### 🔍 Cause
사용자 식별자(ID) 체계의 혼용 문제.

```text
[ Auth System ]
      |-- auth.users.id (UUID: b754...) <--- 클라이언트가 전달한 p_user_id

[ Business Logic ]
      |-- trucker.tbl_user_profile
            |-- auth_user_id (FK to auth.users.id)
            |-- public_profile_id (Primary Key, UUID: 9938...) <--- 실제 업무용 ID

[ Error Point ]
      |-- trucker.tbl_runs.user_id (FK to tbl_user_profile.public_profile_id)
      |
      |-- INSERT INTO tbl_runs (user_id) VALUES (p_user_id)
          (Error: p_user_id는 auth_user_id이지 public_profile_id가 아님)
```

- 클라이언트(React)는 Supabase Auth의 `user.id`(`auth_user_id`)를 전달했으나, `tbl_runs` 테이블은 비즈니스 로직 상의 PK인 `public_profile_id`를 외래 키로 참조하고 있어 데이터 불일치가 발생함.

#### 💡 Solution
함수 내부에서 `auth_user_id`를 기반으로 `public_profile_id`를 조회하는 변환 로직 추가.

```sql
-- v1_create_run.sql 수정
DECLARE
    v_public_profile_id uuid;
BEGIN
    -- 1. auth_user_id를 public_profile_id로 변환
    SELECT public_profile_id INTO v_public_profile_id 
    FROM trucker.tbl_user_profile 
    WHERE auth_user_id = p_user_id;
    
    -- 2. 변환된 ID로 INSERT 수행
    INSERT INTO trucker.tbl_runs (user_id, ...)
    VALUES (v_public_profile_id, ...);
END;
```

---

### [DB] v1_complete_run 정산 처리 시 사용자 프로필 조회 실패
- **Status**: ✅ Resolved
- **Date**: 2026-01-29

#### 🔴 Issue
운행 완료(`v1_complete_run`) 처리 시 `tbl_transactions`의 `balance_after` 컬럼에 `null` 값이 입력되려 하여 제약 조건 위반 발생:
```text
ERROR: null value in column "balance_after" of relation "tbl_transactions" violates not-null constraint
DETAIL: Failing row contains (..., REWARD, 2, null, ...)
```

#### 🔍 Cause
`tbl_runs` 테이블의 `user_id` 컬럼 성격 오해로 인한 ID 불일치.

```text
[ Data Schema ]
      |-- tbl_runs.user_id = public_profile_id (비즈니스 PK)
      |-- tbl_user_profile.auth_user_id (인증용 ID)
      |-- tbl_user_profile.public_profile_id (비즈니스 PK)

[ SQL Logic Error ]
      |-- v_user_id := v_run.user_id; (v_user_id는 public_profile_id가 됨)
      |
      |-- UPDATE tbl_user_profile 
      |   SET balance = ... 
      |   WHERE auth_user_id = v_user_id; (Error: public_profile_id로 auth_user_id를 조회함)
      |
      |-- 결과: 업데이트된 행이 없어 v_new_balance가 NULL이 됨
```

#### 💡 Solution
`v1_complete_run` 함수 내에서 사용자 프로필을 업데이트할 때 `auth_user_id` 대신 `public_profile_id`를 조건으로 사용하도록 수정.

```sql
-- 수정 전
UPDATE trucker.tbl_user_profile
SET balance = balance + p_final_reward, ...
WHERE auth_user_id = v_user_id
RETURNING balance INTO v_new_balance;

-- 수정 후
UPDATE trucker.tbl_user_profile
SET balance = balance + p_final_reward, ...
WHERE public_profile_id = v_user_id
RETURNING balance INTO v_new_balance;
```

---

### [DB/API] 운행 완료 후 "사용 가능한 슬롯이 없습니다" 지속 표시
- **Status**: ✅ Resolved
- **Date**: 2026-01-29

#### 🔴 Issue
운행을 완료하고 홈 화면으로 돌아와도 계속 "사용 가능한 슬롯이 없습니다" 메시지가 표시되어 새 주문을 수락할 수 없음.

#### 🔍 Cause
API 함수들 간의 사용자 ID 체계 불일치 및 auth 테이블 의존성 문제.

```text
[ 문제점: ID 체계 불일치 ]

┌─ 클라이언트 (React) ─────────────────────────────────┐
│  user.id (auth_user_id: b754...)                     │
│      ↓ 전달                                          │
└──────────────────────────────────────────────────────┘
                      ↓
┌─ SQL Functions ──────────────────────────────────────┐
│                                                      │
│  v1_get_user_slots(p_user_id)                        │
│      → auth_user_id → public_profile_id 변환         │
│      → 슬롯 조회 (user_id = public_profile_id)       │
│                                                      │
│  v1_create_run(p_user_id)                            │
│      → auth_user_id → public_profile_id 변환         │
│      → Run 생성 (user_id = public_profile_id)        │
│                                                      │
│  v1_get_active_runs(p_user_id)                       │
│      → public_profile_id를 직접 기대!!! ❌ 불일치!   │
│      → 조회 실패 또는 데이터 누락                    │
│                                                      │
│  v1_get_run_history(p_user_id)                       │
│      → public_profile_id를 직접 기대!!! ❌ 불일치!   │
│                                                      │
└──────────────────────────────────────────────────────┘

[ 결과 ]
- 슬롯 데이터 조회 실패 또는 불일치
- 운행 완료 후에도 슬롯이 OCCUPIED 상태로 표시
- 실제 DB는 정상이지만 클라이언트가 잘못된 ID로 조회
```

#### 💡 Solution
**근본적 해결**: auth 테이블 의존성을 완전히 제거하고, 모든 API를 `public_profile_id` 기반으로 통일.

**1. SQL 함수 수정 (021_unify_to_public_profile_id.sql)**
```sql
-- v1_get_user_slots: auth_user_id 변환 로직 제거
CREATE OR REPLACE FUNCTION trucker.v1_get_user_slots(p_user_id uuid)
...
AS $$
BEGIN
    -- p_user_id는 이제 public_profile_id를 직접 받음
    IF NOT EXISTS (SELECT 1 FROM trucker.tbl_user_profile WHERE public_profile_id = p_user_id) THEN
        RETURN;
    END IF;
    ...
END;
$$;

-- v1_create_run: 동일하게 수정
CREATE OR REPLACE FUNCTION trucker.v1_create_run(p_user_id uuid, ...)
...
AS $$
BEGIN
    -- p_user_id는 public_profile_id를 직접 받음
    IF NOT EXISTS (SELECT 1 FROM trucker.tbl_user_profile WHERE public_profile_id = p_user_id) THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    
    INSERT INTO trucker.tbl_runs (user_id, ...) VALUES (p_user_id, ...);
    ...
END;
$$;
```

---

### [UI/Logic] 운행 로직 공통화 및 실시간 데이터 정확도 개선
- **Status**: ✅ Resolved
- **Date**: 2026-01-29

#### 🔴 Issue
1. `ActiveRun.tsx`, `PublicRun.tsx`, `RoutePreviewMap.tsx` 등 여러 곳에서 속도 계산, 경로 보간, Mapbox API 호출 로직이 중복되고 파편화됨.
2. `PublicRun.tsx`에서 진행률 계산 시 장비의 실제 속도를 반영하지 못하고 단순히 시간 비율로만 계산하여 실제 운행 상태와 괴리가 발생함.
3. 가속(Overdrive) 시 ETA 및 남은 거리가 실시간으로 갱신되지 않아 사용자 경험 저하.

#### 🔍 Cause
- 초기 개발 시 각 페이지별로 독립적으로 로직을 구현하여 공통 로직이 부재함.
- `PublicRun`의 경우 서버 사이드 업데이트가 아닌 클라이언트 사이드 추정 방식을 사용하는데, 이때 장비의 성능(속도) 데이터를 고려하지 않음.

#### 💡 Solution
운행 관련 핵심 로직을 공통 라이브러리로 분리하고, 모든 관련 컴포넌트에서 이를 참조하도록 구조 개선.

1. **공통 유틸리티 생성**: `src/shared/lib/run.ts` 파일을 생성하여 다음 로직을 통합.
   - 장비 스냅샷 기반 속도 추출 (`getSpeedFromSnapshot`)
   - 연료 패널티 적용 (`applyFuelPenalty`)
   - 초당 이동 거리 계산 (`speedToKmPerSecond`)
   - 경로 상 위치 보간 (`interpolatePositionOnRoute`)
   - Mapbox 라우팅 API 호출 통합 (`fetchMapboxRoute`)
2. **PublicRun 개선**: 시간 비율이 아닌, 장비의 `base_speed`를 기반으로 실제 이동 거리를 추정하여 진행률과 위치를 계산하도록 수정.
3. **ActiveRun 개선**: 가속 시 실시간으로 변하는 속도를 반영하여 `traveledDistanceKm`를 누적하고, 이를 기반으로 ETA와 남은 거리를 `useMemo`로 실시간 갱신.

#### 📁 수정된 파일
- `src/shared/lib/run.ts` (신규)
- `src/pages/ActiveRun.tsx`
- `src/pages/PublicRun.tsx`
- `src/widgets/order/RoutePreviewMap.tsx`

---

### [UI/API] 자전거 장비의 최대 속도 제한 문제 (22km/h 고정)
- **Status**: ✅ Resolved
- **Date**: 2026-01-29

#### 🔴 Issue
자전거 장비 설정에서 최대 속도를 60km/h로 설정했음에도 불구하고, 실제 운행 중 가속 시 22km/h 부근에서 속도가 더 이상 올라가지 않는 현상 발생.

#### 🔍 Cause
프론트엔드 로직의 하드코딩과 DB API의 데이터 누락이 결합된 문제.

```text
[ Logic Flow ]
      |-- ActiveRun.tsx
      |     |-- EQUIPMENT_SPEEDS['BICYCLE'] = 15 (하드코딩된 기본값)
      |     |-- maxSpeedKmh = baseSpeed * 1.5 = 22.5km/h
      |
[ Data Flow ]
      |-- tbl_runs.equipment_snapshot (DB에는 60km/h가 저장되어 있음)
      |-- v1_get_run_by_id (SQL 함수가 snapshot을 반환하지 않음)
      |-- RunDetail (인터페이스에 snapshot 필드 부재)
```

- 운행 페이지(`ActiveRun.tsx`)에서 장비의 실제 설정값이 아닌 하드코딩된 기본값(`15km/h`)에 1.5배를 곱해 최대 속도를 계산하고 있었습니다.
- DB에는 운행 시작 시점의 장비 설정이 `equipment_snapshot`으로 저장되어 있었으나, 이를 조회하는 API에서 해당 필드를 누락하여 프론트엔드에서 실제 설정값을 알 수 없었습니다.

#### 💡 Solution
DB 함수부터 프론트엔드 로직까지 데이터 흐름을 연결하여 실제 설정값을 사용하도록 수정.

1. **SQL**: `v1_get_run_by_id` 함수가 `equipment_snapshot` 컬럼을 반환하도록 수정.
2. **API/Types**: `Run` 인터페이스에 `equipmentSnapshot` 필드를 추가하고 API 매핑 로직 업데이트.
3. **UI**: `ActiveRun.tsx`에서 속도 계산 시 `equipmentSnapshot`의 `max_speed` 값을 우선적으로 사용하도록 수정.

```typescript
// ActiveRun.tsx 수정 내용
const equipmentBaseSpeed = runDetail?.run.equipmentSnapshot?.base_speed || EQUIPMENT_SPEEDS[equipmentType] || 15;
const equipmentMaxSpeed = runDetail?.run.equipmentSnapshot?.max_speed || (equipmentBaseSpeed * 1.5);
```

**2. 프론트엔드 수정 (Home.tsx, OrderDetail.tsx, Garage.tsx)**
```tsx
// 수정 전: auth_user_id 사용
const { user } = useUserStore();
const slots = await getUserSlots(user.id);

// 수정 후: public_profile_id 사용
const { data: profile } = useUserProfile();
const profileId = profile.public_profile_id;
const slots = await getUserSlots(profileId);
```

**3. 데이터 흐름 변경**
```text
[ 수정 전 ]
user.id (auth) → SQL 함수 → 내부 변환 → public_profile_id

[ 수정 후 ]
profile.public_profile_id → SQL 함수 → 직접 사용 (변환 없음)
```

#### 📁 수정된 파일
- `doc/sql/021_unify_to_public_profile_id.sql` (신규)
- `doc/sql/006_v1_get_user_slots.sql`
- `doc/sql/001_v1_create_run.sql`
- `src/pages/Home.tsx`
- `src/pages/OrderDetail.tsx`
- `src/pages/Garage.tsx`

#### 🎯 핵심 교훈
- 게임 로직에서는 `auth.users.id`가 아닌 비즈니스용 PK(`public_profile_id`)를 일관되게 사용해야 함
- 프로필이 로드된 후에는 auth ID 대신 profile ID를 사용하여 데이터 조회
- auth 시스템(로그인/회원가입)과 게임 운영 시스템을 분리하여 독립성 확보
