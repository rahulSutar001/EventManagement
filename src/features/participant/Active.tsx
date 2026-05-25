import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, MapPin, Users, Sparkles, Github, Linkedin } from "lucide-react";

export function ParticipantActive() {
  const { user } = useAuth();
  const [regs, setRegs] = useState<any[]>([]);
  const [active, setActive] = useState("");
  useEffect(()=>{
    if(!user) return;
    const load = () => supabase.from("registrations").select("*, events(*)").eq("participant_id", user.id).then(({data})=>{setRegs(data||[]); if(data?.[0] && !active) setActive(data[0].id);});
    load();
    const ch = supabase.channel(`my-regs-${user.id}`).on("postgres_changes",{event:"UPDATE",schema:"public",table:"registrations",filter:`participant_id=eq.${user.id}`},load).subscribe();
    return ()=>{supabase.removeChannel(ch);};
  },[user]);

  if (!regs.length) return <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Register for an event to access its live workspace.</div>;
  const r = regs.find(x=>x.id===active) || regs[0];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-auto">
        {regs.map(x=>(<button key={x.id} onClick={()=>setActive(x.id)} className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${r.id===x.id?"gradient-cta text-white":"bg-white/60"}`}>{x.events.title}</button>))}
      </div>
      <Ticketcard r={r}/>
      <Timeline/>
      <Networking eventId={r.event_id}/>
    </div>
  );
}

function Ticketcard({ r }: { r: any }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(r.qr_code)}`;
  return (
    <div className={`glass-strong rounded-2xl p-5 flex gap-5 items-center transition ${r.checked_in?"ring-2 ring-green-400":""}`}>
      <img src={qrUrl} alt="QR" className="w-32 h-32 rounded-lg border border-border bg-white"/>
      <div className="flex-1">
        <div className="flex items-center gap-2"><Ticket className="h-4 w-4 text-primary"/><h3 className="font-semibold">{r.events.title}</h3></div>
        <p className="text-xs text-muted-foreground mt-1">{r.events.event_date || "TBA"}</p>
        <p className="mt-2 font-mono text-xs">{r.qr_code}</p>
        {r.checked_in ? (
          <p className="mt-3 inline-block rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-medium animate-pulse">✓ Check-In Confirmed!</p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Show this QR to a volunteer at entry.</p>
        )}
      </div>
    </div>
  );
}

function Timeline() {
  const sessions = [
    { time: "09:00", title: "Opening Keynote", room: "Main Seminar Hall", done: true },
    { time: "10:30", title: "AI Workshop", room: "Lab 3", done: true },
    { time: "12:00", title: "Networking Lunch", room: "Atrium", done: false, live: true },
    { time: "14:00", title: "Panel: Sponsors in Tech", room: "Main Seminar Hall", done: false },
    { time: "17:00", title: "Closing & Awards", room: "Main Seminar Hall", done: false },
  ];
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-3">Event Timeline</h3>
      <ol className="relative border-l-2 border-border pl-5 space-y-3">
        {sessions.map((s,i)=>(
          <li key={i} className="relative">
            <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ${s.live?"gradient-cta animate-pulse":s.done?"bg-green-500":"bg-muted-foreground/30"}`}/>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{s.time} — {s.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3"/> {s.room}</p>
              </div>
              {s.live && <span className="text-xs px-2 py-0.5 rounded-full gradient-cta text-white">LIVE</span>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Networking({ eventId }: { eventId: string }) {
  const [people, setPeople] = useState<any[]>([]);
  useEffect(()=>{
    supabase.from("registrations").select("checked_in, profiles!registrations_participant_id_fkey(id, full_name, hashtags), participant_profiles:profiles!registrations_participant_id_fkey(participant_profiles(github_url, linkedin_url, interests))").eq("event_id", eventId).eq("checked_in", true)
      .then(({data})=>setPeople(data||[]));
  },[eventId]);
  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary"/> AI Networking Hub</h3>
      <p className="text-xs text-muted-foreground mt-1"><Users className="inline h-3 w-3"/> {people.length} participants checked in</p>
      <div className="mt-3 grid sm:grid-cols-2 gap-2">
        {people.slice(0,6).map((p:any,i:number)=>(
          <div key={i} className="rounded-lg bg-white/70 p-3 border border-border/60">
            <div className="flex justify-between items-start">
              <p className="font-medium text-sm">{p.profiles?.full_name}</p>
              {i<2 && <span className="text-[10px] px-1.5 py-0.5 rounded-full gradient-cta text-white">Smart match</span>}
            </div>
            <p className="text-xs text-muted-foreground">{p.profiles?.hashtags}</p>
            <div className="mt-2 flex gap-2"><Github className="h-3.5 w-3.5 text-muted-foreground"/><Linkedin className="h-3.5 w-3.5 text-muted-foreground"/></div>
          </div>
        ))}
        {!people.length && <p className="text-xs text-muted-foreground">No one has checked in yet.</p>}
      </div>
    </div>
  );
}
