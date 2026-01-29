import { Bot, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { type BotStatus } from '../../../entities/admin/api.ts';
import { getTimeDiff } from '../../../shared/lib/date';

interface BotStatusCardProps {
  bot: BotStatus;
}

export const BotStatusCard = ({ bot }: BotStatusCardProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERING': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'RESTING': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-surface-600 bg-surface-50 border-surface-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERING': return '운행 중';
      case 'RESTING': return '휴식 중';
      default: return '대기 중';
    }
  };

  const handleCardClick = () => {
    navigate(`/p/status/${bot.botId}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-2xl p-4 border border-surface-100 shadow-soft-sm flex items-center justify-between cursor-pointer hover:border-primary-200 transition-colors active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-surface-100 overflow-hidden flex items-center justify-center border border-surface-200">
          {bot.avatarUrl ? (
            <img src={bot.avatarUrl} alt={bot.nickname} className="h-full w-full object-cover" />
          ) : (
            <Bot className="h-5 w-5 text-surface-500" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-surface-900">{bot.nickname}</p>
          <p className="text-[10px] text-surface-400">완료: {bot.totalDeliveries}회</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-medium border ${getStatusColor(bot.status)}`}>
          {getStatusText(bot.status)}
        </span>
        {bot.status === 'RESTING' && bot.nextAvailableAt && (
          <p className="text-[10px] text-surface-400 mt-1 flex items-center justify-end gap-1">
            <Clock className="h-3 w-3" />
            {getTimeDiff(bot.nextAvailableAt).totalMinutes}분 남음
          </p>
        )}
      </div>
    </div>
  );
};
