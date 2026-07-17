import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
export default function NotFoundPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-5 py-24 text-center"
    >
      <Seo
        title="Page not found"
        description="The requested page does not exist."
        path={window.location.pathname}
        noIndex
      />
      <p className="font-bold text-[#85591f]">404</p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-[#002147]">
        Page not found
      </h1>
      <p className="mt-4 text-slate-600">
        The address may be incorrect or the page may have moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-xl bg-[#002147] px-6 py-3 font-bold text-white"
      >
        Return home
      </Link>
    </main>
  );
}
