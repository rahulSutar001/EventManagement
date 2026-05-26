import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles, Trash2, Plus, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const inputCls = "w-full rounded-lg border border-input bg-white/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary";

interface TimelineEntry {
  start_time: string;
  end_time: string;
  title: string;
  category: string;
  location: string;
}

const CATEGORIES = ["Keynote", "Workshop", "Meal/Refreshment", "Evaluation", "Fun Activity"];

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
  const [dbSponsors, setDbSponsors] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    supabase
      .from("sponsor_profiles")
      .select("*")
      .then(({ data }) => {
        setDbSponsors(data || []);
      });
  }, []);

  const addTimelineRow = () => {
    setTimeline([...timeline, { start_time: "", end_time: "", title: "", category: "Keynote", location: "" }]);
  };

  const updateTimelineRow = (index: number, field: keyof TimelineEntry, value: string) => {
    const updated = [...timeline];
    updated[index] = { ...updated[index], [field]: value };
    setTimeline(updated);
  };

  const removeTimelineRow = (index: number) => {
    setTimeline(timeline.filter((_, i) => i !== index));
  };

  const generate = () => {
    const splits = { Catering: 0.30, "Prize Pool": 0.30, "Marketing/Merch": 0.20, "Venue/Logistics": 0.20 };
    const i: Record<string, number> = {};
    for (const [k, v] of Object.entries(splits)) i[k] = Math.round(budget * v);
    setItems(i);
    toast.success("Budget estimation generated");
  };

  const publish = async () => {
    if (!user || !title) {
      toast.error("Title required");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("events").insert({
      organizer_id: user.id,
      title,
      description,
      themes: themes.split(",").map((s) => s.trim()).filter(Boolean),
      expected_footfall: footfall,
      total_budget: budget,
      itemized_budget: items || {},
      status: "published",
      event_date: date || null,
      timeline: timeline.filter(t => t.title.trim() !== ""),
    } as any);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Event published!");
    setTitle("");
    setDescription("");
    setThemes("");
    setItems(null);
    setTimeline([]);
  };

  // Dynamic matching calculation
  const splitThemes = themes
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const matchedSponsorsCount = dbSponsors.filter((s) => {
    const ind = (s.industry || "").toLowerCase();
    const goals = Array.isArray(s.primary_goal) ? s.primary_goal.map((g: string) => g.toLowerCase()) : [];
    const themeMatch = splitThemes.some((t) => ind.includes(t) || goals.some((g: string) => g.includes(t)));

    let budgetMatch = true;
    if (s.budget_range) {
      if (s.budget_range.includes("1L+") && budget < 100000) budgetMatch = false;
      if (s.budget_range.includes("2L+") && budget < 200000) budgetMatch = false;
    }

    return splitThemes.length === 0 ? budgetMatch : themeMatch && budgetMatch;
  }).length;

  const displayMatchCount = splitThemes.length === 0 ? dbSponsors.length : matchedSponsorsCount;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-strong rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-lg">Event details</h3>
        <input
          className={inputCls}
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <textarea
          className={inputCls}
          rows={3}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
        />
        <input
          className={inputCls}
          placeholder="Tech themes/tags (comma separated, e.g. AI, Web3, Design)"
          value={themes}
          onChange={(e) => setThemes(e.target.value)}
        />
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Expected footfall</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={footfall}
              onChange={(e) => setFootfall(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Target budget (₹)</label>
            <input
              type="number"
              min={0}
              step={1000}
              className={inputCls}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Event date</label>
            <input
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={generate}
          className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:bg-accent/80"
        >
          <Sparkles className="h-4 w-4" /> Generate AI Budget Estimation
        </button>

        {items && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(items).map(([k, v]) => (
                <div key={k} className="glass rounded-xl p-3">
                  <label className="text-xs text-muted-foreground">{k}</label>
                  <input
                    type="number"
                    className={inputCls + " mt-1"}
                    value={v}
                    onChange={(e) => setItems({ ...items, [k]: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>
            <div className="h-64 mt-4 p-4 glass rounded-xl border border-border/50">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(items).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {Object.entries(items).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#A855F7', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6'][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Event Timeline Builder ── */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Event Timeline Builder
          </h4>

          {timeline.length === 0 ? (
            <div className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No activities scheduled yet. Click <strong>"Add Activity Row"</strong> to map out your custom agenda day by hand.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.map((entry, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_2fr_1.5fr_1.5fr_auto] gap-2 items-end bg-white/60 rounded-xl p-3 border border-border/40">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Start</label>
                    <input
                      type="time"
                      className="w-full rounded-lg border border-input bg-white/70 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                      value={entry.start_time}
                      onChange={(e) => updateTimelineRow(idx, "start_time", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">End</label>
                    <input
                      type="time"
                      className="w-full rounded-lg border border-input bg-white/70 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                      value={entry.end_time}
                      onChange={(e) => updateTimelineRow(idx, "end_time", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Activity</label>
                    <input
                      placeholder="e.g., Session 1 / Break / Keynote"
                      className="w-full rounded-lg border border-input bg-white/70 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                      value={entry.title}
                      onChange={(e) => updateTimelineRow(idx, "title", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Category</label>
                    <select
                      className="w-full rounded-lg border border-input bg-white/70 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                      value={entry.category}
                      onChange={(e) => updateTimelineRow(idx, "category", e.target.value)}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Location</label>
                    <input
                      placeholder="e.g., Seminar Hall A"
                      className="w-full rounded-lg border border-input bg-white/70 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                      value={entry.location}
                      onChange={(e) => updateTimelineRow(idx, "location", e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => removeTimelineRow(idx)}
                    className="mb-0.5 p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
                    title="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addTimelineRow}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-primary/40 text-primary px-4 py-2 text-sm font-medium hover:bg-primary/5 transition"
          >
            <Plus className="h-4 w-4" /> Add Activity Row
          </button>
        </div>

        <button
          disabled={busy}
          onClick={publish}
          className="w-full rounded-lg gradient-cta py-3 font-medium disabled:opacity-60"
        >
          {busy ? "Publishing..." : "Finalize & Publish Event"}
        </button>
      </div>

      <aside className="glass-strong rounded-2xl p-5 h-fit sticky top-24">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" /> AI Insights
        </div>
        <p className="mt-3 text-sm">
          <span className="font-bold text-2xl gradient-text">{displayMatchCount}</span> active sponsors match your tags
          & budget
        </p>
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <div>• Avg sponsor budget for tech events: ₹{Math.round(budget * 0.4 / 1000)}k</div>
          <div>• Predicted volunteer applications: ~{Math.round(footfall * 0.15)}</div>
          <div>• Best slot: Saturday 10am–6pm</div>
        </div>
      </aside>
    </div>
  );
}
