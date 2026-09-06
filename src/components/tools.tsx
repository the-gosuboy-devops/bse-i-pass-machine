"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Calculator, Sigma, Table2, X, BookOpen } from "lucide-react";
import { SOLVERS, defaultValues, type Solver } from "@/lib/solvers";
import { stdNormalCdf, fmt } from "@/lib/math";
import { FORMULA_GROUPS } from "@/lib/content/formulas";
import { cn } from "@/lib/utils";

export type ToolId = "solve" | "tables" | "calc" | "sheet" | null;

export function Dock({ open, onOpen }: { open: ToolId; onOpen: (id: ToolId) => void }) {
  const items: { id: Exclude<ToolId, null>; label: string; icon: typeof Sigma }[] = [
    { id: "solve", label: "Solve", icon: Sigma },
    { id: "tables", label: "Tables", icon: Table2 },
    { id: "calc", label: "Calc", icon: Calculator },
    { id: "sheet", label: "Sheet", icon: BookOpen },
  ];
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 sm:flex-row sm:bottom-5 sm:right-5">
      {items.map((it) => {
        const Icon = it.icon;
        const active = open === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onOpen(active ? null : it.id)}
            className={cn(
              "flex items-center gap-2 min-h-11 px-3.5 rounded-full font-bold text-[0.82rem] uppercase tracking-wide shadow-[var(--shadow-md)] border",
              active ? "bg-ink text-paper border-ink" : "bg-paper text-ink border-line hover:bg-cream-deep",
            )}
          >
            <Icon className="size-4" strokeWidth={2.2} />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToolDrawer({
  open,
  onClose,
  children,
  title,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "bg-paper w-full max-h-[92vh] overflow-y-auto rounded-t-[22px] sm:rounded-[22px] shadow-[var(--shadow-lg)] border border-line",
          wide ? "sm:max-w-[720px]" : "sm:max-w-[520px]",
        )}
      >
        <div className="sticky top-0 bg-paper/95 backdrop-blur-sm flex items-center justify-between px-5 py-3.5 border-b border-line z-10">
          <h3 className="font-display text-[1.15rem] font-semibold m-0">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="size-10 grid place-items-center rounded-full hover:bg-cream-deep"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-4 pb-8">{children}</div>
      </div>
    </div>
  );
}

export function SolverPanel() {
  const [id, setId] = useState(SOLVERS[0].id);
  const solver = SOLVERS.find((s) => s.id === id) as Solver;
  const [vals, setVals] = useState<Record<string, string>>(() => defaultValues(solver));
  const [out, setOut] = useState<ReturnType<Solver["run"]> | null>(null);

  function switchTo(next: string) {
    const s = SOLVERS.find((x) => x.id === next)!;
    setId(next);
    setVals(defaultValues(s));
    setOut(null);
  }

  return (
    <div>
      <p className="text-[0.88rem] text-ink-soft mb-3">
        Pick a recipe, type the numbers from the question, and it shows every step. Defaults are already a worked example.
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
        {SOLVERS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => switchTo(s.id)}
            className={cn(
              "shrink-0 text-[0.75rem] font-semibold px-2.5 py-1.5 rounded-full border min-h-9",
              s.id === id ? "bg-ink text-paper border-ink" : "bg-cream-deep text-ink border-line",
            )}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="text-[0.85rem] italic text-ink-soft mb-3">{solver.blurb}</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {solver.fields.map((f) => (
          <label key={f.key} className="block text-[0.8rem] font-semibold">
            <span className="text-ink-soft">{f.label}</span>
            {f.kind === "sel" ? (
              <select
                className="mt-1 w-full min-h-11 rounded-[10px] border border-line bg-cream px-3 font-medium text-[0.92rem]"
                value={vals[f.key] ?? f.def ?? ""}
                onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="mt-1 w-full min-h-11 rounded-[10px] border border-line bg-cream px-3 font-mono text-[0.92rem]"
                value={vals[f.key] ?? ""}
                inputMode={f.kind === "num" ? "decimal" : "text"}
                onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOut(solver.run(vals))}
        className="mt-4 w-full min-h-11 rounded-full bg-ink text-paper font-bold hover:opacity-90"
      >
        Solve →
      </button>
      {out?.error ? (
        <p className="mt-3 text-bad font-semibold">{out.error}</p>
      ) : null}
      {out && !out.error ? (
        <div className="mt-4 rounded-[14px] bg-cream-deep p-3.5">
          <ol className="list-decimal pl-5 space-y-1.5 font-mono text-[0.86rem]">
            {out.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <div className="mt-3 font-display font-semibold text-[1.05rem] bg-mint rounded-[10px] px-3 py-2">
            {out.answer}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function zRows() {
  const rows: { z: string; cells: number[] }[] = [];
  for (let i = -34; i <= 34; i++) {
    const base = i / 10;
    const cells: number[] = [];
    for (let d = 0; d <= 9; d++) {
      const z = base >= 0 ? base + d / 100 : base - d / 100;
      cells.push(stdNormalCdf(z));
    }
    rows.push({ z: base.toFixed(1), cells });
  }
  return rows;
}

export function TablesPanel() {
  const rows = useMemo(zRows, []);
  const [q, setQ] = useState("1.96");
  const z = Number(q);
  const p = Number.isFinite(z) ? stdNormalCdf(z) : NaN;

  return (
    <div>
      <p className="text-[0.88rem] text-ink-soft mb-3">
        Standard normal left-tail P(Z ≤ z). Type a z to look it up, or scroll the table.
      </p>
      <label className="block text-[0.8rem] font-semibold mb-3">
        <span className="text-ink-soft">z</span>
        <div className="flex gap-2 mt-1">
          <input
            className="flex-1 min-h-11 rounded-[10px] border border-line bg-cream px-3 font-mono"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="min-h-11 rounded-[10px] bg-mint px-3 grid place-items-center font-mono font-semibold tabular-nums">
            {Number.isFinite(p) ? fmt(p, 4) : "—"}
          </div>
        </div>
      </label>
      <div className="overflow-auto max-h-[50vh] rounded-[10px] border border-line">
        <table className="text-[0.72rem] font-mono w-full">
          <thead className="sticky top-0 bg-ink text-paper">
            <tr>
              <th className="px-2 py-1.5 text-left">z</th>
              {Array.from({ length: 10 }, (_, i) => (
                <th key={i} className="px-1.5 py-1.5">
                  0.0{i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.z} className="odd:bg-cream even:bg-paper border-b border-line/60">
                <td className="px-2 py-1 font-bold">{r.z}</td>
                {r.cells.map((c, i) => (
                  <td key={i} className="px-1.5 py-1 tabular-nums">
                    {c.toFixed(4)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function safeEval(expr: string): number {
  let s = expr.replace(/\s/g, "");
  s = s.replace(/√\(/g, "Math.sqrt(");
  s = s.replace(/(\d+\.?\d*)²/g, "Math.pow($1,2)");
  s = s.replace(/\)²/g, ")**2");
  if (!/^[0-9+\-*/().eMathsqrtpow,]+$/.test(s)) throw new Error("bad");
  const n = Function(`"use strict"; return (${s})`)() as number;
  if (typeof n !== "number" || !Number.isFinite(n)) throw new Error("nan");
  return n;
}

export function CalcPanel() {
  const [expr, setExpr] = useState("");
  const [val, setVal] = useState("0");
  const [err, setErr] = useState(false);

  function press(t: string) {
    setErr(false);
    if (t === "C") {
      setExpr("");
      setVal("0");
      return;
    }
    if (t === "⌫") {
      setExpr((e) => e.slice(0, -1));
      return;
    }
    if (t === "=") {
      try {
        const n = safeEval(expr);
        setVal(fmt(n, 8));
      } catch {
        setErr(true);
        setVal("Error");
      }
      return;
    }
    if (t === "√") {
      setExpr((e) => e + "√(");
      return;
    }
    setExpr((e) => e + t);
  }

  const keys = ["C", "⌫", "(", ")", "7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "√", "+", "x²", "="];

  return (
    <div>
      <div className="rounded-[14px] bg-cream-deep px-4 py-3 mb-3">
        <div className="font-mono text-[0.8rem] text-ink-soft min-h-5 break-all">{expr || " "}</div>
        <div className={cn("font-mono text-3xl font-semibold tabular-nums", err && "text-bad")}>{val}</div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k === "x²" ? "²" : k)}
            className={cn(
              "min-h-12 rounded-[12px] font-bold text-[1.02rem] border border-line",
              k === "=" ? "bg-ink text-paper col-span-2" : "bg-paper hover:bg-cream-deep",
              (k === "C" || k === "⌫") && "bg-peach",
            )}
          >
            {k}
          </button>
        ))}
      </div>
      <p className="text-[0.8rem] text-ink-soft mt-3">
        √ opens a bracket — type √(18) then ). x² squares the number you just typed. Need a full recipe instead? Use Solve.
      </p>
    </div>
  );
}

export function SheetPanel() {
  return (
    <div className="space-y-5">
      {FORMULA_GROUPS.map((g) => (
        <section key={g.id}>
          <h4 className="font-display text-[1.05rem] font-semibold mb-2">{g.title}</h4>
          <div className="overflow-x-auto rounded-[10px] bg-cream-deep">
            <table className="w-full text-[0.86rem]">
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.name} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 font-semibold w-[38%] align-top">{r.name}</td>
                    <td className="px-3 py-2 font-mono text-[0.84rem]">{r.formula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
