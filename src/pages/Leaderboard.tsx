import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Trophy, Activity, Clock, Users, Bot, 
  TrendingUp, ChevronRight, Loader2, RefreshCw,
  MapPin, DollarSign, Zap
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

type TabType = 'live' | 'ranking' | 'activity';

// 탭 버튼 컴포넌트
const TabButton = ({ 
  active, 
  onClick, 
  children, 
  icon: Icon 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
      active 
        ? 'bg-primary-600 text-white shadow-soft-md' 
        : 'bg-white text-surface-600 hover:bg-surface-50 border border-surface-200'
    }`}
  >
    <Icon className="h-4 w-4" />
    {children}
  </button>
);

// 통계 카드 컴포넌트
const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  color = 'primary' 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>;
  color?: 'primary' | 'emerald' | 'amber' | 'rose';
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 border border-surface-100 shadow-soft-xs">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-medium text-surface-900">{value}</p>
      </div>
    </div>
  );
};

// 활성 운행 카드 컴포넌트
const ActiveRunCard = ({ run }: { run: ActiveRunEntry }) => {
  const progressWidth = Math.min(100, Math.max(0, run.progressPercent));
  
  return (
    <div className="rounded-xl bg-white border border-surface-100 shadow-soft-sm overflow-hidden">
      {/* 진행률 바 */}
      <div className="h-1 bg-surface-100">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000"
          style={{ width: `${progressWidth}%` }}
        />
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* 아바타 */}
            <div className={`relative h-10 w-10 rounded-full flex items-center justify-center ${
              run.isBot ? 'bg-amber-100' : 'bg-primary-100'
            }`}>
              {run.isBot ? (
                <Bot className="h-5 w-5 text-amber-600" />
              ) : (
                <Users className="h-5 w-5 text-primary-600" />
              )}
              {/* 라이브 표시 */}
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-surface-900">{run.nickname}</span>
                {run.isBot && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">BOT</span>
                )}
              </div>
              <p className="text-xs text-surface-500 mt-0.5">{run.orderTitle}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium text-emerald-600">${run.currentReward.toLocaleString()}</p>
            <p className="text-[10px] text-surface-400">{run.distance.toFixed(1)}km</p>
          </div>
        </div>
        
        {/* 진행 정보 */}
        <div className="mt-3 flex items-center justify-between text-xs text-surface-500">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{run.cargoName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{Math.round(progressWidth)}% 완료</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 경쟁자(봇) 카드 컴포넌트
const CompetitorCard = ({ entry, isActive }: { entry: LeaderboardEntry; isActive: boolean }) => {
  // 봇별 특성 설명
  const getBotDescription = (nickname: string) => {
    switch (nickname) {
      case 'Bot_Alpha': return '서울 강남권 퀵서비스 전문';
      case 'Bot_Beta': return '부산 해운대~서면 루트 마스터';
      case 'Bot_Gamma': return '대전-세종 행정타운 서류배송';
      case 'Bot_Delta': return '수도권 광역 장거리 전문';
      case 'Bot_Epsilon': return '전국 순회 프리랜서 라이더';
      default: return '배송 전문가';
    }
  };

  return (
    <div className={`relative rounded-xl p-4 transition-all ${
      entry.isBot 
        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200' 
        : 'bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200'
    }`}>
      {/* 활성 표시 */}
      {isActive && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-medium">
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          운행 중
        </div>
      )}
      
      <div className="flex items-center gap-3">
        {/* 아바타 */}
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
          entry.isBot ? 'bg-amber-200' : 'bg-primary-200'
        }`}>
          {entry.isBot ? (
            <Bot className="h-6 w-6 text-amber-700" />
          ) : (
            <Users className="h-6 w-6 text-primary-700" />
          )}
        </div>
        
        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-surface-900">{entry.nickname}</span>
            {entry.isBot && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-800">BOT</span>
            )}
          </div>
          <p className="text-xs text-surface-600 mt-0.5">{getBotDescription(entry.nickname)}</p>
        </div>
      </div>
      
      {/* 스탯 */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[10px] text-surface-500">평판</p>
          <p className="text-sm font-semibold text-surface-900">{entry.reputation}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-surface-500">완료</p>
          <p className="text-sm font-semibold text-surface-900">{entry.totalRuns}회</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-surface-500">수익</p>
          <p className="text-sm font-semibold text-emerald-600">${entry.periodEarnings.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// 랭킹 항목 컴포넌트
const RankingItem = ({ entry, highlight = false }: { entry: LeaderboardEntry; highlight?: boolean }) => {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-amber-400 text-white';
    if (rank === 2) return 'bg-surface-400 text-white';
    if (rank === 3) return 'bg-amber-700 text-white';
    return 'bg-surface-100 text-surface-600';
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
      highlight ? 'bg-primary-50 border border-primary-200' : 'bg-white border border-surface-100'
    }`}>
      {/* 순위 */}
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${getRankStyle(entry.rank)}`}>
        {entry.rank}
      </div>
      
      {/* 프로필 */}
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
        entry.isBot ? 'bg-amber-100' : 'bg-primary-100'
      }`}>
        {entry.isBot ? (
          <Bot className="h-5 w-5 text-amber-600" />
        ) : (
          <Users className="h-5 w-5 text-primary-600" />
        )}
      </div>
      
      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-surface-900 truncate">{entry.nickname}</span>
          {entry.isBot && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 shrink-0">BOT</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-surface-500 mt-0.5">
          <span>Rep: {entry.reputation}</span>
          <span>Runs: {entry.totalRuns}</span>
        </div>
      </div>
      
      {/* 수익 */}
      <div className="text-right">
        <p className="text-sm font-medium text-emerald-600">${entry.periodEarnings.toLocaleString()}</p>
        <p className="text-[10px] text-surface-400">이번 기간</p>
      </div>
    </div>
  );
};

// 활동 히트맵 컴포넌트 (GitHub 스타일)
const ActivityHeatmap = ({ data }: { data: ActivityDay[] }) => {
  const levelColors = [
    'bg-surface-100',
    'bg-emerald-200',
    'bg-emerald-400',
    'bg-emerald-500',
    'bg-emerald-600',
  ];

  // 주 단위로 그룹화 (최근 52주)
  const weeks: ActivityDay[][] = [];
  let currentWeek: ActivityDay[] = [];
  
  // 시작 요일 맞추기
  const startDate = new Date(data[0]?.date || new Date());
  const startDay = startDate.getDay();
  
  // 첫 주 앞부분 빈 셀 채우기
  for (let i = 0; i < startDay; i++) {
    currentWeek.push({ date: '', runsCount: 0, earnings: 0, level: -1 });
  }
  
  data.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <div className="rounded-xl bg-white border border-surface-100 p-4 shadow-soft-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-surface-900">연간 활동</h3>
        <div className="flex items-center gap-1 text-xs text-surface-500">
          <span>적음</span>
          {levelColors.map((color, i) => (
            <div key={i} className={`h-3 w-3 rounded-sm ${color}`} />
          ))}
          <span>많음</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex gap-0.5" style={{ minWidth: '680px' }}>
          {weeks.slice(-52).map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`h-3 w-3 rounded-sm transition-colors ${
                    day.level === -1 ? 'bg-transparent' : levelColors[day.level]
                  }`}
                  title={day.date ? `${day.date}: ${day.runsCount}회 운행, $${day.earnings}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 거래 내역 항목 컴포넌트
