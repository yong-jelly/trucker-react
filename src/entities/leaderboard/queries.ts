import { useQuery } from '@tanstack/react-query';
import { getTransactions, type TransactionEntry } from './api';

/**
 * 거래 내역 조회 훅
 */
export function useTransactions(params?: {
  userId?: string;
  limit?: number;
  offset?: number;
  includeBots?: boolean;
}) {
  return useQuery<TransactionEntry[], Error>({
    queryKey: ['transactions', params],
    queryFn: () => getTransactions(params),
    staleTime: 1000 * 60, // 1분간 캐시
  });
}
