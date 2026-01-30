import { X, Shield, Activity, HeartPulse, ShieldAlert } from 'lucide-react';

export const InsuranceHelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-900/60">
      <div className="w-full max-w-md bg-white rounded-2xl border border-surface-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="text-lg font-medium text-surface-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-surface-600" />
            보험(항상성) 가이드
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg">
            <X className="h-5 w-5 text-surface-500" />
          </button>
        </div>
        
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          <section className="space-y-3">
            <h4 className="text-sm font-medium text-surface-900 flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-surface-600" />
              시스템 항상성 (Homeostasis)
            </h4>
            <p className="text-xs text-surface-600 leading-relaxed">
              보험은 단순한 비용 보전이 아닙니다. 치명적인 사고 발생 시 시스템이 멈추지 않도록 유지하는 항상성 장치입니다.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-surface-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-surface-600" />
              트레이드오프 (Trade-off)
            </h4>
            <p className="text-xs text-surface-600 leading-relaxed">
              모든 보험은 시스템에 부하를 줍니다. <span className="text-surface-900 font-medium">속도 저하</span>, <span className="text-surface-900 font-medium">내구도 소모 증가</span> 등의 부작용을 고려하여 전략적으로 선택하세요.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-surface-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-surface-600" />
              보장 범위
            </h4>
            <div className="space-y-2.5">
              <div className="flex gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-surface-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-surface-800">즉시 보전</p>
                  <p className="text-xs text-surface-600 leading-relaxed">사고 발생 즉시 손실액의 일부를 차단합니다.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-surface-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-surface-800">지연 회복</p>
                  <p className="text-xs text-surface-600 leading-relaxed">당장의 충격은 받되, 이후 운행을 통해 서서히 보상받습니다.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-4 bg-surface-50 border-t border-surface-100">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white border border-surface-200 text-surface-700 rounded-xl text-sm font-medium"
          >
            이해했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
