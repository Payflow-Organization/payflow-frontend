import axios from "axios";

const client = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

// Shared promise so concurrent 401s (e.g. on hard refresh) only trigger one
// refresh call. Without this, each simultaneous request creates its own
// refresh call and single-use tokens are invalidated by the first one.
let refreshPromise: Promise<void> | null = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isRetryLoop = original.url === "/auth/refresh" || original.url === "/auth/login";
    const isAuthPage = typeof window !== "undefined" &&
      (window.location.pathname === "/login" || window.location.pathname === "/register");

    if ((error.response?.status === 401 || error.response?.status === 403) && !original._retry && !isRetryLoop && !isAuthPage) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = client
          .post("/auth/refresh")
          .then(() => undefined)
          .finally(() => { refreshPromise = null; });
      }
      try {
        await refreshPromise;
        return client(original);
      } catch {
        return Promise.reject({ type: "AUTH_EXPIRED" });
      }
    }
    return Promise.reject(error);
  },
);

export default client;
