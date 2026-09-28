import type { Role } from "@/lib/users-store";

export const roleHome = (role: Role) =>
  role === "driver" ? "/driver" : role === "admin" ? "/admin" : "/account";