import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Users, UserPlus, DollarSign, Info, AlertCircle } from 'lucide-react';
import { Assets } from '../shared/assets';
import { useUserProfile } from '../entities/user';

type DriverType = 'NPC' | 'USER';

interface DriverOffer {
  id: string;
  name: string;
  avatar: string;
  baseCommission: number;
  attempts: number;
}

export const HireDriverPage = () => {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState<DriverType>('NPC');
  
  // NPC 드라이버 오퍼 상태
  const [offer, setOffer] = useState<DriverOffer>({
    id: 'npc-1',
    name: 'Jack "The Wheel" Anderson',
    avatar: Assets.images.characters.driver,
    baseCommission: 25,
    attempts: 0,
  });

  const [, setIsHired] = useState(false);

  const handleNegotiate = () => {
    if (offer.attempts < 2) {
      // 새로운 수수료 랜덤 생성 (15~40%)
      const newRate = Math.floor(Math.random() * (40 - 15 + 1)) + 15;
      setOffer({ ...offer, baseCommission: newRate, attempts: offer.attempts + 1 });
    } else {
      // 3번째는 강제 고용 단계
      alert('마지막 제안입니다. 수락 시 고용이 완료됩니다.');
      setOffer({ ...offer, attempts: 3 });
    }
  };

  const handleHire = () => {
    const deposit = (1000 + 500) * 1.1; // 예시 계산
    if (!profile || profile.balance < deposit) {
      alert('예치금이 부족합니다.');
      return;
    }
    setIsHired(true);
    alert(`${offer.name} 드라이버가 고용되었습니다!`);
    navigate('/garage');
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-12">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-4 shadow-soft-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-50"
          >
            <ArrowLeft className="h-5 w-5 text-surface-700" />
          </button>
          <h1 className="text-xl font-medium text-surface-900">드라이버 고용</h1>
        </div>
        <div className="rounded-full bg-primary-50 px-4 py-1.5 border border-primary-100">
          <span className="text-sm font-medium text-primary-600">
            ${profile?.balance.toLocaleString() ?? '0'}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4 space-y-6">
        {/* 탭 네비게이션 */}
        <div className="flex rounded-2xl bg-white p-1 shadow-soft-sm border border-surface-100">
          <button
            onClick={() => setActiveTab('NPC')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'NPC' ? 'bg-primary-600 text-white shadow-soft-md' : 'text-surface-500 hover:bg-surface-50'
            }`}
          >
            <Users className="h-4 w-4" />
            NPC 드라이버
          </button>
          <button
            onClick={() => setActiveTab('USER')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'USER' ? 'bg-primary-600 text-white shadow-soft-md' : 'text-surface-500 hover:bg-surface-50'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            유저 드라이버
          </button>
        </div>

        {activeTab === 'NPC' ? (
          <div className="space-y-6">
            {/* 드라이버 카드 */}
            <div className="rounded-3xl bg-white p-8 shadow-soft-lg border border-surface-100 text-center">
              <div className="mx-auto h-32 w-32 rounded-full bg-surface-50 p-1 border-4 border-primary-100 overflow-hidden mb-4">
                <img src={offer.avatar} alt="드라이버" className="h-full w-full object-cover rounded-full" />
              </div>
              <h2 className="text-xl font-medium text-surface-900">{offer.name}</h2>
              <p className="text-sm text-surface-500 mt-1">전문 물류 전문가</p>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-surface-50 p-4">
                  <p className="text-[10px] font-medium text-surface-400 uppercase mb-1">제안 수수료</p>
                  <p className="text-2xl font-medium text-primary-600">{offer.baseCommission}%</p>
                </div>
                <div className="rounded-2xl bg-surface-50 p-4">
                  <p className="text-[10px] font-medium text-surface-400 uppercase mb-1">협상 기회</p>
                  <p className="text-2xl font-medium text-surface-900">{3 - offer.attempts}/3</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {offer.attempts < 3 ? (
                  <button 
                    onClick={handleNegotiate}
                    className="w-full py-4 rounded-2xl bg-white border-2 border-primary-600 text-primary-600 font-medium text-base hover:bg-primary-50 transition-all active:scale-95"
                  >
                    수수료 재협상하기
                  </button>
                ) : (
                  <div className="py-2 px-4 rounded-xl bg-accent-amber/10 text-accent-amber text-xs font-medium flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    더 이상의 협상은 불가능합니다.
                  </div>
                )}
                <button 
                  onClick={handleHire}
                  className="w-full py-4 rounded-2xl bg-primary-600 text-white font-medium text-base shadow-soft-lg hover:bg-primary-700 transition-all active:scale-95"
                >
                  이 조건으로 고용하기
                </button>
              </div>
            </div>

            {/* 예치금 안내 */}
            <div className="rounded-2xl bg-surface-900 p-6 text-white space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary-400" />
                <h3 className="text-sm font-medium">고용 예치금 상세</h3>
              </div>
              <div className="space-y-2 text-xs text-surface-300">
                <div className="flex justify-between">
                  <span>최대 예상 수수료 적립</span>
                  <span className="text-white font-medium">$1,000</span>
                </div>
                <div className="flex justify-between">
                  <span>의무 기간 내 해고 위약금</span>
                  <span className="text-white font-medium">$500</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-primary-400 font-medium">합계 (10% 버퍼 포함)</span>
                  <span className="text-primary-400 font-medium text-sm">$1,650</span>
                </div>
              </div>
              <p className="text-[10px] text-surface-400 leading-relaxed">
                * 예치금은 의무 운행(10회) 종료 후 해고 시 5%의 행정 수수료를 제외하고 환불됩니다.
              </p>
            </div>
          </div>
        ) : (
          /* 유저 드라이버 (Coming Soon) */
          <div className="space-y-4">
            <div className="rounded-3xl bg-white p-12 shadow-soft-md border border-surface-100 text-center border-dashed">
              <div className="mx-auto h-20 w-20 rounded-full bg-surface-50 flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-surface-200" />
              </div>
              <h2 className="text-lg font-medium text-surface-900">유저 드라이버 마켓</h2>
              <p className="text-sm text-surface-500 mt-2">
                다른 유저가 생성한 개성 넘치는 드라이버를<br/>고용할 수 있는 기능이 곧 추가됩니다!
              </p>
              <div className="mt-6 inline-block rounded-full bg-primary-50 px-4 py-1 text-[10px] font-medium text-primary-600 uppercase tracking-widest">
                Coming Soon
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-surface-100 space-y-3">
              <h3 className="text-sm font-medium text-surface-900 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary-500" />
                유저 드라이버란?
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                유저는 자신만의 드라이버 캐릭터를 생성하여 마켓에 등록할 수 있습니다. 
                다른 유저가 내 드라이버를 고용하여 운행을 마치면, 설정한 수수료(기본 30%)의 일부를 수익으로 얻게 됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
