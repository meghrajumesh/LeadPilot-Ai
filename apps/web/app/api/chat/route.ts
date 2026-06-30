import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { corsHeaders } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { retrieve } from "@/lib/rag";

const SYSTEM_PROMPT = `You are the friendly virtual receptionist for Vedhas Technology and Solutions. Chat naturally and warmly — small talk, light jokes, and general questions are all welcome, and you can answer them like a normal helpful assistant. When the visitor asks anything about the company, you must ONLY use the facts in the COMPANY INFO section below. Never invent services, prices, timelines, or features. If you are asked something company-specific that isn't covered, say you're not sure and offer to connect them with the team. Never quote fixed project prices — instead explain pricing depends on scope and invite them to a free discovery call. When a visitor seems interested, gently guide them toward the next step: booking a discovery call or leaving their name, email, and a short note about their project. Keep replies concise and conversational (2–4 sentences unless more detail is genuinely needed). Do not use markdown, bold (**), or any formatting — respond in plain text only. For live/real-time questions like weather or current events, use search grounding to give a real answer.

=== COMPANY INFO ===
COMPANY: Vedhas Technology and Solutions

ABOUT US:
Vedhas Technology and Solutions is a software and IT services company that helps businesses build, modernize, and scale their digital products. We work with startups and established companies to turn ideas into reliable, well-designed software.

SERVICES:
- Custom Software Development — web apps, internal tools, and SaaS platforms (React, Next.js, Node.js, Python).
- Mobile App Development — native and cross-platform apps for iOS and Android.
- Cloud & DevOps — cloud migration, infrastructure setup, and CI/CD pipelines (AWS, Azure, Google Cloud).
- AI & Automation — chatbots, workflow automation, and AI features in existing products.
- UI/UX Design — product design, prototyping, and design systems.
- Maintenance & Support — ongoing support, bug fixes, and feature updates.

KEY FEATURES / WHY US:
- Dedicated project team with a single point of contact.
- Transparent weekly progress updates and demos.
- Fixed-scope and dedicated-team engagement models.
- Post-launch support included on all builds.

ENGAGEMENT MODELS / PRICING:
- Project-based: fixed scope and fixed quote after a free discovery call.
- Dedicated team: monthly retainer for an ongoing team.
- Exact pricing depends on scope; a tailored quote is shared after a discovery call. Do not quote fixed prices over chat.

PROCESS:
Discovery call → proposal & quote → design → development in sprints → testing → launch → support.

CONTACT / NEXT STEP:
- Book a free 30-minute discovery call, or leave name, email, and a short project note; the team replies within one business day.
- Email: hello@vedhastech.com
- Hours: Mon–Fri, 9 AM – 6 PM IST.
=== END COMPANY INFO ===`;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages: { role: "user" | "model"; content: string }[];
    };

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { reply: "Hi! How can I help you today?" },
        { headers: corsHeaders() }
      );
    }

    const lastUserMsg = [...body.messages]
      .reverse()
      .find((m) => m.role === "user");

    let ragContext = "";
    if (lastUserMsg) {
      try {
        const results = await retrieve(lastUserMsg.content);
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

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: body.messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT + ragContext }],
        },
        tools: [{ googleSearch: {} }],
      },
    });

    return NextResponse.json(
      { reply: response.text ?? "I'm not sure how to respond to that." },
      { headers: corsHeaders() }
    );
  } catch (error) {
    logger.error(error);
    return NextResponse.json(
      {
        reply:
          "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
      },
      { headers: corsHeaders() }
    );
  }
}
