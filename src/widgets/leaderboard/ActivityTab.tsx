import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { ActivityHeatmap } from './ui/ActivityHeatmap';
import { TransactionItem, TransactionItemSkeleton } from './ui/TransactionItem';
import type { ActivityDay, TransactionEntry } from '../entities/leaderboard/api';

interface ActivityTabProps {
  isLoading: boolean;
  heatmap: ActivityDay[];
  transactions: TransactionEntry[];
}

export const ActivityTab = ({
  isLoading,
  heatmap,
  transactions,
}: ActivityTabProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* 활동 히트맵 */}
      <ActivityHeatmap data={heatmap} isLoading={isLoading} />

      {/* 최근 거래 내역 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-surface-900">최근 거래 내역</h2>
          <button 
            onClick={() => navigate('/transactions')}
            className="text-xs text-primary-600 flex items-center gap-1"
          >
            전체 보기
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-xl bg-white border border-surface-100 px-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <TransactionItemSkeleton key={i} />)
          ) : transactions.length > 0 ? (
            transactions.slice(0, 15).map((tx) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-surface-500">거래 내역이 없습니다</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
