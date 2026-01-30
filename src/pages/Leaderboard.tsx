import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { 
  RefreshCw, HelpCircle
} from 'lucide-react';
import { 
  getLeaderboard, 
  getAllActiveRuns, 
  getRecentCompletedRuns,
  getActivityHeatmap,
  getTransactions,
  getStatsSummary,
  type LeaderboardEntry,
  type ActiveRunEntry,
  type ActivityDay,
  type TransactionEntry,
  type StatsSummary,
  type LeaderboardPeriod
} from '../entities/leaderboard/api';
import { Skeleton } from '../shared/ui/Skeleton';
import { useUserProfile } from '../entities/user/queries';
// import { getTimeDiff, formatRelativeTime, formatKSTTime } from '../shared/lib/date';

// 분리된 컴포넌트 임포트
import { HelpModal } from '../widgets/leaderboard/ui/HelpModal';
import { LiveTab } from '../widgets/leaderboard/LiveTab';
import { RankingTab } from '../widgets/leaderboard/RankingTab';
import { CompetitorsTab } from '../widgets/leaderboard/CompetitorsTab';
import { ActivityTab } from '../widgets/leaderboard/ActivityTab';

import { PageHeader } from '../shared/ui/PageHeader';

type TabType = 'live' | 'ranking' | 'competitors' | 'activity';

// 통계 카드 컴포넌트
const StatCard = ({ 
  label, 
  value, 
  isLoading,
}: { 
  label: string; 
  value: string | number; 
  color?: 'primary' | 'emerald' | 'amber' | 'rose';
  isLoading?: boolean;
}) => {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-white p-2.5 border border-surface-100 shadow-soft-xs">
      <p className="text-[10px] font-medium text-surface-400 uppercase tracking-tight">{label}</p>
      {isLoading ? (
        <Skeleton className="h-5 w-16 mt-0.5" />
      ) : (
        <p className="text-sm font-medium text-surface-900">{value}</p>
      )}
    </div>
  );
};

const StatCardSkeleton = () => (
  <div className="grid grid-cols-4 gap-2">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex flex-col gap-0.5 rounded-xl bg-white p-2.5 border border-surface-100 shadow-soft-xs">
        <Skeleton className="h-3 w-10 mb-1" />
        <Skeleton className="h-5 w-16" />
      </div>
    ))}
  </div>
);

