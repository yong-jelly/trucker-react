import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Package, Wrench, Shield, FileText, ArrowLeft, Loader2, History,
  Lock, CheckCircle2, ShoppingCart, DollarSign, Gauge, Zap
} from 'lucide-react';
import { useUserProfile } from '../entities/user';
import { rpcTrucker } from '../shared/api/supabase';
import { getActiveRuns, getRunHistory, type ActiveRun, type RunHistory } from '../entities/run';
import { 
  EquipmentHistorySheet, 
  useEquipments, 
  useUserEquipments,
  getEquipmentThumbnailPath,
  getEquipmentImagePath,
  type Equipment
} from '../entities/equipment';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@shared/ui/Sheet';

type TabType = 'EQUIPMENT' | 'DOCUMENT' | 'INSURANCE';

export const GaragePage = () => {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState<TabType>('EQUIPMENT');
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [equipmentHistory, setEquipmentHistory] = useState<RunHistory[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [selectedShopEquipment, setSelectedShopEquipment] = useState<Equipment | null>(null);

  // public_profile_id 사용
  const profileId = profile?.public_profile_id;

  // 데이터 로드 (React Query)
  const { data: allEquipments = [], isLoading: isLoadingEquipments } = useEquipments();
  const { data: userEquipments = [], isLoading: isLoadingUserEquipments } = useUserEquipments(profileId);
  const queryClient = useQueryClient();

  const buyMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      const { error } = await rpcTrucker('v1_purchase_equipment', { p_equipment_id: equipmentId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userEquipments', profileId] });
      queryClient.invalidateQueries({ queryKey: ['user_profile'] });
      setSelectedShopEquipment(null);
      alert('장비를 성공적으로 구매했습니다!');
    },
    onError: (error: any) => {
      console.error('Purchase failed:', error);
      alert(error.message || '구매에 실패했습니다.');
    }
  });

  const handlePurchase = () => {
    if (!selectedShopEquipment) return;
    if (!confirm(`${selectedShopEquipment.name}을(를) 구매하시겠습니까?`)) return;
    buyMutation.mutate(selectedShopEquipment.id);
  };

  // 진행 중인 운행 조회
  const fetchActiveRuns = useCallback(async () => {
    if (!profileId) return;
    
    try {
      const runs = await getActiveRuns(profileId);
      setActiveRuns(runs);
    } catch (err) {
      console.error('Failed to fetch active runs:', err);
    } finally {
      setIsLoadingRuns(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchActiveRuns();
  }, [fetchActiveRuns]);

  // 장비 히스토리 조회
  const fetchEquipmentHistory = useCallback(async (equipmentId: string) => {
    if (!profileId) return;
    
    setIsHistoryLoading(true);
    setSelectedEquipmentId(equipmentId);
    try {
      const history = await getRunHistory({
        userId: profileId,
        equipmentId: equipmentId,
      });
      setEquipmentHistory(history);
    } catch (err) {
      console.error('Failed to fetch equipment history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [profileId]);

  // 보유 장비 ID 세트 (빠른 조회를 위해)
  const ownedEquipmentIds = useMemo(() => 
    new Set(userEquipments.map(ue => ue.equipmentId)), 
    [userEquipments]
  );

  // 현재 장착 중인 장비 ID (기본값: basic-bicycle)
  const equippedId = useMemo(() => 
    userEquipments.find(ue => ue.isEquipped)?.equipmentId || 'basic-bicycle',
    [userEquipments]
  );

  const equipMutation = useMutation({
    mutationFn: async (params: { equipmentId: string; userEquipmentId: string }) => {
      const { userEquipmentId } = params;
      
      const { error } = await rpcTrucker('v1_equip_equipment', { 
        p_user_id: profileId,
        p_user_equipment_id: userEquipmentId 
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userEquipments', profileId] });
      alert('장비를 장착했습니다!');
    },
    onError: (error: any) => {
      console.error('Equip failed:', error);
      alert(error.message || '장착에 실패했습니다.');
    }
  });

  const handleEquip = (equipmentId: string, userEquipmentId: string) => {
    if (equipmentId === equippedId) return;
    if (inUseEquipmentIds.has(equipmentId)) {
      alert('현재 운행 중인 장비는 교체할 수 없습니다.');
      return;
    }
    equipMutation.mutate({ equipmentId, userEquipmentId });
  };

  // 운행 중인 장비 ID 세트
  const inUseEquipmentIds = useMemo(() => 
    new Set(activeRuns.map(ar => ar.run.selectedItems.equipmentId || 'basic-bicycle')),
    [activeRuns]
  );

  const categories = [
    { id: 'EQUIPMENT' as TabType, label: '장비', icon: Wrench, color: 'text-accent-blue' },
    { id: 'DOCUMENT' as TabType, label: '서류', icon: FileText, color: 'text-accent-amber' },
    { id: 'INSURANCE' as TabType, label: '보험', icon: Shield, color: 'text-accent-rose' },
  ];

  const isLoading = isLoadingRuns || isLoadingEquipments || isLoadingUserEquipments;

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      <div className="mx-auto max-w-2xl bg-white min-h-screen relative">
        {/* 헤더 */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-none border-b border-surface-100 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')} 
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-50 hover:bg-surface-100 active:scale-90 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-surface-700" />
              </button>
              <div>
                <h1 className="text-xl font-medium text-surface-900 tracking-tight">창고 및 상점</h1>
                <p className="text-[10px] text-surface-400 font-medium uppercase tracking-widest">Garage & Shop</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-2 border border-primary-100 shadow-sm">
              <DollarSign className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-bold text-primary-600">
                {profile?.balance.toLocaleString() ?? '0'}
              </span>
            </div>
          </div>

          {/* 카테고리 탭 - GPU 가속 적용 */}
          <div 
            className="flex gap-2 mt-6 overflow-x-auto pb-1 scrollbar-hide"
            style={{ 
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
              transform: 'translateZ(0)',
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all shrink-0 border ${
                  activeTab === cat.id 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200' 
                    : 'bg-white text-surface-600 border-surface-200 hover:border-primary-200'
                }`}
              >
                <cat.icon className={`h-4 w-4 ${activeTab === cat.id ? 'text-white' : cat.color}`} />
                {cat.label}
              </button>
            ))}
          </div>
        </header>

        <main className="p-4 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
              <p className="text-sm text-surface-400 font-medium">창고 데이터를 불러오는 중...</p>
            </div>
          ) : (
            <>
              {/* 캐릭터 가이드 섹션 */}
              {/* <section className="relative overflow-hidden rounded-[32px] bg-surface-900 p-6 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" />
                <div className="relative flex items-center gap-6">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white/10 p-1 border border-white/20">
                    <img 
                      src={Assets.images.characters.mechanic} 
                      alt="정비사" 
                      className="h-full w-full object-cover rounded-xl"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary-400 uppercase tracking-[0.2em]">Garage Master</span>
                    </div>
                    <h2 className="text-lg font-medium mt-1 tracking-tight">"장비가 곧 실력이야, 트러커!"</h2>
                    <p className="text-xs text-white/60 mt-2 leading-relaxed font-medium">
                      보유한 자금으로 더 좋은 장비를 구매해봐.<br />
                      속도와 적재량이 늘어나면 수익도 수직 상승할 거야!
                    </p>
                  </div>
                </div>
              </section> */}

              {/* 장비 탭 내용 */}
              {activeTab === 'EQUIPMENT' && (
                <div className="space-y-10">
                  {/* 보유 중인 장비 */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-base font-bold text-surface-900 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-accent-emerald" />
                        내 차고 ({userEquipments.length})
                      </h2>
                    </div>
                    
                    <div className="grid gap-4">
                      {/* 보유한 장비들 (기본 자전거 포함) */}
                      {userEquipments.map((ue) => (
                        <div 
                          key={ue.userEquipmentId}
                          className={`group relative overflow-hidden rounded-[32px] bg-white border-2 transition-all cursor-pointer ${
                            equippedId === ue.equipmentId 
                              ? 'border-primary-500 ring-4 ring-primary-500/10' 
                              : 'border-surface-100 hover:border-surface-200'
                          }`}
                          onClick={() => fetchEquipmentHistory(ue.equipmentId)}
                        >
                          <div className="flex p-5 gap-5">
                            <div className="relative h-24 w-24 shrink-0 rounded-2xl bg-surface-50 p-2 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F6F6EC' }}>
                              <img 
                                src={getEquipmentThumbnailPath(ue.imageFilename)} 
                                alt={ue.name} 
                                className="h-full w-full object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                              {inUseEquipmentIds.has(ue.equipmentId) && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">운행 중</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <div className="flex items-center justify-between">
                                  <h3 className="text-base font-bold text-surface-900">{ue.name}</h3>
                                  {equippedId === ue.equipmentId ? (
                                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg">장착 중</span>
                                  ) : (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEquip(ue.equipmentId, ue.userEquipmentId);
                                      }}
                                      disabled={equipMutation.isPending}
                                      className="text-[10px] font-bold text-surface-400 hover:text-primary-600 transition-colors"
                                    >
                                      장착하기
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-surface-500 mt-1 line-clamp-1">{ue.description}</p>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-4 text-[10px] font-bold text-surface-400 uppercase tracking-tighter">
                                  <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {ue.baseSpeed}km/h</span>
                                  <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {ue.maxWeight}kg / {ue.maxVolume}L</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetchEquipmentHistory(ue.equipmentId);
                                  }}
                                  className="p-2 rounded-xl bg-surface-50 text-surface-400 hover:text-surface-600 transition-colors"
                                >
                                  <History className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 상점 목록 */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-base font-bold text-surface-900 flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-primary-500" />
                        장비 상점
                      </h2>
                    </div>

                    <div className="grid gap-4">
                      {allEquipments
                        .filter(eq => !eq.isDefault && !ownedEquipmentIds.has(eq.id))
                        .map((eq) => {
                          const canAfford = (profile?.balance || 0) >= eq.price;
                          
                          return (
                            <button
                              key={eq.id}
                              onClick={() => setSelectedShopEquipment(eq)}
                              className="group relative overflow-hidden rounded-[32px] bg-white border border-surface-100 p-5 text-left hover:border-primary-200 active:scale-[0.98] transition-all"
                            >
                              <div className="flex gap-5">
                                <div className="relative h-24 w-24 shrink-0 rounded-2xl bg-surface-50 p-2 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F6F6EC' }}>
                                  <img 
                                    src={getEquipmentThumbnailPath(eq.imageFilename)} 
                                    alt={eq.name} 
                                    className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-500"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </div>
                                
                                <div className="flex-1 flex flex-col justify-between py-1">
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-base font-bold text-surface-900">{eq.name}</h3>
                                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${canAfford ? 'bg-primary-50 text-primary-600' : 'bg-surface-100 text-surface-400'}`}>
                                        <DollarSign className="h-3 w-3" />
                                        <span className="text-xs font-bold">{eq.price.toLocaleString()}</span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-surface-500 mt-1 line-clamp-2 leading-relaxed">{eq.description}</p>
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-surface-400 uppercase tracking-tighter">
                                      <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {eq.baseSpeed}km/h</span>
                                      <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {eq.maxWeight}kg</span>
                                    </div>
                                    {!canAfford && (
                                      <div className="flex items-center gap-1 text-[9px] font-bold text-accent-rose uppercase">
                                        <Lock className="h-3 w-3" />
                                        잔액 부족
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </section>
                </div>
              )}

              {/* 기타 탭 (준비중) */}
              {(activeTab === 'DOCUMENT' || activeTab === 'INSURANCE') && (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                  <div className="h-32 w-32 rounded-full bg-surface-50 flex items-center justify-center">
                    {activeTab === 'DOCUMENT' ? (
                      <FileText className="h-16 w-16 text-surface-200" />
                    ) : (
                      <Shield className="h-16 w-16 text-surface-200" />
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-surface-900">준비 중인 기능입니다</h3>
                    <p className="text-sm text-surface-500 mt-2">더 많은 콘텐츠를 곧 만나보실 수 있습니다!</p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 장비 히스토리 바텀시트 */}
      <EquipmentHistorySheet
        isOpen={!!selectedEquipmentId}
        onClose={() => setSelectedEquipmentId(null)}
        isLoading={isHistoryLoading}
        history={equipmentHistory}
        isEquipped={selectedEquipmentId === equippedId}
        onEquip={() => {
          const ue = userEquipments.find(u => u.equipmentId === selectedEquipmentId);
          if (ue) {
            handleEquip(ue.equipmentId, ue.userEquipmentId);
            setSelectedEquipmentId(null);
          }
        }}
        isEquipPending={equipMutation.isPending}
      />

      {/* 상점 구매 상세 바텀시트 */}
      <Sheet open={!!selectedShopEquipment} onOpenChange={(open) => !open && setSelectedShopEquipment(null)}>
        <SheetContent className="p-0">
          {selectedShopEquipment && (
            <>
              <SheetHeader className="px-8 pt-8 pb-0">
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-2xl font-bold text-surface-900">{selectedShopEquipment.name}</SheetTitle>
                  <span className="px-2 py-0.5 rounded-lg bg-surface-100 text-[10px] font-bold text-surface-500 uppercase tracking-widest">
                    {selectedShopEquipment.equipmentType}
                  </span>
                </div>
                <SheetDescription className="text-sm text-surface-500 mt-1 leading-relaxed font-medium">
                  {selectedShopEquipment.description}
                </SheetDescription>
              </SheetHeader>

              <div className="px-8 py-6 space-y-8">
                <div className="relative h-48 w-full rounded-[32px] bg-surface-50 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F6F6EC' }}>
                  <img 
                    src={getEquipmentImagePath(selectedShopEquipment.imageFilename)} 
                    alt={selectedShopEquipment.name} 
                    className="h-full w-full object-contain p-6"
                  />
                  <div className="absolute top-4 right-4 px-4 py-2 rounded-2xl bg-white/90 shadow-sm border border-white/20">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-primary-600" />
                      <span className="text-lg font-bold text-primary-600">{selectedShopEquipment.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-400 mb-2">
                      <Gauge className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">속도 성능</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-surface-900">{selectedShopEquipment.baseSpeed}</span>
                      <span className="text-xs text-surface-400 font-medium">km/h</span>
                      <span className="mx-1 text-surface-200">|</span>
                      <Zap className="h-3 w-3 text-accent-amber" />
                      <span className="text-sm font-bold text-accent-amber">{selectedShopEquipment.maxSpeed}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-400 mb-2">
                      <Package className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">적재 용량</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-surface-900">{selectedShopEquipment.maxWeight}</span>
                      <span className="text-xs text-surface-400 font-medium">kg</span>
                      <span className="mx-1 text-surface-200">|</span>
                      <span className="text-sm font-bold text-surface-600">{selectedShopEquipment.maxVolume}</span>
                      <span className="text-[10px] text-surface-400 font-medium">L</span>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="px-8 pb-8 pt-0 flex-col gap-3">
                <button 
                  onClick={handlePurchase}
                  disabled={(profile?.balance || 0) < selectedShopEquipment.price || buyMutation.isPending}
                  className={`w-full rounded-[24px] py-4 text-base font-bold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                    (profile?.balance || 0) >= selectedShopEquipment.price
                      ? 'bg-primary-600 text-white shadow-primary-200 hover:bg-primary-700'
                      : 'bg-surface-100 text-surface-400 cursor-not-allowed'
                  }`}
                >
                  {buyMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    (profile?.balance || 0) >= selectedShopEquipment.price ? '구매하기' : '잔액 부족'
                  )}
                </button>
                <button 
                  onClick={() => setSelectedShopEquipment(null)}
                  disabled={buyMutation.isPending}
                  className="w-full rounded-[24px] py-4 text-base font-bold text-surface-500 hover:bg-surface-50 transition-colors disabled:opacity-50"
                >
                  닫기
                </button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
