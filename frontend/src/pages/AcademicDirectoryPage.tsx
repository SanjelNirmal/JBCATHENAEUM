import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import { fetchAcademicCatalog } from "../lib/supabase/academic";

export default function AcademicDirectoryPage() {
  const location = useLocation();
  const params = useParams();
  const query = useQuery({
    queryKey: ["academic-catalog"],
    queryFn: fetchAcademicCatalog,
    staleTime: 10 * 60_000,
  });
  if (query.isLoading)
    return (
      <main id="main-content">
        <LoadingState label="Loading academic structure" />
      </main>
    );
  if (query.isError)
    return (
      <main id="main-content" className="px-5 py-20">
        <ErrorState
          message="The academic directory could not be loaded."
          retry={() => void query.refetch()}
        />
      </main>
    );
  const catalog = query.data ?? [];
  const kind = location.pathname.startsWith("/faculties")
    ? "faculty"
    : location.pathname.startsWith("/programs")
      ? "program"
      : "subject";
  const slug = params.facultySlug ?? params.programSlug ?? params.subjectSlug;
  if (slug) {
    const item = catalog.find((option) =>
      kind === "faculty"
        ? option.facultySlug === slug
        : kind === "program"
          ? option.programSlug === slug
          : option.subjectSlug === slug,
    );
    if (!item)
      return (
        <main
          id="main-content"
          className="mx-auto max-w-3xl px-5 py-24 text-center"
        >
          <Seo
            title="Academic page not found"
            description="The requested academic entry does not exist."
            path={location.pathname}
            noIndex
          />
          <h1 className="font-serif text-4xl font-bold text-[#002147]">
            Academic entry not found
          </h1>
          <Link
            to="/faculties"
            className="mt-7 inline-flex rounded-xl bg-[#002147] px-6 py-3 font-bold text-white"
          >
            Academic directory
          </Link>
        </main>
      );
    const title =
      kind === "faculty"
        ? item.facultyName
        : kind === "program"
          ? item.programName
          : item.subjectName;
    const resourcesLink =
      kind === "faculty"
        ? `/resources?faculty=${item.facultyId}`
        : kind === "program"
          ? `/resources?program=${item.programId}`
          : `/resources?subject=${item.subjectId}`;
    const relatedSubjects = catalog.filter((option) =>
      kind === "faculty"
        ? option.facultyId === item.facultyId
        : option.programId === item.programId,
    );
    return (
      <main id="main-content" className="mx-auto max-w-5xl px-5 py-16">
        <Seo
          title={title}
          description={`Academic resources and curriculum information for ${title}.`}
          path={location.pathname}
        />
        <p className="text-sm font-bold uppercase tracking-wider text-[#85591f]">
          {kind}
        </p>
        <h1 className="mt-3 font-serif text-5xl font-bold text-[#002147]">
          {title}
        </h1>
        <p className="mt-4 text-slate-600">
          {item.campusName} · {item.programName} · {item.termName}
        </p>
        <Link
          to={resourcesLink}
          className="mt-7 inline-flex rounded-xl bg-[#002147] px-6 py-3 font-bold text-white"
        >
          Browse matching resources
        </Link>
        {kind !== "subject" && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-[#002147]">
              Subjects
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {relatedSubjects.map((subject) => (
                <Link
                  key={subject.subjectId}
                  to={`/subjects/${subject.subjectSlug}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 font-bold text-[#002147] hover:border-[#85591f]"
                >
                  {subject.subjectName}
                  <span className="mt-1 block text-sm font-normal text-slate-500">
                    {subject.termName}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    );
  }
  const faculties = Array.from(
    new Map(catalog.map((item) => [item.facultyId, item])).values(),
  );
  return (
    <main id="main-content" className="mx-auto max-w-7xl px-5 py-16">
      <Seo
        title="Academic directory"
        description="Browse faculties, programs, terms, and subjects."
        path="/faculties"
      />
      <h1 className="font-serif text-5xl font-bold text-[#002147]">
        Academic directory
      </h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        Curriculum records come directly from the normalized academic database.
      </p>
      {faculties.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No active academic records"
            message="An administrator must configure faculties and programs."
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {faculties.map((faculty) => {
            const programs = Array.from(
              new Map(
                catalog
                  .filter((item) => item.facultyId === faculty.facultyId)
                  .map((item) => [item.programId, item]),
              ).values(),
            );
            return (
              <section
                key={faculty.facultyId}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h2 className="font-serif text-2xl font-bold text-[#002147]">
                  <Link to={`/faculties/${faculty.facultySlug}`}>
                    {faculty.facultyName}
                  </Link>
                </h2>
                <ul className="mt-4 space-y-2">
                  {programs.map((program) => (
                    <li key={program.programId}>
                      <Link
                        to={`/programs/${program.programSlug}`}
                        className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4"
                      >
                        {program.programName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
