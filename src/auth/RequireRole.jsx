import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireRole({ roles, children }) {
  const auth = useAuth();
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (!auth.isAuthenticated) return <Navigate to="/" replace />;
  if (!auth.user || !allowed.includes(auth.user.role)) {
    return <Navigate to="/layout/dashboard" replace />;
  }

  return children;
}

