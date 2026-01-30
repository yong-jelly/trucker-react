import { HelpCircle, X, FileText, AlertTriangle, Zap, Clock } from 'lucide-react';

export const DocumentHelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-900/60">
      <div className="w-full max-w-md bg-white rounded-2xl border border-surface-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="text-lg font-medium text-surface-900 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-surface-600" />
            서류 시스템 가이드
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg">
            <X className="h-5 w-5 text-surface-500" />
          </button>
        </div>
        
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          <section className="space-y-3">
            <h4 className="text-sm font-medium text-surface-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-surface-600" />
              서류와 슬롯
            </h4>
            <p className="text-xs text-surface-500 leading-relaxed">
              모든 서류는 물리적인 부피를 가집니다. 강력한 권한을 부여하는 서류일수록 더 많은 인벤토리 슬롯을 차지하며, 이는 화물을 실을 공간이 줄어듦을 의미합니다.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-surface-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-surface-600" />
              유효 기간 및 횟수
            </h4>
            <div className="space-y-2.5">
              <div className="flex gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-surface-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-surface-800">유효 기간</p>
                  <p className="text-xs text-surface-600 leading-relaxed">획득 시점부터 실제 시간이 흐름에 따라 만료됩니다. 만료된 서류는 효과가 사라지지만 슬롯은 여전히 차지할 수 있습니다.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-surface-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-surface-800">사용 횟수</p>
                  <p className="text-xs text-surface-600 leading-relaxed">특정 이벤트를 방어하거나 혜택을 받을 때마다 횟수가 차감됩니다. 모든 횟수를 소진하면 서류는 파기됩니다.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-surface-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-surface-600" />
              위반 및 저주
            </h4>
            <p className="text-xs text-surface-600 leading-relaxed">
              과속 딱지나 압류 통지서 같은 서류는 <span className="text-surface-900 font-medium">강제로 슬롯을 점유</span>하며, 벌금을 내거나 특정 조건을 만족하기 전까지는 버릴 수 없습니다.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-surface-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-surface-600" />
              전략적 활용
            </h4>
            <p className="text-xs text-surface-600 leading-relaxed">
              수익이 높은 위험물 운송을 위해 슬롯을 비워둘지, 아니면 단속을 피하기 위해 위조 통행증을 챙길지는 당신의 선택입니다.
            </p>
          </section>
        </div>

        <div className="p-4 bg-surface-50 border-t border-surface-100">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white border border-surface-200 text-surface-700 rounded-xl text-sm font-medium"
          >
            알겠습니다
          </button>
        </div>
      </div>
    </div>
  );
};
