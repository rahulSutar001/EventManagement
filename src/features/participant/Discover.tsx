import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function ParticipantDiscover() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [regs, setRegs] = useState<Set<string>>(new Set());
  const [interests, setInterests] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      // Fetch user's registered events
      const { data: regData } = await supabase.from("registrations").select("event_id").eq("participant_id", user.id);
      if (regData) setRegs(new Set(regData.map(r => r.event_id)));

      // Fetch user's interests
      const { data: profData } = await supabase.from("participant_profiles").select("interests").eq("profile_id", user.id).maybeSingle();
      const userInterests: string[] = Array.isArray(profData?.interests) ? (profData!.interests as string[]) : ["hackathon", "ai", "tech"];
      setInterests(userInterests);

      // Fetch published events
      const { data: evtData } = await supabase.from("events").select("*").eq("status", "published");
      if (evtData) {
        // Calculate AI match score
        const scored = evtData.map(e => {
          let score = 40; // base score
          const text = (e.title + " " + (e.description || "")).toLowerCase();
          userInterests.forEach(int => {
            if (text.includes(int.toLowerCase())) score += 20;
          });
          return { ...e, matchScore: Math.min(99, score) };
        });
        // Sort by match score descending
        scored.sort((a, b) => b.matchScore - a.matchScore);
        setEvents(scored);
      }
    };
    load();
  }, [user]);

  const register = async (eventId: string) => {
    if (!user) return;
    const qr = `${eventId.slice(0, 8)}-${user.id.slice(0, 6)}-${Date.now().toString(36)}`.toUpperCase();
    const { error } = await supabase.from("registrations").insert({ event_id: eventId, participant_id: user.id, qr_code: qr });
    if (error) { toast.error(error.message); return; }
    toast.success("Registered! Check 'My Events'");
    setRegs(new Set([...regs, eventId]));
  };

  const totalPages = Math.ceil(events.length / itemsPerPage);
  const currentEvents = events.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Personalized Interest Feed</h2>
        <p className="text-xs text-muted-foreground bg-accent px-3 py-1 rounded-full">
          AI tuned to your skills
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentEvents.map((e, i) => (
          <div key={e.id} className="glass rounded-2xl overflow-hidden relative">
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-border">
              <span className="text-[10px] font-bold gradient-text">{e.matchScore}% Match</span>
            </div>
            <div className="h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 grid place-items-center text-white text-2xl font-bold">
              {e.title.slice(0, 2).toUpperCase()}
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1 mb-2">
                {i === 0 && currentPage === 1 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">Top Recommendation</span>}
                {e.matchScore > 75 && !(i === 0 && currentPage === 1) && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Highly Relevant</span>}
              </div>
              <h3 className="font-semibold">{e.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {e.event_date || "TBA"} • {e.expected_footfall || "—"} seats
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
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
              <button disabled={regs.has(e.id)} onClick={() => register(e.id)} className="mt-3 w-full rounded-lg gradient-cta py-2 text-sm disabled:opacity-50">
                {regs.has(e.id) ? "Registered ✓" : "Register for Event"}
              </button>
            </div>
          </div>
        ))}
        {!events.length && (
          <div className="col-span-full glass rounded-2xl p-8 text-center text-muted-foreground">
            No events available right now.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-2">
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
