import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { TASK_PRIORITIES, TASK_TYPES } from "@/lib/enums";

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

  const system = `You convert a spoken note into one or MORE structured sourcing tasks for an RC-car vendor CRM used by two partners (Syed, Shoaib).

CRITICAL — SPLIT INTO MULTIPLE TASKS: a single note usually contains SEVERAL distinct tasks — a numbered or bulleted list (1. … 2. … 3. …), several sentences each describing a different action, or items joined by "and", "also", "then", "next". Return EACH distinct action item as its OWN separate task. Do NOT merge different actions into one task. Only return a single task if the note genuinely describes just one action.

Return ONLY a JSON object (no markdown, no prose):
{ "tasks": [ {
  "title": string (short self-contained imperative, e.g. "Call about drift RC catalogue"),
  "vendorId": string|null (BEST matching id from the vendor list, else null),
  "assignedToId": string|null (partner id if a person is named — "ask Shoaib to…", "Syed will…" — else null),
  "type": one of ${JSON.stringify(TASK_TYPES)} (business CATEGORY — a call/visit/whatsapp/email/sample/follow-up/research, or a function like LEGAL, FINANCE, OPS, INVENTORY, MARKETING, CONTENT, PRODUCT, SOURCING, STRATEGY; default SOURCING),
  "priority": one of ${JSON.stringify(TASK_PRIORITIES)},
  "dueDate": "YYYY-MM-DD" (resolve relative dates against today=${today}; default today if unspecified),
  "notes": string (extra detail for THIS task, else "")
} ] }
Rules: Always return at least one task in the "tasks" array. Each task's title must be self-contained and actionable on its own. dueDate is ALWAYS a real date (never null) — use today if unspecified. Default priority MEDIUM. If no vendor is clearly named, vendorId=null. If no person is named, assignedToId=null.`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
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
    // Accept {tasks:[...]} (new) or a bare single-task object (fallback).
    const rawTasks: Record<string, unknown>[] = Array.isArray(parsed.tasks)
      ? parsed.tasks
      : parsed.title
        ? [parsed]
        : [];
    const tasks = rawTasks
      .filter((t) => t && typeof t.title === "string" && (t.title as string).trim())
      .map((t) => {
        if (t.vendorId && !vendors.some((v) => v.id === t.vendorId)) t.vendorId = null;
        if (t.assignedToId && !users.some((u) => u.id === t.assignedToId)) t.assignedToId = null;
        if (!t.type || !(TASK_TYPES as readonly string[]).includes(t.type as string)) t.type = "SOURCING";
        if (!t.priority || !(TASK_PRIORITIES as readonly string[]).includes(t.priority as string)) t.priority = "MEDIUM";
        if (!t.dueDate) t.dueDate = today;
        return t;
      });
    if (!tasks.length) {
      return NextResponse.json({ error: "No tasks found in note" }, { status: 502 });
    }
    // Keep `task` for any old client; `tasks` is the array.
    return NextResponse.json({ tasks, task: tasks[0] });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "AI request failed" },
      { status: 502 },
    );
  }
}
