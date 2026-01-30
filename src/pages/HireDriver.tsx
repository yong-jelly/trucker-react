import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Users, DollarSign, Info, AlertCircle, ChevronLeft, ChevronRight, Zap, Target, Shield, Briefcase, Palette, Loader2 } from 'lucide-react';
import { useUserProfile } from '../entities/user';
import { useDriverPersonas, useHireDriver, getAvatarImageUrl } from '../entities/driver';
import { useUserStore } from '../entities/user';

import { PageHeader } from '../shared/ui/PageHeader';

type DriverType = 'NPC' | 'USER';

export const HireDriverPage = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { data: profile } = useUserProfile();
  const { data: personas, isLoading: isLoadingPersonas, error: personasError } = useDriverPersonas();
  const hireDriverMutation = useHireDriver();
  
  const [activeTab, setActiveTab] = useState<DriverType>('NPC');
  const [selectedDriverIndex, setSelectedDriverIndex] = useState(0);

  const tabs = [
    { id: 'NPC', label: 'NPC 드라이버' },
    { id: 'USER', label: '유저 드라이버' },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as DriverType);
  };
  
  // NPC 드라이버 오퍼 상태 관리 (각 드라이버별 협상 상태 저장)
  const [driverOffers, setDriverOffers] = useState<Record<string, { commission: number; attempts: number }>>({});

  // 페르소나 데이터가 로드되면 초기 오퍼 생성
  useMemo(() => {
    if (personas && personas.length > 0 && Object.keys(driverOffers).length === 0) {
      const initialOffers = Object.fromEntries(personas.map(d => {
        const min = d.baseCommissionMin;
        const max = d.baseCommissionMax;
        const initialCommission = Math.floor(Math.random() * (max - min + 1)) + min;
        return [d.id, { commission: initialCommission, attempts: 0 }];
      }));
      setDriverOffers(initialOffers);
    }
  }, [personas, driverOffers]);

  const currentPersona = personas?.[selectedDriverIndex];
  const currentOffer = currentPersona ? driverOffers[currentPersona.id] : null;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNegotiate = () => {
    if (!currentPersona || !currentOffer) return;
    
    setErrorMessage(null);
    if (currentOffer.attempts < 2) {
      const min = currentPersona.baseCommissionMin;
      const max = currentPersona.baseCommissionMax;
      // 협상 시에는 범위 내에서 다시 랜덤 생성 (기존보다 낮아질 수도, 높아질 수도 있음)
      const newRate = Math.floor(Math.random() * (max - min + 1)) + min;
      setDriverOffers({
        ...driverOffers,
        [currentPersona.id]: { commission: newRate, attempts: currentOffer.attempts + 1 }
      });
    } else {
      setDriverOffers({
        ...driverOffers,
        [currentPersona.id]: { ...currentOffer, attempts: 3 }
      });
    }
  };

  const handlePrevDriver = () => {
    if (!personas || personas.length === 0) return;
    setSelectedDriverIndex((prev) => (prev === 0 ? personas.length - 1 : prev - 1));
    setErrorMessage(null);
  };

  const handleNextDriver = () => {
    if (!personas || personas.length === 0) return;
    setSelectedDriverIndex((prev) => (prev === personas.length - 1 ? 0 : prev + 1));
    setErrorMessage(null);
  };

  const handleHire = async () => {
    if (!currentPersona || !currentOffer || !user || !profile) {
      setErrorMessage('필수 정보가 누락되었습니다.');
      return;
    }

    const deposit = (1000 + 500) * 1.1; // 예시 계산
    if (profile.balance < deposit) {
      setErrorMessage('예치금이 부족합니다.');
      return;
    }

    try {
      await hireDriverMutation.mutateAsync({
        userId: user.id,
        personaId: currentPersona.id,
        commissionRate: currentOffer.commission,
        depositAmount: deposit,
      });
      
      navigate('/garage');
    } catch (error: any) {
      setErrorMessage(error?.message || '드라이버 고용에 실패했습니다.');
    }
  };

  // 탭 변경 시 스크롤 최상단 이동
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeTab]);

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <PageHeader 
        title="드라이버 고용"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        rightElement={
          <div className="rounded-full bg-primary-50 px-4 py-1.5 border border-primary-100">
            <span className="text-sm font-medium text-primary-600">
              ${profile?.balance.toLocaleString() ?? '0'}
            </span>
          </div>
        }
      />

      <main className="flex-1 w-full max-w-lg mx-auto pt-32 pb-32">
        {activeTab === 'NPC' ? (
          <div className="space-y-6">
            {/* 로딩 상태 */}
            {isLoadingPersonas && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            )}

            {/* 에러 상태 */}
            {personasError && (
              <div className="rounded-2xl bg-accent-rose/10 p-6 text-center">
                <AlertCircle className="h-8 w-8 text-accent-rose mx-auto mb-2" />
                <p className="text-sm text-accent-rose">드라이버 정보를 불러오는데 실패했습니다.</p>
              </div>
            )}

            {/* 드라이버 선택 UI 개선 - 게임 캐릭터 선택 스타일 */}
            {!isLoadingPersonas && !personasError && currentPersona && currentOffer && (
            <div className="relative rounded-3xl bg-white border border-surface-100 overflow-hidden min-h-[600px] flex flex-col shadow-soft-sm">
              <div className="relative z-10 flex flex-col h-full">
                {/* 메인 콘텐츠 영역: 캐릭터 이미지 및 정보 */}
                <div className="flex flex-col flex-1 p-6 gap-8">
                  {/* 캐릭터 이미지 섹션 */}
                  <div className="w-full flex flex-col items-center justify-center space-y-6">
                    <div className="relative group">
                      <div className="relative h-[320px] w-[240px] rounded-[32px] bg-white p-2 shadow-soft-md border border-surface-100 overflow-hidden">
                        <img 
                          src={getAvatarImageUrl(currentPersona.avatarFilename)} 
                          alt={currentPersona.name} 
                          className="h-full w-full object-cover rounded-[24px]" 
                        />
                        {/* 이미지 위 오버레이 정보 */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-surface-900/60 text-white">
                          <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-80 mb-1">유형</p>
                          <p className="text-lg font-medium">{currentPersona.archetype}</p>
                        </div>
                      </div>

                      {/* 네비게이션 버튼 */}
                      <button 
                        onClick={handlePrevDriver}
                        className="absolute top-1/2 -left-6 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-soft-xl border border-surface-100 text-surface-600 hover:text-primary-600 active:scale-90 z-20"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      
                      <button 
                        onClick={handleNextDriver}
                        className="absolute top-1/2 -right-6 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-soft-xl border border-surface-100 text-surface-600 hover:text-primary-600 active:scale-90 z-20"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </div>

                    {/* 캐릭터 기본 태그 */}
                    <div className="flex gap-2">
                      <span className="px-4 py-1.5 rounded-full bg-surface-900 text-white text-[10px] font-medium uppercase tracking-wider shadow-soft-md">
                        {currentPersona.age}
                      </span>
                      <span className="px-4 py-1.5 rounded-full bg-white text-primary-700 border border-primary-100 text-[10px] font-medium uppercase tracking-wider shadow-soft-sm">
                        {currentPersona.mood}
                      </span>
                    </div>
                  </div>

                  {/* 상세 정보 섹션 */}
                  <div className="w-full flex flex-col space-y-6 py-4">
                    <div className="space-y-1">
                      <h2 className="text-4xl font-medium text-surface-900 tracking-tight leading-none">
                        {currentPersona.name.split(' ')[0]}
                        <span className="block text-primary-600">{currentPersona.name.split(' ').slice(1).join(' ')}</span>
                      </h2>
                    </div>

                    {/* 페르소나 바이오 */}
                    <div className="relative">
                      <div className="absolute -left-3 top-0 bottom-0 w-1 bg-primary-500 rounded-full" />
                      <p className="text-sm text-surface-600 leading-relaxed pl-4 italic font-medium">
                        "{currentPersona.bio}"
                      </p>
                    </div>

                    {/* 능력치 보너스 */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-medium text-surface-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Zap className="h-3 w-3" />
                        드라이버 능력
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {currentPersona.stats.map((stat, idx) => (
                          <div key={idx} className="group flex items-center justify-between p-3 rounded-2xl bg-white border border-surface-100 hover:border-primary-200 transition-all shadow-soft-xs">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-surface-50 flex items-center justify-center">
                                {idx === 0 ? <Zap className="h-5 w-5 text-primary-600" /> : 
                                 idx === 1 ? <Target className="h-5 w-5 text-primary-600" /> : 
                                 <Shield className="h-5 w-5 text-primary-600" />}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-surface-900">{stat.label}</p>
                                <p className="text-[10px] text-surface-500">{stat.description}</p>
                              </div>
                            </div>
                            <span className="text-base font-medium text-primary-600">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 하단: 협상 및 고용 액션 영역 */}
                <div className="p-6 bg-surface-900 text-white rounded-t-[32px] mt-auto">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-surface-400 uppercase tracking-[0.2em]">현재 제안</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-medium text-primary-400">{currentOffer.commission}</span>
                          <span className="text-xl font-medium text-primary-400/60">%</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-medium text-surface-400 uppercase tracking-[0.2em]">협상</p>
                        <div className="flex items-center justify-end gap-1.5">
                          {[...Array(3)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-2 w-8 rounded-full transition-all duration-500 ${
                                i < (3 - currentOffer.attempts) ? 'bg-primary-500' : 'bg-surface-700'
                              }`} 
                            />
                          ))}
                        </div>
                        <p className="text-[10px] font-medium text-surface-500 mt-1">{3 - currentOffer.attempts}회 남음</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {currentOffer.attempts < 3 ? (
                        <button 
                          onClick={handleNegotiate}
                          className="py-4 rounded-2xl bg-surface-800 border border-surface-700 text-white font-medium text-base hover:bg-surface-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Palette className="h-5 w-5 text-primary-400" />
                          협상하기
                        </button>
                      ) : (
                        <div className="py-4 rounded-2xl bg-surface-800/50 border border-surface-700/50 text-surface-500 font-medium text-sm flex items-center justify-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          협상 종료
                        </div>
                      )}
                      
                      <button 
                        onClick={handleHire}
                        disabled={hireDriverMutation.isPending}
                        className="py-4 rounded-2xl bg-primary-500 text-surface-900 font-medium text-base shadow-lg hover:bg-primary-400 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {hireDriverMutation.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Briefcase className="h-5 w-5" />
                        )}
                        {hireDriverMutation.isPending ? '고용 중...' : '드라이버 고용'}
                      </button>
                    </div>

                    {errorMessage && (
                      <p className="mt-4 text-center text-accent-rose text-xs font-medium animate-pulse">
                        {errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* 예치금 안내 */}
            {!isLoadingPersonas && !personasError && (
              <div className="rounded-2xl bg-surface-900 p-6 text-white space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary-400" />
                  <h3 className="text-sm font-medium">고용 예치금 상세</h3>
                </div>
                <div className="space-y-2 text-xs text-surface-300">
                  <div className="flex justify-between">
                    <span>최대 예상 수수료 적립</span>
                    <span className="text-white font-medium">$1,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>의무 기간 내 해고 위약금</span>
                    <span className="text-white font-medium">$500</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-primary-400 font-medium">합계 (10% 버퍼 포함)</span>
                    <span className="text-primary-400 font-medium text-sm">$1,650</span>
                  </div>
                </div>
                <p className="text-[10px] text-surface-400 leading-relaxed">
                  * 예치금은 의무 운행(10회) 종료 후 해고 시 5%의 행정 수수료를 제외하고 환불됩니다.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* 유저 드라이버 (Coming Soon) */
          <div className="space-y-4">
            <div className="rounded-3xl bg-white p-12 shadow-soft-md border border-surface-100 text-center border-dashed">
              <div className="mx-auto h-20 w-20 rounded-full bg-surface-50 flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-surface-200" />
              </div>
              <h2 className="text-lg font-medium text-surface-900">유저 드라이버 마켓</h2>
              <p className="text-sm text-surface-500 mt-2">
                다른 유저가 생성한 개성 넘치는 드라이버를<br/>고용할 수 있는 기능이 곧 추가됩니다!
              </p>
              <div className="mt-6 inline-block rounded-full bg-primary-50 px-4 py-1 text-[10px] font-medium text-primary-600 uppercase tracking-widest">
                곧 출시
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-surface-100 space-y-3">
              <h3 className="text-sm font-medium text-surface-900 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary-500" />
                유저 드라이버란?
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                유저는 자신만의 드라이버 캐릭터를 생성하여 마켓에 등록할 수 있습니다. 
                다른 유저가 내 드라이버를 고용하여 운행을 마치면, 설정한 수수료(기본 30%)의 일부를 수익으로 얻게 됩니다.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
