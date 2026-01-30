import { useState, useMemo } from 'react';
import { useTransactions } from '@entities/leaderboard';
import { useUserProfile } from '@entities/user';
import { 
  History, 
  Loader2, 
  ArrowUpRight, 
  Package, 
  Wrench, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { formatDateTime } from '@shared/lib/date';

type FilterType = 'ALL' | 'EQUIPMENT';

export const TransactionsTab = () => {
  const { data: profile } = useUserProfile();
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const { data: transactions = [], isLoading } = useTransactions({
    userId: profile?.public_profile_id,
    limit: 50,
    includeBots: false
  });

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'ALL') return transactions;
    if (activeFilter === 'EQUIPMENT') {
      return transactions.filter(t => 
        t.type === 'EQUIPMENT_PURCHASE' || t.type === 'EQUIPMENT_GRANTED'
      );
    }
    return transactions;
  }, [transactions, activeFilter]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'REWARD':
        return <ArrowUpRight className="h-4 w-4 text-accent-emerald" />;
      case 'EQUIPMENT_PURCHASE':
        return <Wrench className="h-4 w-4 text-accent-blue" />;
      case 'EQUIPMENT_GRANTED':
        return <Package className="h-4 w-4 text-accent-amber" />;
      case 'PENALTY':
      case 'FINE':
        return <AlertCircle className="h-4 w-4 text-accent-rose" />;
      default:
        return <History className="h-4 w-4 text-surface-400" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'REWARD': return '운행 보상';
      case 'EQUIPMENT_PURCHASE': return '장비 구매';
      case 'EQUIPMENT_GRANTED': return '장비 지급';
      case 'PENALTY': return '운행 패널티';
      case 'FINE': return '범칙금';
      default: return '기타 거래';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="text-sm text-surface-400 font-medium">거래 내역을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터 탭 */}
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
        {(['ALL', 'EQUIPMENT'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
              activeFilter === filter
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-surface-600 border-surface-200 hover:border-primary-200'
            }`}
          >
            {filter === 'ALL' ? '전체 내역' : '장비 관련'}
          </button>
        ))}
      </div>

      {/* 내역 리스트 */}
      <div className="px-4 space-y-2">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((t) => (
            <div 
              key={t.id}
              className="bg-white rounded-xl p-3 border border-surface-100 shadow-sm flex items-center gap-3"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                t.amount > 0 ? 'bg-accent-emerald/10' : 'bg-surface-50'
              }`}>
                {getTransactionIcon(t.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-semibold text-surface-400 uppercase tracking-wider">
                    {getTransactionLabel(t.type)}
                  </span>
                  <span className="text-[9px] text-surface-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDateTime(t.createdAt)}
                  </span>
                </div>
                <h4 className="text-xs font-medium text-surface-900 truncate">
                  {t.description || t.orderTitle || '상세 내역 없음'}
                </h4>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs font-semibold ${
                    t.amount > 0 ? 'text-accent-emerald' : 'text-surface-900'
                  }`}>
                    {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-medium text-surface-400">
                    잔액: {t.balanceAfter.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-surface-50 flex items-center justify-center mb-4">
              <History className="h-8 w-8 text-surface-200" />
            </div>
            <h3 className="text-base font-medium text-surface-900">거래 내역이 없습니다</h3>
            <p className="text-sm text-surface-500 mt-1">해당 조건의 내역을 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};
