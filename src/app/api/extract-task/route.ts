import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { TASK_PRIORITIES } from "@/lib/enums";

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

  // give the model the vendor + partner lists so it can match by name
  const [vendors, users] = await Promise.all([
    db.vendor.findMany({
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const vendorList = vendors
    .map((v) => `${v.id} | ${v.name}${v.city ? ` (${v.city})` : ""}`)
    .join("\n");
  const userList = users.map((u) => `${u.id} | ${u.name}`).join("\n");

  const today = new Date().toISOString().slice(0, 10);

  const anthropic = new Anthropic({ apiKey });

  const system = `You convert a spoken note into a structured sourcing task for an RC-car vendor CRM used by two partners.
Return ONLY a JSON object (no markdown, no prose) with these keys:
{
  "title": string (short imperative, e.g. "Call about drift RC catalogue"),
  "vendorId": string|null (pick the BEST matching id from the vendor list, else null),
  "assignedToId": string|null (pick the partner id if a person is named — "ask Shoaib to...", "Syed will..." — else null),
  "priority": one of ${JSON.stringify(TASK_PRIORITIES)},
  "dueDate": "YYYY-MM-DD" (resolve relative dates against today=${today}; if no date is mentioned, default to today=${today}),
  "notes": string (any extra detail from the note, else "")
}
Rules: Default priority MEDIUM. dueDate is ALWAYS a real date (never null) — use today if unspecified. If no vendor is clearly named, vendorId=null. If no person is named, assignedToId=null.`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system,
      messages: [
        {
          role: "user",
          content: `Partners (id | name):\n${userList}\n\nVendor list (id | name):\n${vendorList}\n\nVoice note:\n"${transcript}"\n\nReturn the JSON.`,
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
    // validate ids actually exist
    if (parsed.vendorId && !vendors.some((v) => v.id === parsed.vendorId)) {
      parsed.vendorId = null;
    }
    if (parsed.assignedToId && !users.some((u) => u.id === parsed.assignedToId)) {
      parsed.assignedToId = null;
    }
    if (!parsed.dueDate) parsed.dueDate = today;
    return NextResponse.json({ task: parsed });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "AI request failed" },
      { status: 502 },
    );
  }
}
