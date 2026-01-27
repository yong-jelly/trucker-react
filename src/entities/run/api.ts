import { supabase } from '../../shared/api/supabase';
import type { Run } from '../../shared/api/types';

export async function createRun(params: {
  userId: string;
  orderId: string;
  slotId: string;
  selectedItems: { equipmentId?: string; documentId?: string; insuranceId?: string };
}): Promise<Run> {
  const { userId, orderId, slotId, selectedItems } = params;

  // 1. 주문 정보 조회 (보상금, 거리 등 계산용)
  const { data: order, error: orderError } = await supabase
    .from('trucker.tbl_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error('Order not found');
  }

  // ETA 계산: 거리(km) / 속도(60km/h) * 3600 (초) -> 단순화: 1km당 1분(60초)
  const etaSeconds = Math.round(order.distance * 60); 
  const deadlineAt = new Date(Date.now() + order.limit_time_minutes * 60 * 1000).toISOString();

  // 2. Run 생성
  const { data: run, error: runError } = await supabase
    .from('trucker.tbl_runs')
    .insert({
      user_id: userId,
      order_id: orderId,
      slot_id: slotId,
      status: 'IN_TRANSIT',
      eta_seconds: etaSeconds,
      deadline_at: deadlineAt,
      selected_equipment_id: selectedItems.equipmentId,
      selected_document_id: selectedItems.documentId,
      selected_insurance_id: selectedItems.insuranceId,
      current_reward: order.base_reward,
      current_risk: 0.05, // 기본 위험도
      current_durability: 100,
      current_fuel: 100
    })
    .select()
    .single();

  if (runError) {
    console.error('Failed to create run:', runError);
    throw new Error('Failed to create run');
  }

  // 3. 슬롯 상태 업데이트
  const { error: slotError } = await supabase
    .from('trucker.tbl_slots')
    .update({ active_run_id: run.id })
    .eq('id', slotId);

  if (slotError) {
    console.error('Failed to update slot:', slotError);
    // 롤백 로직이 필요하지만 MVP에서는 생략
  }

  // 4. 이벤트 로그 추가 (운행 시작)
  await supabase
    .from('trucker.tbl_event_logs')
    .insert({
      run_id: run.id,
      type: 'SYSTEM',
      title: '운행 시작',
      description: `[${order.title}] 운행이 시작되었습니다. 안전 운전하세요!`,
      amount: 0,
      eta_change_seconds: 0,
      is_estimated: false
    });

  // 5. 트랜잭션 기록 (계약 체결)
  // 예치금이나 수수료가 있다면 여기서 차감
  // 현재는 기록만 남김
  /*
  await supabase
    .from('trucker.tbl_transactions')
    .insert({
      user_id: userId,
      run_id: run.id,
      type: 'CONTRACT',
      amount: 0,
      balance_after: 0, // 실제 잔액 조회 필요
      description: `운송 계약 체결: ${order.title}`
    });
  */

  // 카멜케이스 변환하여 반환
  return {
    id: run.id,
    orderId: run.order_id,
    slotId: run.slot_id,
    status: run.status,
    startAt: new Date(run.start_at).getTime(),
    etaSeconds: run.eta_seconds,
    deadlineAt: new Date(run.deadline_at).getTime(),
    selectedItems: {
      equipmentId: run.selected_equipment_id,
      documentId: run.selected_document_id,
      insuranceId: run.selected_insurance_id,
    },
    currentReward: run.current_reward,
    accumulatedPenalty: run.accumulated_penalty,
    accumulatedBonus: run.accumulated_bonus,
    currentRisk: run.current_risk,
    currentDurability: run.current_durability,
  };
}
