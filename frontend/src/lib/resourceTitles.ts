export function buildSuggestedResourceTitle(input: {
  subjectName: string;
  subjectCode?: string | null;
  categoryName?: string;
}): string {
  const subject = input.subjectName.trim();
  const code = input.subjectCode?.trim();
  const category = input.categoryName?.trim() || "Study Notes";
  if (!subject) return "";
  const subjectWithCode = code ? `${subject} (${code})` : subject;
  return `${subjectWithCode} — ${category}`;
}

export function isProfessionalResourceTitle(title: string): boolean {
  return /^.{3,240}$/.test(title.trim()) && title.includes("—");
}
