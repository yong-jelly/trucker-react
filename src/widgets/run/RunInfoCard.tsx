import { Package, ChevronUp } from 'lucide-react';

interface RunInfoCardProps {
  title: string;
  cargoName: string;
  distance: number;
  equipmentName: string;
  onOpenDetail: () => void;
  extraInfo?: string;
}

export const RunInfoCard = ({
  title,
  cargoName,
  distance,
  equipmentName,
  onOpenDetail,
  extraInfo
}: RunInfoCardProps) => {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 bg-white/95 backdrop-blur-md border-t border-surface-100 rounded-t-[32px] shadow-soft-lg px-6 py-4 pb-8">
      <div className="mx-auto max-w-2xl">
        <button 
          onClick={onOpenDetail}
          className="w-full flex items-center gap-4 group active:scale-[0.98] transition-all"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 group-hover:bg-primary-100 transition-colors">
            <Package className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-surface-900 truncate group-hover:text-primary-600 transition-colors">
                {title}
              </h3>
              <div className="h-4 w-4 rounded-full bg-surface-100 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                <ChevronUp className="h-3 w-3 text-surface-400 group-hover:text-primary-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-surface-500 mt-0.5">
              {cargoName} · {distance}km · {equipmentName}
              {extraInfo && ` · ${extraInfo}`}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
