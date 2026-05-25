import { TrendingUp, Sparkles, Users, DollarSign } from "lucide-react";

const TRENDS = [
  { icon: "🔥", title: "Sponsors investing 35% more in AI events", detail: "This month vs. last", color: "from-pink-500 to-red-500" },
  { icon: "💡", title: "Weekend workshops: 20% higher turnout", detail: "Saturday afternoons peak at 2pm", color: "from-purple-500 to-pink-500" },
  { icon: "🎯", title: "Web3 themes attract Series A startups", detail: "Avg ticket ₹4.2k", color: "from-indigo-500 to-purple-500" },
  { icon: "🚀", title: "Hackathons with mentors fill 2x faster", detail: "Pro tip: list mentor names early", color: "from-amber-500 to-pink-500" },
];

const STATS = [
  { icon: Users, label: "Active sponsors", value: "1,284" },
  { icon: DollarSign, label: "Avg event budget", value: "₹2.4L" },
  { icon: TrendingUp, label: "Volunteer match rate", value: "92%" },
  { icon: Sparkles, label: "AI suggestions used", value: "10.3k" },
];

export function OrganizerHome() {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4"/> AI Marketing Trend Intelligence
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {TRENDS.map(t => (
            <div key={t.title} className="glass rounded-2xl p-5 hover:-translate-y-0.5 transition">
              <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${t.color} text-xl`}>{t.icon}</div>
              <h3 className="mt-3 font-semibold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.detail}</p>
            </div>
          ))}
        </div>
      </div>
      <aside className="space-y-3">
        <div className="glass-strong rounded-2xl p-5">
          <h4 className="font-semibold mb-3">This week at a glance</h4>
          <div className="space-y-3">
            {STATS.map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <s.icon className="h-4 w-4 text-primary"/> {s.label}
                </div>
                <span className="font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">💎 Pro tip</p>
          <p className="mt-1 text-sm">Add the tag <span className="font-mono text-primary">#AI</span> to attract 3x more sponsor matches in your next event.</p>
        </div>
      </aside>
    </div>
  );
}
