import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Download, FileText, Send } from "lucide-react";

export function SponsorWorkspace() {
  const { user } = useAuth();
  const [sps, setSps] = useState<any[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(()=>{
    if(!user) return;
    supabase.from("sponsorships").select("*, events(*)").eq("sponsor_id", user.id).eq("status","approved")
      .then(({data})=>{ setSps(data||[]); if(data?.[0]) setActive(data[0].id); });
  },[user]);

  if (!sps.length) return <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Once an organizer approves your sponsorship, the workspace appears here.</div>;
  const s = sps.find(x=>x.id===active);
  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      <aside className="space-y-2">
        {sps.map(x=>(<button key={x.id} onClick={()=>setActive(x.id)} className={`w-full text-left rounded-lg px-3 py-2 text-sm ${active===x.id?"gradient-cta text-white":"bg-white/60"}`}>{x.events.title}</button>))}
      </aside>
      {s && <div className="space-y-4">
        <ROI event={s.events}/>
        <MoU s={s}/>
        <KanbanMirror event={s.events}/>
      </div>}
    </div>
  );
}

function ROI({ event }: { event: any }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className="font-semibold">ROI Dashboard — {event.title}</h3>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[{l:"Registered",v:event.expected_footfall||120},{l:"Impressions",v:"24k"},{l:"Handshakes",v:48}].map(k=>(
          <div key={k.l} className="rounded-lg bg-accent p-3"><p className="text-xs text-muted-foreground">{k.l}</p><p className="text-xl font-bold">{k.v}</p></div>
        ))}
      </div>
      <button onClick={()=>toast.success("Executive summary downloaded (simulated)")} className="mt-3 inline-flex items-center gap-2 rounded-lg gradient-cta px-4 py-2 text-sm"><Download className="h-4 w-4"/> Executive Summary</button>
    </div>
  );
}

function MoU({ s }: { s: any }) {
  const [draft, setDraft] = useState("");
  const gen = () => setDraft(`MEMORANDUM OF UNDERSTANDING\n\nBetween: ${s.events.title} Organizer\nAnd: Sponsor (You)\n\nTier: ${s.tier}\nBudget: ₹${s.custom_package?.budget?.toLocaleString()||"-"}\nIn-kind: ${s.custom_package?.inkind||"None"}\n\nDeliverables include logo placement, branding rights, and access per ${s.tier} tier benefits.\n\nSigned digitally on ${new Date().toLocaleDateString()}.`);
  const sign = async () => {
    await supabase.from("sponsorships").update({ signed: true }).eq("id", s.id);
    toast.success("Signed & sent to organizer");
  };
  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary"/> Smart Legal Automation</h3>
      <button onClick={gen} className="mt-3 rounded-lg bg-accent text-accent-foreground px-3 py-1.5 text-sm">Draft AI Agreement</button>
      {draft && <>
        <textarea rows={8} className="mt-3 w-full rounded-lg border border-input bg-white/70 p-3 text-xs font-mono" value={draft} onChange={(e)=>setDraft(e.target.value)}/>
        <input placeholder="Digital signature (type your name)" className="mt-2 w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm"/>
        <button onClick={sign} className="mt-2 inline-flex items-center gap-2 rounded-lg gradient-cta px-4 py-2 text-sm"><Send className="h-4 w-4"/> Send to Organizer</button>
      </>}
    </div>
  );
}

function KanbanMirror({ event }: { event: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  useEffect(()=>{
    const load = () => supabase.from("tasks").select("*").eq("event_id", event.id).then(({data})=>setTasks(data||[]));
    load();
    const ch = supabase.channel(`mirror-${event.id}`).on("postgres_changes",{event:"*",schema:"public",table:"tasks",filter:`event_id=eq.${event.id}`},load).subscribe();
    return ()=>{supabase.removeChannel(ch);};
  },[event.id]);
  if (!event.sponsor_kanban_enabled) return <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">Kanban mirror is disabled by the organizer.</div>;
  const cols=["todo","in_progress","done"]; const lbl:any={todo:"To-Do",in_progress:"In Progress",done:"Done"};
  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className="font-semibold mb-3">Live Kanban (read-only)</h3>
      <div className="grid md:grid-cols-3 gap-3">
        {cols.map(c=>(
          <div key={c} className="bg-white/60 rounded-xl p-3">
            <h4 className="text-sm font-semibold mb-2">{lbl[c]}</h4>
            <div className="space-y-2">{tasks.filter(t=>t.status===c).map(t=>(<div key={t.id} className="bg-white rounded p-2 text-xs border border-border/60">{t.title}</div>))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
