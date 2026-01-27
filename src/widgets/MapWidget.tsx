import { useState, useMemo } from 'react';
import Map, { NavigationControl, Marker as MapboxMarker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { MAPBOX_TOKEN, MOCK_ORDERS } from '../shared/lib/mockData';

export const MapWidget = () => {
  const center: [number, number] = [37.5665, 126.9780]; // 서울 시청

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <Map
        initialViewState={{
          longitude: center[1],
          latitude: center[0],
          zoom: 12
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="bottom-right" />
        
        {/* 모든 주문의 출발지 표시 */}
        {MOCK_ORDERS.map((order) => (
          <MapboxMarker 
            key={order.id} 
            longitude={order.startPoint[1]} 
            latitude={order.startPoint[0]}
          >
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="rounded-full bg-white p-1.5 shadow-soft-md border border-primary-100 group-hover:scale-110 transition-transform">
                <MapPin className="h-4 w-4 text-primary-500" />
              </div>
              <div className="mt-1 hidden group-hover:block">
                <span className="rounded bg-surface-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg whitespace-nowrap">
                  {order.title}
                </span>
              </div>
            </div>
          </MapboxMarker>
        ))}
      </Map>
    </div>
  );
};
