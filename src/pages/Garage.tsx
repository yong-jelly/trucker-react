import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Package, Wrench, Shield, FileText, ArrowLeft, Lock, Info, ChevronRight, PlayCircle, Clock } from 'lucide-react';
import { useGameStore } from '../app/store';
import { COMING_SOON_ITEMS } from '../shared/lib/constants';
import { Assets } from '../shared/assets';
import type { Item, Run, Order } from '../shared/api/types';

export const GaragePage = () => {
  const navigate = useNavigate();
  const { profile, currentRuns, availableOrders, slots } = useGameStore();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // 현재 운행 중인 정보 매핑
  const runningInfo = useMemo(() => {
    return currentRuns.map(run => {
      const order = availableOrders.find(o => o.id === run.orderId);
      const slot = slots.find(s => s.id === run.slotId);
      return { run, order, slot };
    }).filter(info => info.run.status === 'IN_TRANSIT');
  }, [currentRuns, availableOrders, slots]);

  const categories = [
    { id: 'EQUIPMENT', label: '장비', icon: Wrench, color: 'text-accent-blue', char: Assets.images.characters.mechanic },
    { id: 'DOCUMENT', label: '서류', icon: FileText, color: 'text-accent-amber', char: Assets.images.characters.driver },
    { id: 'INSURANCE', label: '보험', icon: Shield, color: 'text-accent-rose', char: Assets.images.characters.trucker },
  ];

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-4 shadow-soft-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-50"
          >
            <ArrowLeft className="h-5 w-5 text-surface-700" />
          </button>
          <h1 className="text-xl font-bold text-surface-900">창고 및 상점</h1>
        </div>
        <div className="rounded-full bg-primary-50 px-4 py-1.5 border border-primary-100">
          <span className="text-sm font-bold text-primary-600">${profile.balance.toLocaleString()}</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4 space-y-8">
        {/* 실시간 운행 상태 섹션 */}
        {runningInfo.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-black text-surface-900 flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary-500" />
                실시간 운행 정보
              </h2>
              <span className="text-[10px] font-bold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full animate-pulse">
                ON AIR
              </span>
            </div>
            
            <div className="grid gap-3">
              {runningInfo.map(({ run, order, slot }) => (
                <button
                  key={run.id}
                  onClick={() => navigate(`/run/${run.id}`)}
                  className="group relative overflow-hidden rounded-3xl bg-white p-5 shadow-soft-md border border-primary-100 transition-all hover:border-primary-300 active:scale-[0.98]"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Package className="h-16 w-16" />
                  </div>
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-surface-900 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-tighter">
                          Slot {slot?.index !== undefined ? slot.index + 1 : '-'}
                        </span>
                        <h3 className="text-sm font-black text-surface-900">{order?.title || '알 수 없는 화물'}</h3>
                      </div>
                      <p className="text-xs text-surface-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        운행 시작: {new Date(run.startAt).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">현재 보상</p>
                      <p className="text-lg font-black text-primary-600">${run.currentReward.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-surface-100 overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 transition-all duration-1000" 
                        style={{ width: '45%' }} // 실제 진행률 계산 로직 필요
                      />
                    </div>
                    <span className="text-[10px] font-bold text-surface-400">45%</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 캐릭터 가이드 섹션 */}
        <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-soft-md border border-surface-100">
          <div className="flex items-center gap-6">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-surface-50">
              <img 
                src={Assets.images.characters.mechanic} 
                alt="정비사" 
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">차고 마스터</span>
              <h2 className="text-xl font-black text-surface-900 mt-1">"장비 점검은 필수라고!"</h2>
              <p className="text-sm text-surface-500 mt-2 leading-relaxed">
                안녕! 난 이곳의 정비를 책임지는 마스터야. 
                자전거부터 비행기까지, 네가 벌어온 돈으로 최고의 장비를 맞춰줄게.
              </p>
            </div>
          </div>
        </section>

        {/* 카테고리 탭 */}
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-soft-sm border border-surface-100 transition-all hover:border-primary-200">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-surface-50 ${cat.color}`}>
                <cat.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-surface-700">{cat.label}</span>
            </div>
          ))}
        </div>

        {/* 현재 보유 중인 아이템 (기본) */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-surface-900 px-1">보유 중인 기본 장비</h2>
          <div className="overflow-hidden rounded-3xl bg-white shadow-soft-md border border-surface-100">
            <div className="relative h-48 w-full bg-surface-50 p-4 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20" />
              <img 
                src={Assets.images.basicBicycle} 
                alt="기본 배달 자전거" 
                className="relative z-0 h-full w-full object-contain drop-shadow-xl transform -scale-x-100" 
              />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-surface-900">기본 배달 자전거</h3>
                  <p className="text-xs font-medium text-primary-600 mt-0.5">1티어 · 기본 장비</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                  <Package className="h-5 w-5 text-primary-500" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-surface-50 p-2 text-center">
                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">적재</p>
                  <p className="text-sm font-black text-surface-900">8kg</p>
                </div>
                <div className="rounded-xl bg-surface-50 p-2 text-center">
                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">부피</p>
                  <p className="text-sm font-black text-surface-900">10L</p>
                </div>
                <div className="rounded-xl bg-surface-50 p-2 text-center">
                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">속도</p>
                  <p className="text-sm font-black text-surface-900">15km/h</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 준비중 아이템 리스트 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-surface-900">신규 아이템 (준비중)</h2>
            <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Coming Soon</span>
          </div>
          
          <div className="grid gap-3">
            {COMING_SOON_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group flex items-center justify-between rounded-2xl bg-white p-4 text-left shadow-soft-sm border border-surface-100 transition-all hover:border-primary-200 active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-50 text-surface-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                    {item.type === 'EQUIPMENT' && <Wrench className="h-5 w-5" />}
                    {item.type === 'DOCUMENT' && <FileText className="h-5 w-5" />}
                    {item.type === 'INSURANCE' && <Shield className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-surface-900">{item.name}</h3>
                    <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-surface-300 group-hover:text-primary-400" />
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* 아이템 상세 바텀시트 모달 (단순 구현) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedItem(null)}>
          <div 
            className="w-full max-w-lg rounded-t-[32px] bg-white p-8 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-surface-200" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                {selectedItem.type === 'EQUIPMENT' && <Wrench className="h-8 w-8" />}
                {selectedItem.type === 'DOCUMENT' && <FileText className="h-8 w-8" />}
                {selectedItem.type === 'INSURANCE' && <Shield className="h-8 w-8" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-surface-900">{selectedItem.name}</h2>
                  <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-bold text-surface-500">준비중</span>
                </div>
                <p className="text-sm font-medium text-primary-600 mt-1">{selectedItem.effectDescription}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-surface-50 p-5">
                <h4 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-2">아이템 설명</h4>
                <p className="text-sm text-surface-700 leading-relaxed">{selectedItem.description}</p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50/30 p-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
                <div>
                  <p className="text-sm font-bold text-surface-900">업데이트 예정</p>
                  <p className="mt-1 text-xs text-surface-600 leading-relaxed">
                    이 아이템은 다음 업데이트에서 실제 구매 및 장착이 가능해집니다. 
                    현재는 설명만 확인하실 수 있습니다.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedItem(null)}
                className="w-full rounded-2xl bg-surface-900 py-4 text-base font-bold text-white shadow-soft-lg active:scale-[0.98] transition-all"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
