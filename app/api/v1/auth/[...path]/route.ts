import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL!;
const IS_PROD = process.env.NODE_ENV === "production";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const url = `${BACKEND}/api/v1/auth/${path.join("/")}`;

  const endpoint = path.at(-1);
  const accessToken = request.cookies.get("accessToken")?.value;
  const storedRefreshToken = request.cookies.get("refreshToken")?.value;

  let requestBody: string | undefined;
  const extraHeaders: Record<string, string> = {};

  if (request.method !== "GET" && request.method !== "HEAD") {
    const raw = await request.text();
    const base = raw ? JSON.parse(raw) : {};

    if (endpoint === "refresh") {
      // Backend reads refreshToken from @RequestBody — inject from HttpOnly cookie.
      requestBody = JSON.stringify({ ...base, refreshToken: storedRefreshToken });
    } else if (endpoint === "logout") {
      // Backend reads Authorization header for JTI deny-listing and refreshToken
      // from @RequestBody — inject both from HttpOnly cookies.
      if (accessToken) extraHeaders["Authorization"] = `Bearer ${accessToken}`;
      requestBody = JSON.stringify({ ...base, refreshToken: storedRefreshToken });
    } else {
      requestBody = raw || undefined;
    }
  }

  let upstreamStatus: number;
  let upstreamBody: string;
  let upstreamSetCookies: string[];
  let upstreamOk: boolean;
  let upstreamContentType: string;

  try {
    const upstream = await axios({
      method: request.method,
      url,
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") ?? "",
        ...extraHeaders,
      },
      data: requestBody,
      // Don't throw on any HTTP status — only throw on network errors.
      validateStatus: () => true,
      responseType: "text",
    });

    upstreamStatus = upstream.status;
    upstreamBody = upstream.data as string;
    upstreamSetCookies = (upstream.headers["set-cookie"] as string[] | undefined) ?? [];
    upstreamOk = upstream.status >= 200 && upstream.status < 300;
    upstreamContentType = (upstream.headers["content-type"] as string | undefined) ?? "application/json";
  } catch {
    // Network error — backend unreachable or dropped the connection.
    // Still clear auth cookies for logout so the browser session is cleaned up.
    const errResponse = new NextResponse(null, { status: 502 });
    if (endpoint === "logout") {
      errResponse.cookies.delete("accessToken");
      errResponse.cookies.delete("refreshToken");
    }
    return errResponse;
  }

  const response = new NextResponse(upstreamBody || null, {
    status: upstreamStatus,
    headers: { "Content-Type": upstreamContentType },
  });

  // Forward any Set-Cookie the backend sends, stripping Domain and Secure so
  // they land correctly on localhost in dev.
  for (const raw of upstreamSetCookies) {
    const rewritten = raw
      .replace(/;\s*[Dd]omain=[^;]*/g, "")
      .replace(/;\s*[Ss]ecure/g, IS_PROD ? "; Secure" : "");
    response.headers.append("Set-Cookie", rewritten);
  }

  // Set tokens as HttpOnly cookies from the response body so the middleware
  // can read them regardless of what the backend's Set-Cookie does.
  if (upstreamOk) {
    try {
      const data = JSON.parse(upstreamBody);
      if (data.accessToken) {
        response.cookies.set("accessToken", data.accessToken, {
          httpOnly: true,
          secure: IS_PROD,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days — JWT exp enforces real expiry
        });
      }
      if (data.refreshToken) {
        response.cookies.set("refreshToken", data.refreshToken, {
          httpOnly: true,
          secure: IS_PROD,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
    } catch {
      // not JSON (e.g. logout 204)
    }
  }

  if (endpoint === "logout") {
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
  }

  return response;
}

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
