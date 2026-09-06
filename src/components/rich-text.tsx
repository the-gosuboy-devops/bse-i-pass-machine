/** Tiny **bold** / `code` renderer so lesson copy stays in plain strings. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g).filter((p) => p !== undefined);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part === "\n") return <br key={i} />;
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-ink">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="font-mono text-[0.92em] bg-cream-deep px-[0.4em] py-[0.12em] rounded-[4px]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
