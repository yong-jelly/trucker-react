import { useNavigate } from 'react-router';
import { Package, ChevronRight, HelpCircle, Settings, Users, UserCircle, Loader2, RefreshCw, PlayCircle, Bike, Truck, Car, Plane } from 'lucide-react';
import { useGameStore } from '../app/store';
import { OrderCard } from '../entities/order/OrderCard';
import { useUserProfile, useUpsertProfile } from '../entities/user/queries';
import { useUserStore } from '../entities/user';
import { useEffect, useState, useCallback } from 'react';
import { getOrders } from '../entities/order';
import { getUserSlots } from '../entities/slot';
import { getActiveRuns, type ActiveRun } from '../entities/run';
import type { Order } from '../shared/api/types';

export const HomePage = () => {
  const navigate = useNavigate();
  const { slots, setSlots } = useGameStore();
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useUserProfile();
  const { user, isAuthenticated, isSyncing, isHydrated } = useUserStore();
  const { mutate: upsertProfile, isPending: isCreating } = useUpsertProfile();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(true);
  const [isActiveRunsLoading, setIsActiveRunsLoading] = useState(true);

  // 슬롯 목록 로드 함수
  const fetchSlots = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const userSlots = await getUserSlots(user.id);
      setSlots(userSlots);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setIsSlotsLoading(false);
    }
  }, [isAuthenticated, user, setSlots]);

  // 진행 중인 운행 목록 로드 함수
  const fetchActiveRuns = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const runs = await getActiveRuns(user.id);
      setActiveRuns(runs);
    } catch (err) {
      console.error('Failed to fetch active runs:', err);
    } finally {
      setIsActiveRunsLoading(false);
    }
  }, [isAuthenticated, user]);

  // 주문 목록 로드 함수
  const fetchOrders = useCallback(() => {
    if (!isAuthenticated || !user) return;
    
    setIsOrdersLoading(true);
    // 유저 ID를 전달하여 주문이 없을 경우 자동 생성 트리거
    getOrders(user.id)
      .then(setOrders)
      .catch(err => console.error(err))
      .finally(() => setIsOrdersLoading(false));
  }, [isAuthenticated, user]);

  // 디버깅용 로그
  useEffect(() => {
    console.log('Home State:', { isHydrated, isAuthenticated, isSyncing, isProfileLoading, hasProfile: !!profile, profileError, slotsCount: slots.length });
  }, [isHydrated, isAuthenticated, isSyncing, isProfileLoading, profile, profileError, slots.length]);

  // 인증 상태 체크 및 리다이렉트
  useEffect(() => {
    if (isHydrated && !isSyncing && !isAuthenticated) {
      navigate('/onboarding');
    }
  }, [isHydrated, isAuthenticated, isSyncing, navigate]);

  // 슬롯, 주문, 진행 중인 운행 목록 로드
  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      // 프로필 존재 여부와 상관없이 기본 데이터 로드 시도
      fetchSlots();
      fetchOrders();
      fetchActiveRuns();
      
      // 주문 및 운행 상태는 1분마다 자동 갱신
      const interval = setInterval(() => {
        fetchOrders();
        fetchActiveRuns();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isHydrated, isAuthenticated, user, fetchSlots, fetchOrders, fetchActiveRuns]);

  const activeSlot = slots.find(s => !s.isLocked && !s.activeRunId);

  const handleCreateProfile = () => {
    if (!user) return;
    
    // 구글 계정 정보를 기본값으로 사용
    const defaultNickname = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Trucker';
    
    upsertProfile({
      nickname: defaultNickname.slice(0, 20),
      avatar_url: user.user_metadata?.avatar_url || null,
    });
  };

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

  // hydration이 완료되지 않았거나 동기화 중일 때 로딩 화면 표시
  if (!isHydrated || isSyncing || (isAuthenticated && (isSlotsLoading || isActiveRunsLoading))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-surface-500">데이터 동기화 중...</p>
        </div>
      </div>
    );
  }

  // 프로필이 없는 경우 대응 UI (프로필 로딩이 끝난 후 데이터가 없을 때만)
  if (!isProfileLoading && !profile && isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-surface-50">
        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6 shadow-soft-md">
          <UserCircle className="h-10 w-10 text-primary-600" />
        </div>
        <h2 className="text-2xl font-medium text-surface-900 mb-2 leading-tight">새로운 트럭커를 환영합니다!</h2>
        <p className="text-sm text-surface-500 mb-8 leading-relaxed">
          도로에 나갈 준비가 거의 다 되었습니다.<br/>
          계정 정보를 바탕으로 프로필을 생성할까요?
        </p>
        <button
          onClick={handleCreateProfile}
          className="w-full max-w-xs py-4 bg-primary-600 text-white rounded-2xl font-medium text-lg shadow-soft-lg active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          프로필 생성하고 시작하기
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // 데이터 로딩 중이거나 프로필이 아직 없는 경우 대기
  if (isProfileLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-surface-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      <div className="mx-auto max-w-2xl">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 bg-surface-50 px-4 pt-4">
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-soft-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-surface-400 uppercase tracking-widest mb-1">Available Balance</p>
                <span className="text-3xl font-medium text-surface-900">
                  ${profile.balance.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate('/help')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 text-surface-500 hover:bg-surface-200 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => navigate('/super/admin/setting')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 text-surface-500 hover:bg-surface-200 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                  >
                    <UserCircle className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest">Reputation</p>
                  <span className="text-2xl font-medium text-primary-600 leading-none">{profile.reputation.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* 슬롯 상태 */}
            <div className="flex items-center gap-2 border-t border-surface-100 pt-4">
              <span className="text-sm font-medium text-surface-600">슬롯</span>
              <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
                {slots.map((slot) => (
                  <div 
                    key={slot.id} 
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0 ${
                      slot.isLocked 
                        ? 'bg-surface-100 text-surface-400 border border-surface-200' 
                        : slot.activeRunId
                          ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20'
                          : 'bg-primary-50 text-primary-600 border border-primary-100'
                    }`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      slot.isLocked 
                        ? 'bg-surface-300' 
                        : slot.activeRunId 
                          ? 'bg-accent-emerald animate-pulse' 
                          : 'bg-primary-500'
                    }`} />
                    {slot.index + 1}
                  </div>
                ))}
              </div>
              
              {/* 창고/상점 바로가기 */}
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate('/hire')}
                  className="flex items-center gap-1 rounded-xl bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-100 shadow-soft-xs active:scale-95 transition-all"
                >
                  <Users className="h-3.5 w-3.5" />
                  고용
                </button>
                <button 
                  onClick={() => navigate('/garage')}
                  className="flex items-center gap-1 rounded-xl bg-surface-900 px-3 py-1.5 text-xs font-medium text-white shadow-soft-sm active:scale-95 transition-all"
                >
                  <Package className="h-3.5 w-3.5" />
                  창고
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="mt-6 space-y-8 px-4">
          {/* 진행 중인 운행 */}
          {activeRuns.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-surface-900 flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-accent-emerald" />
                  진행 중인 운행
                </h2>
                <span className="text-xs font-medium text-accent-emerald uppercase tracking-widest animate-pulse">ON AIR</span>
              </div>
              <div className="space-y-3">
                {activeRuns.map((activeRun) => (
                  <button
                    key={activeRun.run.id}
                    onClick={() => navigate(`/run/${activeRun.run.id}`)}
                    className="w-full text-left overflow-hidden rounded-2xl bg-white border border-accent-emerald/30 shadow-soft-md hover:shadow-soft-lg transition-all active:scale-[0.98]"
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
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-surface-900 leading-tight">{activeRun.order.title}</h3>
                        <p className="text-[10px] font-medium text-surface-400 mt-1">{activeRun.order.cargoName} · {activeRun.order.distance}km</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest">현재 보상</p>
                        <p className="text-sm font-medium text-accent-emerald">${activeRun.run.currentReward.toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 사용 가능한 주문 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-surface-900">사용 가능한 주문</h2>
              <span className="text-xs font-medium text-surface-500">
                {isOrdersLoading ? '로딩 중...' : `${orders.length}개 오퍼`}
              </span>
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
                <div className="rounded-2xl bg-white p-12 text-center border border-surface-100 shadow-soft-sm">
                  <Package className="h-12 w-12 text-surface-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-surface-400">현재 사용 가능한 주문이 없습니다</p>
                  <p className="text-xs text-surface-300 mt-1 mb-6">잠시 후 다시 확인해주세요</p>
                  <button 
                    onClick={fetchOrders}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-50 text-primary-600 rounded-2xl text-sm font-medium hover:bg-primary-100 active:scale-95 transition-all shadow-soft-xs"
                  >
                    <RefreshCw className={`h-4 w-4 ${isOrdersLoading ? 'animate-spin' : ''}`} />
                    새로고침
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 추가 오퍼 안내 */}
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-200 bg-white py-8 px-6 text-center">
            <p className="text-sm text-surface-500">
              더 많은 오퍼는 평판을 올리면 해금됩니다
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

