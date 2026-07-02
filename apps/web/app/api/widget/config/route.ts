import { NextResponse } from "next/server";
import { z } from "zod";
import { corsHeaders, fail, ok } from "@/lib/api-response";
import { findProjectByWidgetKey, toWidgetConfig } from "@/lib/widget-store";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  widgetKey: z.string().min(1)
});

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");

  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      widgetKey: url.searchParams.get("widgetKey")
    });

    if (!parsed.success) {
      return fail("Missing widgetKey", 400, origin);
    }

    const project = await findProjectByWidgetKey(parsed.data.widgetKey);

    if (!project) {
      return fail("Widget not found", 404, origin);
    }

    return ok({ config: toWidgetConfig(project) }, origin);
  } catch (error) {
    logger.error(error);
    return fail("Unable to load widget config", 500, origin);
  }
}
