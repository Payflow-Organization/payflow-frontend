import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";

interface MockSession {
  id: string;
  email: string;
  fullName: string;
}

// Module-level state persists inside the service worker across page navigations.
let mockSession: MockSession | null = null;

export const authHandlers = [
  http.post("/api/v1/auth/login", () => {
    mockSession = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      fullName: faker.person.fullName(),
    };
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/v1/auth/register", () => {
    mockSession = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      fullName: faker.person.fullName(),
    };
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/v1/auth/refresh", () =>
    mockSession
      ? HttpResponse.json(null, { status: 204 })
      : HttpResponse.json(null, { status: 401 }),
  ),

  http.post("/api/v1/auth/logout", () => {
    mockSession = null;
    const headers = new Headers();
    headers.append("Set-Cookie", "accessToken=; Path=/; Max-Age=0");
    headers.append("Set-Cookie", "refreshToken=; Path=/; Max-Age=0");
    return new HttpResponse(null, { status: 204, headers });
  }),

  http.get("/api/v1/auth/me", () =>
    mockSession
      ? HttpResponse.json(mockSession)
      : HttpResponse.json(null, { status: 401 }),
  ),
];

export const authErrorHandlers = [
  http.post("/api/v1/auth/login", () =>
    HttpResponse.json(
      { message: "Invalid email or password" },
      { status: 401 },
    ),
  ),
  http.post("/api/v1/auth/register", () =>
    HttpResponse.json({ message: "Email already registered" }, { status: 409 }),
  ),
];
