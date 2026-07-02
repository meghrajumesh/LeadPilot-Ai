import { NextResponse } from "next/server";
import type { ApiResponse } from "@leadpilot/types";

export function ok<T>(data: T, origin?: string | null) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data },
    {
      headers: corsHeaders(origin)
    }
  );
}

export function fail(error: string, status = 400, origin?: string | null) {
  return NextResponse.json<ApiResponse<never>>(
    { success: false, error },
    {
      status,
      headers: corsHeaders(origin)
    }
  );
}

export function corsHeaders(origin?: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
