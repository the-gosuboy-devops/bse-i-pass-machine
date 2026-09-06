export type Tier = 1 | 2 | 3;
export type QSrc = "concept" | "exam";
export type CalloutKind = "tip" | "trap" | "recipe" | "example";

export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; kind: CalloutKind; title: string; text: string }
  | { type: "formula"; title: string; lines: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type Question = {
  id: string;
  prompt: string;
  story?: string;
  options: string[];
  answer: number;
  explain: string;
  src: QSrc;
};

export type Lesson = {
  id: number;
  pos: number;
  slug: string;
  tier: Tier;
  title: string;
  sub: string;
  lastPaper: number;
  older: number;
  recipe: string;
  body: Block[];
  questions: Question[];
};

export const TIER_META: Record<
  Tier,
  { label: string; sub: string; tag: string; tagClass: string; headerClass: string }
> = {
  1: {
    label: "Bank a pass",
    sub: "The machines that show up every paper. Do these first.",
    tag: "Mandatory",
    tagClass: "bg-peach text-[#8a4a1f]",
    headerClass: "bg-linear-to-br from-peach to-peach-deep",
  },
  2: {
    label: "The next six marks",
    sub: "Once you can pass, these turn a C into a B.",
    tag: "Likely",
    tagClass: "bg-mint text-[#2c6b3d]",
    headerClass: "bg-linear-to-br from-mint to-mint-deep",
  },
  3: {
    label: "Cheap leftover marks",
    sub: "Short recipes. One reading, one question, one mark.",
    tag: "Bonus",
    tagClass: "bg-lilac text-[#5a3f8e]",
    headerClass: "bg-linear-to-br from-lilac to-lilac-deep",
  },
};
