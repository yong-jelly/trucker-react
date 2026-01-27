import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Settings, ShieldAlert, DollarSign, Percent, Save, RefreshCcw } from 'lucide-react';

export const AdminSettingPage = () => {
  const navigate = useNavigate();
  
  // 관리자 설정 시뮬레이션 상태
  const [settings, setSettings] = useState({
    baseEnforcementRate: 10,
    speedingEnforcementMultiplier: 3.5,
    baseFineAmount: 500,
    fineMultiplierPerKm: 50,
    evasionSuccessRate: 40,
    bypassTimePenaltyMinutes: 15,
  });

  const handleSave = () => {
    alert('설정이 저장되었습니다. (관리자 전용)');
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-12">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-surface-900 px-4 py-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary-400" />
            <h1 className="text-lg font-black uppercase tracking-tighter">System Admin</h1>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold hover:bg-primary-700"
        >
          <Save className="h-4 w-4" />
          저장
        </button>
      </header>

      <div className="mx-auto max-w-2xl p-4 space-y-6">
        {/* 단속 확률 설정 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-accent-rose" />
              <h2 className="text-base font-bold text-surface-900">단속 알고리즘 설정</h2>
            </div>
            <button className="text-xs text-surface-400 flex items-center gap-1">
              <RefreshCcw className="h-3 w-3" /> 초기화
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-soft-md border border-surface-100 space-y-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-surface-700">기본 단속 발생 확률 (정속)</label>
                  <span className="text-sm font-black text-primary-600">{settings.baseEnforcementRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={settings.baseEnforcementRate}
                  onChange={(e) => setSettings({...settings, baseEnforcementRate: parseInt(e.target.value)})}
                  className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <p className="text-[10px] text-surface-400 mt-1">도로의 기본 감시 수준을 결정합니다.</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-surface-700">과속(Boost) 시 확률 가중치</label>
                  <span className="text-sm font-black text-accent-rose">x{settings.speedingEnforcementMultiplier}</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="10" step="0.1"
                  value={settings.speedingEnforcementMultiplier}
                  onChange={(e) => setSettings({...settings, speedingEnforcementMultiplier: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-accent-rose"
                />
                <p className="text-[10px] text-surface-400 mt-1">과속 시 기본 확률에 곱해지는 배율입니다. (현재: {Math.min(100, settings.baseEnforcementRate * settings.speedingEnforcementMultiplier).toFixed(1)}%)</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-surface-400 uppercase">야간 확률 보정</label>
                  <select className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-bold outline-none">
                    <option>낮음 (-5%)</option>
                    <option selected>보통 (0%)</option>
                    <option>높음 (+10%)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-surface-400 uppercase">지역 위험도</label>
                  <select className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-bold outline-none">
                    <option>안전 지역 (x0.5)</option>
                    <option selected>일반 지역 (x1.0)</option>
                    <option>우범 지역 (x2.0)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-50 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">기본 벌금 ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input 
                    type="number" 
                    value={settings.baseFineAmount}
                    onChange={(e) => setSettings({...settings, baseFineAmount: parseInt(e.target.value)})}
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 pl-9 pr-4 py-2.5 text-sm font-bold focus:border-primary-500 outline-none"
                  />
                </div>
                <p className="text-[10px] text-right text-surface-400 font-bold">${settings.baseFineAmount.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">돌파 성공 확률 (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input 
                    type="number" 
                    value={settings.evasionSuccessRate}
                    onChange={(e) => setSettings({...settings, evasionSuccessRate: parseInt(e.target.value)})}
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 pl-9 pr-4 py-2.5 text-sm font-bold focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 시스템 로그 시뮬레이션 (미리보기) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-surface-900">운행 로그 시뮬레이션</h2>
            <span className="text-[10px] font-medium text-surface-400">실제 운행 화면의 '정산' 탭에 표시될 형식</span>
          </div>
          <div className="rounded-2xl bg-surface-900 p-5 font-mono text-[11px] space-y-3 shadow-2xl border border-white/5">
            <div className="space-y-1">
              <p className="text-surface-500">[10:05:12] <span className="text-primary-400">SYSTEM</span> 운행 시작 (서울시청 → 종로5가)</p>
              <p className="text-surface-500">[10:08:45] <span className="text-accent-amber">EVENT</span> 단속 감지 (과속 주행 중)</p>
              <p className="text-white ml-4">└ <span className="text-surface-400">선택:</span> <span className="text-primary-400 font-bold underline">돌파(Evasion)</span></p>
              <p className="text-accent-rose ml-4">└ <span className="font-bold">단속됨!</span> 벌금 <span className="underline">-$1,200</span> 및 평판 하락</p>
            </div>
            
            <div className="h-px bg-surface-800" />
            
            <div className="space-y-1">
              <p className="text-surface-500">[10:15:20] <span className="text-accent-amber">EVENT</span> 단속 감지 (정속 주행 중)</p>
              <p className="text-white ml-4">└ <span className="text-surface-400">선택:</span> <span className="text-primary-400 font-bold underline">서류제시(Document)</span></p>
              <p className="text-accent-emerald ml-4">└ <span className="font-bold">성공!</span> 필수 서류 확인 완료 (무사 통과)</p>
            </div>

            <div className="h-px bg-surface-800" />

            <div className="space-y-1">
              <p className="text-surface-500">[10:22:10] <span className="text-accent-amber">EVENT</span> 단속 감지 (과속 주행 중)</p>
              <p className="text-white ml-4">└ <span className="text-surface-400">선택:</span> <span className="text-primary-400 font-bold underline">우회(Bypass)</span></p>
              <p className="text-accent-blue ml-4">└ <span className="font-bold">회피 성공!</span> 경로 우회 완료 (ETA +12분)</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
