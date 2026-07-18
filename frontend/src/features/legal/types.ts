import type { LucideIcon } from "lucide-react";

export type PolicySlug =
  | "privacy"
  | "terms"
  | "copyright"
  | "upload"
  | "retention"
  | "content-removal"
  | "acceptable-use"
  | "account-deletion"
  | "reporting";

export type PolicyBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; title: string; text: string }
  | {
      type: "definitions";
      terms: Array<{ term: string; description: string }>;
    }
  | {
      type: "table";
      caption: string;
      columns: string[];
      rows: string[][];
    };

export interface PolicySection {
  id: string;
  heading: string;
  blocks: PolicyBlock[];
}

export interface PolicyDocument {
  slug: PolicySlug;
  path: string;
  title: string;
  shortTitle: string;
  summary: string;
  description: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: PolicySection[];
  relatedSlugs: PolicySlug[];
  icon?: LucideIcon;
}
