import { useEffect, ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, Role } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export function DashboardShell({ role, children, title }: { role: Role; children: ReactNode; title: string }) {
  const { user, role: actualRole, loading, signOut } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
    if (!loading && actualRole && actualRole !== role) nav({ to: `/dashboard/${actualRole}` });
  }, [user, actualRole, loading, role]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 glass-strong border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-cta grid place-items-center text-white font-bold">E</div>
            <span className="font-bold gradient-text">EventTech</span>
            <span className="ml-3 px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground capitalize">{role}</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden md:inline text-muted-foreground">{user.email}</span>
            <button onClick={() => { signOut(); nav({ to: "/" }); }} className="inline-flex items-center gap-1 rounded-md border border-input bg-white/70 px-3 py-1.5 hover:bg-white">
              <LogOut className="h-4 w-4"/> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        {children}
      </main>
    </div>
  );
}
