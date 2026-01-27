import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Clock, Package, DollarSign, AlertTriangle, FileText, Shield, Wrench, Play, Info, Bike, Anchor } from 'lucide-react';
import { useGameStore } from '../app/store';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../shared/lib/mockData';
import { RoutePreviewMap } from '../widgets/order/RoutePreviewMap';
import { useUserStore, useUserProfile } from '../entities/user';
import { sendNotification } from '../shared/lib/notification';
import { Dialog, DialogContent, DialogTitle } from '../shared/ui/Dialog';
import { createRun } from '../entities/run';
import { getOrderById } from '../entities/order';
import type { Order } from '../shared/api/types';

const EQUIPMENT_ICONS: Record<string, any> = {
// ...
  SHIP: Anchor,
};

const EQUIPMENT_LABELS: Record<string, string> = {
// ...
  SHIP: '컨테이너선',
};

export const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { slots } = useGameStore();
  const { data: _profile } = useUserProfile();
  const { user } = useUserStore();
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 페이지 진입 시 스크롤을 최상단으로 이동 및 데이터 로드
  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (orderId) {
      getOrderById(orderId)
        .then(setOrder)
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [orderId]);

  const availableSlot = slots.find(s => !s.isLocked && !s.activeRunId);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 p-4 text-center">
        <div className="mb-4 rounded-full bg-surface-100 p-4">
          <Package className="h-8 w-8 text-surface-400" />
        </div>
        <h2 className="text-lg font-medium text-surface-900">주문을 찾을 수 없습니다</h2>
        <p className="mt-1 text-sm text-surface-500">이미 만료되었거나 존재하지 않는 주문입니다.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-6 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-soft-md"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  };

  const handleStartDelivery = () => {
    setIsContractOpen(true);
  };

  const handleConfirmContract = async () => {
    if (!user || !order || !availableSlot) return;

    try {
      // 실제 DB에 Run 생성
      const newRun = await createRun({
        userId: user.id,
        orderId: order.id,
        slotId: availableSlot.id,
        selectedItems: {
          // TODO: 실제 선택된 아이템 ID 연동 필요
          documentId: order.requiredDocumentId || undefined,
        }
      });

      sendNotification(user.id, {
        title: "🚚 운행 시작 안내",
        message: `[${order.cargoName}] 운행을 시작합니다.\n목적지까지 안전하게 운행하세요!`,
        type: "info"
      });

      setIsContractOpen(false);
      navigate(`/run/${newRun.id}`);
    } catch (error) {
      console.error('Failed to start delivery:', error);
      alert('운행 시작 중 오류가 발생했습니다.');
    }
  };

  return (
// ...
    <div className="min-h-screen bg-surface-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-soft-xs">
        <button 
          onClick={() => navigate(-1)} 
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-50"
        >
          <ArrowLeft className="h-5 w-5 text-surface-700" />
        </button>
        <h1 className="text-lg font-medium text-surface-900">주문 상세</h1>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4">
        {/* 지도 미리보기 */}
        <RoutePreviewMap order={order} />

        {/* 주문 정보 카드 */}
        <div className="rounded-2xl bg-white p-5 shadow-soft-sm">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[order.category]}`}>
            {CATEGORY_LABELS[order.category]}
          </span>
          
          <h2 className="mt-3 text-xl font-medium text-surface-900">{order.title}</h2>
          <p className="mt-1 text-sm text-surface-500">{order.cargoName}</p>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-surface-50 p-3">
              <div className="flex items-center gap-2 text-surface-500">
                <MapPin className="h-4 w-4" />
                <span className="text-xs">거리</span>
              </div>
              <p className="mt-1 text-lg font-medium text-surface-900">{(order.distance || 0).toLocaleString()}km</p>
            </div>
            <div className="rounded-xl bg-surface-50 p-3">
              <div className="flex items-center gap-2 text-surface-500">
                <Clock className="h-4 w-4" />
                <span className="text-xs">제한시간</span>
              </div>
              <p className="mt-1 text-lg font-medium text-surface-900">{formatDuration(order.limitTimeMinutes || 0)}</p>
            </div>
            <div className="rounded-xl bg-surface-50 p-3">
              <div className="flex items-center gap-2 text-surface-500">
                <Package className="h-4 w-4" />
                <span className="text-xs">무게/부피</span>
              </div>
              <p className="mt-1 text-sm font-medium text-surface-900">{(order.weight || 0).toLocaleString()}kg / {(order.volume || 0).toLocaleString()}L</p>
            </div>
            <div className="rounded-xl bg-surface-50 p-3">
              <div className="flex items-center gap-2 text-surface-500">
                {order.requiredEquipmentType ? (
                  (() => {
                    const Icon = EQUIPMENT_ICONS[order.requiredEquipmentType];
                    return Icon ? <Icon className="h-4 w-4" /> : <Bike className="h-4 w-4" />;
                  })()
                ) : <Bike className="h-4 w-4" />}
                <span className="text-xs">필요 장비</span>
              </div>
              <p className="mt-1 text-sm font-medium text-surface-900">
                {order.requiredEquipmentType ? (EQUIPMENT_LABELS[order.requiredEquipmentType] || order.requiredEquipmentType) : '자전거'}
              </p>
            </div>
            <div className="col-span-2 rounded-xl bg-primary-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary-600">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs font-medium uppercase tracking-wider">기본 보상</span>
                </div>
                <p className="text-2xl font-medium text-primary-600">${(order.baseReward || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 출발 전 세팅 카드 */}
        <div className="rounded-2xl bg-white p-5 shadow-soft-sm">
          <h3 className="flex items-center gap-2 text-base font-medium text-surface-900">
            <Wrench className="h-4 w-4" />
            출발 전 세팅
          </h3>
          <p className="mt-1 text-xs text-surface-500">출발하면 세팅 변경이 불가합니다.</p>

          <div className="mt-4 space-y-3">
            {/* 필수 서류 */}
            <div className="flex items-center justify-between rounded-xl border border-surface-200 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-amber/10">
                  <FileText className="h-4 w-4 text-accent-amber" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">필수 서류</p>
                  <p className="text-xs text-surface-500">배송 확인서 (POD)</p>
                </div>
              </div>
              <span className="rounded-full bg-accent-emerald/10 px-2 py-0.5 text-xs font-medium text-accent-emerald">
                보유중
              </span>
            </div>

            {/* 장비 선택 */}
            <button className="flex w-full items-center justify-between rounded-xl border border-dashed border-surface-300 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100">
                  <Wrench className="h-4 w-4 text-surface-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-surface-900">장비 선택</p>
                  <p className="text-xs text-surface-500">선택 안함 (기본)</p>
                </div>
              </div>
              <span className="text-xs text-primary-500">선택</span>
            </button>

            {/* 보험 선택 */}
            <button className="flex w-full items-center justify-between rounded-xl border border-dashed border-surface-300 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100">
                  <Shield className="h-4 w-4 text-surface-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-surface-900">보험 선택</p>
                  <p className="text-xs text-surface-500">선택 안함 (기본)</p>
                </div>
              </div>
              <span className="text-xs text-primary-500">선택</span>
            </button>
          </div>
        </div>

        {/* 리스크 및 안내 사항 */}
        <div className="space-y-3">
          {order.category === 'INTERNATIONAL' && (
            <div className="flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50/50 p-4">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100">
                <Info className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">항공 운송 안내</p>
                <p className="mt-1 text-xs text-surface-600 leading-relaxed">
                  이 주문은 대륙간 장거리 운송 건으로, **화물 비행기(Cargo Plane)** 라이선스 및 장비가 필수입니다. 
                  (현재 선박 운송은 지원되지 않습니다.)
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-accent-amber/30 bg-accent-amber/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-amber" />
            <div>
              <p className="text-sm font-medium text-surface-900">리스크 안내</p>
              <p className="mt-1 text-xs text-surface-600">
                제한시간 초과 시 분당 2%씩 패널티가 적용됩니다. 
                패널티가 기본 보상의 50%에 도달하면 운행이 자동 종료됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-surface-100 bg-white p-4">
        <div className="mx-auto max-w-2xl">
          {availableSlot ? (
            <button
              onClick={handleStartDelivery}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 py-4 text-base font-medium text-white shadow-soft-md transition-colors hover:bg-primary-700 active:bg-primary-800"
            >
              <Play className="h-5 w-5" />
              운행 시작
            </button>
          ) : (
            <div className="space-y-2">
              <button
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-200 py-4 text-base font-medium text-surface-400"
              >
                슬롯 없음
              </button>
              <p className="text-center text-xs text-surface-500">
                사용 가능한 슬롯이 없습니다. 운행이 완료되면 다시 시도해 주세요.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-24" />

      {/* 계약서 확인 다이얼로그 */}
      <Dialog open={isContractOpen} onOpenChange={setIsContractOpen}>
        <DialogContent className="rounded-3xl max-w-[340px] p-0 overflow-hidden border-none bg-surface-50">
          <div className="bg-primary-600 p-6 text-white">
            <DialogTitle className="text-center font-medium text-xl tracking-tight">운송 계약 체결</DialogTitle>
            <p className="text-center text-primary-100 text-xs mt-1">Contract Confirmation</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                <h4 className="text-xs font-medium text-surface-400 uppercase tracking-widest mb-3">주문 요약</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-600">화물명</span>
                    <span className="font-medium text-surface-900">{order.cargoName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-600">예상 소요</span>
                    <span className="font-medium text-surface-900">
                      {order.distance < 1 ? Math.round(order.distance * 60) + '초' : Math.round(order.distance) + '분'} (ETA)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-surface-100 pt-2 mt-2">
                    <span className="text-surface-600">최종 보상금</span>
                    <span className="font-medium text-primary-600">${order.baseReward.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-accent-amber/5 p-4 border border-accent-amber/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-accent-amber" />
                  <h4 className="text-xs font-medium text-accent-amber uppercase tracking-widest">주의사항</h4>
                </div>
                <ul className="text-xs text-surface-600 space-y-1 list-disc pl-4">
                  <li>운행 중 <strong>단속 이벤트</strong>가 발생할 수 있습니다.</li>
                  <li>제한시간 초과 시 패널티가 부과됩니다.</li>
                  <li>중도 포기 시 평판이 하락합니다.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsContractOpen(false)}
                className="flex-1 rounded-2xl bg-surface-200 py-3.5 text-sm font-medium text-surface-600 hover:bg-surface-300 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleConfirmContract}
                className="flex-[2] rounded-2xl bg-primary-600 py-3.5 text-sm font-medium text-white shadow-soft-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                계약 서명 및 출발
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
