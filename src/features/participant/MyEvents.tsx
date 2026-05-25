import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { downloadCertificate } from "@/lib/certificate";
import { Download } from "lucide-react";

export function ParticipantMyEvents() {
  const { user } = useAuth();
  const [regs, setRegs] = useState<any[]>([]);
  useEffect(()=>{
    if(!user) return;
    supabase.from("registrations").select("*, events(*)").eq("participant_id", user.id).then(({data})=>setRegs(data||[]));
  },[user]);

  const cert = async (r: any) => {
    const cuid = `EVT-${r.event_id.slice(0,8).toUpperCase()}-${r.id.slice(0,6).toUpperCase()}`;
    await supabase.from("certificates").insert({ user_id: user!.id, event_id: r.event_id, role: "participant", certificate_uid: cuid });
    const p = await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();
    downloadCertificate({ name: p.data?.full_name||"Participant", event: r.events.title, role: "Participant", date: r.events.event_date||new Date().toISOString().slice(0,10), uid: cuid });
  };

  if (!regs.length) return <div className="glass rounded-2xl p-8 text-center text-muted-foreground">No events yet. Discover and register from the Discover tab.</div>;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {regs.map(r=>(
        <div key={r.id} className="glass rounded-2xl p-5">
          <h3 className="font-semibold">{r.events.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{r.events.event_date||"TBA"}</p>
          <p className="mt-2 text-xs">QR: <span className="font-mono">{r.qr_code}</span></p>
          <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${r.checked_in?"bg-green-100 text-green-800":"bg-amber-100 text-amber-800"}`}>{r.checked_in?"Checked in":"Not checked in"}</span>
          <button onClick={()=>cert(r)} className="mt-3 ml-2 inline-flex items-center gap-1 rounded-lg gradient-cta px-3 py-1.5 text-xs"><Download className="h-3 w-3"/>Certificate</button>
        </div>
      ))}
    </div>
  );
}
