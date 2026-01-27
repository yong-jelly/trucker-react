import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, rpcTrucker } from "@/shared/api/supabase";
import { useUserStore } from "./index";

export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
};

export function useUserProfile() {
  const { user } = useUserStore();
  
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await rpcTrucker("v1_get_user_profile", { p_auth_user_id: user.id });
        
      if (error) {
        console.error("Profile fetch error via RPC:", error);
        throw error;
      }
      return data;
    },
    enabled: !!user,
    retry: (failureCount) => {
      // 프로필이 아직 생성되지 않은 경우(406 또는 null) 최대 5번 재시도
      if (failureCount < 5) return true;
      return false;
    },
    retryDelay: 1000,
  });
}

export function useUpsertProfile() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  return useMutation({
    mutationFn: async (profile: { 
      nickname: string; 
      bio?: string | null; 
      avatar_url?: string | null;
      telegram_chat_id?: string | null;
      slack_webhook_url?: string | null;
      notification_enabled?: boolean;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await rpcTrucker("v1_upsert_user_profile", {
        p_auth_user_id: user.id,
        p_profile: profile
      });

      if (error) {
        console.error("Profile upsert error via RPC:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { clearUser } = useUserStore();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      clearUser();
      queryClient.clear();
    },
  });
}
