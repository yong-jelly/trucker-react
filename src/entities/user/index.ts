import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/shared/api/supabase";

interface UserState {
  user: any | null;
  isAuthenticated: boolean;
  isSyncing: boolean;
  setUser: (user: any) => void;
  clearUser: () => void;
  syncSession: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isSyncing: true,
      setUser: (user) => set({ user, isAuthenticated: !!user, isSyncing: false }),
      clearUser: () => set({ user: null, isAuthenticated: false, isSyncing: false }),
      syncSession: async () => {
        try {
          set({ isSyncing: true });
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (session) {
            set({ user: session.user, isAuthenticated: true, isSyncing: false });
          } else {
            set({ user: null, isAuthenticated: false, isSyncing: false });
          }
        } catch (error) {
          console.error("Session sync error:", error);
          set({ user: null, isAuthenticated: false, isSyncing: false });
        }
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export * from "./queries";

