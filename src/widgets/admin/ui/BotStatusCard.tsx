import { Bot, Clock, Play } from 'lucide-react';
import { useNavigate } from 'react-router';
import { type BotStatus } from '../../../entities/admin/api.ts';
import { getTimeDiff } from '../../../shared/lib/date';

interface BotStatusCardProps {
  bot: BotStatus;
  onTrigger?: () => void;
  isTriggering?: boolean;
}

export const BotStatusCard = ({ bot, onTrigger, isTriggering }: BotStatusCardProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERING': return 'bg-emerald-500 text-white';
      case 'RESTING': return 'bg-surface-500 text-white';
      default: return 'bg-amber-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERING': return '운행 중';
      case 'RESTING': return getRestTimeDisplay(bot.nextAvailableAt || 0);
      default: return '휴식 중';
    }
  };

  const getRestTimeDisplay = (nextAvailableAt: number) => {
    const { totalHours, minutes, seconds } = getTimeDiff(nextAvailableAt);
    if (totalHours >= 1) return `${totalHours}시간 후 복귀`;
    if (minutes > 0) return `${minutes}분 ${seconds}초 후 복귀`;
    return `${seconds}초 후 복귀`;
  };

  const handleCardClick = () => {
    navigate(`/p/status/${bot.botId}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="relative bg-white p-4 border-b border-surface-100 cursor-pointer transition-all active:scale-[0.98]"
    >
      {/* 상태 표시 뱃지 */}
      <div className={`absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${getStatusColor(bot.status)}`}>
        {bot.status === 'RESTING' ? <Clock className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
        {getStatusText(bot.status)}
      </div>

      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-surface-50 overflow-hidden flex items-center justify-center border border-surface-100" style={{ backgroundColor: '#F6F6EC' }}>
          {bot.avatarUrl ? (
            <img 
              src={bot.avatarUrl} 
              alt={bot.nickname} 
              className="h-full w-full object-cover" 
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Bot className="h-6 w-6 text-surface-400" />
          )}
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <p className="text-base font-medium text-surface-900 truncate">{bot.nickname}</p>
          <p className="text-xs text-surface-500 mt-0.5">배송 전문가 · {bot.totalDeliveries}회 완료</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        {bot.status === 'IDLE' && onTrigger && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrigger();
            }}
            disabled={isTriggering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 text-surface-700 text-[10px] font-medium hover:bg-surface-200 transition-colors disabled:opacity-50"
          >
            {isTriggering ? <div className="h-3 w-3 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
            활동 트리거
          </button>
        )}
      </div>
    </div>
  );
};
