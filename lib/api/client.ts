import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const client: AxiosInstance = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Deduplicate concurrent 401/403 refresh attempts — each simultaneous request
// would trigger its own refresh and the single-use token gets invalidated.
let refreshPromise: Promise<void> | null = null;

const AUTH_ROUTES = new Set(["/auth/refresh", "/auth/login", "/auth/register"]);
const AUTH_PAGES = new Set(["/login", "/register"]);

async function refreshTokens(): Promise<void> {
  try {
    await client.post("/auth/refresh");
  } finally {
    refreshPromise = null;
  }
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig;
    const status = error.response?.status;

    // Refresh only when: auth failed + not already retried + not an auth
    // endpoint (would loop) + not on a login/register page (user isn't logged in yet).
    const shouldRefresh =
      (status === 401 || status === 403) &&
      !original._retry &&
      !AUTH_ROUTES.has(original.url ?? "") &&
      !(typeof window !== "undefined" && AUTH_PAGES.has(window.location.pathname));

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= refreshTokens();

    try {
      await refreshPromise;
      return client(original);
    } catch {
      return Promise.reject({ type: "AUTH_EXPIRED" });
    }
  },
);

export default client;
