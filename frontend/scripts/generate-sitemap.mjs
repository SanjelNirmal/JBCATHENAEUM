import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_ORIGIN = "https://jbc.nirmalsanjel.com.np";
const SITEMAP_PATH = resolve("public/sitemap.xml");

const staticRoutes = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/resources", changefreq: "daily", priority: "0.9" },
  { path: "/posts", changefreq: "daily", priority: "0.9" },
  { path: "/faculties", changefreq: "weekly", priority: "0.8" },
  { path: "/resource-requests", changefreq: "daily", priority: "0.7" },
  { path: "/contributors", changefreq: "weekly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/about/review-process", changefreq: "monthly", priority: "0.5" },
  { path: "/policies", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy", changefreq: "monthly", priority: "0.3" },
  { path: "/terms", changefreq: "monthly", priority: "0.3" },
  { path: "/copyright", changefreq: "monthly", priority: "0.3" },
  { path: "/policies/upload", changefreq: "monthly", priority: "0.3" },
  {
    path: "/policies/content-removal",
    changefreq: "monthly",
    priority: "0.3",
  },
  {
    path: "/policies/acceptable-use",
    changefreq: "monthly",
    priority: "0.3",
  },
  {
    path: "/policies/account-deletion",
    changefreq: "monthly",
    priority: "0.3",
  },
  { path: "/policies/retention", changefreq: "monthly", priority: "0.3" },
  { path: "/policies/reporting", changefreq: "monthly", priority: "0.3" },
  { path: "/copyright/removal", changefreq: "monthly", priority: "0.3" },
];

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function absoluteUrl(path) {
  return new URL(path, SITE_ORIGIN).toString();
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function toUrlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${escapeXml(changefreq)}</changefreq>` : null,
    priority ? `    <priority>${escapeXml(priority)}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

async function fetchPublishedResources() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return [];

  const endpoint = new URL("/rest/v1/resources", supabaseUrl);
  endpoint.searchParams.set(
    "select",
    "slug,updated_at,published_at,created_at",
  );
  endpoint.searchParams.set("status", "eq.published");
  endpoint.searchParams.set("order", "published_at.desc.nullslast");
  endpoint.searchParams.set("limit", "50000");

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    if (!response.ok) {
      console.warn(
        `Sitemap resource fetch skipped: Supabase returned ${response.status}.`,
      );
      return [];
    }
    const rows = await response.json();
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((row) => typeof row.slug === "string" && row.slug.length > 0)
      .map((row) => ({
        loc: absoluteUrl(`/resources/${row.slug}`),
        lastmod: formatDate(
          row.updated_at ?? row.published_at ?? row.created_at,
        ),
        changefreq: "weekly",
        priority: "0.7",
      }));
  } catch (error) {
    console.warn(
      `Sitemap resource fetch skipped: ${error instanceof Error ? error.message : "unknown error"}.`,
    );
    return [];
  }
}

async function fetchPublishedAcademicPosts() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return [];

  const endpoint = new URL("/rest/v1/academic_posts", supabaseUrl);
  endpoint.searchParams.set(
    "select",
    "slug,updated_at,published_at,created_at",
  );
  endpoint.searchParams.set("status", "eq.published");
  endpoint.searchParams.set("deleted_at", "is.null");
  endpoint.searchParams.set("published_at", `lte.${new Date().toISOString()}`);
  endpoint.searchParams.set("order", "published_at.desc");
  endpoint.searchParams.set("limit", "50000");

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    if (!response.ok) {
      console.warn(
        `Sitemap academic post fetch skipped: Supabase returned ${response.status}.`,
      );
      return [];
    }

    async function fetchAcademicStructureRoutes() {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) return [];

      const headers = {
        apikey: supabaseAnonKey,
        Authorization: `******
      };
      const fetchRows = async (path, select) => {
        const endpoint = new URL(path, `${supabaseUrl}/rest/v1/`);
        endpoint.searchParams.set("select", select);
        endpoint.searchParams.set("is_active", "eq.true");
        endpoint.searchParams.set("limit", "50000");
        const response = await fetch(endpoint, { headers });
        if (!response.ok) return [];
        const rows = await response.json();
        return Array.isArray(rows) ? rows : [];
      };

      try {
        const [faculties, programs, subjects] = await Promise.all([
          fetchRows("faculties", "slug,updated_at,created_at"),
          fetchRows("programs", "slug,updated_at,created_at"),
          fetchRows("subjects", "slug,updated_at,created_at"),
        ]);
        const build = (path, row) => ({
          loc: absoluteUrl(`${path}/${row.slug}`),
          lastmod: formatDate(row.updated_at ?? row.created_at),
          changefreq: "weekly",
          priority: "0.6",
        });
        return [
          ...faculties
            .filter((row) => typeof row.slug === "string" && row.slug)
            .map((row) => build("/faculties", row)),
          ...programs
            .filter((row) => typeof row.slug === "string" && row.slug)
            .map((row) => build("/programs", row)),
          ...subjects
            .filter((row) => typeof row.slug === "string" && row.slug)
            .map((row) => build("/subjects", row)),
        ];
      } catch {
        return [];
      }
    }
    const rows = await response.json();
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((row) => typeof row.slug === "string" && row.slug.length > 0)
      .map((row) => ({
        loc: absoluteUrl(`/posts/${row.slug}`),
        lastmod: formatDate(
          row.updated_at ?? row.published_at ?? row.created_at,
        ),
        changefreq: "weekly",
        priority: "0.7",
      }));
  } catch (error) {
    console.warn(
      `Sitemap academic post fetch skipped: ${error instanceof Error ? error.message : "unknown error"}.`,
    );
    return [];
  }
}

async function main() {
  loadEnvFile(resolve(".env"));
  loadEnvFile(resolve(".env.local"));

  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    ...staticRoutes.map((route) => ({
      loc: absoluteUrl(route.path),
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    })),
    ...(await fetchPublishedResources()),
    ...(await fetchPublishedAcademicPosts()),
    ...(await fetchAcademicStructureRoutes()),
  ];

  const deduped = [
    ...new Map(entries.map((entry) => [entry.loc, entry])).values(),
  ];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...deduped.map(toUrlEntry),
    "</urlset>",
    "",
  ].join("\n");

  writeFileSync(SITEMAP_PATH, xml);
  console.log(`Generated ${SITEMAP_PATH} with ${deduped.length} URLs.`);
}

await main();
