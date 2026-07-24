import { AcademicTrustSection } from "../components/AcademicTrustSection";
import { Seo } from "../components/Seo";

export default function AboutReviewProcessPage() {
  return (
    <main id="main-content" className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
      <Seo
        title="Resource review process"
        description="Review process, moderation checks, and verification definitions for JBC Athenaeum resources."
        path="/about/review-process"
      />
      <h1 className="font-serif text-4xl font-bold text-[#002147]">
        About the review process
      </h1>
      <p className="mt-4 text-sm leading-7 text-slate-700">
        This page explains how JBC Athenaeum moderates resources and what each
        verification claim means.
      </p>
      <div className="mt-8">
        <AcademicTrustSection compact />
      </div>
    </main>
  );
}
