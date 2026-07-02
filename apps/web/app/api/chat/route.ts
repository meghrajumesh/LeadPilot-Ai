import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { corsHeaders } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { retrieve } from "@/lib/rag-supabase";
import { findProjectByWidgetKey, isDomainAllowed } from "@/lib/widget-store";

const BASE_PROMPT = `You are a friendly virtual receptionist. Chat naturally and warmly — small talk, light jokes, and general questions are all welcome, and you can answer them like a normal helpful assistant. When the visitor asks anything about the company, you must ONLY use the facts from the RETRIEVED CONTEXT section below (if provided). Never invent services, prices, timelines, or features. If you are asked something company-specific that the context doesn't cover, say you're not sure and offer to connect them with the team. Never quote fixed prices — instead explain pricing depends on scope and invite them to a free discovery call. When a visitor seems interested, gently guide them toward the next step. Keep replies concise and conversational (2–4 sentences unless more detail is genuinely needed). Do not use markdown, bold, or any formatting — respond in plain text only.`;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || request.headers.get("referer");

  try {
    const body = (await request.json()) as {
      messages: { role: "user" | "model"; content: string }[];
      widgetKey?: string;
    };

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { reply: "Hi! How can I help you today?" },
        { headers: corsHeaders(origin) }
      );
    }

    const widgetKey = body.widgetKey;

    if (!widgetKey) {
      return NextResponse.json(
        { success: false, error: "Missing widgetKey" },
        { status: 403, headers: corsHeaders(origin) }
      );
    }

    const project = await findProjectByWidgetKey(widgetKey);

    if (!project || project.id === "demo-project") {
      return NextResponse.json(
        { success: false, error: "Invalid widget key" },
        { status: 403, headers: corsHeaders(origin) }
      );
    }

    const domainCheck = isDomainAllowed(project, origin);

    if (!domainCheck.allowed) {
      return NextResponse.json(
        { success: false, error: domainCheck.reason },
        { status: 403, headers: corsHeaders(origin) }
      );
    }

    const projectId = project.id;

    const lastUserMsg = [...body.messages]
      .reverse()
      .find((m) => m.role === "user");

    let ragContext = "";
    if (lastUserMsg && projectId) {
      try {
        const results = await retrieve(projectId, lastUserMsg.content, 5);
        if (results.length > 0) {
          ragContext =
            "\n\n=== RETRIEVED CONTEXT ===\n" +
            results.map((r) => r.content).join("\n\n") +
            "\n=== END CONTEXT ===\n";
        }
      } catch (e) {
        logger.error(e);
      }
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    let response;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await groq.chat.completions.create({
          model: "groq/compound",
          messages: [
            { role: "system", content: BASE_PROMPT + ragContext },
            ...body.messages.map((m) => ({
              role: (m.role === "model" ? "assistant" : "user") as "user" | "assistant",
              content: m.content,
            })),
          ],
        });
        break;
      } catch (e: any) {
        const isQuota = e?.status === 429 || e?.message?.includes("429");
        if (isQuota && attempt === 0) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        throw e;
      }
    }

    let reply = response!.choices?.[0]?.message?.content ?? "I'm not sure how to respond to that.";
    reply = reply
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      .replace(/`{1,3}[^`]+`{1,3}/g, "")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1");

    return NextResponse.json(
      { reply },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    const errJson =
      error instanceof Error ? error.message : String(error);
    const errCode = error?.status ?? error?.statusCode ?? 500;
    logger.error(`[chat] status=${errCode} msg=${errJson.slice(0, 300)}`);
    const isQuota =
      errCode === 429 ||
      errJson.includes('"code":429') ||
      errJson.includes("status: 429");
    return NextResponse.json(
      { success: false, error: isQuota ? "Rate limited, please retry." : errJson.slice(0, 200) },
      { status: isQuota ? 429 : 500, headers: corsHeaders(origin) }
    );
  }
}
