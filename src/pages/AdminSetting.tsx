import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { 
  ArrowLeft, Save, Bot, ShieldAlert, Loader2, Bike 
} from 'lucide-react';
import * as adminApi from '../entities/admin/api.ts';
import { BotStatusCard } from '../widgets/admin/ui/BotStatusCard';
import { BotSettingsTab } from '../widgets/admin/ui/BotSettingsTab';
import { EnforcementSettingsTab } from '../widgets/admin/ui/EnforcementSettingsTab';
import { EquipmentSettingsTab } from '../widgets/admin/ui/EquipmentSettingsTab';
import { useAllEquipmentsAdmin, updateEquipment, type Equipment } from '../entities/equipment';

type TabType = 'bot' | 'enforcement' | 'equipment';

export const AdminSettingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL 파라미터에서 탭 읽기 (기본값: bot)
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const activeTab: TabType = tabFromUrl && ['bot', 'enforcement', 'equipment'].includes(tabFromUrl) 
    ? tabFromUrl 
    : 'bot';
  
  const setActiveTab = (tab: TabType) => {
    setSearchParams({ tab });
  };
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // 장비 목록 조회 (관리자용)
  const { data: equipments = [], isLoading: isEquipmentsLoading, refetch: refetchEquipments } = useAllEquipmentsAdmin();
  
  // 원본 설정 상태 (변경 감지용)
  const [originalSettings, setOriginalSettings] = useState<Map<string, any>>(new Map());
  
  // 봇 설정 상태
  const [botSettings, setBotSettings] = useState({
    restMinMinutes: 10,
    restMaxMinutes: 60,
    acceptProbability: 0.5,
  });

  // 단속 설정 상태
  const [enforcementSettings, setEnforcementSettings] = useState({
    baseEnforcementRate: 10,
    speedingEnforcementMultiplier: 3.5,
    baseFineAmount: 500,
    fineMultiplierPerKm: 50,
    evasionSuccessRate: 40,
    enforcementBypassPenalty: 15,
    maxEnforcementCount: 1,
    enforcementCheckProbability: 0.25,
    enforcementFineRate: 0.1,
  });

  // 봇 상태 목록
  const [botStatuses, setBotStatuses] = useState<adminApi.BotStatus[]>([]);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [configs, bots] = await Promise.all([
          adminApi.getAllAdminConfigs(),
          adminApi.getBotStatuses()
        ]);

        // 설정값 매핑
        const configMap = new Map(configs.map(c => [c.key, c.value]));
        setOriginalSettings(configMap);
        
        setBotSettings({
          restMinMinutes: Number(configMap.get('bot_rest_min_minutes') || 10),
          restMaxMinutes: Number(configMap.get('bot_rest_max_minutes') || 60),
          acceptProbability: Number(configMap.get('bot_accept_probability') || 0.5),
        });

        setEnforcementSettings({
          baseEnforcementRate: Number(configMap.get('enforcement_base_rate') || 10),
          speedingEnforcementMultiplier: Number(configMap.get('enforcement_speeding_multiplier') || 3.5),
          baseFineAmount: Number(configMap.get('enforcement_base_fine') || 500),
          fineMultiplierPerKm: Number(configMap.get('enforcement_fine_per_km') || 50),
          evasionSuccessRate: Number(configMap.get('enforcement_evasion_rate') || 40),
          enforcementBypassPenalty: Number(configMap.get('enforcement_bypass_penalty') || 15),
          maxEnforcementCount: Number(configMap.get('enforcement_max_count') || 1),
          enforcementCheckProbability: Number(configMap.get('enforcement_check_probability') || 0.25),
          enforcementFineRate: Number(configMap.get('enforcement_fine_rate') || 0.1),
        });

        setBotStatuses(bots);
      } catch (error) {
        console.error('Failed to load admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: Promise<void>[] = [];
      
      // 현재 UI 상의 설정값들을 키-값 쌍으로 정리
      const currentSettings: Record<string, any> = {
        'bot_rest_min_minutes': botSettings.restMinMinutes,
        'bot_rest_max_minutes': botSettings.restMaxMinutes,
        'bot_accept_probability': botSettings.acceptProbability,
        'enforcement_base_rate': enforcementSettings.baseEnforcementRate,
        'enforcement_speeding_multiplier': enforcementSettings.speedingEnforcementMultiplier,
        'enforcement_base_fine': enforcementSettings.baseFineAmount,
        'enforcement_fine_per_km': enforcementSettings.fineMultiplierPerKm,
        'enforcement_evasion_rate': enforcementSettings.evasionSuccessRate,
        'enforcement_bypass_penalty': enforcementSettings.enforcementBypassPenalty,
        'enforcement_max_count': enforcementSettings.maxEnforcementCount,
        'enforcement_check_probability': enforcementSettings.enforcementCheckProbability,
        'enforcement_fine_rate': enforcementSettings.enforcementFineRate,
      };

      // 변경된 항목만 추출하여 업데이트 큐에 추가
      Object.entries(currentSettings).forEach(([key, value]) => {
        if (originalSettings.get(key) !== value) {
          updates.push(adminApi.setAdminConfig(key, value));
        }
      });

      if (updates.length > 0) {
        await Promise.all(updates);
        
        // 원본 상태 업데이트 (다음 저장을 위해)
        const newOriginal = new Map(originalSettings);
        Object.entries(currentSettings).forEach(([key, value]) => {
          newOriginal.set(key, value);
        });
        setOriginalSettings(newOriginal);
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetBots = async () => {
    if (!confirm('정말로 모든 봇 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    setIsResetting(true);
    try {
      await adminApi.resetBotSystem();
      // 상태 새로고침
      const bots = await adminApi.getBotStatuses();
      setBotStatuses(bots);
      alert('봇 시스템이 초기화되었습니다.');
    } catch (error) {
      console.error('Failed to reset bots:', error);
      alert('봇 초기화 중 오류가 발생했습니다.');
    } finally {
      setIsResetting(false);
    }
  };

  // 장비 업데이트 핸들러
  const handleUpdateEquipment = async (params: Parameters<typeof updateEquipment>[0]) => {
    await updateEquipment(params);
    refetchEquipments();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-12">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-surface-900 px-4 py-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium uppercase tracking-tighter">System Admin</h1>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
            isSaved 
              ? 'bg-accent-emerald' 
              : 'bg-primary-600 hover:bg-primary-700'
          } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaved ? '저장됨!' : '저장'}
        </button>
      </header>

      {/* 탭 네비게이션 */}
      <div className="sticky top-[72px] z-40 bg-surface-50 px-4 pt-4 pb-2">
        <div className="flex p-1 bg-white rounded-xl border border-surface-200 shadow-sm">
          <button
            onClick={() => setActiveTab('bot')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'bot' 
                ? 'bg-surface-900 text-white shadow-sm' 
                : 'text-surface-500 hover:bg-surface-50'
            }`}
          >
            <Bot className="h-4 w-4" />
            봇
          </button>
          <button
            onClick={() => setActiveTab('enforcement')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'enforcement' 
                ? 'bg-surface-900 text-white shadow-sm' 
                : 'text-surface-500 hover:bg-surface-50'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            단속
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'equipment' 
                ? 'bg-surface-900 text-white shadow-sm' 
                : 'text-surface-500 hover:bg-surface-50'
            }`}
          >
            <Bike className="h-4 w-4" />
            장비
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-4 space-y-6">
        {/* 봇 설정 탭 */}
        {activeTab === 'bot' && (
          <BotSettingsTab 
            botSettings={botSettings}
            setBotSettings={setBotSettings}
            botStatuses={botStatuses}
            isResetting={isResetting}
            handleResetBots={handleResetBots}
            renderBotCard={(bot) => <BotStatusCard key={bot.botId} bot={bot} />}
          />
        )}

        {/* 단속 설정 탭 */}
        {activeTab === 'enforcement' && (
          <EnforcementSettingsTab 
            enforcementSettings={enforcementSettings}
            setEnforcementSettings={setEnforcementSettings}
          />
        )}

        {/* 장비 설정 탭 */}
        {activeTab === 'equipment' && (
          <EquipmentSettingsTab 
            equipments={equipments}
            isLoading={isEquipmentsLoading}
            onUpdateEquipment={handleUpdateEquipment}
          />
        )}
      </div>
    </div>
  );
};
