import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { dashboardPath } from "@/lib/dashboardPath";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/login")({ component: LoginPage });

const schema = z.object({
  email: z.string().trim().email("Valid email required").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

function LoginPage() {
  const nav = useNavigate();
  const { user, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && role) nav({ to: dashboardPath(role) });
  }, [user, role, loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back");
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md glass-strong rounded-2xl p-8">
        <Link to="/" className="text-sm text-muted-foreground">← Back</Link>
        <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Log in to your EventTech account.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input className="mt-1 w-full rounded-lg border border-input bg-white/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input className="mt-1 w-full rounded-lg border border-input bg-white/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={72} />
          </div>
          <button disabled={busy} className="w-full rounded-lg gradient-cta py-3 font-medium disabled:opacity-60">
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          New here? <Link to="/signup" search={{ role: undefined }} className="text-primary font-medium">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
