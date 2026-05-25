import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { dashboardPath } from "@/lib/dashboardPath";
import { Calendar, Users, Briefcase, Sparkles, Trophy, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user && role) nav({ to: dashboardPath(role) });
  }, [user, role, loading]);

  return (
    <div className="min-h-screen">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-cta grid place-items-center text-white font-bold">E</div>
          <span className="text-xl font-bold gradient-text">EventTech</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium px-4 py-2 hover:text-primary">Log in</Link>
          <Link to="/signup" className="text-sm font-medium px-4 py-2 rounded-md gradient-cta">Join EventTech</Link>
        </div>
      </nav>

      <header className="mx-auto max-w-7xl px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI-powered event ecosystem
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight">
          One platform.<br/><span className="gradient-text">Four roles. Zero chaos.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Organizers, Volunteers, Sponsors and Participants — finally in sync.
          Smart matching, live Kanban, transparent budgets and digital tickets.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/signup" className="rounded-lg gradient-cta px-6 py-3 font-medium">Get started free</Link>
          <Link to="/login" className="rounded-lg glass px-6 py-3 font-medium">I have an account</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-24 grid md:grid-cols-4 gap-4">
        {[
          { icon: Calendar, title: "Organizers", desc: "AI budgeting, sponsor matching & live workspaces." },
          { icon: Users, title: "Volunteers", desc: "Find shifts by skill, earn XP & download certificates." },
          { icon: Briefcase, title: "Sponsors", desc: "Match scoring, smart MoUs & transparent ROI." },
          { icon: Trophy, title: "Participants", desc: "Discover events, QR check-in & network in real time." },
        ].map((f) => (
          <div key={f.title} className="glass rounded-2xl p-6">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground flex justify-between">
          <span>© EventTech</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4"/> Built for events that matter.</span>
        </div>
      </footer>
    </div>
  );
}
