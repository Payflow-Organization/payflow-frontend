import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
const isDev = process.env.NODE_ENV === "development";

async function proxyToBackend(request: NextRequest): Promise<NextResponse> {
  const url = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    BACKEND_URL,
  ).toString();

  const headers = new Headers(request.headers);
  headers.delete("host");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let backendResponse: Response;
  try {
    backendResponse = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError";
    return new NextResponse(isTimeout ? "Gateway timeout" : "Bad gateway", {
      status: isTimeout ? 504 : 502,
    });
  }

  // Exclude Set-Cookie from the constructor — passing it through Headers joins
  // multiple values with ", " which corrupts them. Append individually below.
  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    if (
      key.toLowerCase() !== "set-cookie" &&
      key.toLowerCase() !== "content-encoding" &&
      key.toLowerCase() !== "transfer-encoding"
    ) {
      responseHeaders.set(key, value);
    }
  });

  const response = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });

  backendResponse.headers.getSetCookie().forEach((cookie) => {
    let c = cookie.replace(/;\s*domain=[^;]*/i, "");
    // http://localhost doesn't accept Secure cookies — strip the flag in dev.
    if (isDev) c = c.replace(/;\s*secure/i, "");
    response.headers.append("Set-Cookie", c);
  });

  return response;
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return proxyToBackend(request);
  }

  // Skip strict CSP in dev — nonce + unsafe-inline can't coexist (browsers
  // ignore unsafe-inline when a nonce is present), which breaks the dev overlay.
  if (isDev) {
    return NextResponse.next();
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    connect-src 'self' ${BACKEND_URL};
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  const cspValue = cspHeader.replace(/\s{2,}/g, " ").trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspValue);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", cspValue);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)", "/api/v1/:path*"],
};
