import { useEffect } from "react";

const origin = "https://jbc.nirmalsanjel.com.np";

export function Seo({
  title,
  description,
  path,
  keywords,
  noIndex = false,
  image,
  type = "website",
  publishedAt,
  modifiedAt,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  noIndex?: boolean;
  image?: string;
  type?: "website" | "article";
  publishedAt?: string;
  modifiedAt?: string;
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
    const removeMeta = (selector: string) => {
      document.head.querySelector(selector)?.remove();
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
    setMeta('meta[property="og:type"]', "content", type);
    setMeta('meta[property="og:site_name"]', "content", "JBC Athenaeum");
    setMeta('meta[property="og:url"]', "content", `${origin}${path}`);
    setMeta('meta[property="twitter:title"]', "content", title);
    setMeta('meta[property="twitter:description"]', "content", description);
    setMeta('meta[property="twitter:url"]', "content", `${origin}${path}`);
    if (image) {
      setMeta('meta[property="og:image"]', "content", image);
      setMeta('meta[property="twitter:image"]', "content", image);
    } else {
      removeMeta('meta[property="og:image"]');
      removeMeta('meta[property="twitter:image"]');
    }
    if (publishedAt)
      setMeta(
        'meta[property="article:published_time"]',
        "content",
        publishedAt,
      );
    else removeMeta('meta[property="article:published_time"]');
    if (modifiedAt)
      setMeta('meta[property="article:modified_time"]', "content", modifiedAt);
    else removeMeta('meta[property="article:modified_time"]');
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${origin}${path}`;
  }, [
    description,
    image,
    keywords,
    modifiedAt,
    noIndex,
    path,
    publishedAt,
    title,
    type,
  ]);
  return null;
}
