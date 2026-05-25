import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Award, MessageSquare, Download } from "lucide-react";
import { downloadCertificate } from "@/lib/certificate";

export function VolunteerOps() {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [eventId, setEventId] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase.from("volunteer_applications").select("*, events(*)").eq("volunteer_id", user.id).eq("status","approved")
      .then(({data})=>{ setApps(data||[]); if (data?.[0]) setEventId(data[0].event_id); });
  }, [user]);

  if (!apps.length) return <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Get approved for an event to unlock your live ops workspace.</div>;
  const app = apps.find(a => a.event_id === eventId);

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      <aside className="space-y-2">
        <label className="text-xs text-muted-foreground px-2">Approved events</label>
        {apps.map(a => (
          <button key={a.id} onClick={()=>setEventId(a.event_id)} className={`w-full text-left rounded-lg px-3 py-2 text-sm ${eventId===a.event_id?"gradient-cta text-white":"bg-white/60 hover:bg-white"}`}>
            {a.events.title}{a.is_lead && " 🌟"}
          </button>
        ))}
      </aside>
      {app && <div className="space-y-6">
        <MyKanban eventId={app.event_id}/>
        <DiscordWidget isLead={app.is_lead}/>
        <PerformanceCard app={app}/>
      </div>}
    </div>
  );
}

function MyKanban({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [doneNote, setDoneNote] = useState<{id: string; title: string} | null>(null);

  const load = () => supabase.from("tasks").select("*").eq("event_id", eventId).eq("assigned_to", user!.id).then(({data})=>setTasks(data||[]));
  useEffect(() => {
    load();
    const ch = supabase.channel(`my-tasks-${eventId}`).on("postgres_changes",{event:"*",schema:"public",table:"tasks",filter:`event_id=eq.${eventId}`}, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [eventId, user]);

  const move = async (t: any, status: "todo"|"in_progress"|"done") => {
    if (status === "done") { setDoneNote({ id: t.id, title: t.title }); return; }
    await supabase.from("tasks").update({ status }).eq("id", t.id);
  };

  const completeWithNote = async (notes: string) => {
    if (!doneNote) return;
    await supabase.from("tasks").update({ status: "done", notes }).eq("id", doneNote.id);
    toast.success("Task complete! Discord notified.");
    setDoneNote(null);
  };

  const cols: {id:"todo"|"in_progress"|"done";label:string}[] = [{id:"todo",label:"To-Do"},{id:"in_progress",label:"In Progress"},{id:"done",label:"Done"}];
  if (!tasks.length) return <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">No tasks assigned yet.</div>;
  return (
    <div>
      <h3 className="font-semibold mb-3">My tasks</h3>
      <div className="grid md:grid-cols-3 gap-3">
        {cols.map(c => (
          <div key={c.id} className="glass rounded-2xl p-3">
            <h4 className="font-semibold text-sm mb-2">{c.label}</h4>
            <div className="space-y-2">
              {tasks.filter(t=>t.status===c.id).map(t => (
                <div key={t.id} className="bg-white rounded-lg p-2.5 border border-border/60">
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.category}</p>
                  <div className="mt-2 flex gap-1">
                    {cols.filter(x=>x.id!==c.id).map(x => (
                      <button key={x.id} onClick={()=>move(t, x.id)} className="text-[10px] px-2 py-0.5 rounded border border-input hover:bg-accent">→ {x.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {doneNote && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={()=>setDoneNote(null)}>
          <div className="glass-strong rounded-2xl p-6 max-w-md w-full" onClick={(e)=>e.stopPropagation()}>
            <h3 className="font-semibold">Mark "{doneNote.title}" complete</h3>
            <textarea id="note" rows={3} placeholder="Optional notes / photo URLs..." className="mt-3 w-full rounded-lg border border-input bg-white/70 p-3 text-sm"/>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={()=>setDoneNote(null)} className="rounded-lg border border-input px-4 py-2 text-sm">Cancel</button>
              <button onClick={()=>completeWithNote((document.getElementById("note") as HTMLTextAreaElement).value)} className="rounded-lg gradient-cta px-4 py-2 text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiscordWidget({ isLead }: { isLead: boolean }) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center justify-between">
      <div>
        <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary"/> Discord</h3>
        <p className="text-xs text-muted-foreground mt-1">Role assigned: <span className={`px-2 py-0.5 rounded-full text-[10px] ${isLead?"bg-amber-100 text-amber-800":"bg-purple-100 text-purple-800"}`}>{isLead?"Lead Volunteer":"Volunteer"}</span></p>
      </div>
      <button onClick={()=>toast.success("Discord invite copied (simulated)")} className="rounded-lg gradient-cta px-4 py-2 text-sm">Join Event Discord</button>
    </div>
  );
}

function PerformanceCard({ app }: { app: any }) {
  const { user } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("performance_scores").select("score, xp_awarded").eq("volunteer_id", user.id).eq("event_id", app.event_id).maybeSingle()
      .then(({data})=>{ if (data) { setScore(data.score); setTimeout(()=>{setPop(true); setTimeout(()=>setPop(false), 2000);}, 200); } });
  }, [user, app.event_id]);

  const cert = async () => {
    const cuid = `EVT-${app.event_id.slice(0,8).toUpperCase()}-${user!.id.slice(0,6).toUpperCase()}`;
    await supabase.from("certificates").insert({ user_id: user!.id, event_id: app.event_id, role: "volunteer", certificate_uid: cuid, performance_score: score });
    const p = await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();
    downloadCertificate({ name: p.data?.full_name || "Volunteer", event: app.events.title, role: "Volunteer", date: app.events.event_date || new Date().toISOString().slice(0,10), uid: cuid, score });
  };

  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className="font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-primary"/> Performance</h3>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full gradient-cta grid place-items-center text-white text-2xl font-bold">{score ?? "—"}</div>
          {pop && <div className="absolute -top-2 -right-6 px-2 py-1 rounded-full gradient-cta text-white text-xs animate-bounce">+{(score||0)*15} XP!</div>}
        </div>
        <div className="text-sm text-muted-foreground">Rated by Lead / Organizer<br/>Out of 10</div>
      </div>
      <button onClick={cert} className="mt-4 inline-flex items-center gap-2 rounded-lg gradient-cta px-4 py-2 text-sm">
        <Download className="h-4 w-4"/> Download Certificate
      </button>
    </div>
  );
}
