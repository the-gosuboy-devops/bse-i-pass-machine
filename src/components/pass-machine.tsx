"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Volume2, VolumeX, Star, Flame } from "lucide-react";
import { ALL_LESSONS } from "@/lib/content/lessons";
import { TIER_META, type Lesson } from "@/lib/content/types";
import { gradeFrom, useProgress } from "@/lib/progress";
import { Blocks } from "./blocks";
import { Practice } from "./practice";
import {
  CalcPanel,
  Dock,
  SheetPanel,
  SolverPanel,
  TablesPanel,
  ToolDrawer,
  type ToolId,
} from "./tools";
import { cn } from "@/lib/utils";

const NUDGES = [
  "Four lessons down. Stand up, shake out your hands.",
  "Hydrate. Then straight back in.",
  "Small wins every few minutes is exactly how this works.",
  "You are further along than you feel.",
];

function useStats() {
  const answers = useProgress((s) => s.answers);
  return useMemo(() => {
    const ids = Object.keys(answers);
    const attempted = ids.length;
    const correct = ids.filter((id) => answers[id].correct).length;
    const total = ALL_LESSONS.reduce((n, l) => n + l.questions.length, 0);
    const doneLessons = ALL_LESSONS.filter((l) =>
      l.questions.every((q) => answers[q.id]),
    ).length;
    return { attempted, correct, total, doneLessons };
  }, [answers]);
}

function Topbar() {
  const { correct, attempted, total } = useStats();
  const streak = useProgress((s) => s.streak);
  const muted = useProgress((s) => s.muted);
  const toggleMuted = useProgress((s) => s.toggleMuted);
  const reset = useProgress((s) => s.reset);
  const pct = total ? (attempted / total) * 100 : 0;

  return (
    <header className="fixed top-0 inset-x-0 z-30 bg-paper/93 backdrop-blur-[14px] border-b border-line">
      <div className="max-w-[920px] mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2 font-display font-bold text-[1.05rem]">
            <span className="size-[11px] rounded-full bg-coral-deep shadow-[0_0_0_4px_rgba(255,122,114,0.18)]" />
            BSE I · Pass Machine
          </a>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className="stat-pill bg-mint text-[#2c6b3d] font-bold text-[0.83rem] px-2.5 py-1 rounded-full inline-flex items-center gap-1 tabular-nums">
              <Star className="size-3.5" fill="currentColor" />
              {correct}
            </span>
            <span className="stat-pill bg-peach text-[#8a4a1f] font-bold text-[0.83rem] px-2.5 py-1 rounded-full inline-flex items-center gap-1 tabular-nums">
              <Flame className="size-3.5" />
              {streak}
            </span>
            <button
              type="button"
              onClick={toggleMuted}
              className="size-9 grid place-items-center rounded-full bg-cream-deep border border-line text-ink-soft"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Reset all answers and streaks?")) reset();
              }}
              className="size-9 grid place-items-center rounded-full bg-cream-deep border border-line text-ink-soft"
              aria-label="Reset progress"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-cream-deep rounded-full overflow-hidden mt-2">
          <div
            className="h-full rounded-full bg-linear-to-r from-mint-deep via-sky-deep to-lilac-deep transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[0.75rem] text-ink-soft mt-1 tabular-nums">
          Correct so far: <b className="text-ink">{correct}/{attempted || 0}</b>
          {" · "}
          {total} questions · progress saves automatically
        </p>
      </div>
    </header>
  );
}

