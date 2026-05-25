import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const TIERS = [{name:"Gold",price:100000,perks:["Logo on stage","Keynote slot","Booth"]},{name:"Silver",price:50000,perks:["Logo on website","Booth"]},{name:"Bronze",price:20000,perks:["Logo on website"]}];

export function SponsorPackages() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState("");
  const [budget, setBudget] = useState(50000);
  const [inkind, setInkind] = useState("");
  useEffect(()=>{ supabase.from("events").select("*").eq("status","published").then(({data})=>{setEvents(data||[]); if(data?.[0])setEventId(data[0].id);}); },[]);
  const event = events.find(e=>e.id===eventId);
  const tier = budget >= 100000 ? "Gold" : budget >= 40000 ? "Silver" : "Bronze";
  const items = event?.itemized_budget || {};

  const apply = async () => {
    if (!user || !event) return;
    const { error } = await supabase.from("sponsorships").insert({ event_id: event.id, sponsor_id: user.id, tier, custom_package: { budget, inkind }, status: "pending" });
    if (error) toast.error(error.message); else toast.success("Sponsorship proposal sent");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <select className="w-full rounded-lg border border-input bg-white/70 px-3 py-2" value={eventId} onChange={(e)=>setEventId(e.target.value)}>
          {events.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        {event && <>
          <div className="glass-strong rounded-2xl p-5">
            <h3 className="font-semibold">{event.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-accent p-3"><p className="text-xs text-muted-foreground">Footfall</p><p className="font-semibold">{event.expected_footfall||"—"}</p></div>
              <div className="rounded-lg bg-accent p-3"><p className="text-xs text-muted-foreground">Date</p><p className="font-semibold">{event.event_date||"TBA"}</p></div>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {TIERS.map(t => (
              <div key={t.name} className={`glass rounded-2xl p-4 ${tier===t.name?"ring-purple":""}`}>
                <h4 className="font-bold">{t.name}</h4><p className="text-xs text-muted-foreground">₹{t.price.toLocaleString()}</p>
                <ul className="mt-2 text-xs space-y-1">{t.perks.map(p=><li key={p}>• {p}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="glass-strong rounded-2xl p-5">
            <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary"/> AI Custom Package Planner</h4>
            <label className="text-xs mt-3 block">Budget: ₹{budget.toLocaleString()} → <span className="font-semibold text-primary">{tier} tier</span></label>
            <input type="range" min={10000} max={200000} step={5000} value={budget} onChange={(e)=>setBudget(Number(e.target.value))} className="w-full"/>
            <input placeholder="In-kind contributions (e.g. API credits, hoodies)" value={inkind} onChange={(e)=>setInkind(e.target.value)} className="mt-3 w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm"/>
            <button onClick={apply} className="mt-4 w-full rounded-lg gradient-cta py-2.5 text-sm font-medium">Submit sponsorship proposal</button>
          </div>
        </>}
      </div>
      <aside className="glass-strong rounded-2xl p-5 h-fit">
        <h4 className="font-semibold">Transparent budget</h4>
        <div className="mt-3 space-y-2 text-sm">
          {Object.entries(items).map(([k,v])=>(<div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">₹{Number(v).toLocaleString()}</span></div>))}
          {!Object.keys(items).length && <p className="text-xs text-muted-foreground">Organizer hasn't published the itemized budget yet.</p>}
        </div>
      </aside>
    </div>
  );
}
