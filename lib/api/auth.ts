import { LoginRequest, RegisterRequest, UserProfile } from "../types";
import client from "./client";

export async function login(data: LoginRequest): Promise<void> {
  await client.post("/auth/login", data);
}

export async function register(data: RegisterRequest): Promise<void> {
  await client.post("/auth/register", data);
}

export async function logout(): Promise<void> {
  await client.post("/auth/logout");
}

export async function refreshTokens(): Promise<void> {
  await client.post("/auth/refresh");
}

export async function getMe(): Promise<UserProfile> {
  const res = await client.get<UserProfile>("/auth/me");
  return res.data;
}
