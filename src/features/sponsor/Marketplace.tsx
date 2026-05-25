import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp } from "lucide-react";

export function SponsorMarketplace() {
  const [events, setEvents] = useState<any[]>([]);
  const [domain, setDomain] = useState("");
  useEffect(() => {
    supabase.from("events").select("*, profiles!events_organizer_id_fkey(full_name)").eq("status","published").order("created_at",{ascending:false})
      .then(({data})=>setEvents(data||[]));
  }, []);
  const filtered = events.filter(e => !domain || (Array.isArray(e.themes) && e.themes.some((t:string)=>t.toLowerCase().includes(domain.toLowerCase()))));
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        {[{l:"Active events",v:events.length,i:Sparkles},{l:"Avg match",v:"87%",i:TrendingUp},{l:"Trending tag",v:"#AI",i:Sparkles}].map(s => (
          <div key={s.l} className="glass rounded-2xl p-4 flex items-center gap-3"><s.i className="h-5 w-5 text-primary"/><div><p className="text-xs text-muted-foreground">{s.l}</p><p className="font-bold text-lg">{s.v}</p></div></div>
        ))}
      </div>
      <input placeholder="Filter by domain/tag (AI, Web3, Design...)" value={domain} onChange={(e)=>setDomain(e.target.value)} className="w-full rounded-lg border border-input bg-white/70 px-3 py-2"/>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(e => {
          const match = 70 + Math.floor(Math.random()*30);
          return (
            <div key={e.id} className="glass rounded-2xl p-5">
              <div className="flex justify-between items-start">
                <div><h3 className="font-semibold">{e.title}</h3><p className="text-xs text-muted-foreground">{e.expected_footfall||"—"} attendees</p></div>
                <div className="h-14 w-14 grid place-items-center rounded-full gradient-cta text-white font-bold text-sm">{match}%</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {(Array.isArray(e.themes)?e.themes:[]).slice(0,3).map((t:string)=><span key={t} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">#{t}</span>)}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Silver tier fit • Audience 18-22</p>
            </div>
          );
        })}
        {!filtered.length && <div className="col-span-full glass rounded-2xl p-8 text-center text-muted-foreground">No events match this filter.</div>}
      </div>
    </div>
  );
}