const TransactionItem = ({ tx }: { tx: TransactionEntry }) => {
  const isPositive = tx.amount > 0;
  const date = new Date(tx.createdAt);
  
  return (
    <div className="flex items-center gap-3 py-3 border-b border-surface-100 last:border-0">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
        isPositive ? 'bg-emerald-100' : 'bg-rose-100'
      }`}>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        ) : (
          <TrendingUp className="h-4 w-4 text-rose-600 rotate-180" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-900 truncate">{tx.nickname}</span>
          {tx.isBot && (
            <span className="px-1 py-0.5 rounded text-[8px] font-medium bg-amber-100 text-amber-700">BOT</span>
          )}
        </div>
        <p className="text-xs text-surface-500 truncate">{tx.description || tx.orderTitle}</p>
      </div>
      
      <div className="text-right">
        <p className={`text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? '+' : ''}{tx.amount.toLocaleString()}
        </p>
        <p className="text-[10px] text-surface-400">
          {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

// 메인 Leaderboard 페이지
export const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 데이터 상태
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [activeRuns, setActiveRuns] = useState<ActiveRunEntry[]>([]);
  const [recentRuns, setRecentRuns] = useState<ActiveRunEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [heatmap, setHeatmap] = useState<ActivityDay[]>([]);
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);

  // 데이터 로드
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const [statsData, runsData, recentData, rankData, heatData, txData] = await Promise.all([
        getStatsSummary(),
        getAllActiveRuns(),
        getRecentCompletedRuns(10),
        getLeaderboard(period),
        getActivityHeatmap(),
        getTransactions({ limit: 30 }),
      ]);
      
      setStats(statsData);
      setActiveRuns(runsData);
      setRecentRuns(recentData);
      setLeaderboard(rankData);
      setHeatmap(heatData);
      setTransactions(txData);
    } catch (error) {
      console.error('Failed to fetch leaderboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // 기간 변경 시 랭킹 다시 로드
  useEffect(() => {
    if (!isLoading) {
      getLeaderboard(period).then(setLeaderboard).catch(console.error);
    }
  }, [period]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-surface-500">리더보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-12">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-surface-100 shadow-soft-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-surface-700" />
            </button>
            <div>
              <h1 className="text-lg font-medium text-surface-900">리더보드</h1>
              <p className="text-xs text-surface-500">실시간 경쟁 현황</p>
            </div>
          </div>
          
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-50 hover:bg-surface-100 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 text-surface-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <TabButton 
            active={activeTab === 'live'} 
            onClick={() => setActiveTab('live')}
            icon={Zap}
          >
            실시간
          </TabButton>
          <TabButton 
            active={activeTab === 'ranking'} 
            onClick={() => setActiveTab('ranking')}
            icon={Trophy}
          >
            랭킹
          </TabButton>
          <TabButton 
            active={activeTab === 'activity'} 
            onClick={() => setActiveTab('activity')}
            icon={Activity}
          >
            활동
          </TabButton>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-6">
        {/* 통계 요약 */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            label="활성 운행" 
            value={stats?.activeRuns || 0} 
            icon={Activity} 
            color="emerald" 
          />
          <StatCard 
            label="오늘 완료" 
            value={stats?.completedRunsToday || 0} 
            icon={Clock} 
            color="primary" 
          />
          <StatCard 
            label="참여자" 
            value={`${stats?.totalUsers || 0} + ${stats?.totalBots || 0}`} 
            icon={Users} 
            color="amber" 
          />
          <StatCard 
            label="오늘 총 수익" 
            value={`$${(stats?.totalEarningsToday || 0).toLocaleString()}`} 
            icon={DollarSign} 
            color="rose" 
          />
        </div>

        {/* 실시간 탭 */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            {/* 활성 운행 */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-surface-900 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  실시간 운행
                </h2>
                <span className="text-xs text-surface-500">{activeRuns.length}건 진행 중</span>
              </div>
              
              {activeRuns.length > 0 ? (
                <div className="space-y-2">
                  {activeRuns.map((run) => (
                    <ActiveRunCard key={run.runId} run={run} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-white border border-surface-100 p-8 text-center">
                  <Activity className="h-10 w-10 text-surface-300 mx-auto mb-3" />
                  <p className="text-sm text-surface-500">현재 진행 중인 운행이 없습니다</p>
                </div>
              )}
            </section>

            {/* 최근 완료 */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-surface-900">최근 완료된 운행</h2>
              
              {recentRuns.length > 0 ? (
                <div className="space-y-2">
                  {recentRuns.slice(0, 5).map((run) => (
                    <div 
                      key={run.runId}
                      className="flex items-center gap-3 rounded-xl bg-white border border-surface-100 p-3"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        run.isBot ? 'bg-amber-100' : 'bg-primary-100'
                      }`}>
                        {run.isBot ? (
                          <Bot className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Users className="h-4 w-4 text-primary-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-surface-900">{run.nickname}</span>
                        <p className="text-xs text-surface-500 truncate">{run.orderTitle}</p>
                      </div>
                      <span className="text-sm font-medium text-emerald-600">
                        +${run.currentReward.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-white border border-surface-100 p-6 text-center">
                  <p className="text-sm text-surface-500">최근 완료된 운행이 없습니다</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 랭킹 탭 */}
        {activeTab === 'ranking' && (
          <div className="space-y-6">
            {/* 경쟁자 소개 섹션 */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-surface-900 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-amber-600" />
                  경쟁자들
                </h2>
                <span className="text-xs text-surface-500">
                  {leaderboard.filter(e => e.isBot).length}명의 봇 + {leaderboard.filter(e => !e.isBot).length}명의 유저
                </span>
              </div>
              
              {/* 봇 + 유저 카드 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 먼저 봇들 표시 */}
                {leaderboard
                  .filter(entry => entry.isBot)
                  .map((entry) => (
                    <CompetitorCard 
                      key={entry.userId} 
                      entry={entry} 
                      isActive={activeRuns.some(r => r.userId === entry.userId)}
                    />
                  ))}
                {/* 유저들 표시 */}
                {leaderboard
                  .filter(entry => !entry.isBot)
                  .slice(0, 4)  // 최대 4명까지만 카드로 표시
                  .map((entry) => (
                    <CompetitorCard 
                      key={entry.userId} 
                      entry={entry} 
                      isActive={activeRuns.some(r => r.userId === entry.userId)}
                    />
                  ))}
              </div>
              
              {leaderboard.filter(e => !e.isBot).length === 0 && (
                <div className="rounded-xl bg-primary-50 border border-primary-200 p-4 text-center">
                  <Users className="h-8 w-8 text-primary-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary-700">아직 참여한 유저가 없습니다</p>
                  <p className="text-xs text-primary-600 mt-1">첫 번째 유저가 되어 봇들과 경쟁하세요!</p>
                </div>
              )}
            </section>

            {/* 기간 선택 */}
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly', 'all'] as LeaderboardPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    period === p
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
                  }`}
                >
                  {p === 'daily' && '오늘'}
                  {p === 'weekly' && '이번 주'}
                  {p === 'monthly' && '이번 달'}
                  {p === 'all' && '전체'}
                </button>
              ))}
            </div>

            {/* 순위표 */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-surface-900 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                순위표
              </h2>
              
              <div className="space-y-2">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry) => (
                    <RankingItem key={entry.userId} entry={entry} />
                  ))
                ) : (
                  <div className="rounded-xl bg-white border border-surface-100 p-8 text-center">
                    <Trophy className="h-10 w-10 text-surface-300 mx-auto mb-3" />
                    <p className="text-sm text-surface-500">랭킹 데이터가 없습니다</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* 활동 탭 */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* 활동 히트맵 */}
            <ActivityHeatmap data={heatmap} />

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
                {transactions.length > 0 ? (
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
        )}
      </main>
    </div>
  );
};
