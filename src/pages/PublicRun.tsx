import { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, Marker as MapboxMarker, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useParams, useNavigate } from 'react-router';
import { 
  MapPin, Loader2, RefreshCw, Bot, UserCircle 
} from 'lucide-react';
import { MAPBOX_TOKEN } from '../shared/lib/mockData';
import { getRunById, type RunDetail } from '../entities/run';
import { 
  getSpeedFromSnapshot, 
  speedToKmPerSecond, 
  interpolatePositionOnRoute,
  fetchMapboxRoute,
  routeToGeoJSON,
  type RouteCoordinate
} from '../shared/lib/run';
import { useEquipments } from '../entities/equipment';

import { PageHeader } from '../shared/ui/PageHeader';
import { RunDetailSheet } from '../widgets/run/RunDetailSheet';
import { RunDashboard } from '../widgets/run/RunDashboard';
import { RunInfoCard } from '../widgets/run/RunInfoCard';

export const PublicRunPage = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [tick, setTick] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // 장비 정보 로드
  const { data: equipments = [] } = useEquipments();

  // DB에서 운행 데이터 로드
  const fetchRunDetail = async (silent = false) => {
    if (!runId) return;
    
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const detail = await getRunById(runId);
      if (detail) {
        setRunDetail(detail);
      }
    } catch (err) {
      console.error('Failed to fetch run detail:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRunDetail();
  }, [runId]);

  const handleRefresh = () => {
    fetchRunDetail(true);
  };

  // 실시간 갱신 타이머 (10초마다)
  useEffect(() => {
    if (!runDetail || runDetail.run.status !== 'IN_TRANSIT') return;

    const timer = setInterval(() => {
      fetchRunDetail(true);
      setTick(prev => prev + 1);
    }, 10000);

    return () => clearInterval(timer);
  }, [runDetail]);

  const order = runDetail?.order;
  const etaSeconds = runDetail?.run.etaSeconds || 0;
  const totalDistanceKm = order?.distance || 0;

  // 장비 속도 정보 (스냅샷 우선)
  const { baseSpeed } = getSpeedFromSnapshot(
    runDetail?.run.equipmentSnapshot,
    runDetail?.run.selectedItems?.equipmentId
  );

  // 경과 시간 계산
  const elapsedSeconds = useMemo(() => {
    if (!runDetail) return 0;
    if (runDetail.run.status === 'COMPLETED' && runDetail.run.completedAt) {
      return Math.floor((runDetail.run.completedAt - runDetail.run.startAt) / 1000);
    }
    return Math.floor((Date.now() - runDetail.run.startAt) / 1000);
  }, [runDetail, tick]);

  // 실제 이동 거리 추정 (장비 속도 기반)
  const distanceCovered = useMemo(() => {
    if (runDetail?.run.status === 'COMPLETED') return totalDistanceKm;
    if (!baseSpeed || !elapsedSeconds) return 0;
    const estimatedDistance = speedToKmPerSecond(baseSpeed) * elapsedSeconds;
    return Math.min(estimatedDistance, totalDistanceKm);
  }, [runDetail, baseSpeed, elapsedSeconds, totalDistanceKm]);

  // 진행률 계산
  const progress = useMemo(() => {
    if (runDetail?.run.status === 'COMPLETED') return 100;
    if (totalDistanceKm <= 0) return 0;
    return Math.min((distanceCovered / totalDistanceKm) * 100, 100);
  }, [runDetail, distanceCovered, totalDistanceKm]);

  const isOvertime = elapsedSeconds > etaSeconds;
  const remainingSeconds = Math.max(etaSeconds - elapsedSeconds, 0);

  // 장비 정보 조회
  const getEquipmentName = (equipmentId: string | null | undefined) => {
    const equipment = equipments.find(e => e.id === equipmentId);
    return equipment?.name || '배달 자전거';
  };

  // Mapbox 라우팅 데이터 가져오기 (공통 함수 사용)
  useEffect(() => {
    if (!order) return;

    const loadRoute = async () => {
      try {
        const route = await fetchMapboxRoute({
          startPoint: order.startPoint,
          endPoint: order.endPoint,
          category: order.category
        });
        setRouteData(route);
        setCurrentPos(order.startPoint);

        // 지도 영역 조정
        if (mapRef.current && route.coordinates?.length) {
          const lats = route.coordinates.map(c => c[1]);
          const lngs = route.coordinates.map(c => c[0]);
          mapRef.current.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 100, duration: 1000 }
          );
        }
      } catch (error) {
        console.error('라우팅 실패:', error);
      }
    };

    loadRoute();
  }, [order]);

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
        <p className="mt-1 text-sm text-surface-500">존재하지 않는 운행입니다.</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-6 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-soft-md"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const isCompleted = runDetail.run.status === 'COMPLETED';
  const isCancelled = runDetail.run.status === 'CANCELLED';

  return (
    <div className="relative h-screen w-full overflow-hidden bg-surface-50 flex flex-col items-center">
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
            {!isCompleted && !isCancelled && (
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-50 hover:bg-surface-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-surface-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              isCompleted 
                ? 'bg-emerald-100 text-emerald-700' 
                : isCancelled 
                  ? 'bg-surface-100 text-surface-500'
                  : 'bg-primary-100 text-primary-700'
            }`}>
              {isCompleted ? '완료' : isCancelled ? '취소됨' : '운행 중'}
            </div>
          </div>
        }
      />

      {/* 대시보드 (상태 바) */}
      <RunDashboard 
        isCompleted={isCompleted}
        isCancelled={isCancelled}
        isOvertime={isOvertime}
        elapsedSeconds={elapsedSeconds}
        etaSeconds={etaSeconds}
        remainingSeconds={remainingSeconds}
        currentReward={runDetail.run.currentReward}
        progress={progress}
      />

      {/* 지도 */}
      <div className="h-full w-full max-w-[480px] pt-[120px] pb-[100px] relative">
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
                  'line-color': isCompleted ? '#10b981' : '#6366f1',
                  'line-width': 4,
                  'line-opacity': 0.4
                }}
              />
            </Source>
          )}

          {/* 현재 위치 */}
          {currentPos && !isCompleted && !isCancelled && (
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

      {/* 하단 정보 카드 */}
      <RunInfoCard 
        title={order.title}
        cargoName={order.cargoName}
        distance={order.distance}
        equipmentName={getEquipmentName(runDetail.run.selectedItems?.equipmentId)}
        onOpenDetail={() => setIsDetailOpen(true)}
      />

      {/* 상세 정보 Sheet */}
      <RunDetailSheet 
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        order={order}
        elapsedSeconds={elapsedSeconds}
        etaSeconds={etaSeconds}
        estimatedRemainingSeconds={remainingSeconds}
        runId={runId || ''}
      />
    </div>
  );
};
