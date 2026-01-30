import { 
  History, 
  Loader2, 
  Package, 
  TrendingUp, 
  MapPin, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@shared/lib/mockData';
import { formatDate, formatKSTTimeShort } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@shared/ui/Sheet';
import type { RunHistory } from '../../run/api';

interface EquipmentHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  history: RunHistory[] | null;
  isEquipped?: boolean;
  onEquip?: () => void;
  isEquipPending?: boolean;
}

export const EquipmentHistorySheet = ({
  isOpen,
  onClose,
  isLoading,
  history,
  isEquipped,
  onEquip,
  isEquipPending,
}: EquipmentHistorySheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col p-0 h-[80vh]">
        {/* 헤더 */}
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-surface-600">
              <History className="h-6 w-6" />
            </div>
            <div className="text-left">
              <SheetTitle>운영 히스토리</SheetTitle>
              <SheetDescription>최근 20건의 운행 기록</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* 요약 정보 */}
        {!isLoading && history && history.length > 0 && (
          <div className="px-6 mb-6 grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-surface-600" />
                <span className="text-[10px] font-medium text-surface-600 uppercase tracking-wider">총 수익</span>
              </div>
              <p className="text-lg font-medium text-surface-900">
                ${history.reduce((acc, h) => acc + h.currentReward, 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-surface-600" />
                <span className="text-[10px] font-medium text-surface-600 uppercase tracking-wider">완료 횟수</span>
              </div>
              <p className="text-lg font-medium text-surface-900">
                {history.filter(h => h.status === 'COMPLETED').length}회
              </p>
            </div>
          </div>
        )}

        {/* 목록 영역 */}
        <div 
          className="flex-1 overflow-y-auto px-6 space-y-4 pr-1 scrollbar-hide pb-4"
          style={{ 
            willChange: 'scroll-position',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
              <p className="text-sm font-medium text-surface-400">기록을 불러오는 중입니다...</p>
            </div>
          ) : history && history.length > 0 ? (
            history.map((h) => (
              <div 
                key={h.runId} 
                className="group relative overflow-hidden rounded-[24px] border border-surface-100 bg-white p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1.5 min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight",
                        CATEGORY_COLORS[h.orderCategory] || "bg-surface-100 text-surface-600"
                      )}>
                        {CATEGORY_LABELS[h.orderCategory] || h.orderCategory}
                      </span>
                      <span className="text-[10px] font-medium text-surface-400 whitespace-nowrap">
                        {formatDate(h.completedAt || h.startAt)} {formatKSTTimeShort(h.completedAt || h.startAt)}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-surface-900 truncate">{h.orderTitle}</h4>
                  </div>
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                    h.status === 'COMPLETED' ? "bg-surface-100 text-surface-600" : "bg-surface-100 text-surface-500"
                  )}>
                    {h.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 rounded-xl bg-surface-50 p-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-medium text-surface-500 uppercase tracking-widest">수익</p>
                    <p className={cn(
                      "text-sm font-medium",
                      h.status === 'COMPLETED' ? "text-surface-900" : "text-surface-500"
                    )}>
                      ${h.currentReward.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-medium text-surface-500 uppercase tracking-widest">거리</p>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-surface-400" />
                      <p className="text-sm font-medium text-surface-700">{h.orderDistance}km</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-medium text-surface-500 uppercase tracking-widest">결과</p>
                    <p className={cn(
                      "text-sm font-medium",
                      h.status === 'COMPLETED' ? "text-surface-900" : "text-surface-600"
                    )}>
                      {h.status === 'COMPLETED' ? '성공' : '실패'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-3xl bg-surface-50 flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-surface-200" />
              </div>
              <h3 className="text-base font-medium text-surface-900 mb-2">아직 기록이 없어요</h3>
              <p className="text-sm text-surface-500 leading-relaxed">
                이 장비로 첫 번째 배송을<br />
                완료하고 기록을 남겨보세요!
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="p-6 flex-col gap-3">
          {!isEquipped && onEquip && (
            <button 
              onClick={onEquip}
              disabled={isEquipPending}
              className="w-full rounded-2xl bg-surface-800 py-4 text-sm font-medium text-white active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isEquipPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '장비 장착하기'}
            </button>
          )}
          <button 
            onClick={onClose}
            className="w-full rounded-2xl bg-surface-100 py-4 text-sm font-medium text-surface-600 active:scale-[0.98]"
          >
            닫기
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
