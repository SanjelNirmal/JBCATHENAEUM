import { Search, SlidersHorizontal } from "lucide-react";
import type { AcademicPostCategory, AcademicPostProgram } from "./types";

export function AcademicPostFilters({
  search,
  onSearchChange,
  programId,
  onProgramChange,
  categoryId,
  onCategoryChange,
  programs,
  categories,
  resultCount,
  compact = false,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  programId: string;
  onProgramChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  programs: AcademicPostProgram[];
  categories: AcademicPostCategory[];
  resultCount?: number;
  compact?: boolean;
}) {
  const buttonClass = (active: boolean) =>
    `min-h-10 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#85591f] ${
      active
        ? "border-[#002147] bg-[#002147] text-white"
        : "border-slate-300 bg-white text-slate-700 hover:border-[#d8b37a] hover:text-[#85591f]"
    }`;

  return (
    <div
      aria-label="Academic post search and filters"
      className={`rounded-2xl border border-slate-200 bg-slate-50 ${compact ? "p-4" : "p-4 sm:p-6"}`}
    >
      <label className="block">
        <span className="sr-only">
          Search academic posts by title, program, or category
        </span>
        <span className="flex min-w-0 items-center rounded-xl border border-slate-300 bg-white px-4 shadow-sm focus-within:outline-[3px] focus-within:outline-offset-[3px] focus-within:outline-[#b7791f]">
          <Search aria-hidden="true" size={19} className="text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title, program or category"
            className="site-search-input min-h-12 min-w-0 flex-1 px-3 text-sm sm:text-base"
          />
        </span>
      </label>
      <div className="mt-5 flex items-start gap-3">
        <SlidersHorizontal
          aria-hidden="true"
          size={18}
          className="mt-2.5 shrink-0 text-[#85591f]"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter academic posts by program"
          >
            <button
              type="button"
              aria-pressed={!programId}
              onClick={() => onProgramChange("")}
              className={buttonClass(!programId)}
            >
              All programs
            </button>
            {programs.map((program) => (
              <button
                key={program.id}
                type="button"
                aria-pressed={programId === program.id}
                onClick={() => onProgramChange(program.id)}
                className={buttonClass(programId === program.id)}
              >
                {program.code ?? program.name}
              </button>
            ))}
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter academic posts by category"
          >
            <button
              type="button"
              aria-pressed={!categoryId}
              onClick={() => onCategoryChange("")}
              className={buttonClass(!categoryId)}
            >
              All categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={categoryId === category.id}
                onClick={() => onCategoryChange(category.id)}
                className={buttonClass(categoryId === category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      {resultCount !== undefined && (
        <p className="mt-4 text-sm text-slate-500" aria-live="polite">
          {resultCount} {resultCount === 1 ? "post" : "posts"} available
        </p>
      )}
    </div>
  );
}
