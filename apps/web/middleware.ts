import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function corsHeadersFor(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeadersFor(origin) });
  }
  let response;
  try {
    response = await updateSession(request);
  } catch {
    response = NextResponse.next();
  }
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ch = corsHeadersFor(origin);
    Object.entries(ch).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"]
};
