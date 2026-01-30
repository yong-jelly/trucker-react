import { useNavigate } from 'react-router';
import { 
  UserCircle, TrendingUp, ChevronRight,
  Truck, Star, Navigation, Bell,
  BarChart3, Wrench, Play,
  ShieldCheck, Users, ArrowUpRight, Signal,
  Settings, Target
} from 'lucide-react';
import { useUserProfile } from '../entities/user/queries';
import { useUserStore } from '../entities/user';
import { useGameStore } from '../app/store';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  getLeaderboard, 
  getAllActiveRuns,
  getRecentCompletedRuns,
  type LeaderboardEntry,
  type ActiveRunEntry
} from '../entities/leaderboard/api';
import { getOrders } from '../entities/order';
import { getActiveRuns, type ActiveRun } from '../entities/run';
import { getUserSlots } from '../entities/slot';
import type { Order } from '../shared/api/types';

// --- Components ---

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-white">
    <div className="text-center">
      <div className="relative mb-6">
        <div className="h-16 w-16 border-4 border-surface-100 border-t-surface-900 rounded-full animate-spin mx-auto" />
        <Truck className="h-6 w-6 text-surface-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-xs font-medium text-surface-900 uppercase tracking-widest animate-pulse">{message}</p>
    </div>
  </div>
);

// 1. 매니저 상태 바 (완전 플랫)
const ManagerStatusBar = ({ profile }: { profile: any }) => {
  const navigate = useNavigate();
  
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-surface-100 px-4 py-3 flex items-center justify-between" style={{ transform: 'translateZ(0)' }}>
      <div className="flex items-center gap-3" onClick={() => navigate('/profile')}>
        <div className="h-9 w-9 rounded-lg bg-surface-50 flex items-center justify-center text-surface-900 border border-surface-200 cursor-pointer">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xs font-medium text-surface-900 uppercase tracking-tight flex items-center gap-1">
            {profile.nickname} <span className="text-surface-400">물류</span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="bg-surface-50 text-surface-500 text-[9px] font-medium px-1.5 py-0.5 rounded border border-surface-100 uppercase tracking-wider">1등급</span>
            <div className="flex items-center gap-1">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-medium text-surface-500 font-mono">{profile.reputation.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[9px] text-surface-400 font-medium uppercase tracking-widest mb-0.5">보유 자산</p>
          <p className="text-base font-medium text-surface-900 font-mono leading-none tracking-tighter">${profile.balance.toLocaleString()}</p>
        </div>
        <button className="relative p-2 hover:bg-surface-50 rounded-lg transition-colors border border-surface-100 active:scale-90">
          <Bell className="h-4.5 w-4.5 text-surface-600" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-rose-500 rounded-full border border-white" />
        </button>
      </div>
    </header>
  );
};

