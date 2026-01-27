import { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, Marker as MapboxMarker, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useParams, useNavigate } from 'react-router';
import { Map as MapIcon, List, ArrowLeft, MoreHorizontal, MapPin, TrendingUp, Zap } from 'lucide-react';
import { MOCK_ORDERS, MAPBOX_TOKEN } from '../shared/lib/mockData';
import { RunSheet } from '../widgets/run/RunSheet';
import { useGameStore } from '../app/store';

type ViewMode = 'map' | 'info';

export const ActiveRunPage = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { addEventLog } = useGameStore();
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [routeData, setRouteData] = useState<any>(null);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [isSpeeding, setIsOverSpeed] = useState(false);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [distanceCovered, setDistanceCovered] = useState(0);
  const [fuel, setFuel] = useState(100);
  const mapRef = useRef<MapRef>(null);

  // 임시로 첫 번째 오더 사용
  const order = MOCK_ORDERS.find(o => o.id === runId) || MOCK_ORDERS[0];
  const etaSeconds = order.limitTimeMinutes * 60;
  
  // 실제 도로 거리
  const totalDistanceKm = order.distance;
  
  // 기본 속도 및 과속 설정
  const fuelPenaltyMultiplier = fuel <= 0 ? 0.2 : 1.0; // 연료 고갈 시 80% 감속
  const baseSpeedKmh = (totalDistanceKm / (etaSeconds / 3600)) * fuelPenaltyMultiplier;
  const maxSpeedKmh = baseSpeedKmh * 1.5; // 최대 1.5배 과속 가능
  const acceleration = 0.5; // 초당 가속도

  // 현재 진행률 계산
  const progress = Math.min((distanceCovered / totalDistanceKm) * 100, 100);
  
  // 거리 정보 계산
  const distanceRemaining = (totalDistanceKm - distanceCovered).toFixed(2);
  
  // 현재 속도 기준 도착 예상 시간 (ETA)
  const estimatedRemainingSeconds = currentSpeedKmh > 0 
    ? (parseFloat(distanceRemaining) / currentSpeedKmh) * 3600 
    : 0;

  // Mapbox 라우팅 데이터 가져오기 및 초기 위치 설정
  useEffect(() => {
    const fetchRoute = async () => {
      // 대륙간 운송은 도로 라우팅을 건너뛰고 바로 직선 경로 생성
      if (order.category === 'INTERNATIONAL') {
        const fallbackGeometry = {
          type: 'LineString',
          coordinates: [
            [order.startPoint[1], order.startPoint[0]],
            [order.endPoint[1], order.endPoint[0]]
          ]
        };
        setRouteData(fallbackGeometry);
        setCurrentPos(order.startPoint);
        
        if (mapRef.current) {
          mapRef.current.fitBounds(
            [[order.startPoint[1], order.startPoint[0]], [order.endPoint[1], order.endPoint[0]]],
            { padding: 100, duration: 1000 }
          );
        }
        return;
      }

      try {
        const profile = order.category === 'HEAVY_DUTY' ? 'driving' : 'cycling';
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${profile}/${order.startPoint[1]},${order.startPoint[0]};${order.endPoint[1]},${order.endPoint[0]}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`,
          { method: 'GET' }
        );
        const json = await query.json();
        const data = json.routes[0];
        setRouteData(data.geometry);
        setCurrentPos(order.startPoint);

        // 경로에 맞춰 지도 줌 조정
        if (mapRef.current) {
          const coordinates = data.geometry.coordinates;
          const lats = coordinates.map((c: number[]) => c[1]);
          const lngs = coordinates.map((c: number[]) => c[0]);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          mapRef.current.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            { padding: 100, duration: 1000 }
          );
        }
      } catch (error) {
        console.error('라우팅 실패, 직선으로 대체:', error);
        setRouteData({
          type: 'LineString',
          coordinates: [[order.startPoint[1], order.startPoint[0]], [order.endPoint[1], order.endPoint[0]]]
        });
      }
    };

    fetchRoute();
  }, [order]);

  // 실시간 속도, 거리, 시간 업데이트 및 단속/연료 로직
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
      
      // 연료 소모 로직
      setFuel(prev => {
        if (progress >= 100) return prev;
        const consumption = isSpeeding ? 0.15 : 0.05; // 과속 시 3배 소모
        return Math.max(0, prev - consumption);
      });

      // 가속/감속 로직
      setCurrentSpeedKmh(prev => {
        const targetSpeed = isSpeeding ? maxSpeedKmh : baseSpeedKmh;
        if (prev < targetSpeed) return Math.min(prev + acceleration, targetSpeed);
        if (prev > targetSpeed) return Math.max(prev - acceleration, targetSpeed);
        return prev;
      });

      // 이동 거리 누적 (속도 기반)
      setDistanceCovered(prev => {
        const distancePerSecond = currentSpeedKmh / 3600;
        return Math.min(prev + distancePerSecond, totalDistanceKm);
      });

      // 단속 로직 (매 15초마다 확률 체크)
      if (elapsedSeconds > 0 && elapsedSeconds % 15 === 0 && progress < 100) {
        const baseProb = 0.05; // 기본 5%
        const multiplier = isSpeeding ? 4 : 1; // 과속 시 4배 (20%)
        
        if (Math.random() < (baseProb * multiplier)) {
          // 단속 이벤트 발생 시뮬레이션
          const choices = ['DOCUMENT', 'BYPASS', 'EVASION'];
          const choice = choices[Math.floor(Math.random() * choices.length)];
          
          let title = '';
          let description = '';
          let amount = 0;
          let etaChange = 0;
          let type: any = 'SYSTEM';

          if (choice === 'DOCUMENT') {
            title = '단속 회피 성공 (서류 제시)';
            description = '필수 서류 확인 완료. 무사 통과.';
            etaChange = 300; // 5분 지연
          } else if (choice === 'BYPASS') {
            title = '단속 회피 성공 (우회)';
            description = '경찰을 피해 우회로 진입.';
            etaChange = 720; // 12분 지연
          } else {
            const isCaught = Math.random() > 0.4; // 60% 확률로 단속됨
            if (isCaught) {
              title = '과속 단속됨 (돌파 실패)';
              description = '벌금 부과 및 평판 하락.';
              amount = -1200;
              type = 'PENALTY';
            } else {
              title = '단속 돌파 성공';
              description = '경찰의 추격을 따돌림.';
              amount = 0;
              type = 'BONUS';
            }
          }
          
          addEventLog(runId || 'temp', {
            id: `enforcement-${elapsedSeconds}`,
            runId: runId || 'temp',
            type: type,
            title: title,
            description: description,
            amount: amount,
            etaChangeSeconds: etaChange,
            isEstimated: false,
            timestamp: Date.now(),
          });
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isSpeeding, baseSpeedKmh, maxSpeedKmh, currentSpeedKmh, totalDistanceKm, elapsedSeconds, progress, runId, addEventLog]);

  // 경로 위의 현재 위치 계산 (progress에 따라)
  useEffect(() => {
    if (!routeData || !routeData.coordinates) return;
    
    const coords = routeData.coordinates;
    const pointIndex = Math.floor((coords.length - 1) * (progress / 100));
    const nextPointIndex = Math.min(pointIndex + 1, coords.length - 1);
    
    // 두 점 사이의 보간 (Interpolation)
    const segmentProgress = ((progress / 100) * (coords.length - 1)) - pointIndex;
    const currentLng = coords[pointIndex][0] + (coords[nextPointIndex][0] - coords[pointIndex][0]) * segmentProgress;
    const currentLat = coords[pointIndex][1] + (coords[nextPointIndex][1] - coords[pointIndex][1]) * segmentProgress;
    
    setCurrentPos([currentLat, currentLng]);
  }, [progress, routeData]);

  const formatDuration = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d.toLocaleString()}일`);
    if (h > 0) parts.push(`${h.toLocaleString()}시간`);
    if (m > 0) parts.push(`${m.toLocaleString()}분`);
    parts.push(`${s.toLocaleString()}초`);

    return parts.join(' ');
  };

  const remainingSeconds = Math.max(etaSeconds - elapsedSeconds, 0);
  const isOvertime = elapsedSeconds > etaSeconds;

  // 도착 예정 시각 (현재 시각 + 남은 예상 초)
  const arrivalTime = new Date(Date.now() + estimatedRemainingSeconds * 1000);
  const formatArrivalTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const geojson = useMemo(() => ({
    type: 'Feature',
    properties: {},
    geometry: routeData
  }), [routeData]);

  const handleComplete = () => {
    const finalReward = isOvertime 
      ? Math.max(order.baseReward * 0.5, order.baseReward - Math.floor((elapsedSeconds - etaSeconds) / 60) * 0.2) 
      : order.baseReward;
    
    navigate('/settlement', { 
      state: { 
        order, 
        elapsedSeconds, 
        finalReward, 
        penalty: order.baseReward - finalReward 
      } 
    });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-surface-50">
      {/* 상단 헤더 */}
      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-md px-4 py-3 border-b border-surface-100 shadow-soft-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')} 
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-surface-700" />
          </button>
          <div className="flex flex-col">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-tight">운행 중</p>
            <p className="text-sm font-black text-surface-900 leading-tight">{order.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 뷰 모드 토글 (헤더로 이동) */}
          <div className="flex rounded-lg bg-surface-100 p-0.5">
            <button
              onClick={() => setViewMode('map')}
              className={`flex h-8 px-3 items-center justify-center rounded-md text-xs font-bold transition-all ${
                viewMode === 'map' ? 'bg-white text-primary-600 shadow-soft-xs' : 'text-surface-500'
              }`}
            >
              <MapIcon className="mr-1.5 h-3.5 w-3.5" />
              지도
            </button>
            <button
              onClick={() => setViewMode('info')}
              className={`flex h-8 px-3 items-center justify-center rounded-md text-xs font-bold transition-all ${
                viewMode === 'info' ? 'bg-white text-primary-600 shadow-soft-xs' : 'text-surface-500'
              }`}
            >
              <List className="mr-1.5 h-3.5 w-3.5" />
              정보
            </button>
          </div>
          <button 
            onClick={handleComplete}
            className="flex h-9 items-center justify-center rounded-xl bg-primary-600 px-4 text-xs font-bold text-white shadow-soft-sm hover:bg-primary-700 active:scale-95 transition-all"
          >
            도착
          </button>
        </div>
      </header>

      {/* 대시보드 (상태 바) */}
      <div className="absolute left-0 right-0 top-[60px] z-20 bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-surface-100/50 shadow-soft-xs">
        <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-surface-400 uppercase tracking-widest text-center">남은 시간</span>
            <span className={`text-base font-black tabular-nums ${isOvertime ? 'text-accent-rose' : 'text-surface-900'}`}>
              {isOvertime ? '지연 ' : ''}{formatDuration(isOvertime ? elapsedSeconds - etaSeconds : remainingSeconds)}
            </span>
          </div>
          
          <div className="flex flex-col items-center flex-1 max-w-[120px]">
            <span className="text-[9px] font-black text-surface-400 uppercase tracking-widest mb-1">현재 속도</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-primary-600 leading-none tabular-nums">{currentSpeedKmh.toFixed(1)}</span>
              <span className="text-[10px] font-bold text-surface-400">km/h</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-surface-400 uppercase tracking-widest text-center">예상 보상</span>
            <span className={`text-base font-black tabular-nums ${isOvertime ? 'text-accent-rose' : 'text-primary-600'}`}>
              ${isOvertime ? Math.max(order.baseReward * 0.5, order.baseReward - Math.floor((elapsedSeconds - etaSeconds) / 60) * 0.2).toFixed(2) : order.baseReward.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 하단 프로그레스 & 거리 정보 */}
        <div className="mx-auto max-w-2xl mt-2 flex items-center gap-3">
          <span className="text-[10px] font-bold text-primary-500 whitespace-nowrap">{distanceCovered.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}km</span>
          <div className="relative flex-1 h-1.5 rounded-full bg-surface-200/50 overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full transition-all duration-1000 ${isSpeeding ? 'bg-accent-rose' : 'bg-primary-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-surface-400 whitespace-nowrap">-{distanceRemaining.toLocaleString()}km</span>
        </div>
        
        {/* 도착 예정 시각 & 연료 정보 */}
        <div className="mx-auto max-w-2xl mt-1 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">연료</span>
            <div className="w-24 h-1.5 bg-surface-100 rounded-full overflow-hidden border border-surface-200">
              <div 
                className={`h-full transition-all duration-500 ${fuel > 20 ? 'bg-accent-amber' : 'bg-accent-rose animate-pulse'}`}
                style={{ width: `${fuel}%` }}
              />
            </div>
            <span className={`text-[10px] font-black tabular-nums ${fuel > 20 ? 'text-surface-600' : 'text-accent-rose'}`}>
              {Math.ceil(fuel)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">도착 예정:</span>
            <span className="text-[10px] font-black text-primary-600">{formatArrivalTime(arrivalTime)}</span>
          </div>
        </div>
      </div>

      {/* 과속 및 연료 버튼 (우측 하단) */}
      <div className="absolute right-4 bottom-80 z-40 flex flex-col items-center gap-3">
        <div className={`text-[10px] font-black px-2 py-0.5 rounded bg-white shadow-soft-sm border border-surface-100 transition-opacity duration-300 ${isSpeeding ? 'opacity-100 text-accent-rose' : 'opacity-0'}`}>
          과속 운행 중
        </div>
        
        {/* 과속 버튼 */}
        <button
          onClick={() => setIsOverSpeed(!isSpeeding)}
          className={`flex h-16 w-16 items-center justify-center rounded-full shadow-soft-2xl transition-all active:scale-90 border-4 ${
            isSpeeding 
              ? 'bg-accent-rose text-white animate-pulse border-white shadow-accent-rose/40 scale-110' 
              : 'bg-white text-surface-400 hover:text-accent-rose border-surface-50'
          }`}
        >
          <div className="flex flex-col items-center">
            <TrendingUp className={`h-7 w-7 ${isSpeeding ? 'text-white' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-tighter mt-0.5">가속</span>
          </div>
        </button>

        {/* 연료 보충 버튼 */}
        <button
          onClick={() => setFuel(prev => Math.min(100, prev + 15))}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft-lg border border-surface-100 text-accent-amber hover:bg-accent-amber hover:text-white transition-all active:scale-95 group"
        >
          <div className="flex flex-col items-center">
            <Zap className="h-6 w-6 group-hover:animate-bounce" />
            <span className="text-[8px] font-black uppercase mt-0.5">보충</span>
          </div>
        </button>
      </div>

      {/* 메인 콘텐츠 영역 */}
      {viewMode === 'map' ? (
        <div className="h-full w-full pt-[130px]">
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: (order.startPoint[1] + order.endPoint[1]) / 2,
              latitude: (order.startPoint[0] + order.endPoint[0]) / 2,
              zoom: 15
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            <NavigationControl position="top-left" />
            
            {routeData && (
              <Source id="route" type="geojson" data={geojson as any}>
                <Layer
                  id="route"
                  type="line"
                  layout={{
                    'line-join': 'round',
                    'line-cap': 'round'
                  }}
                  paint={{
                    'line-color': '#6366f1',
                    'line-width': 4,
                    'line-opacity': 0.3 // 라우트 라인 연하게
                  }}
                />
              </Source>
            )}

            {/* 현재 위치 (반짝이는 점) */}
            {currentPos && (
              <MapboxMarker longitude={currentPos[1]} latitude={currentPos[0]}>
                <div className="relative flex h-6 w-6 items-center justify-center">
                  <div className="absolute h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></div>
                  <div className="relative h-3 w-3 rounded-full border-2 border-white bg-primary-600 shadow-sm"></div>
                </div>
              </MapboxMarker>
            )}

            <MapboxMarker longitude={order.startPoint[1]} latitude={order.startPoint[0]}>
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-white p-1 shadow-md">
                  <MapPin className="h-5 w-5 text-primary-500" />
                </div>
                <span className="mt-1 rounded bg-white px-1 text-[10px] font-bold shadow-sm">출발</span>
              </div>
            </MapboxMarker>

            <MapboxMarker longitude={order.endPoint[1]} latitude={order.endPoint[0]}>
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-white p-1 shadow-md">
                  <MapPin className="h-5 w-5 text-accent-emerald" />
                </div>
                <span className="mt-1 rounded bg-white px-1 text-[10px] font-bold shadow-sm">도착</span>
              </div>
            </MapboxMarker>
          </Map>
        </div>
      ) : (
        <div className="h-full overflow-y-auto pt-40 pb-72 px-4">
          <div className="mx-auto max-w-2xl space-y-4">
            {/* 경로 요약 */}
            <div className="rounded-2xl bg-white p-5 shadow-soft-sm">
              <h3 className="text-sm font-bold text-surface-900">경로 정보</h3>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">A</div>
                <div className="h-px flex-1 bg-surface-200" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-emerald/20 text-xs font-bold text-accent-emerald">B</div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-surface-500">
                <span>출발지</span>
                <span>{order.distance}km</span>
                <span>도착지</span>
              </div>
            </div>

            {/* 운행 세팅 */}
            <div className="rounded-2xl bg-white p-5 shadow-soft-sm">
              <h3 className="text-sm font-bold text-surface-900">적용된 세팅</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-500">서류</span>
                  <span className="font-medium text-surface-900">배송 확인서 (POD)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">장비</span>
                  <span className="font-medium text-surface-400">없음</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">보험</span>
                  <span className="font-medium text-surface-400">없음</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 하단 시트 */}
      <RunSheet 
        order={order} 
        elapsedSeconds={elapsedSeconds}
        etaSeconds={etaSeconds}
        runId={runId || 'temp'}
      />
    </div>
  );
};
