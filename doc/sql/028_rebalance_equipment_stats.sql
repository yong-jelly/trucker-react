-- =====================================================
-- 028_rebalance_equipment_stats.sql
-- 장비 성능 및 가격 리밸런싱
-- 가격이 비쌀수록 확실한 성능 우위를 제공하여 구매 의욕 고취
-- =====================================================

-- 1. 기본 자전거 (입문용, 무료)
-- 속도는 낮지만 접근성이 좋음
UPDATE trucker.tbl_equipments 
SET 
    base_speed = 15,
    max_speed = 30,
    max_weight = 15,
    max_volume = 30,
    price = 0,
    updated_at = now()
WHERE id = 'basic-bicycle';

-- 2. 레일-프레임 카고 스쿠터 (초반 가성비)
-- 자전거보다 확실히 빠르고 적재량도 2배 이상
UPDATE trucker.tbl_equipments 
SET 
    base_speed = 35,
    max_speed = 70,
    max_weight = 40,
    max_volume = 80,
    price = 45000, -- 35000 -> 45000 (성능 상향에 따른 조정)
    updated_at = now()
WHERE id = 'rail-frame-scooter';

-- 3. 짐벌 카고 트라이크 (중거리 적재 특화)
-- 속도는 스쿠터보다 느리지만 적재량이 압도적
UPDATE trucker.tbl_equipments 
SET 
    base_speed = 25,
    max_speed = 50,
    max_weight = 150,
    max_volume = 250,
    price = 120000, -- 90000 -> 120000
    updated_at = now()
WHERE id = 'gimbal-cargo-trike';

-- 4. 마이크로 밴 (전천후 중급기)
-- 자동차급 속도와 안정적인 적재량
UPDATE trucker.tbl_equipments 
SET 
    base_speed = 55,
    max_speed = 100,
    max_weight = 400,
    max_volume = 600,
    price = 350000, -- 220000 -> 350000
    updated_at = now()
WHERE id = 'micro-van-cold-core';

-- 5. 스텝밴 (대량 배송 전문)
-- 속도는 밴과 비슷하거나 약간 느리지만 적재량이 매우 큼
UPDATE trucker.tbl_equipments 
SET 
    base_speed = 50,
    max_speed = 90,
    max_weight = 1200,
    max_volume = 2000,
    price = 850000, -- 520000 -> 850000
    updated_at = now()
WHERE id = 'step-van-shelf-rail';

-- 6. 중형 트럭 (엔드게임 적재)
-- 압도적인 적재량으로 벌크 계약 싹쓸이 가능
UPDATE trucker.tbl_equipments 
SET 
    base_speed = 45,
    max_speed = 85,
    max_weight = 5000,
    max_volume = 8000,
    price = 2500000, -- 1400000 -> 2500000
    updated_at = now()
WHERE id = 'mid-truck-liftgate-mecha';
