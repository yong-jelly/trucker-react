import { useNavigate } from 'react-router';
import { 
  Package, ChevronRight, HelpCircle, Settings, UserCircle, Loader2, RefreshCw, 
  PlayCircle, Bike, Truck, Car, Plane, History, Trophy, Target,
  Award, Star, Flame, Activity
} from 'lucide-react';
import { useGameStore } from '../app/store';
import { OrderCard } from '../entities/order/OrderCard';
import { useUserProfile, useUpsertProfile, type UserProfile } from '../entities/user/queries';
import { useUserStore } from '../entities/user';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getOrders } from '../entities/order';
import { getUserSlots } from '../entities/slot';
import { getActiveRuns, type ActiveRun } from '../entities/run';
import { useEquipments } from '../entities/equipment';
import { getLeaderboard, getAllActiveRuns, getStatsSummary, type LeaderboardEntry, type ActiveRunEntry, type StatsSummary } from '../entities/leaderboard/api';
import { MOCK_ORDERS } from '../shared/lib/mockData';
import type { Order } from '../shared/api/types';
import { cn } from '../shared/lib/utils';

// 로딩 컴포넌트
const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-surface-50">
    <div className="text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary-500 mx-auto mb-4" />
      <p className="text-sm font-medium text-surface-500">{message}</p>
    </div>
  </div>
);

// 레벨 계산 함수 (reputation 기반)
const calculateLevel = (reputation: number): { level: number; currentExp: number; nextLevelExp: number; progress: number } => {
  // 레벨 공식: sqrt(reputation / 100)의 정수 부분
  const level = Math.floor(Math.sqrt(reputation / 100)) + 1;
  const currentLevelExp = Math.pow(level - 1, 2) * 100;
  const nextLevelExp = Math.pow(level, 2) * 100;
  const currentExp = reputation - currentLevelExp;
  const progress = (currentExp / (nextLevelExp - currentLevelExp)) * 100;
  
  return { level, currentExp, nextLevelExp, progress };
};

// 시간 포맷 함수
const formatTimeRemaining = (etaSeconds: number): string => {
  if (etaSeconds < 60) return `${etaSeconds}초`;
  if (etaSeconds < 3600) return `${Math.floor(etaSeconds / 60)}분`;
  const hours = Math.floor(etaSeconds / 3600);
  const minutes = Math.floor((etaSeconds % 3600) / 60);
  return `${hours}시간 ${minutes}분`;
};

