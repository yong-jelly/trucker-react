import { Clock, MapPin, Share2, Hash } from 'lucide-react';
import { CATEGORY_LABELS } from '../../../shared/lib/mockData';

interface SettlementReceiptProps {
  finalReward: number;
  baseReward: number;
  penalty: number;
  lpReward: number;
  orderId: string;
}

export const SettlementReceipt = ({
  finalReward,
  baseReward,
  penalty,
  lpReward,
  orderId,
}: SettlementReceiptProps) => {
  return (
    <div className="rounded-sm bg-white p-6 shadow-soft-sm border border-surface-100 relative overflow-hidden">
      {/* SF 느낌의 장식 요소 (코너 라인) */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary-500/50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary-500/50" />
      
      <div className="text-center mb-6">
        <p className="text-[10px] font-medium text-primary-600 uppercase tracking-[0.2em]">최종 정산 금액</p>
        <h2 className="mt-2 text-4xl font-medium text-surface-900 tracking-tighter tabular-nums">${finalReward.toFixed(2)}</h2>
      </div>

      <div className="space-y-3 border-t border-dashed border-surface-200 pt-6">
        <div className="flex justify-between items-center">
          <span className="text-surface-500 text-xs font-medium">기본 보상</span>
          <span className="text-surface-900 text-base font-medium tabular-nums">${baseReward.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-surface-500 text-xs font-medium">지각 패널티</span>
          <span className="text-accent-rose text-base font-medium tabular-nums">-${penalty.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center border-t border-surface-50 pt-3 mt-1">
          <span className="text-surface-500 text-xs font-medium">획득 평판</span>
          <span className="text-accent-emerald text-base font-medium tabular-nums">
            +{lpReward} LP
          </span>
        </div>
      </div>

      {/* 계약 번호 */}
      <div className="mt-6 pt-4 border-t border-surface-50 flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-surface-400">
          <Hash className="h-3 w-3" />
          <span className="text-[10px] font-medium uppercase tracking-wider">계약 번호</span>
        </div>
        <span className="text-[10px] font-mono text-surface-400 uppercase">{orderId}</span>
      </div>

      {/* 하단 장식 (바코드/데이터 느낌) */}
      <div className="mt-4 pt-4 border-t border-dashed border-surface-200 flex flex-col items-center gap-2">
        <div className="w-full h-1 bg-surface-50 flex gap-0.5">
          {[...Array(24)].map((_, i) => (
            <div key={i} className={`h-full ${i % 4 === 0 ? 'w-2 bg-surface-200' : 'w-0.5 bg-surface-100'}`} />
          ))}
        </div>
        <p className="text-[9px] text-surface-400 font-mono tracking-[0.2em] uppercase">SYSTEM.SETTLEMENT.VERIFIED</p>
      </div>
    </div>
  );
};

interface SettlementDetailsProps {
  orderTitle: string;
  duration: string;
  limitTimeMinutes: number;
  distance: number;
  category: string;
  startAt?: number;
  completedAt?: number;
}

export const SettlementDetails = ({
  orderTitle,
  duration,
  limitTimeMinutes,
  distance,
  category,
  startAt,
  completedAt,
}: SettlementDetailsProps) => {
  const formatDate = (ts?: number) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}. ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="rounded-sm bg-white p-5 shadow-soft-sm border border-surface-100 relative">
      <h3 className="text-[10px] font-medium text-surface-500 uppercase tracking-widest mb-5">운행 상세 데이터</h3>
      
      <div className="grid grid-cols-2 gap-y-5 gap-x-8">
        <div className="col-span-2 space-y-1 pb-2 border-b border-surface-50">
          <div className="flex items-center gap-1.5 text-surface-400">
            <Hash className="h-3 w-3" />
            <span className="text-[11px] font-medium">계약 명칭</span>
          </div>
          <p className="text-sm font-medium text-surface-900">{orderTitle}</p>
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-x-8 gap-y-4 pb-2 border-b border-surface-50">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-surface-400">
              <Clock className="h-3 w-3" />
              <span className="text-[11px] font-medium">운행 시작</span>
            </div>
            <p className="text-[12px] font-medium text-surface-900">{formatDate(startAt)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-surface-400">
              <Clock className="h-3 w-3" />
              <span className="text-[11px] font-medium">운행 종료</span>
            </div>
            <p className="text-[12px] font-medium text-surface-900">{formatDate(completedAt)}</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-surface-400">
            <Clock className="h-3 w-3" />
            <span className="text-[11px] font-medium">운행 시간</span>
          </div>
          <p className="text-sm font-medium text-surface-900">{duration}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-surface-400">
            <Clock className="h-3 w-3" />
            <span className="text-[11px] font-medium">제한 시간</span>
          </div>
          <p className="text-sm font-medium text-surface-900">{limitTimeMinutes}분</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-surface-400">
            <MapPin className="h-3 w-3" />
            <span className="text-[11px] font-medium">운행 거리</span>
          </div>
          <p className="text-sm font-medium text-surface-900">{distance}km</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-surface-400">
            <Share2 className="h-3 w-3" />
            <span className="text-[11px] font-medium">카테고리</span>
          </div>
          <p className="text-sm font-medium text-surface-900">{CATEGORY_LABELS[category] || category}</p>
        </div>
      </div>
    </div>
  );
};
