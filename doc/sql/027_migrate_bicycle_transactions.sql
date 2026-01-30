-- ============================================================
-- 027_migrate_bicycle_transactions.sql
-- 기존 유저들의 basic-bicycle 지급에 대한 거래 이력 소급 기록
-- 날짜: 2026-01-30
-- ============================================================

-- 1. 기존 basic-bicycle 보유 유저에 대한 거래 이력 추가
-- (이미 기록된 유저는 중복 INSERT 방지)
INSERT INTO trucker.tbl_transactions (user_id, type, amount, balance_after, description, created_at)
SELECT 
  ue.user_id,
  'EQUIPMENT_GRANTED',
  0,
  COALESCE(p.balance, 0),
  '기본 장비 지급: 기본 배달 자전거',
  ue.purchased_at
FROM trucker.tbl_user_equipments ue
JOIN trucker.tbl_user_profile p ON p.public_profile_id = ue.user_id
WHERE ue.equipment_id = 'basic-bicycle'
AND NOT EXISTS (
  SELECT 1 FROM trucker.tbl_transactions t 
  WHERE t.user_id = ue.user_id 
  AND t.type = 'EQUIPMENT_GRANTED'
  AND t.description LIKE '%기본 배달 자전거%'
);

-- 2. 마이그레이션 결과 확인
SELECT 
  t.user_id,
  p.nickname,
  t.type,
  t.amount,
  t.description,
  t.created_at
FROM trucker.tbl_transactions t
JOIN trucker.tbl_user_profile p ON p.public_profile_id = t.user_id
WHERE t.type = 'EQUIPMENT_GRANTED'
ORDER BY t.created_at DESC;
