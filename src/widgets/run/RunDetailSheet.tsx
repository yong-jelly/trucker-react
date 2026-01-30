import { useState } from 'react';
import { cn } from '@shared/lib/utils';
import { SettlementTab } from './tabs/SettlementTab';
import { OverviewTab } from './tabs/OverviewTab';
import { EventsTab } from './tabs/EventsTab';
import { SettingsTab } from './tabs/SettingsTab';
import {
  Sheet,
  SheetContent,
} from '@shared/ui/Sheet';

type TabType = 'settlement' | 'overview' | 'events' | 'settings';

// RunSheet에서 필요한 Order 속성만 정의
interface OrderInfo {
  title: string;
  category: string;
  cargoName: string;
  distance: number;
  baseReward: number;
  limitTimeMinutes: number;
  weight: number;
  endPoint: [number, number];
}

interface RunDetailSheetProps {
  order: OrderInfo;
  elapsedSeconds: number;
  etaSeconds: number;
  estimatedRemainingSeconds: number;
  runId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TABS = [
  { id: 'settlement' as const, label: '정산' },
  { id: 'overview' as const, label: '개요' },
  { id: 'events' as const, label: '이벤트' },
  { id: 'settings' as const, label: '세팅' },
];

export const RunDetailSheet = ({ 
  order, 
  elapsedSeconds, 
  etaSeconds, 
  estimatedRemainingSeconds, 
  runId,
  open = true,
  onOpenChange,
  className
}: RunDetailSheetProps & { className?: string }) => {
  const [activeTab, setActiveTab] = useState<TabType>('settlement');
  const [isFull, setIsFull] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        hideHandle
        className={cn(
          "bg-white border-t border-surface-100",
          isFull ? 'h-[92vh]' : 'h-[600px]',
          className
        )}
      >
        {/* 드래그 핸들 및 확장 버튼 */}
        <button 
          onClick={() => setIsFull(!isFull)}
          className="flex w-full flex-col items-center py-4 group"
        >
          <div className="h-1.5 w-12 rounded-full bg-surface-200" />
        </button>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-surface-100 px-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 flex-col items-center gap-1.5 py-4 text-[13px] font-medium relative ${
                  isActive 
                    ? 'text-surface-700' 
                    : 'text-surface-500'
                }`}
              >
                <span className="tracking-tight">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-surface-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* 탭 콘텐츠 */}
        <div 
          className="h-[calc(100%-110px)] overflow-y-auto px-6 py-5 scrollbar-hide"
          style={{ 
            willChange: 'scroll-position',
            WebkitOverflowScrolling: 'touch',
            transform: 'translateZ(0)',
          }}
        >
          {activeTab === 'settlement' && (
            <SettlementTab order={order} elapsedSeconds={elapsedSeconds} etaSeconds={etaSeconds} runId={runId} />
          )}
          {activeTab === 'overview' && (
            <OverviewTab 
              order={order} 
              elapsedSeconds={elapsedSeconds} 
              etaSeconds={etaSeconds} 
              remainingSeconds={estimatedRemainingSeconds} 
            />
          )}
          {activeTab === 'events' && (
            <EventsTab />
          )}
          {activeTab === 'settings' && (
            <SettingsTab runId={runId} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
