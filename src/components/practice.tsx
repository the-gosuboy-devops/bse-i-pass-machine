"use client";

import { useState } from "react";
import type { Question } from "@/lib/content/types";
import { playTone, useProgress } from "@/lib/progress";
import { RichText } from "./rich-text";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E"];

export function Practice({
  q,
  index,
  total,
}: {
  q: Question;
  index: number;
  total: number;
}) {
  const rec = useProgress((s) => s.answers[q.id]);
  const mark = useProgress((s) => s.mark);
  const muted = useProgress((s) => s.muted);
  const [picked, setPicked] = useState<number | null>(rec?.pick ?? null);

  const locked = rec !== undefined;
  const shown = locked ? rec.pick : picked;

  function hit(i: number) {
    if (locked) return;
    setPicked(i);
    const ok = i === q.answer;
    mark(q.id, i, ok);
    playTone(ok ? "ok" : "bad", muted);
  }

  return (
    <div className="mt-4 rounded-2xl border-[1.5px] border-dashed border-peach-deep bg-linear-to-br from-cream to-cream-deep p-4 sm:p-[1.15rem]">
      <div className="font-display italic font-semibold text-[1.02rem] mb-2">
        Practice {index + 1} of {total}{" "}
        <span
          className={cn(
            "ml-2 not-italic font-sans text-[0.68rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md",
            q.src === "exam" ? "bg-peach text-[#8a4a1f]" : "bg-lilac text-[#5a3f8e]",
          )}
        >
          {q.src === "exam" ? "Exam-style" : "Concept"}
        </span>
      </div>
      {q.story ? (
        <p className="text-[0.92rem] text-ink-soft italic mb-2">{q.story}</p>
      ) : null}
      <p className="font-medium mb-3 leading-snug">{q.prompt}</p>
      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          const isPick = shown === i;
          const isAns = locked && i === q.answer;
          const isWrong = locked && isPick && i !== q.answer;
          return (
            <button
              key={i}
              type="button"
              onClick={() => hit(i)}
              disabled={locked}
              className={cn(
                "flex items-start gap-3 text-left rounded-[12px] px-3 py-2.5 min-h-11 border transition-colors duration-150",
                "bg-paper border-line hover:border-ink/30",
                isAns && "bg-good-bg border-good",
                isWrong && "bg-bad-bg border-bad",
                !locked && isPick && "border-ink",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 size-6 shrink-0 rounded-full border border-line grid place-items-center text-[0.75rem] font-bold",
                  isAns && "bg-good text-paper border-good",
                  isWrong && "bg-bad text-paper border-bad",
                )}
              >
                {LETTERS[i]}
              </span>
              <span className="text-[0.95rem] leading-snug pt-0.5">{opt}</span>
            </button>
          );
        })}
      </div>
      {locked ? (
        <div
          className={cn(
            "mt-3 rounded-[12px] px-3 py-2.5 text-[0.92rem] leading-relaxed",
            rec.correct ? "bg-good-bg" : "bg-bad-bg",
          )}
        >
          <div className="font-bold text-[0.72rem] uppercase tracking-wide mb-1">
            {rec.correct ? "Correct" : "Not this one"}
          </div>
          <RichText text={q.explain} />
        </div>
      ) : null}
    </div>
  );
}