// 메인 Leaderboard 페이지
export const LeaderboardPage = () => {
  const { data: profile } = useUserProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'live');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tabs = [
    { id: 'live', label: '실시간' },
    { id: 'ranking', label: '랭킹' },
    { id: 'competitors', label: '경쟁자들' },
    { id: 'activity', label: '활동' },
  ];

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tabId: string) => {
    const tab = tabId as TabType;
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };
  
  // 데이터 상태
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const [activeRuns, setActiveRuns] = useState<ActiveRunEntry[]>([]);
  const [recentRuns, setRecentRuns] = useState<ActiveRunEntry[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(true);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isRankingLoading, setIsRankingLoading] = useState(true);

  const [heatmap, setHeatmap] = useState<ActivityDay[]>([]);
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);

  // 탭 변경 시 스크롤 최상단 이동
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  // 통계 요약 로드 (모든 탭에서 공통 사용)
  const fetchStats = useCallback(async () => {
    try {
      const data = await getStatsSummary();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats summary:', error);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // 실시간 탭 데이터 로드
  const fetchLiveData = useCallback(async () => {
    try {
      const [runsData, recentData] = await Promise.all([
        getAllActiveRuns(),
        getRecentCompletedRuns(10),
      ]);
      setActiveRuns(runsData);
      setRecentRuns(recentData);
    } catch (error) {
      console.error('Failed to fetch live data:', error);
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  // 랭킹 탭 데이터 로드
  const fetchRankingData = useCallback(async (p: LeaderboardPeriod) => {
    try {
      const rankData = await getLeaderboard(p);
      setLeaderboard(rankData);
    } catch (error) {
      console.error('Failed to fetch ranking data:', error);
    } finally {
      setIsRankingLoading(false);
    }
  }, []);

  // 활동 탭 데이터 로드
  const fetchActivityData = useCallback(async () => {
    try {
      const [heatData, txData] = await Promise.all([
        getActivityHeatmap(),
        getTransactions({ limit: 30 }),
      ]);
      setHeatmap(heatData);
      setTransactions(txData);
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
    } finally {
      setIsActivityLoading(false);
    }
  }, []);

  // 전체 새로고침
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchStats(),
      (activeTab === 'live' || activeTab === 'competitors') ? fetchLiveData() : Promise.resolve(),
      (activeTab === 'ranking' || activeTab === 'competitors') ? fetchRankingData(period) : Promise.resolve(),
      activeTab === 'activity' ? fetchActivityData() : Promise.resolve(),
    ]);
    setIsRefreshing(false);
  }, [activeTab, period, fetchStats, fetchLiveData, fetchRankingData, fetchActivityData]);

  // 초기 로드 및 탭 변경 시 로드
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'live') {
      fetchLiveData();
    } else if (activeTab === 'ranking') {
      fetchRankingData(period);
    } else if (activeTab === 'competitors') {
      fetchLiveData();
      fetchRankingData(period);
    } else if (activeTab === 'activity') {
      fetchActivityData();
    }
  }, [activeTab, period, fetchLiveData, fetchRankingData, fetchActivityData]);

  // 자동 새로고침 (현재 탭 데이터만)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      if (activeTab === 'live') fetchLiveData();
      else if (activeTab === 'ranking') fetchRankingData(period);
      else if (activeTab === 'competitors') {
        fetchLiveData();
        fetchRankingData(period);
      }
      else if (activeTab === 'activity') fetchActivityData();
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, period, fetchStats, fetchLiveData, fetchRankingData, fetchActivityData]);

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto max-w-2xl bg-white min-h-screen relative">
        {/* 헤더 */}
        <PageHeader 
          title="리더보드"
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          rightElement={
            <div className="flex gap-1">
              <button
                onClick={() => setIsHelpOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-50 hover:bg-surface-100 transition-colors"
              >
                <HelpCircle className="h-5 w-5 text-surface-600" />
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-50 hover:bg-surface-100 transition-colors"
              >
                <RefreshCw className={`h-5 w-5 text-surface-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          }
        />

        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

        <main className="px-4 py-4 pt-32 space-y-6">
          {/* 통계 요약 - 활동 탭에서만 표시 */}
          {activeTab === 'activity' && (
            isStatsLoading ? (
              <StatCardSkeleton />
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <StatCard 
                  label="활성 운행" 
                  value={stats?.activeRuns || 0} 
                  color="emerald" 
                />
                <StatCard 
                  label="오늘 완료" 
                  value={stats?.completedRunsToday || 0} 
                  color="primary" 
                />
                <StatCard 
                  label="참여자" 
                  value={`${stats?.totalUsers || 0} + ${stats?.totalBots || 0}`} 
                  color="amber" 
                />
                <StatCard 
                  label="오늘 총 수익" 
                  value={`$${(stats?.totalEarningsToday || 0).toLocaleString()}`} 
                  color="rose" 
                />
              </div>
            )
          )}

          {/* 탭 콘텐츠 */}
          {activeTab === 'live' && (
            <LiveTab 
              isLoading={isLiveLoading}
              activeRuns={activeRuns}
              recentRuns={recentRuns}
              userProfileId={profile?.public_profile_id}
              userNickname={profile?.nickname ?? undefined}
              userAvatarUrl={profile?.avatar_url ?? undefined}
            />
          )}

          {activeTab === 'ranking' && (
            <RankingTab 
              isLoading={isRankingLoading}
              leaderboard={leaderboard}
              period={period}
              setPeriod={setPeriod}
              userProfileId={profile?.public_profile_id}
            />
          )}

          {activeTab === 'competitors' && (
            <CompetitorsTab 
              isLoading={isRankingLoading}
              leaderboard={leaderboard}
              activeRuns={activeRuns}
              userProfileId={profile?.public_profile_id}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityTab 
              isLoading={isActivityLoading}
              heatmap={heatmap}
              transactions={transactions}
            />
          )}
        </main>
      </div>
    </div>
  );
};
