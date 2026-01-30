import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Map, { Source, Layer, Marker as MapboxMarker, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useParams, useNavigate } from 'react-router';
import { 
  MapPin, TrendingUp, Zap, Loader2, Bot, UserCircle, 
  Map as MapIcon, CircleCheckBig 
} from 'lucide-react';
import { MAPBOX_TOKEN } from '../shared/lib/mockData';
import { RunDetailSheet } from '../widgets/run/RunDetailSheet';
import { RunDashboard } from '../widgets/run/RunDashboard';
import { RunInfoCard } from '../widgets/run/RunInfoCard';
import { useGameStore } from '../app/store';
import { getRunById, completeRun, type RunDetail } from '../entities/run';
import { 
  getSpeedFromSnapshot, 
  applyFuelPenalty, 
  speedToKmPerSecond,
  interpolatePositionOnRoute,
  routeToGeoJSON,
  type RouteCoordinate
} from '../shared/lib/run';

import { PageHeader } from '../shared/ui/PageHeader';

type ViewMode = 'map' | 'info';

export const ActiveRunPage = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { addEventLog } = useGameStore();
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [isSpeeding, setIsOverSpeed] = useState(false);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [tick, setTick] = useState(0); // 실시간 갱신용
  const [traveledDistanceKm, setTraveledDistanceKm] = useState(0); // 실제 이동 거리 (누적)
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // DB에서 운행 데이터 로드
  const fetchRunDetail = useCallback(async () => {
    if (!runId) return;
    
    try {
      const detail = await getRunById(runId);
      if (detail) {
        if (detail.run.status !== 'IN_TRANSIT') {
          // 이미 완료된 경우 홈으로
          navigate('/');
          return;
        }
        setRunDetail(detail);
        setFuel(detail.run.currentDurability); // currentDurability를 연료로 사용
      }
    } catch (err) {
      console.error('Failed to fetch run detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [runId, navigate]);

  useEffect(() => {
    fetchRunDetail();
  }, [fetchRunDetail]);

  // 경과 시간 계산 (start_at 기준)
  const elapsedSeconds = useMemo(() => {
    if (!runDetail) return 0;
    return Math.floor((Date.now() - runDetail.run.startAt) / 1000);
  }, [runDetail, tick]);

  // 주문 및 ETA 정보
  const order = runDetail?.order;
  const etaSeconds = runDetail?.run.etaSeconds || 0;
  
  // 실제 도로 거리
  const totalDistanceKm = order?.distance || 0;
  
  // 장비 기반 속도 설정 (공통 함수 사용)
  const { baseSpeed: equipmentBaseSpeed, maxSpeed: equipmentMaxSpeed } = getSpeedFromSnapshot(
    runDetail?.run.equipmentSnapshot,
    runDetail?.run.selectedItems?.equipmentId || order?.requiredEquipmentType
  );
  
  // 연료 패널티 적용
  const baseSpeedKmh = applyFuelPenalty(equipmentBaseSpeed, fuel);
  const maxSpeedKmh = applyFuelPenalty(equipmentMaxSpeed, fuel);
  const acceleration = 2.0; // 초당 가속도 (빠르게 목표 속도 도달)

  // 실제 이동 거리 (속도 기반 누적) - 최대값은 총 거리로 제한
  const distanceCovered = Math.min(traveledDistanceKm, totalDistanceKm);

  // 현재 진행률 계산
  const progress = totalDistanceKm > 0 ? Math.min((distanceCovered / totalDistanceKm) * 100, 100) : 0;
  
  // 남은 거리 (숫자)
  const distanceRemainingNum = Math.max(totalDistanceKm - distanceCovered, 0);
  
  // 현재 속도 기준 도착 예상 시간 (ETA)
  const estimatedRemainingSeconds = useMemo(() => {
    return currentSpeedKmh > 0 
      ? (distanceRemainingNum / currentSpeedKmh) * 3600 
      : etaSeconds - elapsedSeconds;
  }, [distanceRemainingNum, currentSpeedKmh, etaSeconds, elapsedSeconds]);

  // 운행 데이터 로드 시 속도 및 초기 위치 설정
  useEffect(() => {
    if (runDetail && currentSpeedKmh === 0) {
      setCurrentSpeedKmh(baseSpeedKmh);
      
      // 페이지 새로고침 시: 경과 시간 기반으로 초기 이동 거리 추정
      // (기본 속도로 이동했다고 가정)
      if (traveledDistanceKm === 0 && elapsedSeconds > 0 && totalDistanceKm > 0) {
        const estimatedDistance = (baseSpeedKmh / 3600) * elapsedSeconds;
        setTraveledDistanceKm(Math.min(estimatedDistance, totalDistanceKm));
      }
    }
  }, [runDetail, baseSpeedKmh, currentSpeedKmh, elapsedSeconds, totalDistanceKm, traveledDistanceKm]);

  const isOvertime = elapsedSeconds > etaSeconds;
  const remainingSeconds = Math.max(etaSeconds - elapsedSeconds, 0);

  const handleComplete = useCallback(async () => {
    if (!order || !runId || isCompleting) return;
    
    setIsCompleting(true);
    const penaltyAmount = isOvertime 
      ? Math.floor(Math.max(order.baseReward * 0.5, Math.floor((elapsedSeconds - etaSeconds) / 60) * 0.2))
      : 0;
    const finalReward = order.baseReward - penaltyAmount;
    
    try {
      // DB에 완료 처리 및 보상 지급
      const result = await completeRun({
        runId,
        finalReward,
        penaltyAmount,
        elapsedSeconds
      });

      // 이미 완료된 경우 (cron에 의해 처리됨) 홈으로 부드럽게 이동
      if (result.alreadyCompleted) {
        navigate('/', { replace: true });
        return;
      }

      navigate(`/settlement/${runId}`, { 
        state: { 
          order, 
          elapsedSeconds, 
          finalReward, 
          penalty: penaltyAmount 
        } 
      });
    } catch (err) {
      console.error('Failed to complete run:', err);
      // 에러 발생 시에도 홈으로 부드럽게 이동 (반복 에러 방지)
      navigate('/', { replace: true });
    } finally {
      setIsCompleting(false);
    }
  }, [order, runId, isCompleting, isOvertime, elapsedSeconds, etaSeconds, navigate]);

  // Mapbox 라우팅 데이터 가져오기 및 초기 위치 설정
  useEffect(() => {
    if (!order) return;

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

  // 실시간 갱신 타이머 (1초마다 속도에 따라 거리 누적)
  useEffect(() => {
    if (!runDetail || runDetail.run.status !== 'IN_TRANSIT') return;

    const timer = setInterval(() => {
      // 이미 도착한 경우 타이머 중지 및 자동 완료 처리
      if (traveledDistanceKm >= totalDistanceKm && totalDistanceKm > 0) {
        clearInterval(timer);
        handleComplete();
        return;
      }

      setTick(prev => prev + 1);
      
      // 연료 소모 로직
      setFuel(prev => {
        if (traveledDistanceKm >= totalDistanceKm) return prev;
        const consumption = isSpeeding ? 0.15 : 0.05; // 과속 시 3배 소모
        return Math.max(0, prev - consumption);
      });

      // 가속/감속 로직 (먼저 속도 계산)
      setCurrentSpeedKmh(prev => {
        const targetSpeed = isSpeeding ? maxSpeedKmh : baseSpeedKmh;
        if (prev < targetSpeed) return Math.min(prev + acceleration, targetSpeed);
        if (prev > targetSpeed) return Math.max(prev - acceleration, targetSpeed);
        return prev;
      });

      // 실제 이동 거리 누적 (현재 속도 기반, 공통 함수 사용)
      setTraveledDistanceKm(prev => {
        if (prev >= totalDistanceKm) return prev;
        const distancePerSecond = speedToKmPerSecond(currentSpeedKmh);
        return Math.min(prev + distancePerSecond, totalDistanceKm);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [runDetail, isSpeeding, baseSpeedKmh, maxSpeedKmh, totalDistanceKm, traveledDistanceKm, currentSpeedKmh, runId, addEventLog, handleComplete]);

  // 경로 위의 현재 위치 계산 (공통 함수 사용)
  useEffect(() => {
    const pos = interpolatePositionOnRoute(routeData as RouteCoordinate, progress);
    if (pos) {
      setCurrentPos(pos);
    }
  }, [progress, routeData]);

  const geojson = useMemo(() => routeToGeoJSON(routeData), [routeData]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-surface-500">운행 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 운행 정보 없음
  if (!runDetail || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 p-4 text-center">
        <div className="mb-4 rounded-full bg-surface-100 p-4">
          <MapPin className="h-8 w-8 text-surface-400" />
        </div>
        <h2 className="text-lg font-medium text-surface-900">운행 정보를 찾을 수 없습니다</h2>
        <p className="mt-1 text-sm text-surface-500">이미 완료되었거나 존재하지 않는 운행입니다.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-6 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-soft-md"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-surface-50">
      <div className="mx-auto max-w-[480px] bg-white h-full relative shadow-2xl flex flex-col items-center">
        {/* 상단 헤더 */}
        <PageHeader 
          title={
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${
                runDetail.user.isBot ? 'bg-amber-100' : 'bg-primary-100'
              }`}>
                {runDetail.user.avatarUrl ? (
                  <img 
                    src={runDetail.user.avatarUrl} 
                    alt={runDetail.user.nickname} 
                    className="h-full w-full object-cover" 
                  />
                ) : runDetail.user.isBot ? (
                  <Bot className="h-5 w-5 text-amber-600" />
                ) : (
                  <UserCircle className="h-5 w-5 text-primary-600" />
                )}
              </div>
              <span className="text-lg font-medium text-surface-900 truncate">
                {runDetail.user.nickname}
              </span>
            </div>
          }
          rightElement={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'map' ? 'info' : 'map')}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  viewMode === 'map' 
                    ? 'bg-primary-50 text-primary-600 shadow-soft-sm' 
                    : 'bg-surface-50 text-surface-400 hover:bg-surface-100'
                }`}
              >
                <MapIcon className="h-5 w-5" />
              </button>

              <div className="h-6 w-[1px] bg-surface-100 mx-1" />

              <button
                onClick={() => setIsOverSpeed(!isSpeeding)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isSpeeding 
                    ? 'bg-accent-rose text-white animate-pulse shadow-accent-rose/20' 
                    : 'bg-surface-50 text-surface-400 hover:text-accent-rose'
                }`}
              >
                <TrendingUp className="h-5 w-5" />
              </button>

              <button
                onClick={() => setFuel(prev => Math.min(100, prev + 15))}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-50 text-accent-amber hover:bg-accent-amber hover:text-white transition-all"
              >
                <Zap className="h-5 w-5" />
              </button>

              <div className="h-6 w-[1px] bg-surface-100 mx-1" />
              
              <button 
                onClick={handleComplete}
                disabled={isCompleting}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-900 text-white shadow-soft-lg hover:bg-black active:scale-95 disabled:opacity-50"
              >
                {isCompleting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CircleCheckBig className="h-5 w-5" />
                )}
              </button>
            </div>
          }
        />

        {/* 대시보드 (상태 바) */}
        <RunDashboard 
          isCompleted={false}
          isCancelled={false}
          isOvertime={isOvertime}
          elapsedSeconds={elapsedSeconds}
          etaSeconds={etaSeconds}
          remainingSeconds={remainingSeconds}
          currentReward={order.baseReward}
          progress={progress}
          currentSpeedKmh={currentSpeedKmh}
          isSpeeding={isSpeeding}
        />

        {/* 메인 콘텐츠 영역 */}
        {viewMode === 'map' ? (
          <div className="h-full w-full pt-[120px] pb-[100px] relative">
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
              <div className="absolute right-4 bottom-4 z-10">
                <NavigationControl showCompass={false} />
              </div>
              
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
                  <span className="mt-1 rounded bg-white px-1 text-[10px] font-medium shadow-sm">출발</span>
                </div>
              </MapboxMarker>

              <MapboxMarker longitude={order.endPoint[1]} latitude={order.endPoint[0]}>
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-white p-1 shadow-md">
                    <MapPin className="h-5 w-5 text-accent-emerald" />
                  </div>
                  <span className="mt-1 rounded bg-white px-1 text-[10px] font-medium shadow-sm">도착</span>
                </div>
              </MapboxMarker>
            </Map>
          </div>
        ) : (
          <div 
            className="h-full overflow-y-auto pt-[120px] pb-[100px] px-4"
            style={{ 
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
              transform: 'translateZ(0)',
            }}
          >
            <div className="mx-auto max-w-2xl space-y-4">
              {/* 경로 요약 */}
              <div className="rounded-2xl bg-white p-5 shadow-soft-sm">
                <h3 className="text-sm font-medium text-surface-900">경로 정보</h3>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600">A</div>
                  <div className="h-px flex-1 bg-surface-200" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-emerald/20 text-xs font-medium text-accent-emerald">B</div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-surface-500">
                  <span>출발지</span>
                  <span>{order.distance}km</span>
                  <span>도착지</span>
                </div>
              </div>

              {/* 운행 세팅 */}
              <div className="rounded-2xl bg-white p-5 shadow-soft-sm">
                <h3 className="text-sm font-medium text-surface-900">적용된 세팅</h3>
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

        {/* 하단 정보 카드 */}
        <RunInfoCard 
          title={order.title}
          cargoName={order.cargoName}
          distance={order.distance}
          equipmentName={`${fuel.toFixed(0)}% 연료`}
          onOpenDetail={() => setIsDetailOpen(true)}
        />

        {/* 상세 정보 Sheet */}
        <RunDetailSheet 
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          order={order}
          elapsedSeconds={elapsedSeconds}
          etaSeconds={etaSeconds}
          estimatedRemainingSeconds={estimatedRemainingSeconds}
          runId={runId || ''}
        />
      </div>
    </div>
  );
};
