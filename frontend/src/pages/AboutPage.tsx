import { Link } from "react-router-dom";
import { AcademicTrustSection } from "../components/AcademicTrustSection";
import { Seo } from "../components/Seo";
import { campusImages } from "../content/campusImages";

export default function AboutPage() {
  return (
    <main id="main-content" className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
      <Seo
        title="About JBC Athenaeum"
        description="Learn what JBC Athenaeum is, how resources are moderated, and how Jana Bhawana Campus students can contribute."
        path="/about"
      />
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#85591f]">
        About JBC Athenaeum
      </p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-[#002147] sm:text-5xl">
        Student-built academic archive for Jana Bhawana Campus
      </h1>
      <p className="mt-4 max-w-4xl text-base leading-8 text-slate-700">
        JBC Athenaeum is a student-built academic archive created to organize
        useful learning materials for Jana Bhawana Campus students.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {[campusImages.campusBuilding, campusImages.classroom].map((image) => (
          <img
            key={image.alt}
            src={image.src}
            alt={image.alt}
            loading="lazy"
            decoding="async"
            className="h-64 w-full rounded-2xl object-cover"
          />
        ))}
      </div>
      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-serif text-2xl font-bold text-[#002147]">
            What students can find
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Notes, past questions, practical files, project guidance, and
            academic posts covering TU BCA, BICTE, BBS, and MBS pathways.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-serif text-2xl font-bold text-[#002147]">
            Ownership and relationship
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Content remains owned by contributors or original rights holders.
            JBC Athenaeum is independently moderated and does not claim official
            institutional endorsement unless explicitly marked.
          </p>
        </article>
      </section>
      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-serif text-2xl font-bold text-[#002147]">
          About the reviewers
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Reviewer identities are shown only when verified institutional details
          are available. Until then, JBC Athenaeum publishes transparent
          institutional review-process information instead of fabricated personal
          profiles.
        </p>
        <Link
          to="/about/review-process"
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#002147] px-5 font-bold text-white"
        >
          See review process
        </Link>
      </section>
      <div className="mt-10">
        <AcademicTrustSection compact />
      </div>
    </main>
  );
}
