import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/users-store";
import { roleHome } from "@/lib/auth";

const RequireRole = ({ role, children }: { role?: Role; children: ReactNode }) => {
  const { user, role: authRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (role && authRole !== role) {
    return <Navigate to={authRole ? roleHome(authRole) : "/"} replace />;
  }
  return <>{children}</>;
};

export default RequireRole;
