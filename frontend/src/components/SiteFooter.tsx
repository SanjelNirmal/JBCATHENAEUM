import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#001b3a] text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-white">
            JBC Athenaeum
          </h2>
          <p className="mt-3 text-sm leading-6">
            A moderated academic-resource archive for Jana Bhawana Campus.
          </p>
          <div className="mt-5 border-l-2 border-[#c49b63] pl-4 text-sm leading-6">
            <p className="font-semibold text-white">Created by Nirmal Sanjel</p>
            <a
              href="https://www.nirmalsanjel.com.np"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[#d8b37a] transition-colors hover:text-white hover:underline"
            >
              www.nirmalsanjel.com.np
            </a>
            <a
              href="mailto:admin@nirmalsanjel.com.np"
              className="block text-[#d8b37a] transition-colors hover:text-white hover:underline"
            >
              admin@nirmalsanjel.com.np
            </a>
          </div>
        </div>
        <div>
          <h2 className="font-bold text-white">Platform</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/resources">Resources</Link>
            </li>
            <li>
              <Link to="/faculties">Academic directory</Link>
            </li>
            <li>
              <Link to="/contribute">Contribute</Link>
            </li>
            <li>
              <Link to="/copyright/removal">Removal request</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-bold text-white">Policies</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/privacy">Privacy</Link>
            </li>
            <li>
              <Link to="/terms">Terms</Link>
            </li>
            <li>
              <Link to="/copyright">Copyright</Link>
            </li>
            <li>
              <Link to="/policies/upload">Upload policy</Link>
            </li>
            <li>
              <Link to="/policies/retention">Data retention</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-bold text-white">Account</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/login">Sign in or sign up</Link>
            </li>
            <li>
              <Link to="/forgot-password">Password recovery</Link>
            </li>
            <li>
              <Link to="/policies/account-deletion">
                Account deletion policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-6 text-center text-xs leading-6 text-slate-400">
        <p>© 2026 JBC Athenaeum. Created and maintained by Nirmal Sanjel.</p>
        <p>
          Independent academic archive · Campus-wide launch remains subject to
          institutional approval.
        </p>
      </div>
    </footer>
  );
}
