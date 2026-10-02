import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/users-store";
import { roleHome } from "@/lib/auth";

const RequireRole = ({ role, children }: { role?: Role; children: ReactNode }) => {
  const { user, role: authRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
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
