import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase";
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
      
      const { data, error } = await supabase
        .schema("trucker")
        .from("tbl_user_profile")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();
        
      if (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }
      return data;
    },
    enabled: !!user,
    retry: (failureCount, error: any) => {
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

      const { data, error } = await supabase
        .schema("trucker")
        .from("tbl_user_profile")
        .upsert({
          auth_user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
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