function LessonCard({ lesson, index }: { lesson: Lesson; index: number }) {
  const answers = useProgress((s) => s.answers);
  const done = lesson.questions.every((q) => answers[q.id]);
  const meta = TIER_META[lesson.tier];
  return (
    <article
      id={`lesson-${lesson.id}`}
      className={cn(
        "bg-paper rounded-[20px] p-5 sm:p-6 mb-4 border border-line shadow-[var(--shadow-sm)] scroll-mt-28",
        done && "done",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <span
            className={cn(
              "size-8 shrink-0 rounded-full grid place-items-center font-bold text-[0.9rem] text-paper",
              done ? "bg-good" : "bg-ink",
            )}
          >
            {lesson.pos}
          </span>
          <h3 className="font-display text-[1.22rem] sm:text-[1.28rem] font-semibold m-0 leading-snug">
            {lesson.title}
          </h3>
        </div>
        <span className={cn("shrink-0 text-[0.68rem] font-bold px-2 py-1 rounded-md uppercase tracking-wide", meta.tagClass)}>
          {meta.tag}
        </span>
      </div>
      <p className="text-[0.86rem] text-ink-soft italic ml-11">{lesson.sub}</p>
      <div className="flex flex-wrap gap-2 mt-2 ml-11">
        {lesson.lastPaper || lesson.older ? (
          <>
            <span className="text-[0.75rem] bg-cream-deep rounded-full px-2.5 py-0.5">
              Typical paper: <b>{lesson.lastPaper}</b> Qs
            </span>
            <span className="text-[0.75rem] bg-cream-deep rounded-full px-2.5 py-0.5">
              Older papers: <b>{lesson.older}</b>
            </span>
          </>
        ) : (
          <span className="text-[0.75rem] bg-cream-deep rounded-full px-2.5 py-0.5">
            Strategy — no marks of its own
          </span>
        )}
      </div>
      <div className="mt-4">
        <Blocks blocks={lesson.body} />
        {lesson.questions.map((q, qi) => (
          <Practice key={q.id} q={q} index={qi} total={lesson.questions.length} />
        ))}
      </div>
      {index > 0 && (index + 1) % 4 === 0 && index + 1 < ALL_LESSONS.length ? (
        <p className="mt-5 text-center font-display italic text-ink-soft">{NUDGES[Math.floor(index / 4) % NUDGES.length]}</p>
      ) : null}
    </article>
  );
}

function GradeCard() {
  const { correct, attempted, total } = useStats();
  const best = useProgress((s) => s.bestStreak);
  const g = gradeFrom(correct, attempted || 1);
  const display = attempted === 0 ? gradeFrom(0, 0) : g;
  const acc = attempted ? Math.round((correct / attempted) * 100) : 0;

  return (
    <section id="grade" className="bg-paper rounded-[22px] border border-line p-6 sm:p-8 text-center shadow-[var(--shadow-sm)] mb-8">
      <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-ink-soft">Your running grade</p>
      <div className="font-display text-[4.5rem] leading-none font-semibold mt-2">{display.letter}</div>
      <h2 className="mt-2 mb-1">{display.title}</h2>
      <p className="text-ink-soft max-w-md mx-auto">{display.blurb}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          [String(correct), "Correct"],
          [String(attempted), "Attempted"],
          [`${acc}%`, "Accuracy"],
          [String(best), "Best streak"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-[14px] bg-cream-deep py-3">
            <div className="font-display text-2xl font-semibold tabular-nums">{v}</div>
            <div className="text-[0.75rem] text-ink-soft uppercase tracking-wide">{l}</div>
          </div>
        ))}
      </div>
      <p className="text-[0.8rem] text-ink-soft mt-4">
        {total} practice questions on this page · first answer locks in
      </p>
    </section>
  );
}

