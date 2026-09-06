/** Sample and probability helpers used by solvers and the z-table. */

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function round(n: number, d = 4): number {
  if (!Number.isFinite(n)) return n;
  const p = 10 ** d;
  return Math.round(n * p) / p;
}

export function fmt(n: number, d = 4): string {
  if (!Number.isFinite(n)) return "—";
  const r = round(n, d);
  if (Object.is(r, -0)) return "0";
  const s = r.toFixed(d);
  return s.replace(/\.?0+$/, "") || "0";
}

export function mean(xs: number[]): number {
  if (!xs.length) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function median(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function modes(xs: number[]): number[] {
  const freq = new Map<number, number>();
  let best = 0;
  for (const x of xs) {
    const n = (freq.get(x) ?? 0) + 1;
    freq.set(x, n);
    if (n > best) best = n;
  }
  if (best <= 1) return [];
  return [...freq.entries()].filter(([, n]) => n === best).map(([x]) => x);
}

export function sampleVariance(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1);
}

export function sampleSd(xs: number[]): number {
  return Math.sqrt(sampleVariance(xs));
}

export function populationVariance(xs: number[]): number {
  if (!xs.length) return NaN;
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length;
}

export function percentileLocation(n: number, p: number): number {
  return (p / 100) * (n + 1);
}

export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 170) return Infinity;
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c;
}

export function binomPmf(n: number, p: number, y: number): number {
  if (y < 0 || y > n) return 0;
  return combinations(n, y) * p ** y * (1 - p) ** (n - y);
}

export function binomCdf(n: number, p: number, y: number): number {
  let s = 0;
  const k = Math.floor(y);
  for (let i = 0; i <= k; i++) s += binomPmf(n, p, i);
  return s;
}

export function poissonPmf(lambda: number, y: number): number {
  if (y < 0 || !Number.isInteger(y)) return 0;
  if (lambda === 0) return y === 0 ? 1 : 0;
  // Iterative to avoid huge factorials
  let term = Math.exp(-lambda);
  for (let i = 1; i <= y; i++) term *= lambda / i;
  return term;
}

export function poissonCdf(lambda: number, y: number): number {
  let s = 0;
  const k = Math.floor(y);
  for (let i = 0; i <= k; i++) s += poissonPmf(lambda, i);
  return s;
}

/** Abramowitz & Stegun erf approximation. */
export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function stdNormalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

export function stdNormalPdf(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

export function parseList(raw: string): number[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}
