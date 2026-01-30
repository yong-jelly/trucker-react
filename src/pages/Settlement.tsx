import { useNavigate, useLocation, useParams } from 'react-router';
import { Check, AlertCircle, Home, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useUserStore, useUserProfile } from '../entities/user';
import { sendNotification } from '../shared/lib/notification';
import { PageHeader } from '../shared/ui/PageHeader';
import { getRunById, type RunDetail } from '../entities/run';
import { isValidUUID } from '../shared/lib/utils';
import { SettlementReceipt, SettlementDetails } from '../features/settlement/ui/SettlementComponents';

export const SettlementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { runId } = useParams();
  const { user } = useUserStore();
  const { refetch: refetchProfile } = useUserProfile();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);

  // 1. 초기 데이터 설정 (location.state 우선, 없으면 API 조회)
  const initialData = location.state;

  useEffect(() => {
    const loadData = async () => {
      // UUID 검증
      if (!runId || !isValidUUID(runId)) {
        setError({
          title: "잘못된 접근",
          message: "유효하지 않은 계약 번호입니다. 데이터 구조가 올바르지 않습니다."
        });
        return;
      }

      if (initialData?.order && initialData?.finalReward !== undefined) {
        // 이미 데이터가 있는 경우 (ActiveRun에서 넘어온 경우)
        return;
      }

      // 데이터가 없는 경우 API 조회 시도
      setIsLoading(true);
      try {
        const detail = await getRunById(runId); 
        if (!detail) {
          setError({
            title: "데이터 없음",
            message: "해당 계약 정보를 찾을 수 없거나 이미 만료된 정산 정보입니다."
          });
        } else if (detail.run.status !== 'COMPLETED' && detail.run.status !== 'IN_TRANSIT') {
          // IN_TRANSIT 상태여도 getRunById 내부에서 자동 완료 처리가 될 수 있으므로 허용
          setError({
            title: "정산 미완료",
            message: "아직 운행이 완료되지 않았습니다. 운행을 먼저 완료해주세요."
          });
        } else {
          setRunDetail(detail);
        }
      } catch (err) {
        setError({
          title: "조회 실패",
          message: "정산 정보를 불러오는 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요."
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [runId, initialData]);

  // 2. 정산 완료 시 알림 발송 및 프로필 갱신 (ActiveRun에서 넘어온 경우만)
  useEffect(() => {
    if (user && initialData?.order && initialData?.finalReward !== undefined) {
      // 알림 발송
      sendNotification(user.id, {
        title: "🚚 운행 정산 완료",
        message: `[${initialData.order.cargoName || initialData.order.cargo_name}] 운행이 완료되었습니다.\n최종 정산 금액: $${initialData.finalReward.toFixed(2)}\n획득 평판: +${initialData.penalty > 0 ? 5 : 10}`,
        type: "success"
      });
      
      // 프로필 갱신 (중복 호출 방지를 위해 refetchProfile 대신 queryClient.invalidateQueries 고려 가능하나, 
      // 여기서는 refetchProfile을 그대로 사용하되 의존성 배열을 확인)
      refetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, !!initialData]); // user.id와 initialData 존재 여부만 체크하여 불필요한 재실행 방지

  const formatDuration = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (d > 0) parts.push(`${d.toLocaleString()}일`);
    if (h > 0) parts.push(`${h.toLocaleString()}시간`);
    if (m > 0) parts.push(`${m.toLocaleString()}분`);
    parts.push(`${s.toLocaleString()}초`);
    return parts.join(' ');
  };

  // 렌더링용 데이터 구성
  const displayData = useMemo(() => {
    if (initialData?.order) {
      const startAt = initialData.order.startAt || Date.now() - (initialData.elapsedSeconds * 1000);
      return {
        order: initialData.order,
        finalReward: initialData.finalReward,
        penalty: initialData.penalty,
        elapsedSeconds: initialData.elapsedSeconds,
        lpReward: initialData.penalty > 0 ? 5 : 10,
        startAt: startAt,
        completedAt: startAt + (initialData.elapsedSeconds * 1000)
      };
    }
    if (runDetail) {
      const penalty = runDetail.run.accumulatedPenalty || 0;
      const completedAt = runDetail.run.completedAt || Date.now();
      return {
        order: runDetail.order,
        finalReward: runDetail.run.currentReward,
        penalty: penalty,
        elapsedSeconds: Math.floor((completedAt - runDetail.run.startAt) / 1000),
        lpReward: penalty > 0 ? 5 : 10,
        startAt: runDetail.run.startAt,
        completedAt: completedAt
      };
    }
    return null;
  }, [initialData, runDetail]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
        <p className="text-surface-500">정산 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 p-6 text-center">
        <div className="mb-6 rounded-full bg-accent-rose/10 p-4">
          <AlertCircle className="h-10 w-10 text-accent-rose" />
        </div>
        <h2 className="text-xl font-medium text-surface-900">{error.title}</h2>
        <p className="mt-2 text-sm text-surface-500 max-w-xs">{error.message}</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-medium text-white shadow-soft-md active:scale-95 transition-transform"
        >
          <Home className="h-4 w-4" />
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (!displayData) return null;

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <PageHeader 
        title="운행 정산"
        showBackButton={false}
        rightElement={
          <button 
            onClick={() => navigate('/')}
            className="flex h-10 items-center gap-1.5 px-4 rounded-full bg-primary-600 text-white text-sm font-medium shadow-soft-sm active:scale-95 transition-transform"
          >
            <Check className="h-4 w-4" />
            확인
          </button>
        }
      />

      <div className="flex-1 w-full max-w-md mx-auto pt-20 pb-10 px-5 space-y-4">
        {/* 성공 헤더 */}
        <div className="text-center py-2">
          <h1 className="text-2xl font-medium text-surface-900 tracking-tight">운행 완료</h1>
          <p className="mt-1 text-sm text-surface-500">정산 프로세스가 정상적으로 완료되었습니다</p>
        </div>

        <SettlementReceipt 
          finalReward={displayData.finalReward}
          baseReward={displayData.order.baseReward}
          penalty={displayData.penalty}
          lpReward={displayData.lpReward}
          orderId={displayData.order.id || runId || ''}
        />

        <SettlementDetails 
          orderTitle={displayData.order.title}
          duration={formatDuration(displayData.elapsedSeconds)}
          limitTimeMinutes={displayData.order.limitTimeMinutes}
          distance={displayData.order.distance}
          category={displayData.order.category}
          startAt={displayData.startAt}
          completedAt={displayData.completedAt}
        />
      </div>
    </div>
  );
};
