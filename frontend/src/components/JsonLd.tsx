import { useEffect } from "react";

export function JsonLd({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  useEffect(() => {
    const selector = `script[data-jbc-jsonld="${id}"]`;
    const existing = document.head.querySelector<HTMLScriptElement>(selector);
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-jbc-jsonld", id);
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [id, data]);
  return null;
}
