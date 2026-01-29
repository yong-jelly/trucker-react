import type { OrderCategory } from './types';

export interface Equipment {
  id: string;
  name: string;
  type: 'BICYCLE' | 'VAN' | 'TRUCK' | 'HEAVY_TRUCK' | 'PLANE' | 'SHIP';
  description: string;
  speedKmH: number; // km/h
  maxWeight: number; // kg
  maxVolume: number; // L
  allowedCategories: OrderCategory[];
}

export const EQUIPMENTS: Equipment[] = [
  {
    id: 'BICYCLE',
    name: '기본 배달 자전거',
    type: 'BICYCLE',
    description: '가장 기본적인 배달 수단입니다. 근거리 배송에 적합합니다.',
    speedKmH: 15,
    maxWeight: 10,
    maxVolume: 20,
    allowedCategories: ['CONVENIENCE'],
  },
  {
    id: 'VAN',
    name: '소형 다마스 밴',
    type: 'VAN',
    description: '도심 속 좁은 골목도 문제없는 기동성을 자랑합니다.',
    speedKmH: 40,
    maxWeight: 500,
    maxVolume: 200,
    allowedCategories: ['CONVENIENCE', 'CONSTRUCTION'],
  },
  {
    id: 'TRUCK',
    name: '1톤 포터 트럭',
    type: 'TRUCK',
    description: '대한민국 물류의 모세혈관, 가장 범용적인 트럭입니다.',
    speedKmH: 60,
    maxWeight: 2000,
    maxVolume: 500,
    allowedCategories: ['CONVENIENCE', 'CONSTRUCTION', 'EQUIPMENT'],
  },
  {
    id: 'HEAVY_TRUCK',
    name: '25톤 대형 트레일러',
    type: 'HEAVY_TRUCK',
    description: '압도적인 적재량으로 장거리 대량 운송을 책임집니다.',
    speedKmH: 80,
    maxWeight: 25000,
    maxVolume: 5000,
    allowedCategories: ['EQUIPMENT', 'HEAVY_DUTY'],
  },
];
