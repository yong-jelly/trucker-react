/**
 * 운행(Run) 관련 공통 유틸리티 함수
 */

import { MAPBOX_TOKEN } from './mockData';

// ============================================
// 1. 장비 관련
// ============================================

/** 장비 ID로 기본 속도 조회 */
export function getEquipmentBaseSpeed(equipmentId?: string | null): number {
  if (!equipmentId) return 15;
  // 하드코딩된 속도 대신 15를 기본값으로 반환 (실제 속도는 DB 스냅샷이나 API 데이터를 우선 사용해야 함)
  return 15;
}

/** 장비 스냅샷에서 속도 정보 추출 */
export function getSpeedFromSnapshot(
  snapshot?: { base_speed?: number; max_speed?: number } | null,
  fallbackEquipmentId?: string | null
): { baseSpeed: number; maxSpeed: number } {
  const baseSpeed = snapshot?.base_speed || getEquipmentBaseSpeed(fallbackEquipmentId);
  const maxSpeed = snapshot?.max_speed || (snapshot?.base_speed ? snapshot.base_speed * 1.5 : baseSpeed * 1.5);
  return { baseSpeed, maxSpeed };
}

/** 연료 패널티 적용된 속도 계산 */
export function applyFuelPenalty(speed: number, fuel: number): number {
  const multiplier = fuel <= 0 ? 0.2 : 1.0;
  return speed * multiplier;
}

/** 장비 이름 조회 (하드코딩 제거, DB 데이터 사용 권장) */
export function getEquipmentName(equipmentId?: string | null): string {
  switch (equipmentId) {
    case 'basic-bicycle':
    case 'BICYCLE':
      return '배달 자전거';
    default: 
      return equipmentId || '알 수 없는 장비';
  }
}

// ============================================
// 2. 거리/시간 계산
// ============================================

/** 속도(km/h)를 초당 이동거리(km/s)로 변환 */
export function speedToKmPerSecond(speedKmh: number): number {
  return speedKmh / 3600;
}

/** 남은 거리와 속도로 예상 소요 시간(초) 계산 */
export function calculateETA(distanceKm: number, speedKmh: number): number {
  if (speedKmh <= 0) return Infinity;
  return (distanceKm / speedKmh) * 3600;
}

/** 진행률 계산 (0~100) */
export function calculateProgress(covered: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min((covered / total) * 100, 100);
}

// ============================================
// 3. 경로 상 위치 보간 (Interpolation)
// ============================================

export interface RouteCoordinate {
  coordinates: [number, number][]; // [lng, lat][]
}

/**
 * 경로 상의 특정 진행률(%)에 해당하는 위치 계산
 * @param routeData 경로 데이터 (Mapbox geometry)
 * @param progressPercent 진행률 (0~100)
 * @returns [lat, lng] 또는 null
 */
export function interpolatePositionOnRoute(
  routeData: RouteCoordinate | null,
  progressPercent: number
): [number, number] | null {
  if (!routeData || !routeData.coordinates || routeData.coordinates.length === 0) {
    return null;
  }

  const coords = routeData.coordinates;
  const progress = Math.min(Math.max(progressPercent, 0), 100) / 100;
  
  const pointIndex = Math.floor((coords.length - 1) * progress);
  const nextPointIndex = Math.min(pointIndex + 1, coords.length - 1);
  
  // 두 점 사이의 보간
  const segmentProgress = ((coords.length - 1) * progress) - pointIndex;
  const currentLng = coords[pointIndex][0] + (coords[nextPointIndex][0] - coords[pointIndex][0]) * segmentProgress;
  const currentLat = coords[pointIndex][1] + (coords[nextPointIndex][1] - coords[pointIndex][1]) * segmentProgress;
  
  return [currentLat, currentLng];
}

// ============================================
// 4. Mapbox 라우팅 API
// ============================================

export interface FetchRouteOptions {
  startPoint: [number, number]; // [lat, lng]
  endPoint: [number, number];
  category?: string;
}

/**
 * Mapbox Directions API로 경로 데이터 가져오기
 * @returns GeoJSON LineString geometry
 */
export async function fetchMapboxRoute(options: FetchRouteOptions): Promise<RouteCoordinate> {
  const { startPoint, endPoint, category } = options;

  // 대륙간 운송은 직선 경로
  if (category === 'INTERNATIONAL') {
    return {
      coordinates: [
        [startPoint[1], startPoint[0]],
        [endPoint[1], endPoint[0]]
      ]
    };
  }

  try {
    const profile = category === 'HEAVY_DUTY' ? 'driving' : 'cycling';
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${startPoint[1]},${startPoint[0]};${endPoint[1]},${endPoint[0]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`,
      { method: 'GET' }
    );
    const json = await response.json();
    
    if (json.routes && json.routes[0]) {
      return json.routes[0].geometry as RouteCoordinate;
    }
  } catch (error) {
    console.error('Mapbox 라우팅 실패, 직선으로 대체:', error);
  }

  // 폴백: 직선 경로
  return {
    coordinates: [
      [startPoint[1], startPoint[0]],
      [endPoint[1], endPoint[0]]
    ]
  };
}

/**
 * 경로 좌표에서 Bounds 계산
 */
export function calculateRouteBounds(coords: [number, number][]): {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
} {
  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  
  return {
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
}

// ============================================
// 5. GeoJSON 변환
// ============================================

export function routeToGeoJSON(routeData: RouteCoordinate | null) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: routeData
  };
}
