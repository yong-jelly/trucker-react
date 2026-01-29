import { useNavigate } from 'react-router';
import { Package, ChevronRight, HelpCircle, Settings, UserCircle, Loader2, RefreshCw, PlayCircle, Bike, Truck, Car, Plane, History, Trophy, Info, Zap, Shield, Target } from 'lucide-react';
import { useGameStore } from '../app/store';
import { OrderCard } from '../entities/order/OrderCard';
import { useUserProfile, useUpsertProfile, type UserProfile } from '../entities/user/queries';
import { useUserStore } from '../entities/user';
import { useEffect, useState, useCallback } from 'react';
import { getOrders } from '../entities/order';
import { getUserSlots } from '../entities/slot';
import { getActiveRuns, type ActiveRun } from '../entities/run';
import type { Order } from '../shared/api/types';

// 로딩 컴포넌트
const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-white">
    <div className="text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary-500 mx-auto mb-4" />
      <p className="text-sm font-medium text-surface-500">{message}</p>
    </div>
  </div>
);

// 미션 보드 아이템 컴포넌트
const MissionCard = ({ title, progress, type, onClick }: { title: string; progress: string; type: 'speed' | 'safety' | 'challenge'; onClick: () => void }) => {
  const getIcon = () => {
    switch (type) {
      case 'speed': return <Zap className="h-4 w-4 text-amber-500" />;
      case 'safety': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'challenge': return <Target className="h-4 w-4 text-rose-500" />;
    }
  };

  return (
    <div className="min-w-[280px] bg-white border border-surface-100 p-5 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {getIcon()}
        <span className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">
          {type === 'speed' ? '속도' : type === 'safety' ? '안정' : '도전'}
        </span>
      </div>
      <h3 className="text-sm font-medium text-surface-900 mb-4 h-10 line-clamp-2">{title}</h3>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="h-1 w-full bg-surface-50 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full" style={{ width: progress }} />
          </div>
          <p className="text-[10px] font-medium text-surface-400 mt-2">{progress} 완료</p>
        </div>
        <button 
          onClick={onClick}
          className="px-4 py-2 bg-primary-50 text-primary-600 text-[11px] font-medium rounded-lg hover:bg-primary-100 transition-colors"
        >
          바로 시작
        </button>
      </div>
    </div>
  );
};

