import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useUserStore } from '../entities/user';
import { Navigate } from 'react-router';
import { TransactionsTab } from '../features/profile/ui/TransactionsTab';

export const TransactionHistoryPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isSyncing, isHydrated } = useUserStore();

  // 페이지 마운트 시 window 스크롤 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  if (!isHydrated || isSyncing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-12">
      <header className="sticky top-0 z-50 flex items-center gap-3 bg-white px-4 py-4 shadow-soft-sm border-b border-surface-100">
        <button 
          onClick={() => navigate(-1)} 
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-surface-700" />
        </button>
        <h1 className="text-xl font-medium text-surface-900 tracking-tight">거래 내역</h1>
      </header>

      <div className="mx-auto max-w-lg pt-6">
        <TransactionsTab />
      </div>
    </div>
  );
};
