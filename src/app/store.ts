import { create } from 'zustand';
import type { Order, Slot, Run, EventLog } from '../shared/api/types';

interface GameState {
  profile: {
    balance: number;
    reputation: number;
  };
  slots: Slot[];
  availableOrders: Order[];
  currentRuns: Run[];
  eventLogs: Record<string, EventLog[]>; // runId -> EventLog[]
  
  // Actions
  setSlots: (slots: Slot[]) => void;
  setOrders: (orders: Order[]) => void;
  addRun: (run: Run) => void;
  updateBalance: (amount: number) => void;
  addEventLog: (runId: string, log: EventLog) => void;
}

export const useGameStore = create<GameState>((set) => ({
  profile: {
    balance: 100, // 초기 자금 $100
    reputation: 0,
  },
  slots: [
    { id: '1', index: 0, isLocked: false },
    { id: '2', index: 1, isLocked: true },
    { id: '3', index: 2, isLocked: true },
  ],
  availableOrders: [],
  currentRuns: [],
  eventLogs: {},

  setSlots: (slots) => set({ slots }),
  setOrders: (orders) => set({ availableOrders: orders }),
  addRun: (run) => set((state) => ({ currentRuns: [...state.currentRuns, run] })),
  updateBalance: (amount) => set((state) => ({ 
    profile: { ...state.profile, balance: state.profile.balance + amount } 
  })),
  addEventLog: (runId, log) => set((state) => ({
    eventLogs: {
      ...state.eventLogs,
      [runId]: [log, ...(state.eventLogs[runId] || [])]
    }
  })),
}));
