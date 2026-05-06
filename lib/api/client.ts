import axios from "axios";

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await client.post("/auth/refresh");
        return client(original);
      } catch {
        return Promise.reject({ type: "AUTH_EXPIRED" });
      }
    }
    return Promise.reject(error);
  },
);

export default client;
