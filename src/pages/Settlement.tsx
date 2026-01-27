import { useNavigate, useLocation } from 'react-router';
import { CheckCircle2, Clock, DollarSign, MapPin, ChevronRight, Share2, Home, TrendingUp } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../shared/lib/mockData';
import { useEffect } from 'react';
import { useUserStore, useUserProfile } from '../entities/user';
import { sendNotification } from '../shared/lib/notification';

export const SettlementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserStore();
  const { refetch: refetchProfile } = useUserProfile();
  const { order, elapsedSeconds, finalReward, penalty } = location.state || {};

  // 정산 완료 시 알림 발송 및 프로필 갱신
  useEffect(() => {
    if (user && order && finalReward !== undefined) {
      // 1. 알림 발송
      sendNotification(user.id, {
        title: "🚚 운행 정산 완료",
        message: `[${order.cargoName || order.cargo_name}] 운행이 완료되었습니다.\n최종 정산 금액: $${finalReward.toFixed(2)}\n획득 평판: +${penalty > 0 ? 5 : 10}`,
        type: "success"
      });

      // 2. 프로필(잔액) 갱신
      refetchProfile();
    }
  }, [user, order, finalReward, penalty, refetchProfile]);

  // 데이터가 없는 경우 홈으로 리다이렉트
  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <button onClick={() => navigate('/')} className="text-primary-600 font-medium">홈으로 이동</button>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      {/* 성공 헤더 */}
      <div className="bg-white px-4 pt-12 pb-8 text-center shadow-soft-sm">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent-emerald/10">
          <CheckCircle2 className="h-10 w-10 text-accent-emerald" />
        </div>
        <h1 className="text-2xl font-medium text-surface-900">운행 완료!</h1>
        <p className="mt-2 text-surface-500">수고하셨습니다. 정산이 완료되었습니다.</p>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 p-4">
        {/* 최종 수익 카드 */}
        <div className="rounded-3xl bg-primary-600 p-8 text-center text-white shadow-soft-lg">
          <p className="text-sm font-medium opacity-80">최종 정산 금액</p>
          <h2 className="mt-2 text-5xl font-medium">${finalReward.toFixed(2)}</h2>
          <div className="mt-6 flex justify-center gap-4 border-t border-white/20 pt-6">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider opacity-70">기본 보상</p>
              <p className="text-lg font-medium">${order.baseReward}</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider opacity-70">패널티</p>
              <p className="text-lg font-medium text-accent-rose">-${penalty.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* 운행 요약 영수증 */}
        <div className="rounded-2xl bg-white p-6 shadow-soft-sm">
          <h3 className="text-base font-medium text-surface-900">운행 상세 영수증</h3>
          <div className="mt-6 space-y-4">
            <div className="flex justify-between border-b border-surface-50 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-50">
                  <Clock className="h-5 w-5 text-surface-400" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">총 운행 시간</p>
                  <p className="text-sm font-medium text-surface-900">{formatDuration(elapsedSeconds)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-surface-500">제한 시간</p>
                <p className="text-sm font-medium text-surface-900">{order.limitTimeMinutes}분</p>
              </div>
            </div>

            <div className="flex justify-between border-b border-surface-50 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-50">
                  <MapPin className="h-5 w-5 text-surface-400" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">운행 거리</p>
                  <p className="text-sm font-medium text-surface-900">{order.distance}km</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-surface-500">카테고리</p>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[order.category]}`}>
                  {CATEGORY_LABELS[order.category]}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-surface-500">기본 배송료</span>
                <span className="font-medium text-surface-900">${order.baseReward.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-surface-500">지각 패널티</span>
                <span className="font-medium text-accent-rose">-${penalty.toFixed(2)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-4">
                <span className="text-base font-medium text-surface-900">합계</span>
                <span className="text-xl font-medium text-primary-600">${finalReward.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 획득 평판 */}
        <div className="flex items-center justify-between rounded-2xl bg-accent-emerald/10 p-5 border border-accent-emerald/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
              <TrendingUp className="h-5 w-5 text-accent-emerald" />
            </div>
            <div>
              <p className="text-xs text-accent-emerald font-medium uppercase tracking-wider">획득 평판</p>
              <p className="text-lg font-medium text-surface-900">+{penalty > 0 ? 5 : 10}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-accent-emerald opacity-50" />
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-surface-100 bg-white p-4">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button 
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 text-surface-600 transition-colors hover:bg-surface-200"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-600 text-base font-medium text-white shadow-soft-md transition-colors hover:bg-primary-700 active:bg-primary-800"
          >
            <Home className="h-5 w-5" />
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
