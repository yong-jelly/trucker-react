import { FileText, Wrench, Shield, Lock, Info } from 'lucide-react';

export const SettingsTab = () => {
  return (
    <div className="space-y-4">
      {/* 안내 메시지 */}
      <div className="flex items-start gap-2 rounded-xl bg-surface-50 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-surface-400" />
        <p className="text-xs text-surface-500">
          운행 중에는 세팅을 변경할 수 없습니다. 다음 운행 시작 전에 변경해 주세요.
        </p>
      </div>

      {/* 현재 적용된 세팅 */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-surface-900">적용된 세팅</h4>

        {/* 서류 */}
        <div className="flex items-center justify-between rounded-xl border border-surface-200 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-amber/10">
              <FileText className="h-4 w-4 text-accent-amber" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-900">서류</p>
              <p className="text-xs text-surface-500">배송 확인서 (POD)</p>
            </div>
          </div>
          <Lock className="h-4 w-4 text-surface-300" />
        </div>

        {/* 장비 */}
        <div className="flex items-center justify-between rounded-xl border border-surface-200 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100">
              <Wrench className="h-4 w-4 text-surface-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-900">장비</p>
              <p className="text-xs text-surface-400">선택 안함</p>
            </div>
          </div>
          <Lock className="h-4 w-4 text-surface-300" />
        </div>

        {/* 보험 */}
        <div className="flex items-center justify-between rounded-xl border border-surface-200 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100">
              <Shield className="h-4 w-4 text-surface-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-900">보험</p>
              <p className="text-xs text-surface-400">선택 안함</p>
            </div>
          </div>
          <Lock className="h-4 w-4 text-surface-300" />
        </div>
      </div>

      {/* 프리셋 (준비중) */}
      <div className="rounded-xl border border-dashed border-surface-300 p-4">
        <div className="flex items-center gap-2">
          <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-500">준비중</span>
          <p className="text-sm font-medium text-surface-700">장비 프리셋</p>
        </div>
        <p className="mt-1 text-xs text-surface-500">
          자주 사용하는 세팅을 프리셋으로 저장하고 빠르게 적용하세요
        </p>
      </div>

      {/* 자동화 (준비중) */}
      <div className="rounded-xl border border-dashed border-surface-300 p-4">
        <div className="flex items-center gap-2">
          <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-500">준비중</span>
          <p className="text-sm font-medium text-surface-700">자동화 설정</p>
        </div>
        <p className="mt-1 text-xs text-surface-500">
          오토 드라이브, 오토 리페어 등 자동화 기능
        </p>
      </div>
    </div>
  );
};
