import type { Role } from "@/hooks/useAuth";
export const dashboardPath = (role: Role | null): string => {
  if (!role) return "/login";
  return `/dashboard/${role}`;
};
