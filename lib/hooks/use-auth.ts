"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, login, logout, register } from "../api/auth";
import { useRouter } from "next/navigation";
import { LoginRequest, RegisterRequest } from "../types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.replace("/dashboard");
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.replace("/dashboard");
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      try { await logout(); } catch { /* best-effort — session may already be expired */ }
    },
    onSuccess: () => {
      sessionStorage.setItem("logged_out", "1");
      window.location.replace("/login");
    },
  });
}
