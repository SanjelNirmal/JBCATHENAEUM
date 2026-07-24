import { useEffect } from "react";

const SITE_ORIGIN = "https://jbc.nirmalsanjel.com.np";
const SITE_NAME = "JBC Athenaeum";

const DEFAULT_IMAGE =
  "https://jbc.nirmalsanjel.com.np/images/jbc-athenaeum-social-preview.jpg";

const DEFAULT_IMAGE_ALT =
  "JBC Athenaeum academic resources for Jana Bhawana Campus students";

type SeoProps = {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  noIndex?: boolean;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  publishedAt?: string;
  modifiedAt?: string;
  authorName?: string;
};

function normalizePath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }

  const withoutOrigin = path.startsWith(SITE_ORIGIN)
    ? path.slice(SITE_ORIGIN.length)
    : path;

  const normalized = withoutOrigin.startsWith("/")
    ? withoutOrigin
    : `/${withoutOrigin}`;

  return normalized.split("?")[0]?.split("#")[0] || "/";
}

function toAbsoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${SITE_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}

function buildDocumentTitle(title: string): string {
  const normalizedTitle = title.trim();

  if (
    normalizedTitle.toLowerCase().includes(SITE_NAME.toLowerCase())
  ) {
    return normalizedTitle;
  }

  return `${normalizedTitle} | ${SITE_NAME}`;
}

export function Seo({
  title,
  description,
  path,
  keywords,
  noIndex = false,
  image,
  imageAlt = DEFAULT_IMAGE_ALT,
  type = "website",
  publishedAt,
  modifiedAt,
  authorName,
}: SeoProps) {
  useEffect(() => {
    const normalizedPath = normalizePath(path);
    const canonicalUrl = `${SITE_ORIGIN}${normalizedPath}`;
    const documentTitle = buildDocumentTitle(title);
    const socialImage = image ? toAbsoluteUrl(image) : DEFAULT_IMAGE;

    document.title = documentTitle;

    const setMetaByName = (name: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(
        `meta[name="${name}"]`,
      );

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    const setMetaByProperty = (property: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(
        `meta[property="${property}"]`,
      );

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("property", property);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    const removeMetaByName = (name: string) => {
      document.head
        .querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
        ?.remove();
    };

    const removeMetaByProperty = (property: string) => {
      document.head
        .querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
        ?.remove();
    };

    setMetaByName("description", description);

    if (keywords?.trim()) {
      setMetaByName("keywords", keywords.trim());
    } else {
      removeMetaByName("keywords");
    }

    const robotsContent = noIndex
      ? "noindex, nofollow, noarchive"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    setMetaByName("robots", robotsContent);
    setMetaByName("googlebot", robotsContent);

    // Open Graph
    setMetaByProperty("og:type", type);
    setMetaByProperty("og:site_name", SITE_NAME);
    setMetaByProperty("og:locale", "en_NP");
    setMetaByProperty("og:url", canonicalUrl);
    setMetaByProperty("og:title", documentTitle);
    setMetaByProperty("og:description", description);
    setMetaByProperty("og:image", socialImage);
    setMetaByProperty("og:image:secure_url", socialImage);
    setMetaByProperty("og:image:alt", imageAlt);

    // X / Twitter
    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:url", canonicalUrl);
    setMetaByName("twitter:title", documentTitle);
    setMetaByName("twitter:description", description);
    setMetaByName("twitter:image", socialImage);
    setMetaByName("twitter:image:alt", imageAlt);

    if (type === "article" && publishedAt) {
      setMetaByProperty("article:published_time", publishedAt);
    } else {
      removeMetaByProperty("article:published_time");
    }

    if (type === "article" && modifiedAt) {
      setMetaByProperty("article:modified_time", modifiedAt);
    } else {
      removeMetaByProperty("article:modified_time");
    }

    if (type === "article" && authorName?.trim()) {
      setMetaByProperty("article:author", authorName.trim());
    } else {
      removeMetaByProperty("article:author");
    }

    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }

    canonical.href = canonicalUrl;
  }, [
    authorName,
    description,
    image,
    imageAlt,
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