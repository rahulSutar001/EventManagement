import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles, Mail, MessageSquare, Check, Star, Plus } from "lucide-react";

type Event = { id: string; title: string; themes: any; total_budget: number; itemized_budget: any; sponsor_kanban_enabled: boolean };

export function OrganizerWorkspace() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState<string>("");
  const [tab, setTab] = useState<"sponsor"|"volunteer"|"kanban">("kanban");

  useEffect(() => {
    if (!user) return;
    supabase.from("events").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setEvents((data as any) || []); if (data?.[0]) setEventId(data[0].id); });
  }, [user]);

  const event = events.find(e => e.id === eventId);

  if (!events.length) return <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Publish an event first to open its workspace.</div>;

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      <aside className="space-y-2">
        <label className="text-xs text-muted-foreground px-2">Event</label>
        <select className="w-full rounded-lg border border-input bg-white/70 px-3 py-2" value={eventId} onChange={(e)=>setEventId(e.target.value)}>
          {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <nav className="mt-4 space-y-1">
          {[
            { id: "sponsor", label: "Sponsor Match Feed" },
            { id: "volunteer", label: "Volunteer Screening" },
            { id: "kanban", label: "Live Kanban" },
          ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id as any)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm ${tab===t.id ? "gradient-cta text-white" : "hover:bg-white/60"}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <div>
        {event && tab === "sponsor" && <SponsorFeed event={event}/>}
        {event && tab === "volunteer" && <VolunteerScreen event={event}/>}
        {event && tab === "kanban" && <OrgKanban event={event} refresh={()=>{
          if (user) supabase.from("events").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false }).then(({data})=>setEvents((data as any)||[]));
        }}/>}
      </div>
    </div>
  );
}

function SponsorFeed({ event }: { event: Event }) {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [pitchTo, setPitchTo] = useState<any>(null);
  useEffect(() => {
    supabase.from("sponsor_profiles").select("*, profiles(full_name, email, id, hashtags)").limit(20)
      .then(({ data }) => setSponsors(data || []));
  }, []);
  const themes = Array.isArray(event.themes) ? event.themes : [];
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sponsors.map((s) => {
        const score = 60 + Math.floor(Math.random()*40);
        return (
          <div key={s.id} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{s.company_name || s.profiles?.full_name}</h4>
                <p className="text-xs text-muted-foreground">{s.industry} • {s.budget_range}</p>
              </div>
              <div className="relative h-14 w-14 grid place-items-center rounded-full bg-gradient-to-br from-pink-500 to-red-500 text-white font-bold text-sm">{score}%</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {(s.primary_goal || []).slice(0,2).map((g: string) => <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{g}</span>)}
              {themes.slice(0,2).map((t: string) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">#{t}</span>)}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={()=>setPitchTo(s)} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg gradient-cta py-2 text-xs"><Mail className="h-3.5 w-3.5"/> Pitch</button>
              <button className="rounded-lg border border-input bg-white/70 px-3 text-xs"><MessageSquare className="h-3.5 w-3.5"/></button>
            </div>
          </div>
        );
      })}
      {pitchTo && <PitchModal sponsor={pitchTo} event={event} onClose={()=>setPitchTo(null)}/>}
    </div>
  );
}

function PitchModal({ sponsor, event, onClose }: { sponsor: any; event: Event; onClose: () => void }) {
  const draft = `Subject: Partnership opportunity — ${event.title}

Hi ${sponsor.profiles?.full_name || sponsor.company_name},

We're hosting ${event.title} and noticed your work in ${sponsor.industry || "your industry"} would be a perfect fit for our audience. With an expected reach and budget of ₹${event.total_budget}, we'd love to explore a partnership that aligns with your ${(sponsor.primary_goal||[]).join(", ") || "growth"} goals.

Themes: ${(Array.isArray(event.themes) ? event.themes : []).join(", ")}.

Looking forward to your response.

— The EventTech Team`;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 max-w-xl w-full" onClick={(e)=>e.stopPropagation()}>
        <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary"/> AI-drafted pitch</h3>
        <textarea defaultValue={draft} rows={12} className="mt-3 w-full rounded-lg border border-input bg-white/70 p-3 text-sm font-mono"/>
        <div className="mt-3 flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm">Close</button>
          <button onClick={()=>{toast.success("Pitch sent (simulated)"); onClose();}} className="rounded-lg gradient-cta px-4 py-2 text-sm">Send</button>
        </div>
      </div>
    </div>
  );
}