// 2. 운영 허브 (플랫 & 미니멀)
const OperationsHub = ({ activeRun }: { activeRun?: ActiveRun }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!activeRun) return;
    const update = () => {
      const now = Date.now();
      const start = new Date(activeRun.run.startAt).getTime();
      const end = start + (activeRun.run.etaSeconds * 1000);
      setProgress(Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)));
    };
    update();
    const itv = setInterval(update, 1000);
    return () => clearInterval(itv);
  }, [activeRun]);

  if (!activeRun) {
    return (
      <div className="col-span-2 bg-white rounded-xl p-4 border border-surface-100 relative overflow-hidden flex flex-col justify-between min-h-[240px]" style={{ transform: 'translateZ(0)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-50 text-surface-600 text-[10px] font-medium uppercase rounded border border-surface-100">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> 본부: 대기 중
            </div>
            <div className="px-2 py-1 bg-surface-50 text-surface-500 text-[10px] font-medium uppercase rounded border border-surface-100">
              가용 차량: 1/1
            </div>
          </div>
          <h2 className="text-2xl font-medium text-surface-900 tracking-tighter leading-tight mb-4">
            전략 지휘 센터
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-surface-50 rounded text-surface-400 border border-surface-100">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-medium text-surface-400 uppercase tracking-widest mb-0.5">시장 상황</p>
                <p className="text-xs font-medium text-surface-700">서울 수요 급증</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-surface-50 rounded text-surface-400 border border-surface-100">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-medium text-surface-400 uppercase tracking-widest mb-0.5">함대 상태</p>
                <p className="text-xs font-medium text-surface-700">100% 가동</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 mt-8">
          <button 
            onClick={() => navigate('/orders')}
            className="flex-1 bg-surface-900 text-white h-11 rounded-lg font-medium text-sm hover:bg-surface-800 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            운송 계약 체결
          </button>
          <button 
            onClick={() => navigate('/garage')}
            className="h-11 w-11 bg-white text-surface-900 rounded-lg flex items-center justify-center border border-surface-200 hover:bg-surface-50 transition-colors active:scale-95"
          >
            <Wrench className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => navigate(`/run/${activeRun.run.id}`)}
      className="col-span-2 bg-white rounded-xl border border-surface-200 relative overflow-hidden min-h-[260px] flex flex-col cursor-pointer group"
      style={{ transform: 'translateZ(0)' }}
    >
      <div className="bg-surface-50 border-b border-surface-100 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Signal className="h-3.5 w-3.5 text-surface-900 animate-pulse" />
          <span className="text-[10px] font-medium text-surface-900 uppercase tracking-widest">실시간 원격 관제</span>
        </div>
        <span className="text-[9px] font-medium text-surface-400 font-mono uppercase">ID: {activeRun.run.id.slice(0,8)}</span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-surface-900 leading-tight mb-2 tracking-tighter truncate">{activeRun.order.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-medium text-surface-600 uppercase bg-surface-50 px-1.5 py-0.5 rounded border border-surface-100">
                {activeRun.order.cargoName}
              </span>
              <span className="text-[9px] font-medium text-surface-400 uppercase tracking-widest flex items-center gap-1">
                <Navigation className="h-2.5 w-2.5" /> {activeRun.order.distance}KM 남음
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-surface-400 font-medium uppercase tracking-widest mb-1">예상 수익</p>
            <p className="text-lg font-medium text-emerald-600 font-mono leading-none tracking-tighter">${activeRun.run.currentReward.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-6 mb-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-medium text-surface-500 uppercase tracking-widest">운송 진행률</span>
            <span className="text-sm font-medium text-surface-900 font-mono leading-none">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-surface-50 rounded-full overflow-hidden border border-surface-100">
            <div className="h-full bg-surface-900 transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-surface-50">
          <div className="flex flex-col">
            <span className="text-[8px] font-medium text-surface-400 uppercase tracking-widest mb-1">속도</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-medium text-surface-900 font-mono">84</span>
              <span className="text-[9px] font-medium text-surface-400">KM/H</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-medium text-surface-400 uppercase tracking-widest mb-1">내구도</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-medium text-surface-900 font-mono">99</span>
              <span className="text-[9px] font-medium text-emerald-600">%</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-medium text-surface-400 uppercase tracking-widest mb-1">도착 예정</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-medium text-surface-900 font-mono">14</span>
              <span className="text-[9px] font-medium text-surface-400">분</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. 시장 분석 (Intelligence)
const MarketIntelligence = ({ orders }: { orders: Order[] }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl border border-surface-100 p-4 flex flex-col group" style={{ transform: 'translateZ(0)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-medium text-surface-900 flex items-center gap-2 uppercase tracking-widest">
          <BarChart3 className="h-4 w-4 text-surface-400" />
          시장 인텔리전스
        </h3>
        <button onClick={() => navigate('/orders')} className="p-1.5 hover:bg-surface-50 rounded-lg transition-colors text-surface-400">
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 flex-1">
        {orders.slice(0, 2).map((order) => (
          <div key={order.id} className="group/item cursor-pointer" onClick={() => navigate(`/order/${order.id}`)}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-medium text-surface-400 font-mono uppercase">REF: {order.id.slice(0,6)}</span>
              <span className="text-[8px] font-medium text-surface-500 uppercase bg-surface-50 px-1.5 py-0.5 rounded border border-surface-100">프리미엄</span>
            </div>
            <p className="text-xs font-medium text-surface-900 leading-tight group-hover/item:text-primary-600 transition-colors mb-2 truncate">{order.title}</p>
            <div className="flex items-center justify-between bg-surface-50 p-2 rounded-lg border border-surface-100 transition-all">
              <p className="text-base font-medium text-surface-900 font-mono tracking-tighter">${(order.baseReward || 0).toLocaleString()}</p>
              <div className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-600">
                <TrendingUp className="h-3 w-3" /> +12%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. 라이벌 추적 (Rival Watch)
const RivalWatch = ({ leaderboard, profileId }: { leaderboard: LeaderboardEntry[], profileId: string }) => {
  const navigate = useNavigate();
  const myIdx = leaderboard.findIndex(e => e.userId === profileId);
  const rivals = useMemo(() => {
    if (myIdx === -1) return leaderboard.slice(0, 5);
    const start = Math.max(0, myIdx - 2);
    return leaderboard.slice(start, start + 5);
  }, [leaderboard, myIdx]);

  return (
    <div className="bg-white rounded-xl border border-surface-100 p-4 flex flex-col" style={{ transform: 'translateZ(0)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-medium text-surface-900 flex items-center gap-2 uppercase tracking-widest">
          <Users className="h-4 w-4 text-surface-400" />
          라이벌 추적
        </h3>
        <button onClick={() => navigate('/leaderboard')} className="text-[9px] font-medium text-surface-400 uppercase tracking-widest hover:underline">전체</button>
      </div>

      <div className="space-y-2 flex-1">
        {rivals.map((r) => (
          <div key={r.userId} className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${r.userId === profileId ? 'bg-surface-900 border-surface-900' : 'bg-surface-50 border-surface-100'}`}>
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-surface-200 overflow-hidden">
                {r.avatarUrl ? <img src={r.avatarUrl} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <UserCircle className="h-5 w-5 text-surface-300" />}
              </div>
              <div className={`absolute -top-1.5 -left-1.5 h-4 w-4 rounded flex items-center justify-center text-[8px] font-medium text-white ${r.rank === 1 ? 'bg-amber-500' : r.rank === 2 ? 'bg-slate-400' : r.rank === 3 ? 'bg-amber-700' : 'bg-surface-700'}`}>
                {r.rank}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-medium truncate uppercase tracking-tight ${r.userId === profileId ? 'text-white' : 'text-surface-900'}`}>{r.nickname}</p>
              <p className={`text-[9px] font-medium font-mono ${r.userId === profileId ? 'text-white/70' : 'text-surface-400'}`}>${r.periodEarnings.toLocaleString()}</p>
            </div>
            {r.userId !== profileId && (
              <div className="text-right shrink-0">
                <p className={`text-[9px] font-medium font-mono ${r.rank < (leaderboard[myIdx]?.rank || 999) ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {r.rank < (leaderboard[myIdx]?.rank || 999) ? '-' : '+'}${Math.abs(r.periodEarnings - (leaderboard[myIdx]?.periodEarnings || 0)).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 5. 뉴스 피드 (실시간 방송)
const NewsFeed = ({ items }: { items: string[] }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-100 py-3 px-4 z-40" style={{ transform: 'translateZ(0)' }}>
      <div className="max-w-lg mx-auto flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-900 text-white rounded text-[9px] font-medium uppercase tracking-widest shrink-0">
          <Signal className="h-3 w-3 text-surface-400" /> 방송
        </div>
        <div className="flex-1 overflow-hidden relative h-4">
          {items.map((it, i) => (
            <div key={i} className={`absolute inset-0 transition-all duration-1000 flex items-center ${i === idx ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
              <span className="text-[11px] font-medium text-surface-700 truncate w-full tracking-tight">{it}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---

const Dashboard = ({ profile }: { profile: any }) => {
  const navigate = useNavigate();
  const { setSlots } = useGameStore();
  
  const [dailyLB, setDailyLB] = useState<LeaderboardEntry[]>([]);
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [globalRuns, setGlobalRuns] = useState<ActiveRunEntry[]>([]);
  const [recentRuns, setRecentRuns] = useState<ActiveRunEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const myDaily = useMemo(() => dailyLB.find(e => e.userId === profile.public_profile_id), [dailyLB, profile.public_profile_id]);

  const tickerItems = useMemo(() => {
    const items = [];
    globalRuns.slice(0, 3).forEach(r => items.push(`배차: ${r.nickname}님이 ${r.orderTitle} 운송 시작`));
    recentRuns.slice(0, 3).forEach(r => items.push(`성공: ${r.nickname}님이 $${r.currentReward.toLocaleString()} 수익 달성`));
    items.push("시장 데이터: 건설 섹터 수요가 18.5% 증가했습니다.");
    items.push("전국 물류 네트워크가 정상 가동 중입니다.");
    return items;
  }, [globalRuns, recentRuns]);

  const fetchData = useCallback(async () => {
    try {
      const [lb, myRuns, ords, slots, gRuns, rRuns] = await Promise.all([
        getLeaderboard('daily'), getActiveRuns(profile.public_profile_id),
        getOrders(profile.public_profile_id), getUserSlots(profile.public_profile_id),
        getAllActiveRuns(), getRecentCompletedRuns(5)
      ]);
      setDailyLB(lb); setActiveRuns(myRuns); setOrders(ords);
      setGlobalRuns(gRuns); setRecentRuns(rRuns);
      let fSlots = [...slots];
      if (fSlots.length === 0) fSlots = [{ id: 'temp-0', index: 0, isLocked: false }, { id: 'temp-1', index: 1, isLocked: true }, { id: 'temp-2', index: 2, isLocked: true }];
      setSlots(fSlots);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }, [profile.public_profile_id, setSlots]);

  useEffect(() => {
    fetchData();
    const itv = setInterval(fetchData, 30000);
    return () => clearInterval(itv);
  }, [fetchData]);

  if (isLoading) return <LoadingScreen message="지휘 센터 연결 중..." />;

  return (
    <div className="min-h-screen bg-white pb-24">
      <ManagerStatusBar profile={profile} />

      <div className="max-w-lg mx-auto p-2 space-y-4">
        {/* Bento Grid (완전 플랫) */}
        <div className="grid grid-cols-2 gap-2">
          <OperationsHub activeRun={activeRuns[0]} />
          <MarketIntelligence orders={orders} />
          <RivalWatch leaderboard={dailyLB} profileId={profile.public_profile_id} />
        </div>

        {/* Quick Access (미니멀) */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Truck, label: '함대', path: '/garage' },
            { icon: Users, label: '인력', path: '/hire' },
            { icon: BarChart3, label: '통계', path: '/leaderboard' },
            { icon: Settings, label: '설정', path: '/profile' }
          ].map((it) => (
            <button 
              key={it.label}
              onClick={() => navigate(it.path)}
              className="bg-surface-50 aspect-square rounded-xl border border-surface-100 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-surface-100"
            >
              <it.icon className="h-5 w-5 text-surface-500" />
              <span className="text-[10px] font-medium text-surface-900 uppercase tracking-tight">{it.label}</span>
            </button>
          ))}
        </div>

        {/* 성과 요약 (플랫 카드) */}
        <div className="bg-white rounded-xl p-4 border border-surface-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-surface-50 rounded text-surface-400 border border-surface-100">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest">성과 보고서</p>
                <p className="text-xs font-medium text-emerald-600 uppercase">우수한 성장세</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest mb-0.5">글로벌 순위</p>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xl font-medium text-surface-900 font-mono leading-none">#{myDaily?.rank || '-'}</span>
                <div className="flex items-center text-[10px] font-medium text-emerald-500">
                  <ArrowUpRight className="h-3 w-3" /> 2
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest mb-1.5">오늘의 순수익</p>
              <p className="text-2xl font-medium text-surface-900 font-mono leading-none tracking-tighter">${(myDaily?.periodEarnings || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest mb-1.5">운영 효율성</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-medium text-surface-900 font-mono leading-none tracking-tighter">98.4</p>
                <span className="text-[10px] font-medium text-surface-400">%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1.5">
                {[1,2,3].map(i => (
                  <div key={i} className="h-6 w-6 rounded border border-white bg-surface-100 flex items-center justify-center overflow-hidden">
                    <UserCircle className="h-4 w-4 text-surface-300" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-medium text-surface-500 uppercase tracking-widest">라이벌 5명 활동 중</p>
            </div>
            <button onClick={() => navigate('/leaderboard')} className="text-[10px] font-medium text-primary-600 uppercase tracking-widest flex items-center gap-1 hover:gap-1.5 transition-all">
              분석 <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <NewsFeed items={tickerItems} />
    </div>
  );
};

export const HomePage = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useUserProfile();
  const { isAuthenticated, isHydrated } = useUserStore();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) navigate('/onboarding');
  }, [isHydrated, isAuthenticated, navigate]);

  if (isLoading || !profile) return <LoadingScreen message="지휘 센터 동기화 중..." />;

  return <Dashboard profile={profile} />;
};
