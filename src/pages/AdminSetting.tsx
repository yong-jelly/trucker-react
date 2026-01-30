import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { 
  Loader2
} from 'lucide-react';
import { TextButton } from '@/shared/ui/TextButton';
import * as adminApi from '../entities/admin/api.ts';
import * as leaderboardApi from '../entities/leaderboard/api.ts';
import { BotStatusCard } from '../widgets/admin/ui/BotStatusCard';
import { BotSettingsTab } from '../widgets/admin/ui/BotSettingsTab';
import { EnforcementSettingsTab } from '../widgets/admin/ui/EnforcementSettingsTab';
import { EquipmentSettingsTab } from '../widgets/admin/ui/EquipmentSettingsTab';
import { useAllEquipmentsAdmin, updateEquipment } from '../entities/equipment';

import { PageHeader } from '../shared/ui/PageHeader';

type TabType = 'bot' | 'enforcement' | 'equipment';

export const AdminSettingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
    isAggressiveMode: false,
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
  const [isTriggering, setIsTriggering] = useState(false);

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
          isAggressiveMode: configMap.get('bot_aggressive_mode') === true,
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
        'bot_aggressive_mode': botSettings.isAggressiveMode,
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

  const handleTriggerBots = async () => {
    setIsTriggering(true);
    try {
      await leaderboardApi.triggerBotActivities();
      const bots = await adminApi.getBotStatuses();
      setBotStatuses(bots);
    } catch (error: any) {
      console.error('Failed to trigger bots:', error);
      alert('봇 활동 트리거 중 오류가 발생했습니다.');
    } finally {
      setIsTriggering(false);
    }
  };

  // 탭 변경 시 스크롤 최상단 이동
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeTab]);

  // 장비 업데이트 핸들러
  const handleUpdateEquipment = async (params: Parameters<typeof updateEquipment>[0]) => {
    await updateEquipment(params);
    refetchEquipments();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PageHeader 
        title="시스템 관리"
        tabs={[
          { id: 'bot', label: '봇 설정' },
          { id: 'enforcement', label: '단속 설정' },
          { id: 'equipment', label: '장비 설정' },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        onBack={() => navigate('/')}
        rightElement={
          <TextButton 
            onClick={handleSave}
            disabled={isSaving}
            variant={isSaved ? 'success' : 'primary'}
            className="text-base"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {isSaved ? '저장됨!' : '저장'}
          </TextButton>
        }
      />

      <main className="flex-1 w-full max-w-lg mx-auto pt-32 pb-32 bg-white">
        {/* 봇 설정 탭 */}
        {activeTab === 'bot' && (
          <BotSettingsTab 
            botSettings={botSettings}
            setBotSettings={setBotSettings}
            botStatuses={botStatuses}
            isResetting={isResetting}
            handleResetBots={handleResetBots}
            renderBotCard={(bot) => (
              <BotStatusCard 
                key={bot.botId} 
                bot={bot} 
                onTrigger={handleTriggerBots}
                isTriggering={isTriggering}
              />
            )}
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
      </main>
    </div>
  );
};
