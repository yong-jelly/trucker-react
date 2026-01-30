import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Package, Wrench, Shield, FileText, Loader2, History,
  Lock, DollarSign, Gauge, Zap,
  AlertTriangle, AlertCircle, HelpCircle, RefreshCcw, Clock,
  HeartPulse, Activity, ShieldAlert
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

import { PageHeader } from '../shared/ui/PageHeader';
import { DocumentHelpModal } from '../widgets/garage/ui/DocumentHelpModal';
import { InsuranceHelpModal } from '../widgets/garage/ui/InsuranceHelpModal';

type TabType = 'equipment' | 'document' | 'insurance';

export const GaragePage = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { data: profile } = useUserProfile();
  
  const activeTab = (tab?.toLowerCase() || 'equipment') as TabType;
  
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [equipmentHistory, setEquipmentHistory] = useState<RunHistory[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [selectedShopEquipment, setSelectedShopEquipment] = useState<Equipment | null>(null);
  const [selectedUserEquipment, setSelectedUserEquipment] = useState<Equipment | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<any | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isInsuranceHelpOpen, setIsInsuranceHelpOpen] = useState(false);

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

  // 탭 변경 시 스크롤 최상단 이동
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeTab]);

  const categories = [
    { id: 'equipment' as TabType, label: '장비', icon: Wrench, color: 'text-accent-blue' },
    { id: 'document' as TabType, label: '서류', icon: FileText, color: 'text-accent-amber' },
    { id: 'insurance' as TabType, label: '보험', icon: Shield, color: 'text-accent-rose' },
  ];

  const handleTabChange = (tabId: string) => {
    navigate(`/garage/${tabId}`);
  };

  const isLoading = isLoadingRuns || isLoadingEquipments || isLoadingUserEquipments;

  // Hardcoded documents for 'Cairn RPG' concept
  const userDocuments = [
    {
      id: 'doc-001',
      name: '표준 이륜차 면허',
      type: 'LICENSE',
      slots: 0,
      description: '가장 기본적인 자전거 운송 면허입니다. 무게가 거의 나가지 않아 슬롯을 차지하지 않습니다.',
      effect: '일반 화물 운송 가능',
      flavor: '“이것만 있으면 어디든 갈 수 있을 줄 알았다.”',
      status: 'ACTIVE',
      expiryDate: '무제한',
      remainingUses: '무제한',
      icon: FileText,
      color: 'text-surface-600',
      bgColor: 'bg-surface-100'
    },
    {
      id: 'doc-003',
      name: '과속 위반 딱지',
      type: 'VIOLATION',
      slots: 1,
      description: '지난 배달에서 신호를 위반하여 발부된 딱지입니다. 벌금을 납부하고 교육을 이수할 때까지 사라지지 않습니다.',
      effect: '제거 불가 (3일 남음)',
      flavor: '“경찰관의 눈은 생각보다 훨씬 날카롭습니다.”',
      status: 'PENDING',
      expiryDate: '2026-02-02',
      remainingUses: 'N/A',
      icon: AlertTriangle,
      color: 'text-accent-rose',
      bgColor: 'bg-rose-50'
    }
  ];

  const shopDocuments = [
    {
      id: 'doc-002',
      name: '위험물 취급 인가증',
      type: 'PERMIT',
      slots: 1,
      price: 5000,
      description: '화학물질 및 폭발성 화물을 다룰 수 있는 허가증입니다. 두꺼운 규정집을 항상 휴대해야 합니다.',
      effect: '위험물 운송 가능',
      flavor: '“불꽃 근처에는 가지 마세요. 제발요.”',
      expiryDate: '30일',
      remainingUses: '무제한',
      icon: Shield,
      color: 'text-accent-amber',
      bgColor: 'bg-amber-50'
    },
    {
      id: 'doc-005',
      name: '위조된 통행증',
      type: 'ILLEGAL',
      slots: 1,
      price: 2000,
      description: '암시장에서 구한 조잡한 위조 서류입니다. 특정 검문소를 무사히 통과할 수 있게 해주지만, 걸리면 파산입니다.',
      effect: '검문소 자동 통과 (확률적)',
      flavor: '“뒷골목의 잉크 냄새가 아직 가시지 않았습니다.”',
      expiryDate: '7일',
      remainingUses: '3회',
      icon: Lock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'doc-006',
      name: '혈액 운송 긴급 칙령',
      type: 'RELIC',
      slots: 2,
      price: 15000,
      description: '국가 비상사태 시 발행되는 강력한 권한의 문서입니다. 모든 신호를 무시할 수 있지만, 인벤토리의 핵심 슬롯을 2칸이나 점유합니다.',
      effect: '신호 위반 무효화',
      flavor: '“생명보다 소중한 종이는 없습니다.”',
      expiryDate: '24시간',
      remainingUses: '1회',
      icon: Zap,
      color: 'text-accent-emerald',
      bgColor: 'bg-emerald-50'
    }
  ];

  // const totalSlots = 10;
  // const usedSlots = userDocuments.reduce((acc, doc) => acc + doc.slots, 0);

  // Hardcoded insurances for 'Cardiovascular' concept
  const userInsurances = [
    {
      id: 'ins-001',
      name: '기초 혈소판 응고제',
      type: 'BASIC',
      description: '가장 기본적인 사고 방어 체계입니다. 미세한 출혈(소액 사고)을 즉시 차단합니다.',
      effect: '사고 손실 70% 방어',
      sideEffect: '운행 속도 -5%',
      flavor: '“상처는 금방 아물 것입니다. 조금 느려지겠지만요.”',
      status: 'ACTIVE',
      expiryDate: '15일 남음',
      icon: Activity,
      color: 'text-accent-rose',
      bgColor: 'bg-rose-50'
    }
  ];

  const shopInsurances = [
    {
      id: 'ins-002',
      name: '인공 혈장 증량 팩',
      type: 'RECOVERY',
      price: 8000,
      description: '지각으로 인한 대량 출혈(패널티) 발생 시, 시스템 쇼크를 방지하기 위해 다음 운행에서 손실액을 서서히 보충합니다.',
      effect: '패널티 50% 지연 회복',
      sideEffect: '내구도 소모 +10%',
      flavor: '“당장의 고통은 잊으세요. 미래의 당신이 갚을 테니까요.”',
      expiryDate: '30일',
      icon: HeartPulse,
      color: 'text-accent-blue',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'ins-003',
      name: '항원 중화 항체',
      type: 'IMMUNE',
      price: 12000,
      description: '외부 항원(단속)의 공격을 무력화합니다. 벌금 발생 시 이를 대납하고 평판 하락을 막습니다.',
      effect: '단속 벌금 80% 대납',
      sideEffect: '사고 발생 확률 +5%',
      flavor: '“법이라는 바이러스에 대한 가장 확실한 백신입니다.”',
      expiryDate: '7일',
      icon: ShieldAlert,
      color: 'text-accent-emerald',
      bgColor: 'bg-emerald-50'
    }
  ];

  const handleBuyDocument = (doc: any) => {
    if ((profile?.balance || 0) < doc.price) {
      alert('잔액이 부족합니다.');
      return;
    }
    if (confirm(`${doc.name}을(를) 구매하시겠습니까?`)) {
      alert('서류를 성공적으로 구매했습니다! (데모)');
      setSelectedDocument(null);
    }
  };

  const handleBuyInsurance = (ins: any) => {
    if ((profile?.balance || 0) < ins.price) {
      alert('잔액이 부족합니다.');
      return;
    }
    if (confirm(`${ins.name}을(를) 구매하시겠습니까?`)) {
      alert('보험을 성공적으로 구매했습니다! (데모)');
      setSelectedInsurance(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      {/* 헤더 */}
      <PageHeader 
        title="창고 및 상점"
        tabs={categories.map(cat => ({ id: cat.id, label: cat.label }))}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onBack={() => navigate('/')}
        rightElement={
          <div className="flex items-center gap-2 rounded-2xl bg-surface-100 px-4 py-2 border border-surface-200">
            <DollarSign className="h-4 w-4 text-surface-700" />
            <span className="text-sm font-medium text-surface-700">
              {profile?.balance.toLocaleString() ?? '0'}
            </span>
          </div>
        }
      />

      <main className="flex-1 w-full max-w-lg mx-auto pt-32 pb-32 bg-white">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            <p className="text-sm text-surface-400 font-medium">창고 데이터를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 장비 탭 내용 */}
            {activeTab === 'equipment' && (
              <div className="space-y-12">
                {/* 보유 중인 장비 */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-y border-surface-100">
                    <h2 className="text-base font-medium text-surface-900">
                      보유 ({userEquipments.length})
                    </h2>
                  </div>
                  
                  <div className="grid gap-4 px-4">
                    {/* 보유한 장비들 (기본 자전거 포함) */}
                    {userEquipments.map((ue) => (
                      <div 
                        key={ue.userEquipmentId}
                        className={`group relative overflow-hidden cursor-pointer`}
                        onClick={() => {
                          // 장착 중인 장비는 상세 정보 시트 열기, 아니면 히스토리 열기
                          if (equippedId === ue.equipmentId) {
                            const equipment = allEquipments.find(eq => eq.id === ue.equipmentId);
                            if (equipment) {
                              setSelectedUserEquipment(equipment);
                            }
                          } else {
                            fetchEquipmentHistory(ue.equipmentId);
                          }
                        }}
                      >
                        <div className="flex p-4 gap-5">
                          <div className="relative h-20 w-20 shrink-0 rounded-2xl bg-surface-50 p-2 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F6F6EC' }}>
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
                                <h3 className="text-base font-medium text-surface-900">{ue.name}</h3>
                                {equippedId === ue.equipmentId ? (
                                  <span className="text-[10px] font-medium text-surface-700 bg-surface-100 px-2 py-0.5 rounded-lg">장착 중</span>
                                ) : (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEquip(ue.equipmentId, ue.userEquipmentId);
                                    }}
                                    disabled={equipMutation.isPending}
                                    className="text-[10px] font-medium text-surface-500"
                                  >
                                    장착하기
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-surface-600 mt-1 line-clamp-1">{ue.description}</p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-4 text-[10px] font-medium text-surface-500 uppercase tracking-tighter">
                                <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {ue.baseSpeed}km/h</span>
                                <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {ue.maxWeight}kg / {ue.maxVolume}L</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetchEquipmentHistory(ue.equipmentId);
                                }}
                                className="p-2 rounded-xl bg-surface-50 text-surface-500"
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
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-y border-surface-100">
                    <h2 className="text-base font-medium text-surface-900">
                      상점
                    </h2>
                  </div>

                  <div className="grid gap-4 px-4">
                    {allEquipments
                      .filter(eq => !eq.isDefault && !ownedEquipmentIds.has(eq.id))
                      .map((eq) => {
                        const canAfford = (profile?.balance || 0) >= eq.price;
                        
                        return (
                          <button
                            key={eq.id}
                            onClick={() => setSelectedShopEquipment(eq)}
                            className="group relative overflow-hidden p-4 text-left active:scale-[0.98]"
                          >
                            <div className="flex gap-5">
                              <div className="relative h-20 w-20 shrink-0 rounded-2xl bg-surface-50 p-2 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F6F6EC' }}>
                                <img 
                                  src={getEquipmentThumbnailPath(eq.imageFilename)} 
                                  alt={eq.name} 
                                  className="h-full w-full object-contain"
                                  loading="lazy"
                                  decoding="async"
                                />
                              </div>
                              
                              <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-base font-medium text-surface-900">{eq.name}</h3>
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${canAfford ? 'bg-surface-100 text-surface-700' : 'bg-surface-50 text-surface-500'}`}>
                                      <DollarSign className="h-3 w-3" />
                                      <span className="text-xs font-medium">{eq.price.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-surface-600 mt-1 line-clamp-2 leading-relaxed">{eq.description}</p>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-3 text-[10px] font-medium text-surface-500 uppercase tracking-tighter">
                                    <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {eq.baseSpeed}km/h</span>
                                    <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {eq.maxWeight}kg</span>
                                  </div>
                                  {!canAfford && (
                                    <div className="flex items-center gap-1 text-[9px] font-medium text-red-600 uppercase">
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

            {/* 서류 탭 내용 */}
            {activeTab === 'document' && (
              <div className="space-y-12">
                {/* 내 서류 목록 */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-y border-surface-100">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-medium text-surface-900">
                        보유 ({userDocuments.length})
                      </h2>
                      <button 
                        onClick={() => setIsHelpOpen(true)}
                        className="p-1 rounded-lg"
                      >
                        <HelpCircle className="h-4 w-4 text-surface-500" />
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 px-4">
                    {userDocuments.map((doc) => (
                      <div 
                        key={doc.id}
                        onClick={() => setSelectedDocument(doc)}
                        className={`group relative overflow-hidden cursor-pointer`}
                      >
                        <div className="flex p-4 gap-5">
                          <div className={`relative h-20 w-20 shrink-0 rounded-2xl ${doc.bgColor} flex flex-col items-center justify-center gap-1`}>
                            <doc.icon className={`h-8 w-8 ${doc.color}`} />
                            {doc.slots > 0 && (
                              <div className="absolute -top-2 -right-2 bg-surface-800 text-white text-[10px] font-medium px-2 py-1 rounded-full border border-white">
                                {doc.slots}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              <div className="flex items-center justify-between">
                                <h3 className="text-base font-medium text-surface-900">{doc.name}</h3>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                                  doc.status === 'ACTIVE' ? 'bg-surface-100 text-surface-700' :
                                  doc.status === 'PENDING' ? 'bg-surface-100 text-surface-600' :
                                  'bg-surface-50 text-surface-500'
                                }`}>
                                  {doc.status === 'ACTIVE' ? '유효함' : 
                                   doc.status === 'PENDING' ? '처리 필요' : '만료됨'}
                                </span>
                              </div>
                              <p className="text-xs text-surface-600 mt-1 line-clamp-1">{doc.effect}</p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-3 text-[10px] text-surface-500 font-medium">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {doc.expiryDate}</span>
                                <span className="flex items-center gap-1"><RefreshCcw className="h-3 w-3" /> {doc.remainingUses}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 서류 상점 */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-y border-surface-100">
                    <h2 className="text-base font-medium text-surface-900">
                      상점
                    </h2>
                  </div>
                  <div className="grid gap-4 px-4">
                    {shopDocuments.map((doc) => {
                      const canAfford = (profile?.balance || 0) >= doc.price;
                      return (
                        <div 
                          key={doc.id}
                          onClick={() => setSelectedDocument(doc)}
                          className="group relative overflow-hidden p-4 cursor-pointer"
                        >
                          <div className="flex gap-5">
                            <div className={`relative h-20 w-20 shrink-0 rounded-2xl ${doc.bgColor} flex flex-col items-center justify-center gap-1`}>
                              <doc.icon className={`h-8 w-8 ${doc.color}`} />
                              {doc.slots > 0 && (
                                <div className="absolute -top-2 -right-2 bg-surface-800 text-white text-[10px] font-medium px-2 py-1 rounded-full border border-white">
                                  {doc.slots}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <div className="flex items-center justify-between">
                                  <h3 className="text-base font-medium text-surface-900">{doc.name}</h3>
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${canAfford ? 'bg-surface-100 text-surface-700' : 'bg-surface-50 text-surface-500'}`}>
                                    <DollarSign className="h-3 w-3" />
                                    <span className="text-xs font-medium">{doc.price.toLocaleString()}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-surface-600 mt-1 line-clamp-1">{doc.effect}</p>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3 text-[10px] text-surface-500 font-medium">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {doc.expiryDate}</span>
                                  <span className="flex items-center gap-1"><RefreshCcw className="h-3 w-3" /> {doc.remainingUses}</span>
                                </div>
                                {!canAfford && (
                                  <span className="text-[9px] font-medium text-red-600 uppercase flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> 잔액 부족
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* 보험 탭 내용 */}
            {activeTab === 'insurance' && (
              <div className="space-y-12">
                {/* 내 보험 목록 */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-y border-surface-100">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-medium text-surface-900">
                        보유 ({userInsurances.length})
                      </h2>
                      <button 
                        onClick={() => setIsInsuranceHelpOpen(true)}
                        className="p-1 rounded-lg"
                      >
                        <HelpCircle className="h-4 w-4 text-surface-500" />
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 px-4">
                    {userInsurances.map((ins) => (
                      <div 
                        key={ins.id}
                        onClick={() => setSelectedInsurance(ins)}
                        className="group relative overflow-hidden cursor-pointer"
                      >
                        <div className="flex p-4 gap-5">
                          <div className={`relative h-20 w-20 shrink-0 rounded-2xl ${ins.bgColor} flex flex-col items-center justify-center gap-1`}>
                            <ins.icon className={`h-8 w-8 ${ins.color}`} />
                          </div>

                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              <div className="flex items-center justify-between">
                                <h3 className="text-base font-medium text-surface-900">{ins.name}</h3>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-surface-100 text-surface-700 uppercase tracking-wider">
                                  활성
                                </span>
                              </div>
                              <p className="text-xs text-surface-600 mt-1 line-clamp-1">{ins.effect}</p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-3 text-[10px] text-surface-500 font-medium">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {ins.expiryDate}</span>
                                <span className="flex items-center gap-1 text-surface-400">/</span>
                                <span className="text-surface-500">{ins.sideEffect}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 보험 상점 */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-y border-surface-100">
                    <h2 className="text-base font-medium text-surface-900">
                      상점
                    </h2>
                  </div>
                  <div className="grid gap-4 px-4">
                    {shopInsurances.map((ins) => {
                      const canAfford = (profile?.balance || 0) >= ins.price;
                      return (
                        <div 
                          key={ins.id}
                          onClick={() => setSelectedInsurance(ins)}
                          className="group relative overflow-hidden p-4 cursor-pointer"
                        >
                          <div className="flex gap-5">
                            <div className={`relative h-20 w-20 shrink-0 rounded-2xl ${ins.bgColor} flex flex-col items-center justify-center gap-1`}>
                              <ins.icon className={`h-8 w-8 ${ins.color}`} />
                            </div>

                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <div className="flex items-center justify-between">
                                  <h3 className="text-base font-medium text-surface-900">{ins.name}</h3>
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${canAfford ? 'bg-surface-100 text-surface-700' : 'bg-surface-50 text-surface-500'}`}>
                                    <DollarSign className="h-3 w-3" />
                                    <span className="text-xs font-medium">{ins.price.toLocaleString()}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-surface-600 mt-1 line-clamp-1">{ins.effect}</p>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3 text-[10px] text-surface-500 font-medium">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {ins.expiryDate}</span>
                                </div>
                                {!canAfford && (
                                  <span className="text-[9px] font-medium text-red-600 uppercase flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> 잔액 부족
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </main>

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

      {/* 보유 장비 상세 바텀시트 */}
      <Sheet open={!!selectedUserEquipment} onOpenChange={(open) => !open && setSelectedUserEquipment(null)}>
        <SheetContent className="p-0">
          {selectedUserEquipment && (() => {
            const ue = userEquipments.find(e => e.equipmentId === selectedUserEquipment.id);
            const isCurrentlyEquipped = equippedId === selectedUserEquipment.id;
            return (
              <>
                <SheetHeader className="px-8 pt-8 pb-0">
                  <div className="flex items-center gap-3">
                    <SheetTitle className="text-2xl font-medium text-surface-900">{selectedUserEquipment.name}</SheetTitle>
                    <span className="px-2 py-0.5 rounded-lg bg-surface-100 text-[10px] font-medium text-surface-600 uppercase tracking-widest">
                      {selectedUserEquipment.equipmentType}
                    </span>
                  </div>
                  <SheetDescription className="text-sm text-surface-600 mt-1 leading-relaxed font-medium">
                    {selectedUserEquipment.description}
                  </SheetDescription>
                </SheetHeader>

                <div className="px-8 py-6 space-y-8">
                  <div className="relative h-48 w-full rounded-[32px] bg-surface-50 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F6F6EC' }}>
                    <img 
                      src={getEquipmentImagePath(selectedUserEquipment.imageFilename)} 
                      alt={selectedUserEquipment.name} 
                      className="h-full w-full object-contain p-6"
                    />
                    {isCurrentlyEquipped && (
                      <div className="absolute top-4 right-4 px-4 py-2 rounded-2xl bg-surface-100 border border-surface-200">
                        <span className="text-sm font-medium text-surface-700">장착 중</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                      <div className="flex items-center gap-2 text-surface-500 mb-2">
                        <Gauge className="h-4 w-4" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">속도 성능</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-medium text-surface-900">{selectedUserEquipment.baseSpeed}</span>
                        <span className="text-xs text-surface-500 font-medium">km/h</span>
                        <span className="mx-1 text-surface-200">|</span>
                        <Zap className="h-3 w-3 text-surface-600" />
                        <span className="text-sm font-medium text-surface-700">{selectedUserEquipment.maxSpeed}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                      <div className="flex items-center gap-2 text-surface-500 mb-2">
                        <Package className="h-4 w-4" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">적재 용량</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-medium text-surface-900">{selectedUserEquipment.maxWeight}</span>
                        <span className="text-xs text-surface-500 font-medium">kg</span>
                        <span className="mx-1 text-surface-200">|</span>
                        <span className="text-sm font-medium text-surface-700">{selectedUserEquipment.maxVolume}</span>
                        <span className="text-[10px] text-surface-500 font-medium">L</span>
                      </div>
                    </div>
                  </div>
                </div>

                <SheetFooter className="px-8 pb-8 pt-0 flex-col gap-3">
                  {!isCurrentlyEquipped && ue && (
                    <button 
                      onClick={() => {
                        handleEquip(ue.equipmentId, ue.userEquipmentId);
                        setSelectedUserEquipment(null);
                      }}
                      disabled={equipMutation.isPending || inUseEquipmentIds.has(ue.equipmentId)}
                      className={`w-full rounded-[24px] py-4 text-base font-medium active:scale-[0.98] flex items-center justify-center gap-2 ${
                        inUseEquipmentIds.has(ue.equipmentId)
                          ? 'bg-surface-100 text-surface-500 cursor-not-allowed'
                          : 'bg-surface-800 text-white'
                      }`}
                    >
                      {equipMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : inUseEquipmentIds.has(ue.equipmentId) ? (
                        '운행 중인 장비는 교체할 수 없습니다'
                      ) : (
                        '장착하기'
                      )}
                    </button>
                  )}
                </SheetFooter>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* 상점 구매 상세 바텀시트 */}
      <Sheet open={!!selectedShopEquipment} onOpenChange={(open) => !open && setSelectedShopEquipment(null)}>
        <SheetContent className="p-0">
          {selectedShopEquipment && (
            <>
              <SheetHeader className="px-8 pt-8 pb-0">
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-2xl font-medium text-surface-900">{selectedShopEquipment.name}</SheetTitle>
                  <span className="px-2 py-0.5 rounded-lg bg-surface-100 text-[10px] font-medium text-surface-600 uppercase tracking-widest">
                    {selectedShopEquipment.equipmentType}
                  </span>
                </div>
                <SheetDescription className="text-sm text-surface-600 mt-1 leading-relaxed font-medium">
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
                  <div className="absolute top-4 right-4 px-4 py-2 rounded-2xl bg-white border border-surface-200">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-surface-700" />
                      <span className="text-lg font-medium text-surface-700">{selectedShopEquipment.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-500 mb-2">
                      <Gauge className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">속도 성능</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-medium text-surface-900">{selectedShopEquipment.baseSpeed}</span>
                      <span className="text-xs text-surface-500 font-medium">km/h</span>
                      <span className="mx-1 text-surface-200">|</span>
                      <Zap className="h-3 w-3 text-surface-600" />
                      <span className="text-sm font-medium text-surface-700">{selectedShopEquipment.maxSpeed}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-500 mb-2">
                      <Package className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">적재 용량</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-medium text-surface-900">{selectedShopEquipment.maxWeight}</span>
                      <span className="text-xs text-surface-500 font-medium">kg</span>
                      <span className="mx-1 text-surface-200">|</span>
                      <span className="text-sm font-medium text-surface-700">{selectedShopEquipment.maxVolume}</span>
                      <span className="text-[10px] text-surface-500 font-medium">L</span>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="px-8 pb-8 pt-0 flex-col gap-3">
                <button 
                  onClick={handlePurchase}
                  disabled={(profile?.balance || 0) < selectedShopEquipment.price || buyMutation.isPending}
                  className={`w-full rounded-[24px] py-4 text-base font-medium active:scale-[0.98] flex items-center justify-center gap-2 ${
                    (profile?.balance || 0) >= selectedShopEquipment.price
                      ? 'bg-surface-800 text-white'
                      : 'bg-surface-100 text-surface-500 cursor-not-allowed'
                  }`}
                >
                  {buyMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    (profile?.balance || 0) >= selectedShopEquipment.price ? '구매하기' : <span className="text-red-600">잔액 부족</span>
                  )}
                </button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 서류 상세 정보 바텀시트 */}
      <Sheet open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <SheetContent className="p-0">
          {selectedDocument && (
            <>
              <SheetHeader className="px-8 pt-8 pb-0">
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-2xl font-medium text-surface-900">{selectedDocument.name}</SheetTitle>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium uppercase tracking-widest ${
                    selectedDocument.type === 'VIOLATION' || selectedDocument.type === 'CURSE' 
                      ? 'bg-surface-100 text-surface-600' 
                      : 'bg-surface-100 text-surface-600'
                  }`}>
                    {selectedDocument.type}
                  </span>
                </div>
                <SheetDescription className="text-sm text-surface-600 mt-1 leading-relaxed font-medium">
                  {selectedDocument.description}
                </SheetDescription>
              </SheetHeader>

              <div className="px-8 py-6 space-y-8">
                {/* 시각적 표현 (아이콘 중심) */}
                <div className={`relative h-48 w-full rounded-[32px] flex flex-col items-center justify-center overflow-hidden ${selectedDocument.bgColor}`}>
                  <selectedDocument.icon className={`h-24 w-24 ${selectedDocument.color} mb-4`} />
                  <div className="absolute top-4 right-4 px-4 py-2 rounded-2xl bg-white border border-surface-200">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-surface-900">{selectedDocument.slots} SLOTS</span>
                    </div>
                  </div>
                  {selectedDocument.flavor && (
                    <p className="text-sm italic text-surface-400 font-serif px-6 text-center">
                      {selectedDocument.flavor}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-500 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">유효 기간</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-medium text-surface-900">{selectedDocument.expiryDate}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-500 mb-2">
                      <RefreshCcw className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">남은 횟수</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-medium text-surface-900">{selectedDocument.remainingUses}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-500 mb-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">적용 효과</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-medium text-surface-900">
                        {selectedDocument.effect}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cairn RPG 스타일의 경고 문구 */}
                {(selectedDocument.type === 'VIOLATION' || selectedDocument.type === 'CURSE') && (
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-200 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-surface-600 shrink-0" />
                    <p className="text-xs text-surface-700 leading-relaxed font-medium">
                      이 서류는 당신의 인벤토리를 오염시키고 있습니다. 
                      해당하는 페널티를 해결하기 전까지는 슬롯을 반환받을 수 없습니다.
                    </p>
                  </div>
                )}
              </div>

              <SheetFooter className="px-8 pb-8 pt-0 flex-col gap-3">
                {selectedDocument.price ? (
                  <button 
                    onClick={() => handleBuyDocument(selectedDocument)}
                    disabled={(profile?.balance || 0) < selectedDocument.price}
                    className={`w-full rounded-[24px] py-4 text-base font-medium active:scale-[0.98] flex items-center justify-center gap-2 ${
                      (profile?.balance || 0) >= selectedDocument.price
                        ? 'bg-surface-800 text-white'
                        : 'bg-surface-100 text-surface-500 cursor-not-allowed'
                    }`}
                  >
                    {(profile?.balance || 0) >= selectedDocument.price ? `${selectedDocument.price.toLocaleString()}원에 구매` : <span className="text-red-600">잔액 부족</span>}
                  </button>
                ) : (
                  <button 
                    onClick={() => setSelectedDocument(null)}
                    className="w-full rounded-[24px] py-4 text-base font-medium bg-surface-800 text-white active:scale-[0.98]"
                  >
                    확인
                  </button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <DocumentHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <InsuranceHelpModal isOpen={isInsuranceHelpOpen} onClose={() => setIsInsuranceHelpOpen(false)} />

      {/* 보험 상세 정보 바텀시트 */}
      <Sheet open={!!selectedInsurance} onOpenChange={(open) => !open && setSelectedInsurance(null)}>
        <SheetContent className="p-0">
          {selectedInsurance && (
            <>
              <SheetHeader className="px-8 pt-8 pb-0">
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-2xl font-medium text-surface-900">{selectedInsurance.name}</SheetTitle>
                  <span className="px-2 py-0.5 rounded-lg bg-surface-100 text-[10px] font-medium text-surface-600 uppercase tracking-widest">
                    {selectedInsurance.type}
                  </span>
                </div>
                <SheetDescription className="text-sm text-surface-600 mt-1 leading-relaxed font-medium">
                  {selectedInsurance.description}
                </SheetDescription>
              </SheetHeader>

              <div className="px-8 py-6 space-y-8">
                {/* 시각적 표현 */}
                <div className={`relative h-48 w-full rounded-[32px] flex flex-col items-center justify-center overflow-hidden ${selectedInsurance.bgColor}`}>
                  <selectedInsurance.icon className={`h-24 w-24 ${selectedInsurance.color} mb-4`} />
                  {selectedInsurance.flavor && (
                    <p className="text-sm italic text-surface-400 font-serif px-6 text-center">
                      {selectedInsurance.flavor}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-500 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">유효 기간</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-medium text-surface-900">{selectedInsurance.expiryDate}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-500 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">부작용</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-medium text-surface-700">{selectedInsurance.sideEffect}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-500 mb-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">보장 효과</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-medium text-surface-900">
                        {selectedInsurance.effect}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="px-8 pb-8 pt-0 flex-col gap-3">
                {selectedInsurance.price ? (
                  <button 
                    onClick={() => handleBuyInsurance(selectedInsurance)}
                    disabled={(profile?.balance || 0) < selectedInsurance.price}
                    className={`w-full rounded-[24px] py-4 text-base font-medium active:scale-[0.98] flex items-center justify-center gap-2 ${
                      (profile?.balance || 0) >= selectedInsurance.price
                        ? 'bg-surface-800 text-white'
                        : 'bg-surface-100 text-surface-500 cursor-not-allowed'
                    }`}
                  >
                    {(profile?.balance || 0) >= selectedInsurance.price ? `${selectedInsurance.price.toLocaleString()}원에 구매` : <span className="text-red-600">잔액 부족</span>}
                  </button>
                ) : (
                  <button 
                    onClick={() => setSelectedInsurance(null)}
                    className="w-full rounded-[24px] py-4 text-base font-medium bg-surface-800 text-white active:scale-[0.98]"
                  >
                    확인
                  </button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
