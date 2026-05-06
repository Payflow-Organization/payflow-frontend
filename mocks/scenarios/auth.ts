import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";

export const authHandlers = [
  http.post("/api/v1/auth/login", () => {
    const headers = new Headers();
    headers.append("Set-Cookie", "accessToken=mock-token; Path=/");
    headers.append("Set-Cookie", "refreshToken=mock-refresh-token; Path=/");
    return HttpResponse.json({ email: faker.internet.email() }, { headers });
  }),

  http.post("/api/v1/auth/register", () => {
    const headers = new Headers();
    headers.append("Set-Cookie", "accessToken=mock-token; Path=/");
    headers.append("Set-Cookie", "refreshToken=mock-refresh-token; Path=/");
    return HttpResponse.json({ email: faker.internet.email() }, { headers });
  }),
  http.post("/api/v1/auth/refresh", () =>
    HttpResponse.json(null, { status: 204 }),
  ),
  http.post("/api/v1/auth/logout", () => {
    const headers = new Headers();
    headers.append("Set-Cookie", "accessToken=; Path=/; Max-Age=0");
    headers.append("Set-Cookie", "refreshToken=; Path=/; Max-Age=0");
    return new HttpResponse(null, { status: 204, headers });
  }),
  http.get("/api/v1/auth/me", () =>
    HttpResponse.json({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      fullName: faker.person.fullName(),
    }),
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
