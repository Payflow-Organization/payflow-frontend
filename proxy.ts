import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && request.nextUrl.pathname.startsWith("/api")) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
    const url = request.url.replace(request.nextUrl.origin, backendUrl);

    const backendResponse = await fetch(url, {
      method: request.method,
      headers: request.headers,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? await request.arrayBuffer()
          : undefined,
    });

    const response = new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: backendResponse.headers,
    });

    return response;
  }

  if (isDev) {
    return NextResponse.next();
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    connect-src 'self' ${backendUrl};
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue,
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue,
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)", "/api/v1/:path*"],
};
