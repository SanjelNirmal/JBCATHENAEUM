import { Fragment, type ReactNode } from "react";

function inlineMarkdown(value: string): ReactNode[] {
  const tokens = value.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**"))
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("`") && token.endsWith("`"))
      return (
        <code
          key={index}
          className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.92em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    const link = token.match(/^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/);
    if (link) {
      try {
        const url = new URL(link[2]);
        if (url.protocol === "https:")
          return (
            <a
              key={index}
              href={url.toString()}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#85591f] underline underline-offset-4"
            >
              {link[1]}
            </a>
          );
      } catch {
        // Render invalid Markdown links as plain text.
      }
    }
    return <Fragment key={index}>{token}</Fragment>;
  });
}

export function MarkdownContent({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((block) => block.trim());
  return (
    <div className="space-y-6 text-base leading-8 text-slate-700 sm:text-lg">
      {blocks.filter(Boolean).map((block, index) => {
        if (block.startsWith("### "))
          return (
            <h3
              key={index}
              className="font-serif text-2xl font-bold text-[#002147]"
            >
              {inlineMarkdown(block.slice(4))}
            </h3>
          );
        if (block.startsWith("## "))
          return (
            <h2
              key={index}
              className="font-serif text-3xl font-bold text-[#002147]"
            >
              {inlineMarkdown(block.slice(3))}
            </h2>
          );
        if (block.startsWith("# "))
          return (
            <h2
              key={index}
              className="font-serif text-3xl font-bold text-[#002147]"
            >
              {inlineMarkdown(block.slice(2))}
            </h2>
          );
        const listItems = block
          .split("\n")
          .filter((line) => /^[-*]\s+/.test(line));
        if (listItems.length && listItems.length === block.split("\n").length)
          return (
            <ul key={index} className="list-disc space-y-2 pl-6">
              {listItems.map((item, itemIndex) => (
                <li key={itemIndex}>{inlineMarkdown(item.slice(2))}</li>
              ))}
            </ul>
          );
        return <p key={index}>{inlineMarkdown(block.replace(/\n/g, " "))}</p>;
      })}
    </div>
  );
}
