import { NextResponse } from "next/server";
import { corsHeaders, fail } from "@/lib/api-response";
import { addFileDocument } from "@/lib/rag";
import { logger } from "@/lib/logger";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return fail("file is required");
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (file.name.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      text = result.text;
    } else {
      text = buffer.toString("utf-8");
    }

    if (!text.trim()) return fail("No readable text found in file");
    const doc = await addFileDocument(file.name, text);
    return NextResponse.json({ success: true, data: doc }, { headers: corsHeaders() });
  } catch (error) {
    logger.error(error);
    return fail("Unable to upload document", 500);
  }
}
