"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Sparkles } from "lucide-react";
import { toast } from "sonner";

export type ExtractedTask = {
  title?: string;
  vendorId?: string | null;
  assignedToId?: string | null;
  priority?: string;
  dueDate?: string | null;
  notes?: string;
};

export function VoiceTaskInput({
  onExtract,
}: {
  onExtract: (task: ExtractedTask) => void;
}) {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const recRef = useRef<unknown>(null);

  const supported =
    typeof window !== "undefined" &&
    !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition);

  const startListening = () => {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown })
        .webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR() as {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void;
      onerror: () => void;
      start: () => void;
      stop: () => void;
    };
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = transcript;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i] as ArrayLike<{ transcript: string }> & {
          isFinal?: boolean;
        };
        const t = r[0].transcript;
        if ((r as { isFinal?: boolean }).isFinal) finalText += t + " ";
        else interim += t;
      }
      setTranscript((finalText + interim).trimStart());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stopListening = () => {
    (recRef.current as { stop?: () => void } | null)?.stop?.();
    setListening(false);
  };

  const fillWithAI = async () => {
    if (!transcript.trim()) {
      toast.error("Speak or type a note first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/extract-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "AI extraction failed");
        return;
      }
      onExtract(data.task as ExtractedTask);
      toast.success("Form filled — review & save");
    } catch {
      toast.error("AI request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Sparkles className="h-4 w-4 text-red-600" /> Speak the task
      </div>
      <p className="text-xs text-slate-500">
        {supported
          ? "Tap the mic and just say it naturally. AI fills the form below — review & save."
          : "Voice not supported on this browser — type the note, then tap AI fill."}
      </p>

      <Textarea
        rows={3}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder={
          "Just say it naturally. For example:\n" +
          "“Ask Shoaib to call DeoDap tomorrow about the no-MOQ drift cars, high priority.”\n" +
          "“Get the 1:18 drift catalogue from Ratnaakar this week.”"
        }
      />
      <p className="text-[11px] leading-relaxed text-slate-400">
        Tip — mention any of: <span className="font-medium text-slate-500">who</span> does it
        (Syed / Shoaib) · <span className="font-medium text-slate-500">what</span> to do ·
        which <span className="font-medium text-slate-500">vendor</span> ·
        <span className="font-medium text-slate-500"> when</span> (today, tomorrow, this week) ·
        <span className="font-medium text-slate-500"> priority</span>. Skip anything you don&apos;t
        know — AI fills the rest.
      </p>

      <div className="flex gap-2">
        {supported &&
          (listening ? (
            <Button
              type="button"
              variant="destructive"
              onClick={stopListening}
              className="flex-1"
            >
              <Square className="h-4 w-4" /> Stop
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={startListening}
              className="flex-1"
            >
              <Mic className="h-4 w-4" /> Record
            </Button>
          ))}
        <Button
          type="button"
          onClick={fillWithAI}
          disabled={loading}
          className="flex-1"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Thinking…" : "AI fill"}
        </Button>
      </div>
    </div>
  );
}
