export type FormulaGroup = {
  id: string;
  title: string;
  rows: { name: string; formula: string }[];
};

export const FORMULA_GROUPS: FormulaGroup[] = [
  {
    id: "desc",
    title: "Descriptive statistics",
    rows: [
      { name: "Relative frequency", formula: "frequency / n" },
      { name: "Percent frequency", formula: "relative frequency × 100" },
      { name: "Mean", formula: "x̄ = (Σ xᵢ) / n" },
      { name: "Weighted mean", formula: "(Σ wᵢ xᵢ) / (Σ wᵢ)" },
      { name: "Percentile location", formula: "L_p = (p/100)(n + 1)" },
      { name: "Percentile interpolate", formula: "if L_p = k + d:  x_(k) + d(x_(k+1) − x_(k))" },
      { name: "IQR", formula: "Q3 − Q1" },
      { name: "Sample variance", formula: "s² = Σ(xᵢ − x̄)² / (n − 1)" },
      { name: "Sample SD", formula: "s = √s²" },
      { name: "Coefficient of variation", formula: "CV = (s / x̄) × 100%" },
      { name: "Z-score", formula: "z = (x − x̄) / s" },
      { name: "Outlier fences", formula: "Q1 − 1.5·IQR    and    Q3 + 1.5·IQR" },
      { name: "Z-outlier rule", formula: "|z| > 3" },
    ],
  },
  {
    id: "prob",
    title: "Probability",
    rows: [
      { name: "Complement", formula: "P(Aᶜ) = 1 − P(A)" },
      { name: "Addition law", formula: "P(A ∪ B) = P(A) + P(B) − P(A ∩ B)" },
      { name: "Exclusive union", formula: "P(A ∪ B) = P(A) + P(B)" },
      { name: "Conditional", formula: "P(A|B) = P(A ∩ B) / P(B)" },
      { name: "Multiplication", formula: "P(A ∩ B) = P(B) · P(A|B)" },
      { name: "Independence", formula: "P(A ∩ B) = P(A) P(B)" },
      { name: "Bayes", formula: "P(A|B) = P(B|A) P(A) / P(B)" },
    ],
  },
  {
    id: "rv",
    title: "Random variables & combinations",
    rows: [
      { name: "Discrete mean", formula: "E[X] = Σ x f(x)" },
      { name: "Discrete variance", formula: "Var(X) = Σ (x − μ)² f(x)" },
      { name: "Y = aX + b", formula: "E[Y] = aE[X]+b     Var(Y) = a² Var(X)" },
      { name: "Independent sum", formula: "E[X+Y] = E[X]+E[Y]     Var(X+Y) = Var(X)+Var(Y)" },
      { name: "Independent difference", formula: "Var(X − Y) = Var(X) + Var(Y)" },
      { name: "Sum of n i.i.d.", formula: "E[S] = nμ     SD(S) = √n · σ" },
      { name: "Average of n i.i.d.", formula: "E[X̄] = μ     SD(X̄) = σ / √n" },
      { name: "Portfolio mean", formula: "E[Z] = w₁ E[X] + w₂ E[Y]" },
      { name: "Portfolio variance", formula: "w₁²σ_X² + w₂²σ_Y² + 2 w₁ w₂ Cov(X,Y)" },
      { name: "Correlation", formula: "r = Cov(X,Y) / (σ_X σ_Y)" },
    ],
  },
  {
    id: "dist",
    title: "Named distributions",
    rows: [
      { name: "Bernoulli", formula: "P(Y=1)=p     E=p     Var=p(1−p)" },
      { name: "Binomial PMF", formula: "P(Y=y) = C(n,y) p^y (1−p)^{n−y}" },
      { name: "Binomial mean / SD", formula: "np     √(np(1−p))" },
      { name: "At most / at least", formula: "P(Y≤k) = Σ P(i)     P(Y≥k) = 1 − P(Y≤k−1)" },
      { name: "Poisson PMF", formula: "P(Y=y) = e^{−λ} λ^y / y!" },
      { name: "Poisson mean / var", formula: "both equal λ     SD = √λ" },
      { name: "Poisson window", formula: "if rate λ₀ per unit, window T → λ = λ₀ T" },
      { name: "Uniform PDF", formula: "1/(U−L) on [L,U]" },
      { name: "Uniform probability", formula: "P(a<X<b) = (b−a)/(U−L)" },
      { name: "Uniform mean / var", formula: "(L+U)/2     (U−L)²/12" },
      { name: "Exponential tail", formula: "P(X > x) = e^{−λx}" },
      { name: "Exponential mean / SD", formula: "both 1/λ     Var = 1/λ²" },
      { name: "Memoryless", formula: "P(X > t₀+t | X > t₀) = P(X > t)" },
      { name: "Normal z", formula: "z = (x − μ) / σ" },
      { name: "Empirical rule", formula: "68% within 1σ, 95% within 2σ, 99.7% within 3σ" },
      { name: "Normal ≈ binomial", formula: "μ=np, σ=√(npq)   when np≥5 and nq≥5" },
      { name: "Continuity P(Y ≤ k)", formula: "≈ P(X ≤ k + 0.5)" },
      { name: "Continuity P(Y ≥ k)", formula: "≈ P(X ≥ k − 0.5)" },
      { name: "Continuity P(Y = k)", formula: "≈ P(k−0.5 < X < k+0.5)" },
      { name: "Continuous P(exact)", formula: "P(X = x) = 0     so P(X ≤ x) = P(X < x)" },
      { name: "CDF / tail", formula: "F(x)=P(X≤x)     P(X>x)=1−F(x)" },
    ],
  },
];
