import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useUserStore } from '../entities/user';
import { Navigate } from 'react-router';
import { TransactionsTab } from '../features/profile/ui/TransactionsTab';

import { PageHeader } from '../shared/ui/PageHeader';

export const TransactionHistoryPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isSyncing, isHydrated } = useUserStore();

  // 페이지 마운트 시 window 스크롤 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const tabs = [
    { id: "profile", label: "프로필" },
    { id: "achievements", label: "업적" },
    { id: "history", label: "운행 기록" },
    { id: "transactions", label: "거래 내역" },
  ];

  const handleTabChange = (newTabId: string) => {
    navigate(`/profile/${newTabId}`);
  };

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
    <div className="flex flex-col min-h-screen bg-surface-50">
      {/* 상단 헤더 */}
      <PageHeader 
        title="마이 페이지"
        tabs={tabs}
        activeTab="transactions"
        onTabChange={handleTabChange}
        showBackButton
      />

      {/* 컨텐츠 영역 */}
      <div className="flex-1 w-full max-w-lg mx-auto pt-32 pb-32">
        <TransactionsTab />
      </div>
    </div>
  );
};
