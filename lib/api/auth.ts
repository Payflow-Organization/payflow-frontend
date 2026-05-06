import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserProfile,
} from "../types";
import client from "./client";

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/auth/login", data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/auth/register", data);
  return res.data;
}

export async function logout(): Promise<void> {
  await client.post("/auth/logout");
}

export async function refreshTokens(): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/auth/refresh");
  return res.data;
}

export async function getMe(): Promise<UserProfile> {
  const res = await client.get<UserProfile>("/users/me");
  return res.data;
}
