import { Navigate, useLocation } from "react-router-dom";
import { PolicyLayout } from "../features/legal/components/PolicyLayout";
import { policyByPath } from "../features/legal/content/policies";

export default function PolicyPage() {
  const location = useLocation();
  const policy = policyByPath.get(location.pathname);

  if (!policy) return <Navigate to="/policies" replace />;

  return <PolicyLayout policy={policy} />;
}