// 메인 대시보드 컴포넌트 (profile이 반드시 존재해야 함)
const Dashboard = ({ profile }: { profile: UserProfile }) => {
  const navigate = useNavigate();
  const { slots, setSlots } = useGameStore();
  const { isAuthenticated } = useUserStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(true);
  const [isActiveRunsLoading, setIsActiveRunsLoading] = useState(true);

  // public_profile_id 사용 (auth 테이블과 독립적)
  const profileId = profile.public_profile_id;

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
      .catch(err => console.error(err))
      .finally(() => setIsOrdersLoading(false));
  }, [isAuthenticated, profileId]);

  // 슬롯, 주문, 진행 중인 운행 목록 로드
  useEffect(() => {
    fetchSlots();
    fetchOrders();
    fetchActiveRuns();
    
    const interval = setInterval(() => {
      fetchOrders();
      fetchActiveRuns();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchSlots, fetchOrders, fetchActiveRuns]);

  const activeSlot = slots.find(s => s.index === 0 && !s.activeRunId);

  const getEquipmentIcon = (equipmentId: string | null | undefined) => {
    switch (equipmentId) {
      case 'VAN': return <Car className="h-4 w-4" />;
      case 'TRUCK': return <Truck className="h-4 w-4" />;
      case 'HEAVY_TRUCK': return <Truck className="h-4 w-4 text-primary-600" />;
      case 'PLANE': return <Plane className="h-4 w-4" />;
      default: return <Bike className="h-4 w-4" />;
    }
  };

  const getEquipmentName = (equipmentId: string | null | undefined) => {
    switch (equipmentId) {
      case 'VAN': return '소형 밴';
      case 'TRUCK': return '대형 트럭';
      case 'HEAVY_TRUCK': return '헤비 트럭';
      case 'PLANE': return '화물기';
      default: return '배달 자전거';
    }
  };

  // 데이터 로딩 중
  if (isSlotsLoading || isActiveRunsLoading) {
    return <LoadingScreen message="데이터 동기화 중..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50/30 pb-24">
      <div className="mx-auto">
        {/* 1) 상단 고정 '랭킹 헤더' */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-4 pt-4 pb-6 border-b border-surface-100/50">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-surface-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary-50 flex items-center justify-center rounded-xl">
                  <Trophy className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-surface-900">골드 III</span>
                    <span className="text-[10px] font-medium text-surface-400 bg-surface-50 px-1.5 py-0.5 rounded">내 순위 128위</span>
                  </div>
                  <p className="text-[11px] font-medium text-primary-600 mt-0.5">다음 등급까지 120점</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => navigate('/help')} className="p-2 text-surface-400 hover:bg-surface-50 rounded-full transition-colors">
                  <Info className="h-4 w-4" />
                </button>
                <button onClick={() => navigate('/super/admin/setting')} className="p-2 text-surface-400 hover:bg-surface-50 rounded-full transition-colors">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">등급 진행</span>
                <span className="text-[10px] font-medium text-surface-900">880 / 1,000</span>
              </div>
              <div className="h-1.5 w-full bg-surface-50 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all duration-1000" style={{ width: '88%' }} />
              </div>
            </div>
          </div>
        </header>

        <main className="mt-6 space-y-10">
          {/* 2) 오늘의 경쟁 목표 (미션 보드) */}
          <section className="space-y-4">
            <div className="px-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-surface-900">오늘의 경쟁 목표</h2>
              <span className="text-[10px] font-medium text-surface-400">3개 남음</span>
            </div>
            <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
              <MissionCard 
                type="speed"
                title="30분 이내 연속 3회 배달 완료하기"
                progress="1/3"
                onClick={() => {}}
              />
              <MissionCard 
                type="safety"
                title="평점 4.8점 이상으로 5회 운행 완료"
                progress="4/5"
                onClick={() => {}}
              />
              <MissionCard 
                type="challenge"
                title="100km 이상의 장거리 주문 1회 수행"
                progress="0/1"
                onClick={() => {}}
              />
            </div>
          </section>

          {/* 3) 진행 중 위젯 (작업이 있을 때만 노출) */}
          {activeRuns.length > 0 && (
            <section className="px-4">
              <div className="bg-primary-500 p-5 rounded-2xl shadow-lg shadow-primary-500/20 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                    <span className="text-[10px] font-medium uppercase tracking-widest opacity-80">현재 운행 중</span>
                  </div>
                  <span className="text-xs font-medium">+150 RP 획득 예정</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{activeRuns[0].order.title}</h3>
                    <p className="text-[10px] font-medium mt-1 opacity-70">ETA 12분 · 4.2km 남음</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/run/${activeRuns[0].run.id}`)}
                    className="shrink-0 px-4 py-2 bg-white text-primary-600 text-[11px] font-medium rounded-lg"
                  >
                    진행 보기
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* 4) 주문 리스트 (전략 선택) */}
          <section className="space-y-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-medium text-surface-900">추천 주문 리스트</h2>
                <span className="text-[10px] font-medium text-surface-400">랭킹 효율순</span>
              </div>
              <button 
                onClick={fetchOrders}
                className="p-2 text-surface-400 hover:text-surface-600 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isOrdersLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="space-y-3">
              {isOrdersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-surface-200" />
                </div>
              ) : orders.length > 0 ? (
                orders.map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    status={index === 0 ? 'recommended' : 'default'}
                    onClick={() => navigate(`/order/${order.id}`)}
                    disabled={!activeSlot}
                    disabledReason={!activeSlot ? '사용 가능한 슬롯이 없습니다' : undefined}
                  />
                ))
              ) : (
                <div className="bg-white p-12 text-center border border-surface-100 rounded-2xl">
                  <Package className="h-10 w-10 text-surface-100 mx-auto mb-4" />
                  <p className="text-sm font-medium text-surface-400">새로운 주문을 기다리는 중...</p>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* 하단 네비게이션 보조 (기존 기능들) */}
        <div className="fixed bottom-6 left-4 right-4 z-30">
          <div className="bg-white/90 backdrop-blur-lg border border-surface-100 p-2 rounded-2xl shadow-xl flex items-center justify-around">
            <button onClick={() => navigate('/garage')} className="flex flex-col items-center gap-1 p-2 flex-1">
              <Package className="h-5 w-5 text-surface-400" />
              <span className="text-[10px] font-medium text-surface-500">창고</span>
            </button>
            <button onClick={() => navigate('/hire')} className="flex flex-col items-center gap-1 p-2 flex-1">
              <UserCircle className="h-5 w-5 text-surface-400" />
              <span className="text-[10px] font-medium text-surface-500">고용</span>
            </button>
            <div className="w-px h-6 bg-surface-100 mx-1" />
            <div className="flex flex-col items-center gap-1 p-2 flex-1">
              <span className="text-xs font-medium text-surface-900">${profile.balance.toLocaleString()}</span>
              <span className="text-[10px] font-medium text-surface-400 uppercase tracking-tighter">보유 자산</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 메인 HomePage 컴포넌트 (상태 관리 및 라우팅)
export const HomePage = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { user, isAuthenticated, isSyncing, isHydrated } = useUserStore();
  const { mutate: upsertProfile, isPending: isCreating } = useUpsertProfile();

  // 디버깅용 로그
  useEffect(() => {
    console.log('Home State:', { isHydrated, isAuthenticated, isSyncing, isProfileLoading, hasProfile: !!profile });
  }, [isHydrated, isAuthenticated, isSyncing, isProfileLoading, profile]);

  // 인증 상태 체크 및 리다이렉트
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

  // 1. Hydration 및 세션 동기화 대기
  if (!isHydrated || isSyncing) {
    return <LoadingScreen message="시스템 준비 중..." />;
  }

  // 2. 미인증 상태
  if (!isAuthenticated) {
    return <LoadingScreen message="인증 확인 중..." />;
  }

  // 3. 프로필 로딩 중
  if (isProfileLoading) {
    return <LoadingScreen message="프로필 불러오는 중..." />;
  }

  // 4. 프로필 없음 (신규 유저)
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

  // 5. 프로필이 존재하는 경우에만 Dashboard 렌더링
  // TypeScript가 이 시점에서 profile이 null이 아님을 보장
  return <Dashboard profile={profile} />;
};
