import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useCurrentAuth } from "../app/AuthContext";
import { Seo } from "../components/Seo";
import { ContributeView } from "../components/ContributeView";

export default function ContributePage() {
  const auth = useCurrentAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (auth.loading) return null;
  if (!auth.user)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  return (
    <>
      <Seo
        title="Contribute a resource"
        description="Upload a PDF for academic review."
        path="/contribute"
        noIndex
      />
      <ContributeView
        initialName={auth.profile?.name}
        isAuthenticated
        emailVerified={auth.emailVerified}
        onLogin={() => navigate("/login")}
      />
    </>
  );
}
