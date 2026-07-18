import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import { fetchAcademicCatalog } from "../lib/supabase/academic";
import {
  parseResourceFilters,
  serializeResourceFilters,
} from "../lib/supabase/filters";
import { pageCount } from "../lib/supabase/pagination";
import { searchResources } from "../lib/supabase/resources";

export default function ResourceCatalogPage() {
  const [params, setParams] = useSearchParams();
  const filters = parseResourceFilters(params);
  const [search, setSearch] = useState(filters.q);
  useEffect(() => {
    setSearch(filters.q);
  }, [filters.q]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== filters.q)
        setParams(
          serializeResourceFilters({ ...filters, q: search, page: 1 }),
          { replace: true },
        );
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search, filters.q]);
  const catalog = useQuery({
    queryKey: ["academic-catalog"],
    queryFn: fetchAcademicCatalog,
    staleTime: 10 * 60_000,
  });
  const results = useQuery({
    queryKey: ["resources", filters],
    queryFn: ({ signal }) => searchResources(filters, signal),
  });
  const update = (patch: Partial<typeof filters>) =>
    setParams(
      serializeResourceFilters({ ...filters, ...patch, page: patch.page ?? 1 }),
    );
  const programs = Array.from(
    new Map(
      (catalog.data ?? [])
        .filter(
          (item) => !filters.faculty || item.facultyId === filters.faculty,
        )
        .map((item) => [item.programId, item]),
    ).values(),
  );
  const faculties = Array.from(
    new Map(
      (catalog.data ?? []).map((item) => [item.facultyId, item]),
    ).values(),
  );
  const terms = Array.from(
    new Map(
      (catalog.data ?? [])
        .filter(
          (item) => !filters.program || item.programId === filters.program,
        )
        .map((item) => [item.termId, item]),
    ).values(),
  );
  const subjects = (catalog.data ?? []).filter(
    (item) =>
      (!filters.program || item.programId === filters.program) &&
      (!filters.term || item.termId === filters.term),
  );
  const categories = Array.from(
    new Map(
      (catalog.data ?? [])
        .flatMap((item) => item.categories)
        .map((item) => [item.id, item]),
    ).values(),
  );
  const pages = pageCount(results.data?.total ?? 0, filters.pageSize);
  const clear = () => {
    setSearch("");
    setParams({});
  };
  return (
    <main
      id="main-content"
      className="safe-area-page mx-auto w-full max-w-7xl py-8 sm:px-6 sm:py-12 lg:px-8"
    >
      <Seo
        title="TU BCA & BICTE notes, PDFs, and past questions"
        description="Search reviewed JBC BCA notes, BICTE notes, Jana Bhawana Campus PDFs, past questions, project reports, and subject-wise academic resources."
        path="/resources"
        keywords="TU BCA notes, JBC BCA notes, BCA notes Nepal, BICTE notes, Jana Bhawana Campus notes, JBC notes, Tribhuvan University past questions, BCA PDFs, BCA project report, Nirmal Sanjel"
      />
      <div className="max-w-3xl">
        <h1 className="font-serif text-3xl font-bold leading-tight text-[#002147] sm:text-5xl">
          TU BCA and BICTE notes and resource catalog
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
          Search Jana Bhawana Campus notes, BCA PDFs, BICTE PDFs, past
          questions, project reports, and subject-wise Tribhuvan University
          resources.
        </p>
      </div>
      <section
        aria-label="Resource filters"
        className="mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:mt-8 sm:p-6"
      >
        <div className="flex items-center gap-2 font-bold text-[#002147]">
          <SlidersHorizontal size={18} />
          Filters
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2 lg:col-span-4">
            <span className="sr-only">Search</span>
            <div className="flex min-w-0 items-center rounded-lg border border-slate-300 px-3 focus-within:outline-[3px] focus-within:outline-offset-[3px] focus-within:outline-[#b7791f]">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                type="search"
                name="q"
                autoComplete="off"
                enterKeyHint="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="site-search-input min-h-11 min-w-0 flex-1 px-2 text-sm sm:text-base"
                placeholder="Title, subject, program, contributor or year"
              />
            </div>
          </label>
          <FilterSelect
            label="Faculty"
            value={filters.faculty ?? ""}
            onChange={(value) =>
              update({
                faculty: value || undefined,
                program: undefined,
                term: undefined,
                subject: undefined,
              })
            }
            options={faculties.map((item) => [
              item.facultyId,
              item.facultyName,
            ])}
          />
          <FilterSelect
            label="Program"
            value={filters.program ?? ""}
            onChange={(value) =>
              update({
                program: value || undefined,
                term: undefined,
                subject: undefined,
              })
            }
            options={programs.map((item) => [item.programId, item.programName])}
          />
          <FilterSelect
            label="Term"
            value={filters.term ?? ""}
            onChange={(value) =>
              update({ term: value || undefined, subject: undefined })
            }
            options={terms.map((item) => [item.termId, item.termName])}
          />
          <FilterSelect
            label="Subject"
            value={filters.subject ?? ""}
            onChange={(value) => update({ subject: value || undefined })}
            options={subjects.map((item) => [item.subjectId, item.subjectName])}
          />
          <FilterSelect
            label="Category"
            value={filters.category ?? ""}
            onChange={(value) => update({ category: value || undefined })}
            options={categories.map((item) => [item.id, item.name])}
          />
          <label className="text-sm font-semibold text-slate-700">
            Academic year
            <input
              type="number"
              min="1959"
              max="2200"
              value={filters.year ?? ""}
              onChange={(event) =>
                update({
                  year: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Uploaded from
            <input
              type="date"
              value={filters.from?.slice(0, 10) ?? ""}
              onChange={(event) =>
                update({
                  from: event.target.value
                    ? new Date(
                        `${event.target.value}T00:00:00.000Z`,
                      ).toISOString()
                    : undefined,
                })
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Uploaded through
            <input
              type="date"
              value={
                filters.to
                  ? new Date(new Date(filters.to).getTime() - 86_400_000)
                      .toISOString()
                      .slice(0, 10)
                  : ""
              }
              onChange={(event) =>
                update({
                  to: event.target.value
                    ? new Date(
                        new Date(
                          `${event.target.value}T00:00:00.000Z`,
                        ).getTime() + 86_400_000,
                      ).toISOString()
                    : undefined,
                })
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
          <FilterSelect
            label="Sort"
            value={filters.sort}
            onChange={(value) => update({ sort: value as typeof filters.sort })}
            options={[
              ["recent", "Recently added"],
              ["popular", "Most downloaded"],
              ["oldest", "Oldest"],
              ["title", "Title"],
            ]}
          />
          <FilterSelect
            label="Page size"
            value={String(filters.pageSize)}
            onChange={(value) => update({ pageSize: Number(value) })}
            options={[
              ["12", "12"],
              ["20", "20"],
              ["50", "50"],
            ]}
          />
          <button
            onClick={clear}
            className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 font-bold text-slate-700 sm:mt-6"
          >
            <X size={16} />
            Clear filters
          </button>
        </div>
      </section>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="font-semibold text-slate-700">
          {results.isSuccess
            ? `${results.data.total.toLocaleString()} results`
            : "Loading results"}
        </p>
        <p className="text-sm text-slate-500">
          Page {filters.page} of {pages}
        </p>
      </div>
      <section aria-label="Resource results" className="mt-5">
        {results.isLoading ? (
          <LoadingState label="Searching resources" />
        ) : results.isError ? (
          <ErrorState
            message="Resources could not be loaded."
            retry={() => void results.refetch()}
          />
        ) : !results.data ? (
          <LoadingState label="Preparing resource results" />
        ) : results.data.items.length === 0 ? (
          <EmptyState
            title="No resources found"
            message="Try fewer filters or a different search term."
            action={
              <button
                onClick={clear}
                className="font-bold text-[#002147] underline"
              >
                Clear all filters
              </button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.data.items.map((item) => (
              <article
                key={item.id}
                className="min-w-0 flex flex-col rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#85591f]">
                  {item.programName} · {item.termName}
                </p>
                <h2 className="mt-3 break-words text-base font-bold text-[#002147] sm:text-lg">
                  <Link
                    to={`/resources/${item.slug}`}
                    className="rounded focus-visible:outline-2"
                  >
                    {item.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                  {item.description || "No description supplied."}
                </p>
                <div className="mt-auto pt-5 text-xs text-slate-500">
                  <p>
                    {item.subjectName} · {item.categoryName}
                  </p>
                  <p className="mt-1">
                    {item.downloadCount.toLocaleString()} downloads
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <nav
        aria-label="Pagination"
        className="mt-10 flex items-center justify-center gap-3"
      >
        <button
          disabled={filters.page <= 1}
          onClick={() => update({ page: filters.page - 1 })}
          className="min-h-11 rounded-lg border border-slate-300 px-5 font-bold disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm">
          {filters.page} / {pages}
        </span>
        <button
          disabled={filters.page >= pages}
          onClick={() => update({ page: filters.page + 1 })}
          className="min-h-11 rounded-lg border border-slate-300 px-5 font-bold disabled:opacity-40"
        >
          Next
        </button>
      </nav>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3"
      >
        <option value="">All</option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
