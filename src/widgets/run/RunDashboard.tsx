import { Timer, Navigation } from 'lucide-react';
import { formatDuration } from '../../shared/lib/date';

interface RunDashboardProps {
  isCompleted: boolean;
  isCancelled: boolean;
  isOvertime: boolean;
  elapsedSeconds: number;
  etaSeconds: number;
  remainingSeconds: number;
  currentReward: number;
  progress: number;
  currentSpeedKmh?: number;
  isSpeeding?: boolean;
}

export const RunDashboard = ({
  isCompleted,
  isCancelled,
  isOvertime,
  elapsedSeconds,
  etaSeconds,
  remainingSeconds,
  currentReward,
  progress,
  currentSpeedKmh,
  isSpeeding
}: RunDashboardProps) => {
  return (
    <div className="fixed top-[73px] left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 bg-white/90 backdrop-blur-md px-4 py-2 border-b border-surface-100/50 shadow-soft-xs">
      <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
        <div className="flex flex-col items-center flex-1">
          <span className="text-[9px] font-bold text-surface-400 uppercase tracking-tight mb-0.5">
            {isCompleted ? '소요 시간' : isCancelled ? '취소 시각' : '남은 시간'}
          </span>
          <div className="flex items-center gap-1">
            <Timer className={`h-3 w-3 ${isOvertime && !isCompleted ? 'text-accent-rose' : 'text-surface-400'}`} />
            <span className={`text-sm font-bold tabular-nums ${isOvertime && !isCompleted ? 'text-accent-rose' : 'text-surface-900'}`}>
              {isCompleted 
                ? formatDuration(elapsedSeconds, true)
                : isCancelled 
                  ? '취소됨'
                  : isOvertime 
                    ? `지연 ${formatDuration(elapsedSeconds - etaSeconds, true)}`
                    : formatDuration(remainingSeconds, true)
              }
            </span>
          </div>
        </div>
        
        <div className="h-6 w-[1px] bg-surface-100" />

        <div className="flex flex-col items-center flex-1">
          {currentSpeedKmh !== undefined ? (
            <>
              <span className="text-[9px] font-bold text-surface-400 uppercase tracking-tight mb-0.5">현재 속도</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold text-primary-600 tabular-nums">{currentSpeedKmh.toFixed(1)}</span>
                <span className="text-[8px] font-bold text-surface-400 uppercase">km/h</span>
              </div>
            </>
          ) : (
            <>
              <span className="text-[9px] font-bold text-surface-400 uppercase tracking-tight mb-0.5">실시간 보상</span>
              <span className={`text-sm font-bold tabular-nums ${isOvertime && !isCompleted ? 'text-accent-rose' : 'text-primary-600'}`}>
                ${currentReward.toLocaleString()}
              </span>
            </>
          )}
        </div>

        <div className="h-6 w-[1px] bg-surface-100" />

        <div className="flex flex-col items-center flex-1">
          <span className="text-[9px] font-bold text-surface-400 uppercase tracking-tight mb-0.5">진행률</span>
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3 text-primary-500" />
            <span className="text-sm font-bold text-surface-900 tabular-nums">
              {progress.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* 프로그레스 바 (심플 버전) */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-surface-100">
        <div 
          className={`h-full transition-all duration-1000 ${
            isCompleted ? 'bg-emerald-500' : isSpeeding ? 'bg-accent-rose' : 'bg-primary-500'
          }`}
          style={{ width: `${isCompleted ? 100 : progress}%` }}
        />
      </div>
    </div>
  );
};
