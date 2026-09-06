import type { Block, CalloutKind } from "@/lib/content/types";
import { RichText } from "./rich-text";
import { cn } from "@/lib/utils";

const CALLOUT: Record<
  CalloutKind,
  { wrap: string; bar: string; head: string; label: string }
> = {
  tip: {
    wrap: "bg-tip",
    bar: "border-butter-deep",
    head: "text-[#8a6f1a]",
    label: "Tip",
  },
  trap: {
    wrap: "bg-trap",
    bar: "border-coral-deep",
    head: "text-[#a53f3b]",
    label: "Trap",
  },
  example: {
    wrap: "bg-example",
    bar: "border-sky-deep",
    head: "text-[#2a5e9e]",
    label: "Worked example",
  },
  recipe: {
    wrap: "bg-formula",
    bar: "border-lilac-deep",
    head: "text-[#5a3f8e]",
    label: "Recipe",
  },
};

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3.5">
      {blocks.map((b, i) => {
        if (b.type === "p") {
          return (
            <p key={i} className="text-[0.98rem] text-ink leading-[1.65]">
              <RichText text={b.text} />
            </p>
          );
        }
        if (b.type === "h") {
          return (
            <h4 key={i} className="font-display text-[1.06rem] font-semibold mt-5 mb-1">
              {b.text}
            </h4>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5 text-[0.98rem]">
              {b.items.map((it, j) => (
                <li key={j}>
                  <RichText text={it} />
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "formula") {
          return (
            <div
              key={i}
              className="rounded-[14px] bg-formula border-l-4 border-lilac-deep px-[1.1rem] py-[0.9rem]"
            >
              <div className="font-sans font-extrabold uppercase tracking-[0.04em] text-[0.69rem] text-[#5a3f8e] mb-1.5">
                {b.title}
              </div>
              <div className="font-mono text-[0.9em] font-medium space-y-1 whitespace-pre-wrap">
                {b.lines.map((ln, j) => (
                  <div key={j}>{ln}</div>
                ))}
              </div>
            </div>
          );
        }
        if (b.type === "callout") {
          const c = CALLOUT[b.kind];
          return (
            <div key={i} className={cn("rounded-[14px] border-l-4 px-[1.1rem] py-[0.9rem]", c.wrap, c.bar)}>
              <div className={cn("font-extrabold uppercase tracking-[0.04em] text-[0.69rem] mb-1.5", c.head)}>
                {c.label}
                {b.title ? ` · ${b.title}` : ""}
              </div>
              <div className="text-[0.95rem] leading-relaxed whitespace-pre-wrap">
                <RichText text={b.text} />
              </div>
            </div>
          );
        }
        return (
          <div key={i} className="overflow-x-auto rounded-[10px] bg-cream-deep">
            <table className="w-full text-[0.9rem] border-collapse">
              <thead>
                <tr>
                  {b.headers.map((h) => (
                    <th
                      key={h}
                      className="text-left bg-ink text-paper font-bold text-[0.82rem] px-3 py-2"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-line last:border-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 align-top">
                        <RichText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
