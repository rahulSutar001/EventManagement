import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Star, Lock, Award } from "lucide-react";

const ALL_SKILLS = ["Logistics","Public Speaking","Graphic Design","Social Media","Coding","Operations","Photography","Hospitality"];
const BADGES = [
  { name: "First Shift", icon: "🎯", req: 50 },
  { name: "Team Player", icon: "🤝", req: 200 },
  { name: "Lead Volunteer", icon: "🌟", req: 500 },
  { name: "Veteran", icon: "👑", req: 1500 },
];

export function VolunteerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [vp, setVp] = useState<any>(null);
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({data})=>setProfile(data));
    supabase.from("volunteer_profiles").select("*").eq("profile_id", user.id).maybeSingle().then(({data})=>setVp(data));
    supabase.from("profiles").select("id, full_name, xp").eq("role", "volunteer").order("xp", { ascending: false }).limit(10).then(({data})=>setLeaders(data||[]));
  }, [user]);

  const xp = profile?.xp || 0;
  const level = Math.floor(xp / 200) + 1;
  const next = level * 200;
  const pct = Math.min(100, Math.round((xp / next) * 100));

  const toggleSkill = async (s: string) => {
    const skills: string[] = vp?.skills || [];
    const next = skills.includes(s) ? skills.filter(x => x !== s) : [...skills, s];
    await supabase.from("volunteer_profiles").update({ skills: next }).eq("profile_id", user!.id);
    setVp({ ...vp, skills: next });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Level</p>
              <p className="text-4xl font-bold gradient-text">{level}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">XP</p>
              <p className="text-2xl font-semibold">{xp} / {next}</p>
            </div>
          </div>
          <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full gradient-cta transition-all duration-700" style={{ width: `${pct}%` }}/>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold flex items-center gap-2"><Star className="h-4 w-4 text-primary"/> My skills</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {ALL_SKILLS.map(s => {
              const on = (vp?.skills || []).includes(s);
              return (
                <button key={s} onClick={()=>toggleSkill(s)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${on?"gradient-cta text-white border-transparent":"border-input bg-white/70"}`}>{s}</button>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-primary"/> Achievement badges</h3>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BADGES.map(b => {
              const unlocked = xp >= b.req;
              return (
                <div key={b.name} className={`rounded-xl p-4 text-center border ${unlocked ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200" : "bg-muted/40 border-border opacity-60"}`}>
                  <div className="text-3xl">{unlocked ? b.icon : <Lock className="h-6 w-6 mx-auto text-muted-foreground"/>}</div>
                  <div className="mt-1 text-xs font-medium">{b.name}</div>
                  <div className="text-[10px] text-muted-foreground">{b.req} XP</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="glass-strong rounded-2xl p-6 h-fit">
        <h3 className="font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-primary"/> Global leaderboard</h3>
        <ol className="mt-3 space-y-2">
          {leaders.map((l, i) => (
            <li key={l.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${l.id===user?.id?"bg-accent":"bg-white/60"}`}>
              <span className="text-sm"><span className="font-bold text-primary mr-2">#{i+1}</span>{l.full_name}</span>
              <span className="text-sm font-semibold">{l.xp} XP</span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
