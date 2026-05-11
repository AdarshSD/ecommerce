import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { useAuthStore } from "@/lib/store/authStore";

export interface AuthResponse {
  data: {
    access_token: string;
    token_type: string;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      is_active: boolean;
    };
  };
  cart_conflict: {
    guest_items: { product_id: string; title: string; quantity: number; price: number }[];
    user_items:  { product_id: string; title: string; quantity: number; price: number }[];
  } | null;
}

export function useLogin() {
  const qc = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      api.post<any>("/auth/login", vars) as unknown as Promise<AuthResponse>,
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.access_token);
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (vars: { email: string; password: string; first_name: string; last_name: string }) =>
      api.post<any>("/auth/register", vars) as unknown as Promise<AuthResponse>,
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.access_token);
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: () => api.post<any>("/auth/logout"),
    onSuccess: () => {
      clearAuth();
      qc.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => api.post<any>("/auth/forgot-password", { email }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (vars: { token: string; new_password: string }) =>
      api.post<any>("/auth/reset-password", vars),
  });
}
