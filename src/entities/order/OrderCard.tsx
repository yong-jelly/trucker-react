import { MapPin, Clock, Package, Trophy, ChevronRight, Bike, Truck, Plane, Anchor } from 'lucide-react';
import type { Order } from '../../shared/api/types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../shared/lib/mockData';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  status?: 'default' | 'recommended' | 'in_progress' | 'completed';
}

const EQUIPMENT_ICONS: Record<string, any> = {
  BICYCLE: Bike,
  VAN: Truck,
  TRUCK: Truck,
  HEAVY_TRUCK: Truck,
  PLANE: Plane,
  SHIP: Anchor,
};

const EQUIPMENT_LABELS: Record<string, string> = {
  BICYCLE: '자전거',
  VAN: '소형 밴',
  TRUCK: '대형 트럭',
  HEAVY_TRUCK: '특수 중량 트럭',
  PLANE: '화물 비행기',
  SHIP: '컨테이너선',
};

export const OrderCard = ({ order, onClick, disabled, disabledReason, status = 'default' }: OrderCardProps) => {
  const EquipmentIcon = order.requiredEquipmentType ? EQUIPMENT_ICONS[order.requiredEquipmentType] : Bike;
  
  // 랭킹 점수 계산 (임시 로직: 기본 보상의 10%)
  const rankingPoints = Math.floor(order.baseReward * 0.1);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-white p-5 text-left border transition-all rounded-2xl shadow-sm ${
        disabled 
          ? 'opacity-60 cursor-not-allowed border-surface-100' 
          : status === 'recommended'
            ? 'border-primary-200 bg-primary-50/10 active:bg-primary-50'
            : 'border-surface-100 active:bg-surface-50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          {/* 상단: 랭킹 점수 강조 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-primary-600">
              <Trophy className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">+{rankingPoints} RP</span>
              {status === 'recommended' && (
                <span className="text-[10px] font-medium bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded ml-1">추천</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-surface-400">
              <EquipmentIcon className="h-3 w-3" />
              <span>{order.requiredEquipmentType ? EQUIPMENT_LABELS[order.requiredEquipmentType] : '자전거'}</span>
            </div>
          </div>

          {/* 제목 및 기본 정보 */}
          <div>
            <h3 className="text-sm font-medium text-surface-900 leading-tight mb-1">{order.title}</h3>
            <div className="flex items-center gap-3 text-[11px] font-medium text-surface-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {order.limitTimeMinutes}분
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {order.distance}km
              </span>
              <span className="text-surface-200">|</span>
              <span className="text-surface-600">${order.baseReward.toLocaleString()}</span>
            </div>
          </div>

          {/* 비활성 사유 */}
          {disabled && disabledReason && (
            <p className="text-[10px] font-medium text-rose-500 bg-rose-50 px-2 py-1 rounded inline-block">
              {disabledReason}
            </p>
          )}
        </div>

        {/* 액션 영역 */}
        <div className="flex flex-col items-end justify-between self-stretch">
          <div className={`flex h-8 w-8 items-center justify-center border rounded-full ${disabled ? 'bg-surface-50 border-surface-100' : 'bg-white border-surface-100'}`}>
            <ChevronRight className={`h-4 w-4 ${disabled ? 'text-surface-300' : 'text-surface-400'}`} />
          </div>
          {order.weight > 1000 && (
            <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">고중량</span>
          )}
        </div>
      </div>
    </button>
  );
};
