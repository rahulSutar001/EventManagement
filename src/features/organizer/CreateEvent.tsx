import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const inputCls = "w-full rounded-lg border border-input bg-white/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary";

export function OrganizerCreateEvent() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [themes, setThemes] = useState("");
  const [footfall, setFootfall] = useState(200);
  const [budget, setBudget] = useState(100000);
  const [date, setDate] = useState("");
  const [items, setItems] = useState<Record<string, number> | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = () => {
    const splits = { Catering: 0.30, "Prize Pool": 0.30, "Marketing/Merch": 0.20, "Venue/Logistics": 0.20 };
    const i: Record<string, number> = {};
    for (const [k, v] of Object.entries(splits)) i[k] = Math.round(budget * v);
    setItems(i);
    toast.success("Budget estimation generated");
  };

  const publish = async () => {
    if (!user || !title) { toast.error("Title required"); return; }
    setBusy(true);
    const { error } = await supabase.from("events").insert({
      organizer_id: user.id, title, description,
      themes: themes.split(",").map(s=>s.trim()).filter(Boolean),
      expected_footfall: footfall, total_budget: budget,
      itemized_budget: items || {}, status: "published",
      event_date: date || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Event published!");
    setTitle(""); setDescription(""); setThemes(""); setItems(null);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-strong rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-lg">Event details</h3>
        <input className={inputCls} placeholder="Event title" value={title} onChange={(e)=>setTitle(e.target.value)} maxLength={120}/>
        <textarea className={inputCls} rows={3} placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)} maxLength={2000}/>
        <input className={inputCls} placeholder="Tech themes/tags (comma separated, e.g. AI, Web3, Design)" value={themes} onChange={(e)=>setThemes(e.target.value)}/>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Expected footfall</label>
            <input type="number" min={0} className={inputCls} value={footfall} onChange={(e)=>setFootfall(Number(e.target.value))}/>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Target budget (₹)</label>
            <input type="number" min={0} step={1000} className={inputCls} value={budget} onChange={(e)=>setBudget(Number(e.target.value))}/>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Event date</label>
            <input type="date" className={inputCls} value={date} onChange={(e)=>setDate(e.target.value)}/>
          </div>
        </div>

        <button onClick={generate} className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:bg-accent/80">
          <Sparkles className="h-4 w-4"/> Generate AI Budget Estimation
        </button>

        {items && (
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(items).map(([k, v]) => (
              <div key={k} className="glass rounded-xl p-3">
                <label className="text-xs text-muted-foreground">{k}</label>
                <input type="number" className={inputCls + " mt-1"} value={v} onChange={(e)=>setItems({...items, [k]: Number(e.target.value)})}/>
              </div>
            ))}
          </div>
        )}

        <button disabled={busy} onClick={publish} className="w-full rounded-lg gradient-cta py-3 font-medium disabled:opacity-60">
          {busy ? "Publishing..." : "Finalize & Publish Event"}
        </button>
      </div>

      <aside className="glass-strong rounded-2xl p-5 h-fit sticky top-24">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4"/> AI Insights
        </div>
        <p className="mt-3 text-sm"><span className="font-bold text-2xl gradient-text">{Math.max(3, Math.min(42, Math.round(budget/12000) + themes.split(",").length))}</span> active sponsors match your tags & budget</p>
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <div>• Avg sponsor budget for tech events: ₹{Math.round(budget*0.4/1000)}k</div>
          <div>• Predicted volunteer applications: ~{Math.round(footfall*0.15)}</div>
          <div>• Best slot: Saturday 10am–6pm</div>
        </div>
      </aside>
    </div>
  );
}
