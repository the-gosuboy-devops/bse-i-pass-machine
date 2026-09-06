import {
  binomCdf,
  binomPmf,
  combinations,
  fmt,
  mean,
  median,
  modes,
  parseList,
  percentileAt,
  poissonCdf,
  poissonPmf,
  round,
  sampleSd,
  sampleVariance,
  stdNormalCdf,
} from "@/lib/math";

export type Field =
  | { kind: "num"; key: string; label: string; def?: string; hint?: string }
  | { kind: "text"; key: string; label: string; def?: string; hint?: string }
  | { kind: "sel"; key: string; label: string; options: { value: string; label: string }[]; def?: string };

export type SolverResult = { steps: string[]; answer: string; error?: string };

export type Solver = {
  id: string;
  name: string;
  blurb: string;
  fields: Field[];
  run: (v: Record<string, string>) => SolverResult;
};

function num(v: Record<string, string>, key: string): number {
  const n = Number(String(v[key] ?? "").replace(/,/g, "").trim());
  return n;
}

function ord(n: number): string {
  const m = n % 100;
  if (m >= 11 && m <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export const SOLVERS: Solver[] = [
  {
    id: "center",
    name: "Mean · median · mode",
    blurb: "Paste a list. Outliers pull the mean; the median ignores them.",
    fields: [
      {
        kind: "text",
        key: "data",
        label: "Numbers (spaces or commas)",
        def: "12, 15, 18, 20, 90",
        hint: "e.g. 12 15 18 20 90",
      },
    ],
    run: (v) => {
      const xs = parseList(v.data ?? "");
      if (xs.length < 1) return { steps: [], answer: "", error: "Need at least one number." };
      const sorted = [...xs].sort((a, b) => a - b);
      const m = mean(xs);
      const med = median(xs);
      const mo = modes(xs);
      const steps = [
        `Sorted: ${sorted.join(", ")}`,
        `n = ${xs.length}`,
        `Mean = Σx / n = ${fmt(xs.reduce((a, b) => a + b, 0))} / ${xs.length} = ${fmt(m)}`,
        xs.length % 2
          ? `Median = middle value = ${fmt(med)}`
          : `Median = average of two middle values = ${fmt(med)}`,
        mo.length ? `Mode = ${mo.map((x) => fmt(x)).join(", ")}` : "Mode = none (every value appears once)",
      ];
      return {
        steps,
        answer: `mean ${fmt(m)}  ·  median ${fmt(med)}  ·  mode ${mo.length ? mo.map((x) => fmt(x)).join(", ") : "—"}`,
      };
    },
  },
  {
    id: "spread",
    name: "Variance · SD · CV",
    blurb: "Sample divisor is n−1. CV lets you compare apples to oranges.",
    fields: [
      { kind: "text", key: "data", label: "Numbers", def: "10, 12, 14, 16, 18" },
    ],
    run: (v) => {
      const xs = parseList(v.data ?? "");
      if (xs.length < 2) return { steps: [], answer: "", error: "Need at least two numbers." };
      const m = mean(xs);
      const s2 = sampleVariance(xs);
      const s = sampleSd(xs);
      const cv = (s / m) * 100;
      const steps = [
        `Mean x̄ = ${fmt(m)}`,
        `Squared deviations: ${xs.map((x) => `(${fmt(x)}−${fmt(m)})² = ${fmt((x - m) ** 2)}`).join("; ")}`,
        `Sample variance s² = Σ(x−x̄)² / (n−1) = ${fmt(xs.reduce((a, x) => a + (x - m) ** 2, 0))} / ${xs.length - 1} = ${fmt(s2)}`,
        `s = √s² = ${fmt(s)}  (same units as the data)`,
        `CV = (s / x̄) × 100 = (${fmt(s)} / ${fmt(m)}) × 100 = ${fmt(cv, 2)}%`,
      ];
      return { steps, answer: `s² = ${fmt(s2)}  ·  s = ${fmt(s)}  ·  CV = ${fmt(cv, 2)}%` };
    },
  },
  {
    id: "zscore",
    name: "Z-score & outlier rule",
    blurb: "How many SDs from the mean. |z| > 3 is the outlier flag.",
    fields: [
      { kind: "num", key: "x", label: "x (the value)", def: "85" },
      { kind: "num", key: "mu", label: "Mean x̄ or μ", def: "70" },
      { kind: "num", key: "s", label: "Standard deviation s or σ", def: "5" },
    ],
    run: (v) => {
      const x = num(v, "x");
      const mu = num(v, "mu");
      const s = num(v, "s");
      if (s === 0) return { steps: [], answer: "", error: "SD cannot be 0." };
      const z = (x - mu) / s;
      const steps = [
        `z = (x − mean) / s = (${fmt(x)} − ${fmt(mu)}) / ${fmt(s)} = ${fmt(z)}`,
        `Standardized data has mean 0 and SD 1.`,
        Math.abs(z) > 3
          ? `|z| = ${fmt(Math.abs(z))} > 3 → this point is an outlier.`
          : `|z| = ${fmt(Math.abs(z))} ≤ 3 → not an outlier by the z-rule.`,
      ];
      return { steps, answer: `z = ${fmt(z)}${Math.abs(z) > 3 ? "  ·  OUTLIER" : ""}` };
    },
  },
  {
    id: "iqr",
    name: "IQR & box-plot fences",
    blurb: "Q3 − Q1. Fences at Q1 − 1.5·IQR and Q3 + 1.5·IQR.",
    fields: [
      { kind: "num", key: "q1", label: "Q1 (25th percentile)", def: "20" },
      { kind: "num", key: "q3", label: "Q3 (75th percentile)", def: "32" },
    ],
    run: (v) => {
      const q1 = num(v, "q1");
      const q3 = num(v, "q3");
      const iqr = q3 - q1;
      const lo = q1 - 1.5 * iqr;
      const hi = q3 + 1.5 * iqr;
      const steps = [
        `IQR = Q3 − Q1 = ${fmt(q3)} − ${fmt(q1)} = ${fmt(iqr)}`,
        `Lower fence = Q1 − 1.5 × IQR = ${fmt(q1)} − 1.5 × ${fmt(iqr)} = ${fmt(lo)}`,
        `Upper fence = Q3 + 1.5 × IQR = ${fmt(q3)} + 1.5 × ${fmt(iqr)} = ${fmt(hi)}`,
        `Whiskers stop at the last point inside the fences. Anything outside is plotted as an outlier.`,
      ];
      return { steps, answer: `IQR = ${fmt(iqr)}  ·  fences (${fmt(lo)}, ${fmt(hi)})` };
    },
  },
  {
    id: "percentile",
    name: "Percentile · quartiles",
    blurb: "L_p = (p/100)(n+1). Interpolate when the location is not a whole number. Excel PERCENTILE.EXC.",
    fields: [
      {
        kind: "text",
        key: "data",
        label: "Sorted or unsorted numbers",
        def: "6, 7, 8, 10, 12, 14, 15, 18, 20",
      },
      { kind: "num", key: "p", label: "Percentile p (e.g. 25, 40, 75)", def: "25" },
    ],
    run: (v) => {
      const xs = parseList(v.data ?? "");
      const p = num(v, "p");
      if (xs.length < 1) return { steps: [], answer: "", error: "Need at least one number." };
      if (p <= 0 || p >= 100) return { steps: [], answer: "", error: "p must be between 0 and 100, exclusive." };
      const r = percentileAt(xs, p);
      const q1 = percentileAt(xs, 25);
      const q2 = percentileAt(xs, 50);
      const q3 = percentileAt(xs, 75);
      const iqr = q3.value - q1.value;
      const loF = q1.value - 1.5 * iqr;
      const hiF = q3.value + 1.5 * iqr;
      const steps = [
        `Sorted (n = ${r.n}): ${r.sorted.join(", ")}`,
        `L_p = (p/100)(n + 1) = (${fmt(p)}/100)×${r.n + 1} = ${fmt(r.Lp, 3)}`,
        r.method === "exact"
          ? `L_p is a whole number, so the ${r.lo}${ord(r.lo)} sorted value = ${fmt(r.value)}`
          : `Between the ${r.lo}${ord(r.lo)} value (${fmt(r.sorted[r.lo - 1])}) and the ${r.hi}${ord(r.hi)} (${fmt(r.sorted[r.hi - 1])}). Interpolate: ${fmt(r.sorted[r.lo - 1])} + ${fmt(r.frac, 3)}×(${fmt(r.sorted[r.hi - 1])} − ${fmt(r.sorted[r.lo - 1])}) = ${fmt(r.value)}`,
        `Q1 (25th) = ${fmt(q1.value)}    Q2 / median (50th) = ${fmt(q2.value)}    Q3 (75th) = ${fmt(q3.value)}`,
        `IQR = ${fmt(iqr)}    fences (${fmt(loF)}, ${fmt(hiF)})`,
        `Five-number summary: ${fmt(r.sorted[0])}, ${fmt(q1.value)}, ${fmt(q2.value)}, ${fmt(q3.value)}, ${fmt(r.sorted[r.n - 1])}`,
      ];
      return {
        steps,
        answer: `${fmt(p)}th percentile = ${fmt(r.value)}  ·  IQR ${fmt(iqr)}`,
      };
    },
  },
  {
    id: "cond",
    name: "Conditional probability",
    blurb: "P(A|B) = P(A ∩ B) / P(B). The given-that machine.",
    fields: [
      { kind: "num", key: "both", label: "P(A ∩ B)", def: "0.12" },
      { kind: "num", key: "b", label: "P(B)", def: "0.4" },
    ],
    run: (v) => {
      const both = num(v, "both");
      const b = num(v, "b");
      if (b === 0) return { steps: [], answer: "", error: "P(B) cannot be 0." };
      const p = both / b;
      const steps = [
        `P(A|B) = P(A ∩ B) / P(B)`,
        `= ${fmt(both)} / ${fmt(b)} = ${fmt(p)}`,
        `Read it as: of the world where B already happened, what fraction is also A.`,
      ];
      return { steps, answer: `P(A|B) = ${fmt(p)}` };
    },
  },
  {
    id: "bayes",
    name: "Bayes (two groups)",
    blurb: "Prior × likelihood, then divide by the total probability of the evidence.",
    fields: [
      { kind: "num", key: "prior", label: "P(A) prior", def: "0.01" },
      { kind: "num", key: "hit", label: "P(D|A)  (true positive)", def: "0.99" },
      { kind: "num", key: "fa", label: "P(D|Aᶜ)  (false positive)", def: "0.05" },
    ],
    run: (v) => {
      const pA = num(v, "prior");
      const pDA = num(v, "hit");
      const pDAc = num(v, "fa");
      const pAc = 1 - pA;
      const jointA = pA * pDA;
      const jointAc = pAc * pDAc;
      const pD = jointA + jointAc;
      const post = jointA / pD;
      const steps = [
        `P(Aᶜ) = 1 − P(A) = ${fmt(pAc)}`,
        `P(D ∩ A) = P(A) × P(D|A) = ${fmt(pA)} × ${fmt(pDA)} = ${fmt(jointA)}`,
        `P(D ∩ Aᶜ) = P(Aᶜ) × P(D|Aᶜ) = ${fmt(pAc)} × ${fmt(pDAc)} = ${fmt(jointAc)}`,
        `P(D) = ${fmt(jointA)} + ${fmt(jointAc)} = ${fmt(pD)}`,
        `P(A|D) = ${fmt(jointA)} / ${fmt(pD)} = ${fmt(post)}`,
      ];
      return { steps, answer: `P(A|D) = ${fmt(post)}   (${fmt(post * 100, 2)}%)` };
    },
  },
  {
    id: "ev",
    name: "Discrete E[X] and Var(X)",
    blurb: "Long-run average of a probability table. Break-even premium = E[claim].",
    fields: [
      { kind: "text", key: "xs", label: "Values x  (spaces/commas)", def: "0, 1, 2, 3" },
      { kind: "text", key: "ps", label: "Probabilities f(x)", def: "0.1, 0.4, 0.3, 0.2" },
    ],
    run: (v) => {
      const xs = parseList(v.xs ?? "");
      const ps = parseList(v.ps ?? "");
      if (xs.length !== ps.length || xs.length === 0) {
        return { steps: [], answer: "", error: "Need matching lists of x and f(x)." };
      }
      const sumP = ps.reduce((a, b) => a + b, 0);
      const mu = xs.reduce((a, x, i) => a + x * ps[i], 0);
      const varr = xs.reduce((a, x, i) => a + (x - mu) ** 2 * ps[i], 0);
      const steps = [
        `Check: Σ f(x) = ${fmt(sumP)}${Math.abs(sumP - 1) > 0.02 ? "  ← should be 1" : "  ✓"}`,
        ...xs.map((x, i) => `x·f(x): ${fmt(x)} × ${fmt(ps[i])} = ${fmt(x * ps[i])}`),
        `E[X] = Σ x f(x) = ${fmt(mu)}`,
        ...xs.map(
          (x, i) =>
            `(x−μ)² f(x): (${fmt(x)}−${fmt(mu)})² × ${fmt(ps[i])} = ${fmt((x - mu) ** 2 * ps[i])}`,
        ),
        `Var(X) = ${fmt(varr)}`,
        `SD(X) = √Var = ${fmt(Math.sqrt(varr))}`,
      ];
      return { steps, answer: `E[X] = ${fmt(mu)}  ·  Var = ${fmt(varr)}  ·  SD = ${fmt(Math.sqrt(varr))}` };
    },
  },
  {
    id: "linear",
    name: "Linear combo Y = aX + b",
    blurb: "Mean scales and shifts. Variance scales by a². The +b does nothing to spread.",
    fields: [
      { kind: "num", key: "a", label: "a (scale)", def: "2" },
      { kind: "num", key: "b", label: "b (shift)", def: "5" },
      { kind: "num", key: "ex", label: "E[X]", def: "10" },
      { kind: "num", key: "vx", label: "Var(X)", def: "4" },
    ],
    run: (v) => {
      const a = num(v, "a");
      const b = num(v, "b");
      const ex = num(v, "ex");
      const vx = num(v, "vx");
      const ey = a * ex + b;
      const vy = a * a * vx;
      const steps = [
        `E[Y] = a E[X] + b = ${fmt(a)} × ${fmt(ex)} + ${fmt(b)} = ${fmt(ey)}`,
        `Var(Y) = a² Var(X) = (${fmt(a)})² × ${fmt(vx)} = ${fmt(vy)}`,
        `SD(Y) = |a| × SD(X) = ${fmt(Math.abs(a))} × ${fmt(Math.sqrt(vx))} = ${fmt(Math.sqrt(vy))}`,
        `Shifting by b moves the centre and leaves the spread alone.`,
      ];
      return { steps, answer: `E[Y] = ${fmt(ey)}  ·  Var(Y) = ${fmt(vy)}  ·  SD(Y) = ${fmt(Math.sqrt(vy))}` };
    },
  },
  {
    id: "iid",
    name: "Sum / average of n i.i.d.",
    blurb: "Sum: mean nμ, SD √n · σ. Average: mean stays μ, SD shrinks as σ/√n.",
    fields: [
      { kind: "num", key: "n", label: "n", def: "16" },
      { kind: "num", key: "mu", label: "μ of each Xi", def: "50" },
      { kind: "num", key: "sig", label: "σ of each Xi", def: "8" },
    ],
    run: (v) => {
      const n = num(v, "n");
      const mu = num(v, "mu");
      const sig = num(v, "sig");
      const steps = [
        `Sum S = X₁+…+Xₙ`,
        `E[S] = nμ = ${fmt(n)} × ${fmt(mu)} = ${fmt(n * mu)}`,
        `SD(S) = √n · σ = ${fmt(Math.sqrt(n))} × ${fmt(sig)} = ${fmt(Math.sqrt(n) * sig)}`,
        `Average X̄`,
        `E[X̄] = μ = ${fmt(mu)}  (the mean does not move)`,
        `SD(X̄) = σ / √n = ${fmt(sig)} / ${fmt(Math.sqrt(n))} = ${fmt(sig / Math.sqrt(n))}`,
      ];
      return {
        steps,
        answer: `E[S]=${fmt(n * mu)}, SD(S)=${fmt(Math.sqrt(n) * sig)}  ·  E[X̄]=${fmt(mu)}, SD(X̄)=${fmt(sig / Math.sqrt(n))}`,
      };
    },
  },
  {
    id: "port",
    name: "Two-asset portfolio",
    blurb: "Z = w₁X + w₂Y. Negative correlation is the risk-reduction trick.",
    fields: [
      { kind: "num", key: "w1", label: "w₁  (weight on X)", def: "0.6" },
      { kind: "num", key: "w2", label: "w₂  (weight on Y)", def: "0.4" },
      { kind: "num", key: "ex", label: "E[X]", def: "0.12" },
      { kind: "num", key: "ey", label: "E[Y]", def: "0.08" },
      { kind: "num", key: "sx", label: "σ_X", def: "0.2" },
      { kind: "num", key: "sy", label: "σ_Y", def: "0.1" },
      { kind: "num", key: "r", label: "Correlation r", def: "-0.3" },
    ],
    run: (v) => {
      const w1 = num(v, "w1");
      const w2 = num(v, "w2");
      const ex = num(v, "ex");
      const ey = num(v, "ey");
      const sx = num(v, "sx");
      const sy = num(v, "sy");
      const r = num(v, "r");
      const cov = r * sx * sy;
      const ez = w1 * ex + w2 * ey;
      const vz = w1 ** 2 * sx ** 2 + w2 ** 2 * sy ** 2 + 2 * w1 * w2 * cov;
      const steps = [
        `E[Z] = w₁ E[X] + w₂ E[Y] = ${fmt(w1)}×${fmt(ex)} + ${fmt(w2)}×${fmt(ey)} = ${fmt(ez)}`,
        `Cov(X,Y) = r · σ_X · σ_Y = ${fmt(r)} × ${fmt(sx)} × ${fmt(sy)} = ${fmt(cov)}`,
        `Var(Z) = w₁²σ_X² + w₂²σ_Y² + 2 w₁ w₂ Cov`,
        `= (${fmt(w1)})²(${fmt(sx)})² + (${fmt(w2)})²(${fmt(sy)})² + 2(${fmt(w1)})(${fmt(w2)})(${fmt(cov)})`,
        `= ${fmt(vz)}`,
        `SD(Z) = ${fmt(Math.sqrt(vz))}`,
      ];
      return { steps, answer: `E[Z] = ${fmt(ez)}  ·  SD(Z) = ${fmt(Math.sqrt(vz))}` };
    },
  },
  {
    id: "binom",
    name: "Binomial",
    blurb: "Fixed n, two outcomes, constant p, independent trials. Counts successes.",
    fields: [
      { kind: "num", key: "n", label: "n (trials)", def: "5" },
      { kind: "num", key: "p", label: "p (success probability)", def: "0.4" },
      { kind: "num", key: "y", label: "y (number of successes)", def: "2" },
      {
        kind: "sel",
        key: "mode",
        label: "What to compute",
        options: [
          { value: "eq", label: "P(Y = y)" },
          { value: "le", label: "P(Y ≤ y)  at most" },
          { value: "ge", label: "P(Y ≥ y)  at least" },
        ],
        def: "eq",
      },
    ],
    run: (v) => {
      const n = Math.round(num(v, "n"));
      const p = num(v, "p");
      const y = Math.round(num(v, "y"));
      const mode = v.mode || "eq";
      if (n < 0 || y < 0 || y > n) return { steps: [], answer: "", error: "Need 0 ≤ y ≤ n." };
      const c = combinations(n, y);
      const eq = binomPmf(n, p, y);
      const le = binomCdf(n, p, y);
      const ge = 1 - binomCdf(n, p, y - 1);
      const mu = n * p;
      const sd = Math.sqrt(n * p * (1 - p));
      const steps = [
        `C(n,y) = n! / (y! (n−y)!) = ${fmt(c, 0)}`,
        `P(Y=y) = C(n,y) p^y (1−p)^{n−y} = ${fmt(c, 0)} × ${fmt(p)}^${y} × ${fmt(1 - p)}^${n - y} = ${fmt(eq)}`,
        `P(Y ≤ y) = ${fmt(le)}`,
        `P(Y ≥ y) = 1 − P(Y ≤ y−1) = ${fmt(ge)}`,
        `E[Y] = np = ${fmt(mu)}    SD = √(npq) = ${fmt(sd)}`,
      ];
      const ans =
        mode === "le" ? `P(Y ≤ ${y}) = ${fmt(le)}` : mode === "ge" ? `P(Y ≥ ${y}) = ${fmt(ge)}` : `P(Y = ${y}) = ${fmt(eq)}`;
      return { steps, answer: ans + `  ·  mean ${fmt(mu)}, SD ${fmt(sd)}` };
    },
  },
  {
    id: "pois",
    name: "Poisson",
    blurb: "Count of events in an interval. One parameter λ. Mean = variance = λ.",
    fields: [
      { kind: "num", key: "lam", label: "λ  (mean count in the interval)", def: "3" },
      { kind: "num", key: "y", label: "y", def: "0" },
      {
        kind: "sel",
        key: "mode",
        label: "What to compute",
        options: [
          { value: "eq", label: "P(Y = y)" },
          { value: "le", label: "P(Y ≤ y)  at most" },
          { value: "ge", label: "P(Y ≥ y)  at least" },
        ],
        def: "eq",
      },
    ],
    run: (v) => {
      const lam = num(v, "lam");
      const y = Math.round(num(v, "y"));
      const mode = v.mode || "eq";
      if (y < 0) return { steps: [], answer: "", error: "y must be 0, 1, 2, …" };
      const eq = poissonPmf(lam, y);
      const le = poissonCdf(lam, y);
      const ge = 1 - poissonCdf(lam, y - 1);
      const steps = [
        `P(Y=y) = e^{−λ} λ^y / y!`,
        `e^{−${fmt(lam)}} × ${fmt(lam)}^${y} / ${y}! = ${fmt(eq)}`,
        `P(Y ≤ ${y}) = ${fmt(le)}`,
        `P(Y ≥ ${y}) = ${fmt(ge)}`,
        `E[Y] = Var(Y) = λ = ${fmt(lam)}    SD = √λ = ${fmt(Math.sqrt(lam))}`,
      ];
      const ans =
        mode === "le" ? `P(Y ≤ ${y}) = ${fmt(le)}` : mode === "ge" ? `P(Y ≥ ${y}) = ${fmt(ge)}` : `P(Y = ${y}) = ${fmt(eq)}`;
      return { steps, answer: ans };
    },
  },
  {
    id: "unif",
    name: "Uniform (L, U)",
    blurb: "Every value between L and U is equally likely. Probability = length / total length.",
    fields: [
      { kind: "num", key: "L", label: "L (lower)", def: "10" },
      { kind: "num", key: "U", label: "U (upper)", def: "20" },
      { kind: "num", key: "a", label: "a (interval start)", def: "12" },
      { kind: "num", key: "b", label: "b (interval end)", def: "15" },
    ],
    run: (v) => {
      const L = num(v, "L");
      const U = num(v, "U");
      const a = num(v, "a");
      const b = num(v, "b");
      if (U <= L) return { steps: [], answer: "", error: "Need U > L." };
      const aa = Math.max(a, L);
      const bb = Math.min(b, U);
      const p = Math.max(0, bb - aa) / (U - L);
      const mu = (L + U) / 2;
      const varr = (U - L) ** 2 / 12;
      const steps = [
        `f(x) = 1 / (U − L) = 1 / ${fmt(U - L)} = ${fmt(1 / (U - L))}  for ${fmt(L)} ≤ x ≤ ${fmt(U)}`,
        `P(a < X < b) = (overlap length) / (U − L) = ${fmt(Math.max(0, bb - aa))} / ${fmt(U - L)} = ${fmt(p)}`,
        `E[X] = (L+U)/2 = ${fmt(mu)}`,
        `Var(X) = (U−L)² / 12 = ${fmt(varr)}    SD = ${fmt(Math.sqrt(varr))}`,
      ];
      return { steps, answer: `P = ${fmt(p)}  ·  mean ${fmt(mu)}  ·  SD ${fmt(Math.sqrt(varr))}` };
    },
  },
  {
    id: "expo",
    name: "Exponential",
    blurb: "Time between Poisson events. Memoryless. P(X > x) = e^{−λx}.",
    fields: [
      { kind: "num", key: "lam", label: "λ  (rate)", def: "2" },
      { kind: "num", key: "x", label: "x  (time)", def: "1" },
      {
        kind: "sel",
        key: "mode",
        label: "What to compute",
        options: [
          { value: "gt", label: "P(X > x)  tail" },
          { value: "le", label: "P(X ≤ x)  CDF" },
        ],
        def: "gt",
      },
    ],
    run: (v) => {
      const lam = num(v, "lam");
      const x = num(v, "x");
      const mode = v.mode || "gt";
      const gt = Math.exp(-lam * x);
      const le = 1 - gt;
      const mu = 1 / lam;
      const steps = [
        `PDF f(x) = λ e^{−λx}  for x ≥ 0`,
        `P(X > x) = e^{−λx} = e^{−${fmt(lam)}×${fmt(x)}} = ${fmt(gt)}`,
        `P(X ≤ x) = 1 − e^{−λx} = ${fmt(le)}`,
        `Mean = SD = 1/λ = ${fmt(mu)}    Var = 1/λ² = ${fmt(1 / (lam * lam))}`,
        `Memoryless: waiting t more minutes does not depend on how long you already waited.`,
      ];
      return {
        steps,
        answer: mode === "le" ? `P(X ≤ ${fmt(x)}) = ${fmt(le)}` : `P(X > ${fmt(x)}) = ${fmt(gt)}`,
      };
    },
  },
  {
    id: "norm",
    name: "Normal → z",
    blurb: "z = (x − μ) / σ. Then read the area from the z-table.",
    fields: [
      { kind: "num", key: "mu", label: "μ", def: "100" },
      { kind: "num", key: "sig", label: "σ", def: "10" },
      { kind: "num", key: "x", label: "x", def: "110" },
      {
        kind: "sel",
        key: "mode",
        label: "What to compute",
        options: [
          { value: "le", label: "P(X ≤ x)" },
          { value: "gt", label: "P(X > x)" },
        ],
        def: "le",
      },
    ],
    run: (v) => {
      const mu = num(v, "mu");
      const sig = num(v, "sig");
      const x = num(v, "x");
      const mode = v.mode || "le";
      if (sig <= 0) return { steps: [], answer: "", error: "σ must be positive." };
      const z = (x - mu) / sig;
      const le = stdNormalCdf(z);
      const gt = 1 - le;
      const steps = [
        `z = (x − μ) / σ = (${fmt(x)} − ${fmt(mu)}) / ${fmt(sig)} = ${fmt(z, 3)}`,
        `P(X ≤ x) = P(Z ≤ ${fmt(z, 3)}) ≈ ${fmt(le, 4)}`,
        `P(X > x) = 1 − that = ${fmt(gt, 4)}`,
        `Empirical rule reminder: 68% within 1σ, 95% within 2σ, 99.7% within 3σ.`,
      ];
      return {
        steps,
        answer:
          mode === "gt"
            ? `P(X > ${fmt(x)}) ≈ ${fmt(gt, 4)}   (z = ${fmt(z, 3)})`
            : `P(X ≤ ${fmt(x)}) ≈ ${fmt(le, 4)}   (z = ${fmt(z, 3)})`,
      };
    },
  },
  {
    id: "normbin",
    name: "Normal ≈ binomial",
    blurb: "np ≥ 5 and nq ≥ 5. Then bump the integer by 0.5 toward the side you keep.",
    fields: [
      { kind: "num", key: "n", label: "n  (trials)", def: "100" },
      { kind: "num", key: "p", label: "p  (success)", def: "0.5" },
      { kind: "num", key: "k", label: "k  (count)", def: "40" },
      {
        kind: "sel",
        key: "mode",
        label: "What to compute",
        options: [
          { value: "le", label: "P(Y ≤ k)" },
          { value: "ge", label: "P(Y ≥ k)" },
          { value: "eq", label: "P(Y = k)" },
          { value: "lt", label: "P(Y < k)" },
          { value: "gt", label: "P(Y > k)" },
        ],
        def: "le",
      },
    ],
    run: (v) => {
      const n = Math.round(num(v, "n"));
      const p = num(v, "p");
      const k = Math.round(num(v, "k"));
      const mode = v.mode || "le";
      if (n < 1) return { steps: [], answer: "", error: "n must be a positive integer." };
      if (p <= 0 || p >= 1) return { steps: [], answer: "", error: "p must be between 0 and 1." };
      if (k < 0 || k > n) return { steps: [], answer: "", error: "k must be between 0 and n." };
      const q = 1 - p;
      const mu = n * p;
      const sig = Math.sqrt(n * p * q);
      const np = n * p;
      const nq = n * q;
      const legal = np >= 5 && nq >= 5;
      const cut = mode === "le" || mode === "gt" ? k + 0.5 : k - 0.5;
      const zLo = (k - 0.5 - mu) / sig;
      const zHi = (k + 0.5 - mu) / sig;
      const zCut = (cut - mu) / sig;
      const steps = [
        `μ = np = ${n} × ${fmt(p)} = ${fmt(mu)}`,
        `σ = √(npq) = √(${fmt(np)} × ${fmt(q)}) = ${fmt(sig)}`,
        `Check: np = ${fmt(np)}, nq = ${fmt(nq)}  →  ${legal ? "both ≥ 5, approximation is legal" : "FAILS np≥5 and nq≥5 — do not use this on the paper"}`,
      ];
      if (mode === "eq") {
        const pEq = stdNormalCdf(zHi) - stdNormalCdf(zLo);
        steps.push(
          `P(Y = ${k}) ≈ P(${k - 0.5} < X < ${k + 0.5})`,
          `z_left = (${k - 0.5} − ${fmt(mu)}) / ${fmt(sig)} = ${fmt(zLo, 3)}`,
          `z_right = (${k + 0.5} − ${fmt(mu)}) / ${fmt(sig)} = ${fmt(zHi, 3)}`,
          `Φ(${fmt(zHi, 3)}) − Φ(${fmt(zLo, 3)}) ≈ ${fmt(pEq, 4)}`,
        );
        return { steps, answer: `P(Y = ${k}) ≈ ${fmt(pEq, 4)}` };
      }
      const tailRight = mode === "ge" || mode === "gt";
      const pCut = tailRight ? 1 - stdNormalCdf(zCut) : stdNormalCdf(zCut);
      const want =
        mode === "le" ? `P(Y ≤ ${k})`
        : mode === "ge" ? `P(Y ≥ ${k})`
        : mode === "lt" ? `P(Y < ${k})`
        : `P(Y > ${k})`;
      const asX = tailRight ? `P(X ≥ ${fmt(cut)})` : `P(X ≤ ${fmt(cut)})`;
      steps.push(
        `${want} ≈ ${asX}     (continuity correction)`,
        `z = (${fmt(cut)} − ${fmt(mu)}) / ${fmt(sig)} = ${fmt(zCut, 3)}`,
        tailRight
          ? `P(Z ≥ ${fmt(zCut, 3)}) = 1 − Φ(${fmt(zCut, 3)}) ≈ ${fmt(pCut, 4)}`
          : `P(Z ≤ ${fmt(zCut, 3)}) = Φ(${fmt(zCut, 3)}) ≈ ${fmt(pCut, 4)}`,
      );
      return { steps, answer: `${want} ≈ ${fmt(pCut, 4)}   (z = ${fmt(zCut, 3)})` };
    },
  },
];

export function defaultValues(s: Solver): Record<string, string> {
  const o: Record<string, string> = {};
  for (const f of s.fields) o[f.key] = f.def ?? "";
  return o;
}

export { round };
