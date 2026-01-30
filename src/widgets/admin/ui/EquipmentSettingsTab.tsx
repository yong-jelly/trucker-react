import { useState } from 'react';
import { Edit2, Check, X, Info, DollarSign, Gauge, Package, Zap, Loader2 } from 'lucide-react';
import type { Equipment } from '../../../entities/equipment';
import { getEquipmentThumbnailPath } from '../../../entities/equipment';

interface EquipmentSettingsTabProps {
  equipments: Equipment[];
  isLoading: boolean;
  onUpdateEquipment: (params: {
    id: string;
    name?: string;
    description?: string;
    price?: number;
    baseSpeed?: number;
    maxSpeed?: number;
    maxWeight?: number;
    maxVolume?: number;
    allowedCategories?: string[];
    isDefault?: boolean;
    isActive?: boolean;
  }) => Promise<void>;
}

export const EquipmentSettingsTab = ({ 
  equipments, 
  isLoading,
  onUpdateEquipment,
}: EquipmentSettingsTabProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Equipment>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (eq: Equipment) => {
    setEditingId(eq.id);
    setEditForm({
      name: eq.name,
      description: eq.description || '',
      price: eq.price,
      baseSpeed: eq.baseSpeed,
      maxSpeed: eq.maxSpeed,
      maxWeight: eq.maxWeight,
      maxVolume: eq.maxVolume,
      isDefault: eq.isDefault,
      isActive: eq.isActive,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      await onUpdateEquipment({
        id,
        name: editForm.name,
        description: editForm.description || undefined,
        price: editForm.price,
        baseSpeed: editForm.baseSpeed,
        maxSpeed: editForm.maxSpeed,
        maxWeight: editForm.maxWeight,
        maxVolume: editForm.maxVolume,
        isDefault: editForm.isDefault,
        isActive: editForm.isActive,
      });
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to save equipment:', error);
      alert('장비 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* 안내 */}
      <div className="bg-primary-50 border-y border-primary-100 p-6 flex gap-4 px-4">
        <Info className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-primary-900">장비 관리 안내</h3>
          <ul className="text-xs text-primary-700 leading-relaxed list-disc pl-4">
            <li><strong>ID는 변경 불가</strong>: 유저 보유 장비와 계약에서 참조하므로 변경할 수 없습니다.</li>
            <li><strong>진행 중인 계약에 영향 없음</strong>: 설정 변경은 새로운 계약에만 적용됩니다.</li>
            <li><strong>기본 속도</strong>: 일반 운행 시 적용되는 속도입니다.</li>
            <li><strong>최대 속도</strong>: 부스트 사용 시 적용되는 속도입니다.</li>
          </ul>
        </div>
      </div>

      {/* 장비 목록 */}
      <div className="space-y-0">
        <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-y border-surface-100">
          <h3 className="text-base font-medium text-surface-900">
            등록된 장비 ({equipments.length}개)
          </h3>
        </div>

        <div className="space-y-0 px-4">
          {equipments.map((eq) => {
            const isEditing = editingId === eq.id;

            return (
              <div 
                key={eq.id}
                className={`relative bg-white p-6 border-b border-surface-100 transition-all ${
                  isEditing ? 'bg-primary-50/30' : ''
                } ${!eq.isActive ? 'opacity-60' : ''}`}
              >
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden border border-surface-100" style={{ backgroundColor: '#F6F6EC' }}>
                      <img 
                        src={getEquipmentThumbnailPath(eq.imageFilename)} 
                        alt={eq.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full text-primary-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg></div>';
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-surface-400 bg-surface-50 px-1.5 py-0.5 rounded">
                          {eq.id}
                        </span>
                        {eq.isDefault && (
                          <span className="text-[10px] font-medium text-accent-emerald bg-accent-emerald/10 px-1.5 py-0.5 rounded">
                            기본 지급
                          </span>
                        )}
                        {!eq.isActive && (
                          <span className="text-[10px] font-medium text-accent-rose bg-accent-rose/10 px-1.5 py-0.5 rounded">
                            비활성
                          </span>
                        )}
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="text-lg font-medium text-surface-900 border-b border-primary-300 bg-transparent focus:outline-none w-full"
                        />
                      ) : (
                        <h4 className="text-lg font-medium text-surface-900">{eq.name}</h4>
                      )}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="p-2 rounded-xl hover:bg-surface-100 text-surface-400"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleSave(eq.id)}
                        disabled={isSaving}
                        className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(eq)}
                      className="p-2 rounded-xl hover:bg-surface-50 text-surface-400"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* 설명 */}
                {isEditing ? (
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="장비 설명을 입력하세요"
                    className="w-full text-sm text-surface-600 border border-surface-100 rounded-xl p-3 mb-6 focus:outline-none focus:border-primary-300"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm text-surface-500 mb-6 leading-relaxed">{eq.description || '설명 없음'}</p>
                )}

                {/* 속성 그리드 */}
                <div className="grid grid-cols-2 gap-4">
                  {/* 가격 */}
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-400 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">가격</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.price || 0}
                        onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                        className="w-full text-base font-medium text-surface-900 bg-white border border-surface-200 rounded-lg px-2 py-1"
                      />
                    ) : (
                      <p className="text-base font-medium text-surface-900">${eq.price.toLocaleString()}</p>
                    )}
                  </div>

                  {/* 기본 속도 */}
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-400 mb-2">
                      <Gauge className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">기본 속도</span>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editForm.baseSpeed || 0}
                          onChange={(e) => setEditForm({ ...editForm, baseSpeed: Number(e.target.value) })}
                          className="w-full text-base font-medium text-surface-900 bg-white border border-surface-200 rounded-lg px-2 py-1"
                        />
                        <span className="text-xs text-surface-400">km/h</span>
                      </div>
                    ) : (
                      <p className="text-base font-medium text-surface-900">{eq.baseSpeed} km/h</p>
                    )}
                  </div>

                  {/* 최대 속도 (부스트) */}
                  <div className="rounded-2xl bg-accent-amber/5 p-4 border border-accent-amber/10">
                    <div className="flex items-center gap-2 text-accent-amber mb-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">최대 속도</span>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editForm.maxSpeed || 0}
                          onChange={(e) => setEditForm({ ...editForm, maxSpeed: Number(e.target.value) })}
                          className="w-full text-base font-medium text-surface-900 bg-white border border-surface-200 rounded-lg px-2 py-1"
                        />
                        <span className="text-xs text-surface-400">km/h</span>
                      </div>
                    ) : (
                      <p className="text-base font-medium text-surface-900">{eq.maxSpeed} km/h</p>
                    )}
                  </div>

                  {/* 적재량 */}
                  <div className="rounded-2xl bg-surface-50 p-4 border border-surface-100">
                    <div className="flex items-center gap-2 text-surface-400 mb-2">
                      <Package className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">적재량</span>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editForm.maxWeight || 0}
                          onChange={(e) => setEditForm({ ...editForm, maxWeight: Number(e.target.value) })}
                          className="w-full text-base font-medium text-surface-900 bg-white border border-surface-200 rounded-lg px-2 py-1"
                        />
                        <span className="text-xs text-surface-400">kg</span>
                      </div>
                    ) : (
                      <p className="text-base font-medium text-surface-900">{eq.maxWeight} kg</p>
                    )}
                  </div>
                </div>

                {/* 토글 옵션 (편집 모드에서만) */}
                {isEditing && (
                  <div className="mt-6 pt-6 border-t border-surface-100 flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isDefault || false}
                        onChange={(e) => setEditForm({ ...editForm, isDefault: e.target.checked })}
                        className="w-5 h-5 rounded-lg border-surface-200 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-surface-700">신규 유저 기본 지급</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isActive || false}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        className="w-5 h-5 rounded-lg border-surface-200 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-surface-700">활성화</span>
                    </label>
                  </div>
                )}

                {/* 허용 카테고리 */}
                <div className="mt-6 pt-6 border-t border-surface-100">
                  <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-3">허용 카테고리</p>
                  <div className="flex flex-wrap gap-2">
                    {eq.allowedCategories.map((cat) => (
                      <span 
                        key={cat}
                        className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
