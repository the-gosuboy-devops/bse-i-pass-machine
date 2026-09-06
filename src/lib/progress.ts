import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Grade = {
  letter: string;
  title: string;
  blurb: string;
};

type AnswerRec = { pick: number; correct: boolean };

type ProgressState = {
  answers: Record<string, AnswerRec>;
  streak: number;
  bestStreak: number;
  muted: boolean;
  mark: (id: string, pick: number, correct: boolean) => void;
  toggleMuted: () => void;
  reset: () => void;
};

export function gradeFrom(correct: number, attempted: number): Grade {
  if (attempted === 0) {
    return { letter: "—", title: "Not started", blurb: "Answer a question and the grade fills in." };
  }
  const pct = (correct / attempted) * 100;
  if (pct >= 90) return { letter: "A+", title: "Outstanding", blurb: "You're ready. Sit the paper." };
  if (pct >= 80) return { letter: "A", title: "Ready", blurb: "Recipes are sticking. Keep drilling the misses." };
  if (pct >= 70) return { letter: "B+", title: "Solid", blurb: "A pass is in reach. Finish the remaining machines." };
  if (pct >= 60) return { letter: "B", title: "On track", blurb: "You've got the shape. Tighten the arithmetic." };
  if (pct >= 50) return { letter: "C", title: "Pass line", blurb: "Ten out of twenty. Now add cushion." };
  if (pct >= 35) return { letter: "D", title: "Not yet", blurb: "Go back to the four mandatory machines." };
  return { letter: "F", title: "Start over", blurb: "Read Lesson 1, then do Lessons 3–6. Nothing else." };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      answers: {},
      streak: 0,
      bestStreak: 0,
      muted: false,
      mark: (id, pick, correct) => {
        const prev = get().answers[id];
        if (prev) return; // first answer locks
        const streak = correct ? get().streak + 1 : 0;
        set({
          answers: { ...get().answers, [id]: { pick, correct } },
          streak,
          bestStreak: Math.max(get().bestStreak, streak),
        });
      },
      toggleMuted: () => set({ muted: !get().muted }),
      reset: () => set({ answers: {}, streak: 0, bestStreak: 0 }),
    }),
    { name: "bse1-pass-machine" },
  ),
);

export function playTone(kind: "ok" | "bad", muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = kind === "ok" ? 880 : 220;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.stop(ctx.currentTime + 0.2);
    o.onended = () => ctx.close();
  } catch {
    /* ignore autoplay blocks */
  }
}
