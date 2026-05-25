import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function ParticipantDiscover() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [regs, setRegs] = useState<Set<string>>(new Set());

  useEffect(()=>{
    supabase.from("events").select("*").eq("status","published").order("created_at",{ascending:false}).then(({data})=>setEvents(data||[]));
    if (user) supabase.from("registrations").select("event_id").eq("participant_id", user.id).then(({data})=>setRegs(new Set((data||[]).map(r=>r.event_id))));
  },[user]);

  const register = async (eventId: string) => {
    if (!user) return;
    const qr = `${eventId.slice(0,8)}-${user.id.slice(0,6)}-${Date.now().toString(36)}`.toUpperCase();
    const { error } = await supabase.from("registrations").insert({ event_id: eventId, participant_id: user.id, qr_code: qr });
    if (error) { toast.error(error.message); return; }
    toast.success("Registered! Check 'My Events'");
    setRegs(new Set([...regs, eventId]));
  };

  const badges = ["🔥 Filling Fast","⏳ Closing Soon","🏆 ₹50k Prize"];
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((e,i)=>(
        <div key={e.id} className="glass rounded-2xl overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 grid place-items-center text-white text-2xl font-bold">{e.title.slice(0,2).toUpperCase()}</div>
          <div className="p-4">
            <div className="flex flex-wrap gap-1 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full gradient-cta text-white">{badges[i % badges.length]}</span>
            </div>
            <h3 className="font-semibold">{e.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{e.event_date || "TBA"} • {e.expected_footfall||"—"} seats</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
            <button disabled={regs.has(e.id)} onClick={()=>register(e.id)} className="mt-3 w-full rounded-lg gradient-cta py-2 text-sm disabled:opacity-50">
              {regs.has(e.id) ? "Registered ✓" : "Register for Event"}
            </button>
          </div>
        </div>
      ))}
      {!events.length && <div className="col-span-full glass rounded-2xl p-8 text-center text-muted-foreground">No events available right now.</div>}
    </div>
  );
}
