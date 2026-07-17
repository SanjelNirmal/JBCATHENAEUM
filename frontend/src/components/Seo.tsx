import { useEffect } from "react";

const origin = "https://jbc.nirmalsanjel.com.np";

export function Seo({
  title,
  description,
  path,
  keywords,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  noIndex?: boolean;
}) {
  useEffect(() => {
    document.title = `${title} | JBC Athenaeum`;
    const setMeta = (selector: string, attribute: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };
    setMeta('meta[name="description"]', "content", description);
    if (keywords) setMeta('meta[name="keywords"]', "content", keywords);
    setMeta(
      'meta[name="robots"]',
      "content",
      noIndex ? "noindex,nofollow" : "index,follow",
    );
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[property="og:site_name"]', "content", "JBC Athenaeum");
    setMeta('meta[property="og:url"]', "content", `${origin}${path}`);
    setMeta('meta[property="twitter:title"]', "content", title);
    setMeta('meta[property="twitter:description"]', "content", description);
    setMeta('meta[property="twitter:url"]', "content", `${origin}${path}`);
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${origin}${path}`;
  }, [description, keywords, noIndex, path, title]);
  return null;
}