// 메인 대시보드 컴포넌트
const Dashboard = ({ profile }: { profile: UserProfile }) => {
  const navigate = useNavigate();
  const { slots, setSlots } = useGameStore();
  const { isAuthenticated } = useUserStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allActiveRuns, setAllActiveRuns] = useState<ActiveRunEntry[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(true);
  const [isActiveRunsLoading, setIsActiveRunsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // 장비 정보 로드
  const { data: equipments = [] } = useEquipments();

  const profileId = profile.public_profile_id;
  const levelInfo = useMemo(() => calculateLevel(profile.reputation), [profile.reputation]);

  // 최후의 방어선: profile이 null이면 로딩 화면 표시
  if (!profile || typeof profile.balance !== 'number') {
    return <LoadingScreen message="프로필 로딩 중..." />;
  }

  // 슬롯 목록 로드 함수
  const fetchSlots = useCallback(async () => {
    if (!isAuthenticated || !profileId) return;
    
    try {
      const userSlots = await getUserSlots(profileId);
      let finalSlots = [...userSlots];
      if (finalSlots.length === 0) {
        finalSlots = [
          { id: 'temp-0', index: 0, isLocked: false },
          { id: 'temp-1', index: 1, isLocked: true },
          { id: 'temp-2', index: 2, isLocked: true },
        ];
      }
      setSlots(finalSlots);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setIsSlotsLoading(false);
    }
  }, [isAuthenticated, profileId, setSlots]);

  // 진행 중인 운행 목록 로드 함수
  const fetchActiveRuns = useCallback(async () => {
    if (!isAuthenticated || !profileId) return;
    
    try {
      const runs = await getActiveRuns(profileId);
      setActiveRuns(runs);
    } catch (err) {
      console.error('Failed to fetch active runs:', err);
    } finally {
      setIsActiveRunsLoading(false);
    }
  }, [isAuthenticated, profileId]);

  // 주문 목록 로드 함수
  const fetchOrders = useCallback(() => {
    if (!isAuthenticated || !profileId) return;
    
    setIsOrdersLoading(true);
    getOrders(profileId)
      .then(setOrders)
      .catch(err => {
        console.error('Failed to fetch orders, using mock data:', err);
        // API 실패 시 목업 데이터 사용
        setOrders(MOCK_ORDERS.slice(0, 5));
      })
      .finally(() => setIsOrdersLoading(false));
  }, [isAuthenticated, profileId]);

  // 리더보드 로드 함수
  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await getLeaderboard('weekly');
      setLeaderboard(data.slice(0, 5)); // 상위 5명만 표시
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, []);

  // 전체 활성 운행 로드 함수
  const fetchAllActiveRuns = useCallback(async () => {
    try {
      const data = await getAllActiveRuns();
      setAllActiveRuns(data.slice(0, 10)); // 최근 10개만 표시
    } catch (err) {
      console.error('Failed to fetch all active runs:', err);
    }
  }, []);

  // 통계 요약 로드 함수
  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const data = await getStatsSummary();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // 데이터 로드
  useEffect(() => {
    fetchSlots();
    fetchOrders();
    fetchActiveRuns();
    fetchLeaderboard();
    fetchAllActiveRuns();
    fetchStats();
    
    const interval = setInterval(() => {
      fetchOrders();
      fetchActiveRuns();
      fetchAllActiveRuns();
      fetchStats();
    }, 30000); // 30초마다 갱신
    
    return () => clearInterval(interval);
  }, [fetchSlots, fetchOrders, fetchActiveRuns, fetchLeaderboard, fetchAllActiveRuns, fetchStats]);

  const activeSlot = slots.find(s => s.index === 0 && !s.activeRunId);
  const userRank = useMemo(() => {
    const rank = leaderboard.findIndex(entry => entry.userId === profileId);
    return rank >= 0 ? rank + 1 : null;
  }, [leaderboard, profileId]);

  const getEquipmentIcon = (equipmentId: string | null | undefined) => {
    const equipment = equipments.find(e => e.id === equipmentId);
    const type = equipment?.equipmentType || equipmentId;

    switch (type) {
      case 'VAN': return <Car className="h-4 w-4" />;
      case 'TRUCK': return <Truck className="h-4 w-4" />;
      case 'HEAVY_TRUCK': return <Truck className="h-4 w-4 text-primary-600" />;
      case 'PLANE': return <Plane className="h-4 w-4" />;
      default: return <Bike className="h-4 w-4" />;
    }
  };

  const getEquipmentName = (equipmentId: string | null | undefined) => {
    const equipment = equipments.find(e => e.id === equipmentId);
    return equipment?.name || '배달 자전거';
  };

  // 데이터 로딩 중
  if (isSlotsLoading || isActiveRunsLoading) {
    return <LoadingScreen message="데이터 동기화 중..." />;
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="mx-auto max-w-lg">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 bg-white px-4 py-4 border-b border-surface-100">
          <div className="flex flex-col gap-6 bg-white p-6 border border-surface-100 rounded-2xl">
            {/* 상단: 프로필 정보 */}
            <div className="flex items-center justify-between gap-3">
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80"
              >
                <div className="relative shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center bg-primary-50 text-primary-600 rounded-full overflow-hidden">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.nickname} 
                        className="h-full w-full object-cover" 
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <UserCircle className="h-8 w-8" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center bg-white border border-surface-100 rounded-full">
                    <Trophy className="h-3 w-3 text-amber-500" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-surface-900 truncate">{profile.nickname}</h2>
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-600 uppercase tracking-tight shrink-0">
                      Lv.{levelInfo.level}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">평판</p>
                      <span className="text-xs font-medium text-primary-600">{profile.reputation.toLocaleString()}</span>
                    </div>
                    {userRank && (
                      <div className="flex items-center gap-1">
                        <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">랭킹</p>
                        <span className="text-xs font-medium text-amber-600">#{userRank}</span>
                      </div>
                    )}
                  </div>
                  {/* 레벨 진행 바 */}
                  <div className="mt-2">
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                        style={{ width: `${Math.min(levelInfo.progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-surface-400 mt-1">
                      다음 레벨까지 {Math.ceil(levelInfo.nextLevelExp - profile.reputation)} 평판 필요
                    </p>
                  </div>
                </div>
              </button>
              
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => navigate('/help')}
                  className="flex h-10 w-10 items-center justify-center bg-surface-50 text-surface-500 border border-surface-100 rounded-full"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => navigate('/super/admin/setting')}
                  className="flex h-10 w-10 items-center justify-center bg-surface-50 text-surface-500 border border-surface-100 rounded-full"
                >
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 중단: 잔액 정보 */}
            <div className="flex items-end justify-between border-t border-surface-50 pt-6">
              <div>
                <p className="text-[10px] font-medium text-surface-400 uppercase tracking-[0.2em] mb-1">보유 잔액</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-surface-400">$</span>
                  <span className="text-4xl font-medium text-surface-900 tracking-tight">
                    {profile.balance.toLocaleString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/transactions')}
                className="mb-1 flex items-center gap-1.5 bg-surface-900 px-4 py-2 text-xs font-medium text-white rounded-xl"
              >
                <History className="h-3.5 w-3.5" />
                내역
              </button>
            </div>
            
            {/* 하단: 슬롯 및 주요 액션 버튼 */}
            <div className="space-y-4 border-t border-surface-50 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-surface-900 uppercase tracking-wider whitespace-nowrap">운행 슬롯</span>
                  <div className="flex gap-1.5">
                    {slots.map((slot) => {
                      const isMVPDisabled = slot.index > 0;
                      const isLocked = slot.isLocked || isMVPDisabled;
                      return (
                        <div 
                          key={slot.id} 
                          className={cn(
                            "h-2 rounded-full",
                            isLocked 
                              ? 'w-6 bg-surface-100' 
                              : slot.activeRunId
                                ? 'w-8 bg-accent-emerald animate-pulse'
                                : 'w-6 bg-primary-500'
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate('/hire')}
                    className="flex items-center gap-1.5 bg-surface-50 px-4 py-2.5 text-xs font-medium text-surface-700 border border-surface-100 rounded-xl"
                  >
                    고용
                  </button>
                  <button 
                    onClick={() => navigate('/garage')}
                    className="flex items-center gap-1.5 bg-surface-50 px-4 py-2.5 text-xs font-medium text-surface-700 border border-surface-100 rounded-xl"
                  >
                    창고
                  </button>
                  <button 
                    onClick={() => navigate('/leaderboard')}
                    className="flex items-center gap-1.5 bg-surface-50 px-4 py-2.5 text-xs font-medium text-surface-700 border border-surface-100 rounded-xl"
                  >
                    랭킹
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="mt-6 space-y-8 px-4">
          {/* 퀵 액션 카드 */}
          <section className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/garage')}
              className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-2xl border border-primary-200 text-left"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-200/30 rounded-full -mr-12 -mt-12" />
              <Truck className="h-8 w-8 text-primary-600 mb-3" />
              <h3 className="text-base font-medium text-surface-900 mb-1">새로운 미션</h3>
              <p className="text-xs text-surface-600">운행 시작하기</p>
            </button>
            
            <button
              onClick={() => activeRuns.length > 0 ? navigate(`/run/${activeRuns[0].run.id}`) : navigate('/leaderboard')}
              className="relative overflow-hidden bg-gradient-to-br from-accent-emerald/10 to-accent-emerald/20 p-6 rounded-2xl border border-accent-emerald/20 text-left"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-emerald/20 rounded-full -mr-12 -mt-12" />
              <Target className="h-8 w-8 text-accent-emerald mb-3" />
              <h3 className="text-base font-medium text-surface-900 mb-1">진행 중인 퀘스트</h3>
              <p className="text-xs text-surface-600">{activeRuns.length}개 미션 진행 중</p>
            </button>
          </section>

          {/* 실시간 경쟁 현황 */}
          {stats && (
            <section className="bg-gradient-to-br from-surface-50 to-surface-100 p-4 rounded-2xl border border-surface-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-surface-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary-600" />
                  실시간 경쟁 현황
                </h2>
                <button 
                  onClick={fetchStats}
                  className="p-1 text-surface-400 hover:text-surface-600"
                >
                  <RefreshCw className={cn("h-4 w-4", isStatsLoading && "animate-spin")} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-surface-200">
                  <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-1">활성 운행</p>
                  <p className="text-2xl font-medium text-surface-900">{stats.activeRuns}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-surface-200">
                  <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-1">오늘 완료</p>
                  <p className="text-2xl font-medium text-surface-900">{stats.completedRunsToday}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-surface-200">
                  <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-1">총 플레이어</p>
                  <p className="text-2xl font-medium text-surface-900">{stats.totalUsers}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-surface-200">
                  <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-1">오늘 수익</p>
                  <p className="text-2xl font-medium text-primary-600">${stats.totalEarningsToday.toLocaleString()}</p>
                </div>
              </div>
            </section>
          )}

          {/* 진행 중인 운행 */}
          {activeRuns.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-surface-900 flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-accent-emerald" />
                  진행 중인 미션
                </h2>
                <button 
                  onClick={fetchActiveRuns}
                  className="p-2 text-surface-400 hover:text-surface-600"
                >
                  <RefreshCw className={cn("h-4 w-4", isActiveRunsLoading && "animate-spin")} />
                </button>
              </div>
              <div className="space-y-3">
                {activeRuns.map((activeRun) => {
                  const progress = activeRun.run.etaSeconds > 0 
                    ? Math.max(0, Math.min(100, ((activeRun.run.deadlineAt - Date.now()) / (activeRun.run.deadlineAt - activeRun.run.startAt)) * 100))
                    : 0;
                  
                  return (
                    <button
                      key={activeRun.run.id}
                      onClick={() => navigate(`/run/${activeRun.run.id}`)}
                      className="w-full text-left overflow-hidden bg-white border border-accent-emerald/30 rounded-2xl"
                    >
                      <div className="bg-accent-emerald/5 px-4 py-2 flex items-center justify-between border-b border-accent-emerald/10">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
                          <span className="text-[10px] font-medium text-accent-emerald uppercase tracking-widest">슬롯 {activeRun.slotIndex + 1} 운행 중</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-surface-500">
                          {getEquipmentIcon(activeRun.run.selectedItems.equipmentId)}
                          <span>{getEquipmentName(activeRun.run.selectedItems.equipmentId)}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-surface-900 leading-tight truncate">{activeRun.order.title}</h3>
                            <p className="text-[10px] font-medium text-surface-400 mt-1 truncate">
                              {activeRun.order.cargoName} · {activeRun.order.distance}km
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest">현재 보상</p>
                            <p className="text-sm font-medium text-accent-emerald">${activeRun.run.currentReward.toLocaleString()}</p>
                          </div>
                        </div>
                        {/* 진행 바 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-medium text-surface-500">진행률</span>
                            <span className="font-medium text-accent-emerald">
                              {activeRun.run.etaSeconds > 0 ? formatTimeRemaining(activeRun.run.etaSeconds) : '완료 대기 중'}
                            </span>
                          </div>
                          <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-accent-emerald to-primary-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 주간 리더보드 미리보기 */}
          {leaderboard.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-surface-900 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  주간 랭킹
                </h2>
                <button 
                  onClick={() => navigate('/leaderboard')}
                  className="text-xs font-medium text-primary-600"
                >
                  전체 보기 →
                </button>
              </div>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <button
                    key={entry.userId}
                    onClick={() => navigate(`/p/status/${entry.userId}`)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border",
                      entry.userId === profileId
                        ? "bg-primary-50 border-primary-200"
                        : "bg-white border-surface-100"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium shrink-0",
                      index === 0 ? "bg-amber-500 text-white" : index === 1 ? "bg-surface-300 text-white" : index === 2 ? "bg-amber-600 text-white" : "bg-surface-100 text-surface-600"
                    )}>
                      {index === 0 ? <Trophy className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-100 shrink-0">
                      {entry.avatarUrl ? (
                        <img 
                          src={entry.avatarUrl} 
                          alt={entry.nickname}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-full w-full text-surface-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-surface-900 truncate">{entry.nickname}</p>
                        {entry.isBot && (
                          <span className="text-[10px] font-medium text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded">BOT</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] font-medium text-surface-500">${entry.periodEarnings.toLocaleString()}</span>
                        <span className="text-[10px] font-medium text-surface-400">평판 {entry.reputation.toLocaleString()}</span>
                      </div>
                    </div>
                    {entry.userId === profileId && (
                      <div className="shrink-0">
                        <Star className="h-4 w-4 text-primary-600 fill-primary-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 사용 가능한 주문 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-medium text-surface-900">사용 가능한 미션</h2>
                <span className="text-[10px] font-medium text-surface-400">
                  {isOrdersLoading ? '· 로딩 중...' : `· ${orders.length}개`}
                </span>
              </div>
              <button 
                onClick={fetchOrders}
                className="p-2 text-surface-400 hover:text-surface-600"
              >
                <RefreshCw className={cn("h-4 w-4", isOrdersLoading && "animate-spin")} />
              </button>
            </div>
            
            <div className="space-y-3">
              {isOrdersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-surface-300" />
                </div>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => navigate(`/order/${order.id}`)}
                    disabled={!activeSlot}
                    disabledReason={!activeSlot ? '사용 가능한 슬롯이 없습니다' : undefined}
                  />
                ))
              ) : (
                <div className="bg-white p-12 text-center border border-surface-100 rounded-2xl">
                  <Package className="h-12 w-12 text-surface-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-surface-400">현재 사용 가능한 미션이 없습니다</p>
                  <p className="text-xs text-surface-300 mt-1 mb-6">잠시 후 다시 확인해주세요</p>
                  <button 
                    onClick={fetchOrders}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-50 text-primary-600 border border-primary-100 text-sm font-medium rounded-xl"
                  >
                    <RefreshCw className={cn("h-4 w-4", isOrdersLoading && "animate-spin")} />
                    새로고침
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 실시간 경쟁자 활동 */}
          {allActiveRuns.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-surface-900 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-accent-rose" />
                  실시간 경쟁자 활동
                </h2>
                <button 
                  onClick={fetchAllActiveRuns}
                  className="text-xs font-medium text-primary-600"
                >
                  더 보기 →
                </button>
              </div>
              <div 
                className="space-y-2 overflow-x-auto"
                style={{ 
                  willChange: 'scroll-position',
                  WebkitOverflowScrolling: 'touch',
                  transform: 'translateZ(0)',
                }}
              >
                {allActiveRuns.slice(0, 5).map((run) => (
                  <button
                    key={run.runId}
                    onClick={() => navigate(`/p/run/${run.runId}`)}
                    className="w-full flex items-center gap-3 p-3 bg-white border border-surface-100 rounded-xl"
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-surface-100 shrink-0">
                      {run.avatarUrl ? (
                        <img 
                          src={run.avatarUrl} 
                          alt={run.nickname}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-full w-full text-surface-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-surface-900 truncate">{run.nickname}</p>
                        {run.isBot && (
                          <span className="text-[10px] font-medium text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded">BOT</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-surface-500 truncate mt-0.5">{run.orderTitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-accent-emerald">${run.currentReward.toLocaleString()}</p>
                      <p className="text-[10px] text-surface-400 mt-0.5">{run.distance}km</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 추가 오퍼 안내 */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-surface-200 bg-white py-8 px-6 text-center rounded-2xl">
            <Award className="h-8 w-8 text-surface-300 mb-3" />
            <p className="text-sm font-medium text-surface-500">
              더 많은 미션은 평판을 올리면 해금됩니다
            </p>
            <p className="text-xs text-surface-400 mt-1">
              레벨업을 통해 새로운 도전을 시작하세요
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

// 메인 HomePage 컴포넌트
export const HomePage = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { user, isAuthenticated, isSyncing, isHydrated } = useUserStore();
  const { mutate: upsertProfile, isPending: isCreating } = useUpsertProfile();

  useEffect(() => {
    console.log('Home State:', { isHydrated, isAuthenticated, isSyncing, isProfileLoading, hasProfile: !!profile });
  }, [isHydrated, isAuthenticated, isSyncing, isProfileLoading, profile]);

  useEffect(() => {
    if (isHydrated && !isSyncing && !isAuthenticated) {
      navigate('/onboarding');
    }
  }, [isHydrated, isAuthenticated, isSyncing, navigate]);

  const handleCreateProfile = () => {
    if (!user) return;
    const defaultNickname = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Trucker';
    upsertProfile({
      nickname: defaultNickname.slice(0, 20),
      avatar_url: user.user_metadata?.avatar_url || null,
    });
  };

  if (!isHydrated || isSyncing) {
    return <LoadingScreen message="시스템 준비 중..." />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen message="인증 확인 중..." />;
  }

  if (isProfileLoading) {
    return <LoadingScreen message="프로필 불러오는 중..." />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-white">
        <div className="w-20 h-20 bg-primary-50 border border-primary-100 flex items-center justify-center mb-6 rounded-full">
          <UserCircle className="h-10 w-10 text-primary-600" />
        </div>
        <h2 className="text-2xl font-medium text-surface-900 mb-2 leading-tight">새로운 트럭커를 환영합니다!</h2>
        <p className="text-sm text-surface-500 mb-8 leading-relaxed">
          도로에 나갈 준비가 거의 다 되었습니다.<br/>
          계정 정보를 바탕으로 프로필을 생성할까요?
        </p>
        <button
          onClick={handleCreateProfile}
          disabled={isCreating}
          className="w-full max-w-xs py-4 bg-primary-600 text-white font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-50 rounded-xl"
        >
          {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : '프로필 생성하고 시작하기'}
          {!isCreating && <ChevronRight className="h-5 w-5" />}
        </button>
      </div>
    );
  }

  return <Dashboard profile={profile} />;
};
