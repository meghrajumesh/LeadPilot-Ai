import { NextResponse } from "next/server";
import { corsHeaders, fail } from "@/lib/api-response";
import { addTextDocument, addWebsiteDocument, deleteDocument, listDocuments } from "@/lib/rag";
import { logger } from "@/lib/logger";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  try {
    const docs = listDocuments();
    return NextResponse.json({ success: true, data: docs }, { headers: corsHeaders() });
  } catch (error) {
    logger.error(error);
    return fail("Unable to list knowledge documents", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      title?: string;
      content?: string;
      url?: string;
    };

    if (body.type === "website") {
      if (!body.url) return fail("url is required");
      const doc = await addWebsiteDocument(body.url);
      return NextResponse.json({ success: true, data: doc }, { headers: corsHeaders() });
    }

    if (!body.title || !body.content) return fail("title and content are required");
    const doc = await addTextDocument(body.title, body.content);
    return NextResponse.json({ success: true, data: doc }, { headers: corsHeaders() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error(error);
    return fail(msg, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return fail("id is required");
    const deleted = await deleteDocument(id);
    if (!deleted) return fail("Document not found", 404);
    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    logger.error(error);
    return fail("Unable to delete document", 500);
  }
}