function VolunteerScreen({ event }: { event: Event }) {
  const [apps, setApps] = useState<any[]>([]);
  const load = () => supabase.from("volunteer_applications").select("*, profiles!volunteer_applications_volunteer_id_fkey(full_name, email, hashtags)").eq("event_id", event.id)
    .then(({ data }) => setApps(data || []));
  useEffect(() => { load(); }, [event.id]);
  const approve = async (id: string) => { await supabase.from("volunteer_applications").update({ status: "approved" }).eq("id", id); toast.success("Approved"); load(); };
  const lead = async (id: string, on: boolean) => { await supabase.from("volunteer_applications").update({ is_lead: on }).eq("id", id); load(); };

  if (!apps.length) return <div className="glass rounded-2xl p-8 text-center text-muted-foreground">No volunteer applications yet.</div>;
  return (
    <div className="space-y-3">
      {apps.map((a, i) => (
        <div key={a.id} className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{a.profiles?.full_name}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full gradient-cta text-white">Top pick #{i+1}</span>
              {a.is_lead && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1"><Star className="h-3 w-3"/>Lead</span>}
            </div>
            <p className="text-xs text-muted-foreground">{a.preferred_dept} • {a.role_type} • {a.tshirt_size}</p>
            <p className="text-xs italic mt-1 max-w-xl">"{a.why_volunteer?.slice(0, 120)}"</p>
          </div>
          <div className="flex items-center gap-2">
            {a.status === "approved" ? (
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={a.is_lead} onChange={(e)=>lead(a.id, e.target.checked)}/> Lead
              </label>
            ) : (
              <button onClick={()=>approve(a.id)} className="rounded-lg gradient-cta px-3 py-1.5 text-xs inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5"/> Approve
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrgKanban({ event, refresh }: { event: Event; refresh: () => void }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [vols, setVols] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("Catering");

  const load = () => {
    supabase.from("tasks").select("*").eq("event_id", event.id).then(({data})=>setTasks(data||[]));
    supabase.from("volunteer_applications").select("volunteer_id, profiles!volunteer_applications_volunteer_id_fkey(full_name)").eq("event_id", event.id).eq("status", "approved")
      .then(({data})=>setVols(data||[]));
  };
  useEffect(() => {
    load();
    const ch = supabase.channel(`tasks-${event.id}`).on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `event_id=eq.${event.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [event.id]);

  const cats = Object.keys(event.itemized_budget || {});

  const addTask = async () => {
    if (!newTitle) return;
    await supabase.from("tasks").insert({ event_id: event.id, title: newTitle, category: newCat });
    setNewTitle("");
  };

  const toggleSponsor = async () => {
    await supabase.from("events").update({ sponsor_kanban_enabled: !event.sponsor_kanban_enabled }).eq("id", event.id);
    toast.success(`Sponsor mirror ${!event.sponsor_kanban_enabled ? "enabled" : "disabled"}`);
    refresh();
  };

  const cols: { id: "todo"|"in_progress"|"done"; label: string }[] = [
    { id: "todo", label: "To-Do" }, { id: "in_progress", label: "In Progress" }, { id: "done", label: "Done" }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 items-center">
          <input value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} placeholder="New task" className="rounded-lg border border-input bg-white/70 px-3 py-2 text-sm"/>
          <select value={newCat} onChange={(e)=>setNewCat(e.target.value)} className="rounded-lg border border-input bg-white/70 px-3 py-2 text-sm">
            {(cats.length ? cats : ["Catering","Prize Pool","Marketing/Merch","Venue/Logistics"]).map(c=><option key={c}>{c}</option>)}
          </select>
          <button onClick={addTask} className="rounded-lg gradient-cta px-3 py-2 text-sm inline-flex items-center gap-1"><Plus className="h-4 w-4"/>Add</button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={event.sponsor_kanban_enabled} onChange={toggleSponsor}/>
          Sponsor read-only mirror
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {cols.map(col => (
          <div key={col.id} className="glass rounded-2xl p-4">
            <h4 className="font-semibold mb-3 flex items-center justify-between">
              {col.label}
              <span className="text-xs text-muted-foreground">{tasks.filter(t=>t.status===col.id).length}</span>
            </h4>
            <div className="space-y-2">
              {tasks.filter(t=>t.status===col.id).map(t => (
                <div key={t.id} className="bg-white rounded-xl p-3 border border-border/60">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.category}</div>
                  <select className="mt-2 w-full text-xs rounded border border-input bg-white px-2 py-1"
                    value={t.assigned_to || ""}
                    onChange={async (e)=>{ await supabase.from("tasks").update({ assigned_to: e.target.value || null }).eq("id", t.id); }}>
                    <option value="">Unassigned</option>
                    {vols.map(v => <option key={v.volunteer_id} value={v.volunteer_id}>{v.profiles?.full_name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