export function PassMachine() {
  const [tool, setTool] = useState<ToolId>(null);
  const grouped = useMemo(() => {
    const m = new Map<1 | 2 | 3, Lesson[]>();
    for (const l of ALL_LESSONS) {
      const arr = m.get(l.tier) ?? [];
      arr.push(l);
      m.set(l.tier, arr);
    }
    return m;
  }, []);

  return (
    <div id="top" className="min-h-screen">
      <Topbar />
      <main className="max-w-[920px] mx-auto px-4 pt-28 pb-36">
        <section className="text-center py-8 sm:py-10">
          <p className="inline-block bg-butter text-[#8a6f1a] text-[0.76rem] font-bold tracking-[0.05em] uppercase rounded-full px-3.5 py-1 mb-4">
            Business Statistics for Entrepreneurs I
          </p>
          <h1 className="text-[clamp(2rem,5vw,3.4rem)] font-bold mb-3">
            Ten right out of twenty.
            <br />
            <em className="italic text-coral-deep font-semibold">That's the whole job.</em>
          </h1>
          <p className="text-[1.08rem] text-ink-soft max-w-[600px] mx-auto mb-6">
            20 MCQs, 4–5 marks each, no partial credit. Every answer is a range, so rough arithmetic is enough. This page
            teaches the recipes in the order that banks marks fastest — then makes you solve them.
          </p>
          <a
            href="#lesson-1"
            className="inline-flex items-center justify-center min-h-12 px-7 rounded-full bg-ink text-paper font-bold shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-transform"
          >
            Start — zero knowledge assumed
          </a>
        </section>

        <section className="bg-paper rounded-[20px] border border-line p-5 sm:p-6 shadow-[var(--shadow-sm)] mb-6">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.06em] text-ink-soft mb-1">
            How this paper actually works
          </p>
          <h2 className="mb-3">Why spreading effort evenly is how people fail</h2>
          <p className="mb-3">
            BSE I is four modules on paper and <b>four machines</b> in the exam hall. Definitions of "nominal scale"
            show up maybe once. Counting, expected value, and a z-score show up constantly. Any prep that walked the notes
            from page 1 to page 11 in order was spending the first hour on 15% of the marks.
          </p>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            {[
              ["1", "The paper is 80% four machines", "Expected value, binomial, Poisson, normal. Name the machine, plug the numbers, circle a range."],
              ["2", "Questions arrive as a story plus two follow-ups", "One Poisson setup becomes P(Y=0), then E[Y], then a 15-minute rescale. One recipe = three marks."],
              ["3", "What the notes bury", "Memoryless, Var(X−Y) still adding, Bayes on a rare event, CV for comparing two series. Those are the trap marks."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-[16px] bg-cream-deep p-4">
                <div className="font-display text-2xl font-semibold text-coral-deep">{n}</div>
                <h4 className="mt-1 mb-1">{t}</h4>
                <p className="text-[0.88rem] text-ink-soft m-0">{d}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[14px] bg-formula border-l-4 border-lilac-deep px-4 py-3 mb-4">
            <div className="font-extrabold uppercase tracking-[0.04em] text-[0.69rem] text-[#5a3f8e] mb-1">
              The pass arithmetic, in one box
            </div>
            <p className="m-0 font-medium">
              20 MCQs × 4–5 marks · no partial credit · <b>10 right = 50% = pass</b>
              <br />
              Lessons 3–6 (expected value, binomial, Poisson, normal) are the minimum path. Two hours, worked honestly,
              is enough.
            </p>
          </div>
          <h4 className="mb-2">Jump to any lesson</h4>
          <ol className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[0.92rem]">
            {ALL_LESSONS.map((l) => (
              <li key={l.id}>
                <a href={`#lesson-${l.id}`} className="hover:text-coral-deep underline-offset-2 hover:underline">
                  {l.pos}. {l.title.replace(/^Read this first — /, "")}
                </a>
              </li>
            ))}
          </ol>
        </section>

        <p className="font-display italic text-center text-[1.03rem] font-medium bg-linear-to-br from-lilac to-sky rounded-[18px] px-4 py-3.5 mb-8 shadow-[var(--shadow-sm)]">
          You are not learning statistics — you are learning nine recipes and where to look things up.
        </p>

        {([1, 2, 3] as const).map((tier) => {
          const meta = TIER_META[tier];
          const list = grouped.get(tier) ?? [];
          return (
            <div key={tier}>
              <div className={cn("rounded-2xl px-4 py-3.5 mb-4 flex items-center gap-3", meta.headerClass)}>
                <div>
                  <h2 className="text-[1.4rem] m-0">{meta.label}</h2>
                  <p className="m-0 text-[0.88rem] opacity-85">{meta.sub}</p>
                </div>
              </div>
              {list.map((l) => (
                <LessonCard key={l.id} lesson={l} index={ALL_LESSONS.indexOf(l)} />
              ))}
            </div>
          );
        })}

        <GradeCard />

        <p className="text-center">
          <a href="#top" className="font-semibold text-ink-soft hover:text-ink">
            Back to the top
          </a>
        </p>
      </main>

      <Dock open={tool} onOpen={setTool} />
      <ToolDrawer open={tool === "solve"} onClose={() => setTool(null)} title="Step-by-step solvers" wide>
        <SolverPanel />
      </ToolDrawer>
      <ToolDrawer open={tool === "tables"} onClose={() => setTool(null)} title="Standard normal table" wide>
        <TablesPanel />
      </ToolDrawer>
      <ToolDrawer open={tool === "calc"} onClose={() => setTool(null)} title="Calculator">
        <CalcPanel />
      </ToolDrawer>
      <ToolDrawer open={tool === "sheet"} onClose={() => setTool(null)} title="Formula sheet" wide>
        <SheetPanel />
      </ToolDrawer>
    </div>
  );
}
