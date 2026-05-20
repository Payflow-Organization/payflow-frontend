import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL!;

async function proxy(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  const upstream = await fetch(`${BACKEND}${path}`, {
    method: req.method,
    headers: req.headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    duplex: "half",
  } as RequestInit);

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
