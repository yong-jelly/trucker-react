import { createClient } from "@supabase/supabase-js";

/**
 * Supabase 설정 정보
 * 환경 변수에서 URL과 Anon Key를 가져오며, 없을 경우 하드코딩된 기본값을 사용합니다.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://xyqpggpilgcdsawuvpzn.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_4rByGLkIJH0y9Qz7CKm1MA_ulfWQZtj";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Supabase 클라이언트 인스턴스
 * 
 * 애플리케이션 전체에서 공유되는 Supabase 클라이언트입니다.
 * 인증, 데이터베이스, 스토리지 등 모든 Supabase 기능의 진입점입니다.
 * 
 * 보안 및 안정성을 위한 설정:
 * - autoRefreshToken: Access Token 만료 전 자동 갱신
 * - persistSession: localStorage에 세션 저장 (다중 탭 동기화 필수)
 * - detectSessionInUrl: OAuth 콜백에서 URL의 세션 자동 감지
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // 자동 토큰 갱신 활성화
    persistSession: true, // localStorage에 세션 영속화 (다중 탭 동기화 필수)
    detectSessionInUrl: true, // OAuth 콜백에서 URL의 세션 자동 감지
    storage: window.localStorage, // 명시적 스토리지 지정
  },
  global: {
    headers: {
      "X-Client-Info": "usemap",
    },
  },
});
