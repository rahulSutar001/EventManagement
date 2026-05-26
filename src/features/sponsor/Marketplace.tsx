import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, TrendingUp } from "lucide-react";

export function SponsorMarketplace({ onSelectEvent }: { onSelectEvent?: (eventId: string) => void }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [sponsorProfile, setSponsorProfile] = useState<any>(null);
  const [domain, setDomain] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    supabase
      .from("events")
      .select("*, profiles!events_organizer_id_fkey(full_name)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => setEvents(data || []));
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("sponsor_profiles")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle()
      .then(({ data }) => setSponsorProfile(data));
  }, [user]);

  const getMatchScore = (event: any) => {
    let score = 40 + (((event.id?.charCodeAt(0) || 0) + (event.id?.charCodeAt(1) || 0)) % 45);
    if (!sponsorProfile) return score;
    const sponsorGoals = Array.isArray(sponsorProfile.primary_goal) ? sponsorProfile.primary_goal : [];
    const eventThemes = Array.isArray(event.themes) ? event.themes : [];

    eventThemes.forEach((t: string) => {
      if (sponsorProfile.industry && sponsorProfile.industry.toLowerCase().includes(t.toLowerCase())) score += 15;
      sponsorGoals.forEach((g: string) => {
        if (g.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(g.toLowerCase())) score += 10;
      });
    });

    if (sponsorProfile.budget_range) {
      const budget = event.total_budget || 0;
      if (sponsorProfile.budget_range.includes("1L+") && budget >= 100000) score += 20;
      else if (sponsorProfile.budget_range.includes("50k-1L") && budget >= 50000 && budget <= 100000) score += 20;
      else if (sponsorProfile.budget_range.includes("10k-50k") && budget >= 10000 && budget <= 50000) score += 20;
      else if (sponsorProfile.budget_range.includes("2L+") && budget >= 200000) score += 20;
    }

    return Math.min(99, score);
  };

  const filtered = events.filter(
    (e) => !domain || (Array.isArray(e.themes) && e.themes.some((t: string) => t.toLowerCase().includes(domain.toLowerCase())))
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Calculate dynamic stats
  let trendingTag = "#AI";
  if (events.length > 0) {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      if (Array.isArray(e.themes)) {
        e.themes.forEach((t: string) => { counts[t] = (counts[t] || 0) + 1; });
      }
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted[0]) trendingTag = `#${sorted[0][0]}`;
  }

  let avgMatchPercent = "75%";
  if (events.length > 0) {
    const totalMatch = events.reduce((sum, e) => sum + getMatchScore(e), 0);
    avgMatchPercent = `${Math.round(totalMatch / events.length)}%`;
  }

  const recommendedTier = (event: any) => {
    const budget = event.total_budget || 0;
    if (budget >= 100000) return "Gold tier recommended";
    if (budget >= 50000) return "Silver tier recommended";
    return "Bronze tier recommended";
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { l: "Active events", v: events.length, i: Sparkles },
          { l: "Avg match", v: avgMatchPercent, i: TrendingUp },
          { l: "Trending tag", v: trendingTag, i: Sparkles },
        ].map((s) => (
          <div key={s.l} className="glass rounded-2xl p-4 flex items-center gap-3">
            <s.i className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{s.l}</p>
              <p className="font-bold text-lg">{s.v}</p>
            </div>
          </div>
        ))}
      </div>
      <input
        placeholder="Filter by domain/tag (AI, Web3, Design...)"
        value={domain}
        onChange={(e) => { setDomain(e.target.value); setCurrentPage(1); }}
        className="w-full rounded-lg border border-input bg-white/70 px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
      />
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentItems.map((e) => {
          const match = getMatchScore(e);
          return (
            <div 
              key={e.id} 
              onClick={() => onSelectEvent?.(e.id)}
              className="glass rounded-2xl p-5 flex flex-col justify-between cursor-pointer hover:border-primary transition group"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition">{e.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">by {e.profiles?.full_name || "Organizer"}</p>
                    <p className="text-xs text-muted-foreground mt-2">{e.expected_footfall || "—"} expected attendees</p>
                  </div>
                  <div className="h-14 w-14 grid place-items-center rounded-full gradient-cta text-white font-bold text-sm shadow-sm">
                    {match}%
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(Array.isArray(e.themes) ? e.themes : []).slice(0, 3).map((t: string) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">#{t}</span>
                  ))}
                </div>
                <div className="mt-3 border-t border-border/40 pt-3">
                  <p className="text-[10px] font-semibold text-primary mb-1">Timeline:</p>
                  {e.timeline && Array.isArray(e.timeline) && e.timeline.length > 0 ? (
                    <ul className="text-[11px] text-muted-foreground space-y-1">
                      {e.timeline.slice(0, 3).map((item: any, idx: number) => (
                        <li key={idx} className="truncate">
                          ⏰ {item.start_time} - {item.end_time}: {item.title} ({item.location || "TBA"})
                        </li>
                      ))}
                      {e.timeline.length > 3 && <li className="text-[10px] italic text-primary">+{e.timeline.length - 3} more sessions</li>}
                    </ul>
                  ) : (
                    <p className="text-[11px] italic text-muted-foreground">No timeline added</p>
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs font-semibold text-primary">{recommendedTier(e)}</p>
            </div>
          );
        })}
        {!currentItems.length && (
          <div className="col-span-full glass rounded-2xl p-8 text-center text-muted-foreground">
            No events match this filter.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-input bg-white/70 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-input bg-white/70 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
