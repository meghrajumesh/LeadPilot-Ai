import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/api-response";
import { getSharedPrismaClient } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getSharedPrismaClient();
    const [totalConversations, totalLeads] = await Promise.all([
      prisma.conversation.count(),
      prisma.lead.count(),
    ]);
    const meetingsBooked = await prisma.lead.count({
      where: { status: { in: ["QUALIFIED", "WON"] } },
    });
    const convRate =
      totalConversations > 0
        ? ((totalLeads / totalConversations) * 100).toFixed(2)
        : "0.00";
    return NextResponse.json({
      success: true,
      data: {
        conversations: totalConversations,
        leads: totalLeads,
        meetingsBooked,
        conversionRate: convRate,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load stats" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
