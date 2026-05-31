import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { TASK_TYPES, TASK_PRIORITIES } from "@/lib/enums";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Accept either the standard name or the `claude_api` name set in Vercel.
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.claude_api;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI not configured. Add ANTHROPIC_API_KEY (or claude_api) in Vercel env vars." },
      { status: 503 },
    );
  }

  let transcript = "";
  try {
    const body = await req.json();
    transcript = String(body.transcript ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!transcript) {
    return NextResponse.json({ error: "Empty transcript" }, { status: 400 });
  }

  // give the model the vendor list so it can match by name
  const vendors = await db.vendor.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
    take: 500,
  });
  const vendorList = vendors
    .map((v) => `${v.id} | ${v.name}${v.city ? ` (${v.city})` : ""}`)
    .join("\n");

  const today = new Date().toISOString().slice(0, 10);

  const anthropic = new Anthropic({ apiKey });

  const system = `You convert a spoken note into a structured sourcing task for an RC-car vendor CRM.
Return ONLY a JSON object (no markdown, no prose) with these keys:
{
  "title": string (short imperative, e.g. "Call about drift RC catalogue"),
  "vendorId": string|null (pick the BEST matching id from the vendor list, else null),
  "type": one of ${JSON.stringify(TASK_TYPES)},
  "priority": one of ${JSON.stringify(TASK_PRIORITIES)},
  "dueDate": "YYYY-MM-DD"|null (resolve relative dates against today=${today}),
  "notes": string (any extra detail from the note, else "")
}
Rules: infer type from intent (call/visit/whatsapp/email/sample order/follow up). Default priority MEDIUM. If no vendor is clearly named, vendorId=null.`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system,
      messages: [
        {
          role: "user",
          content: `Vendor list (id | name):\n${vendorList}\n\nVoice note:\n"${transcript}"\n\nReturn the JSON.`,
        },
      ],
    });

    const text =
      msg.content.find((c) => c.type === "text")?.type === "text"
        ? (msg.content.find((c) => c.type === "text") as { text: string }).text
        : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json(
        { error: "Could not parse AI response", raw: text.slice(0, 300) },
        { status: 502 },
      );
    }
    const parsed = JSON.parse(match[0]);
    // validate vendorId actually exists
    if (parsed.vendorId && !vendors.some((v) => v.id === parsed.vendorId)) {
      parsed.vendorId = null;
    }
    return NextResponse.json({ task: parsed });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "AI request failed" },
      { status: 502 },
    );
  }
}
