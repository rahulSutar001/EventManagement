import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import type { Role } from "@/hooks/useAuth";
import { dashboardPath } from "@/lib/dashboardPath";
import { Calendar, Users, Briefcase, Trophy } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  validateSearch: (s: Record<string, unknown>): { role?: Role } => ({ role: (s.role as Role) || undefined }),
});

const baseSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  bio: z.string().max(800).optional().default(""),
  hashtags: z.string().max(200).optional().default(""),
});

const ROLES = [
  { id: "organizer" as Role, icon: Calendar, title: "Organizer", desc: "Plan & run events. Match with sponsors, manage volunteers." },
  { id: "volunteer" as Role, icon: Users, title: "Volunteer", desc: "Find shifts that match your skills. Earn XP & badges." },
  { id: "sponsor" as Role, icon: Briefcase, title: "Sponsor", desc: "Discover high-ROI events with AI-matched audiences." },
  { id: "participant" as Role, icon: Trophy, title: "Participant", desc: "Discover events, register & network with one click." },
];

function SignupPage() {
  const { role } = Route.useSearch();
  if (!role) return <ChooseRole />;
  return <RoleForm role={role} />;
}

function ChooseRole() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="text-sm text-muted-foreground">← Back</Link>
        <h1 className="mt-2 text-4xl font-bold">Join as...</h1>
        <p className="mt-2 text-muted-foreground">Pick the role that fits you best. You can sign in once and tap into the whole ecosystem.</p>
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {ROLES.map((r) => (
            <Link key={r.id} to="/signup" search={{ role: r.id }}
              className="glass rounded-2xl p-6 hover:-translate-y-0.5 transition group">
              <r.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-xl font-semibold group-hover:text-primary">{r.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
              <span className="mt-4 inline-block text-sm font-medium text-primary">Continue →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
const inputCls = "w-full rounded-lg border border-input bg-white/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary";

function MultiCheck({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button type="button" key={o} onClick={() => onChange(on ? value.filter(v => v !== o) : [...value, o])}
            className={`px-3 py-1.5 rounded-full text-xs border ${on ? "gradient-cta text-white border-transparent" : "border-input bg-white/60 hover:bg-white"}`}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function RoleForm({ role }: { role: Role }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [common, setCommon] = useState({ full_name: "", email: "", password: "", bio: "", hashtags: "" });
  const [extra, setExtra] = useState<any>({});

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setCommon((c) => ({ ...c, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = baseSchema.safeParse(common);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email, password: parsed.data.password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: parsed.data.full_name } },
    });
    if (error || !data.user) { toast.error(error?.message || "Signup failed"); setBusy(false); return; }
    const uid = data.user.id;
    const { error: pErr } = await supabase.from("profiles").insert({
      id: uid,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      role,
      bio: parsed.data.bio,
      hashtags: parsed.data.hashtags,
      github_url: role === "participant" ? extra.github_url : null,
      linkedin_url: role === "participant" ? extra.linkedin_url : null,
    });
    if (pErr) { toast.error(pErr.message); setBusy(false); return; }

    const tbl = `${role}_profiles`;
    let payload: any = { profile_id: uid };
    if (role === "organizer") payload = { ...payload, org_name: extra.org_name, org_type: extra.org_type, past_events_count: Number(extra.past_events_count) || 0, target_audience: extra.target_audience || [] };
    if (role === "volunteer") payload = { ...payload, college: extra.college, year: extra.year, skills: extra.skills || [], experience_level: extra.experience_level };
    if (role === "sponsor") payload = { ...payload, company_name: extra.company_name, industry: extra.industry, budget_range: extra.budget_range, primary_goal: extra.primary_goal || [] };
    if (role === "participant") payload = { ...payload, designation: extra.designation, interests: extra.interests || [], github_url: extra.github_url, linkedin_url: extra.linkedin_url };
    const { error: rErr } = await (supabase.from(tbl as any) as any).insert(payload);
    if (rErr) { toast.error(rErr.message); setBusy(false); return; }
    toast.success("Account created!");
    setTimeout(() => nav({ to: dashboardPath(role) }), 300);
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/signup" search={{ role: undefined }} className="text-sm text-muted-foreground">← Change role</Link>
        <h1 className="mt-2 text-3xl font-bold capitalize">Join as {role}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4 glass-strong rounded-2xl p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full name"><input className={inputCls} value={common.full_name} onChange={set("full_name")} required maxLength={80}/></Field>
            <Field label="Email"><input type="email" className={inputCls} value={common.email} onChange={set("email")} required maxLength={255}/></Field>
            <Field label="Password"><input type="password" className={inputCls} value={common.password} onChange={set("password")} required minLength={6} maxLength={72}/></Field>
          </div>

          {role === "organizer" && <>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Organization name"><input className={inputCls} onChange={(e)=>setExtra({...extra, org_name:e.target.value})} required/></Field>
              <Field label="Type">
                <select className={inputCls} onChange={(e)=>setExtra({...extra, org_type:e.target.value})} required defaultValue="">
                  <option value="" disabled>Select…</option>
                  {["College Club","Non-Profit","Corporate","Independent"].map(o=><option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Past events conducted"><input type="number" min={0} className={inputCls} onChange={(e)=>setExtra({...extra, past_events_count:e.target.value})}/></Field>
            </div>
            <Field label="Target audience">
              <MultiCheck options={["Tech Students","Designers","Entrepreneurs","General Public"]} value={extra.target_audience||[]} onChange={(v)=>setExtra({...extra, target_audience:v})}/>
            </Field>
          </>}

          {role === "volunteer" && <>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="College / University"><input className={inputCls} onChange={(e)=>setExtra({...extra, college:e.target.value})} required/></Field>
              <Field label="Current year"><input placeholder="e.g. SY BTech" className={inputCls} onChange={(e)=>setExtra({...extra, year:e.target.value})}/></Field>
              <Field label="Experience">
                <select className={inputCls} onChange={(e)=>setExtra({...extra, experience_level:e.target.value})} defaultValue="">
                  <option value="" disabled>Select…</option>{["Beginner","Intermediate","Experienced"].map(o=><option key={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Core skills">
              <MultiCheck options={["Logistics","Public Speaking","Graphic Design","Social Media","Coding","Operations"]} value={extra.skills||[]} onChange={(v)=>setExtra({...extra, skills:v})}/>
            </Field>
          </>}

          {role === "sponsor" && <>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Company name"><input className={inputCls} onChange={(e)=>setExtra({...extra, company_name:e.target.value})} required/></Field>
              <Field label="Industry">
                <select className={inputCls} onChange={(e)=>setExtra({...extra, industry:e.target.value})} defaultValue="">
                  <option value="" disabled>Select…</option>{["FinTech","EdTech","SaaS","Web3","Hardware","FMCG"].map(o=><option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Budget range">
                <select className={inputCls} onChange={(e)=>setExtra({...extra, budget_range:e.target.value})} defaultValue="">
                  <option value="" disabled>Select…</option>{["<$1k","$1k-$5k","$5k-$10k","$10k+"].map(o=><option key={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Primary goal">
              <MultiCheck options={["Talent Hiring","Brand Awareness","Product Adoption"]} value={extra.primary_goal||[]} onChange={(v)=>setExtra({...extra, primary_goal:v})}/>
            </Field>
          </>}

          {role === "participant" && <>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Designation">
                <select className={inputCls} onChange={(e)=>setExtra({...extra, designation:e.target.value})} defaultValue="">
                  <option value="" disabled>Select…</option>{["Student","Working Professional","Freelancer"].map(o=><option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="GitHub / Portfolio URL"><input className={inputCls} onChange={(e)=>setExtra({...extra, github_url:e.target.value})}/></Field>
              <Field label="LinkedIn URL"><input className={inputCls} onChange={(e)=>setExtra({...extra, linkedin_url:e.target.value})}/></Field>
            </div>
            <Field label="Primary interests">
              <MultiCheck options={["AI/ML","Web Development","Design","UI/UX","Business/Pitching"]} value={extra.interests||[]} onChange={(v)=>setExtra({...extra, interests:v})}/>
            </Field>
          </>}

          <Field label="Bio & hashtags (short)"><textarea className={inputCls} rows={3} maxLength={800} value={common.bio} onChange={set("bio")}/></Field>
          <Field label="Hashtags"><input placeholder="#AI #Hackathon" className={inputCls} maxLength={200} value={common.hashtags} onChange={set("hashtags")}/></Field>

          <button disabled={busy} className="w-full rounded-lg gradient-cta py-3 font-medium disabled:opacity-60">
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
