import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, MapPin, Users, Sparkles, ExternalLink } from "lucide-react";

export function ParticipantActive() {
  const { user } = useAuth();
  const [regs, setRegs] = useState<any[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = () =>
      supabase
        .from("registrations")
        .select("*, events(*)")
        .eq("participant_id", user.id)
        .then(({ data }) => {
          setRegs(data || []);
          if (data?.[0] && !active) setActive(data[0].id);
        });
    load();
    const ch = supabase
      .channel(`my-regs-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "registrations",
          filter: `participant_id=eq.${user.id}`,
        },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  if (!regs.length)
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
        Register for an event to access its live workspace.
      </div>
    );

  const r = regs.find((x) => x.id === active) || regs[0];

  return (
    <div className="space-y-4">
      {/* Event selector */}
      <div className="flex gap-2 overflow-auto pb-1">
        {regs.map((x) => (
          <button
            key={x.id}
            onClick={() => setActive(x.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${
              r.id === x.id ? "gradient-cta text-white" : "bg-white/60 hover:bg-white"
            }`}
          >
            {x.events.title}
          </button>
        ))}
      </div>

      <Ticketcard r={r} />
      <Timeline timeline={r.events?.timeline} />
      <Networking eventId={r.event_id} />
    </div>
  );
}

function Ticketcard({ r }: { r: any }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    r.qr_code
  )}&color=6d28d9&bgcolor=ffffff`;

  return (
    <div
      className={`glass-strong rounded-2xl overflow-hidden transition ${
        r.checked_in ? "ring-2 ring-green-400" : ""
      }`}
    >
      {/* Top gradient bar */}
      <div className="h-2 gradient-cta" />
      <div className="p-5 flex flex-col sm:flex-row gap-5 items-center">
        {/* QR Code */}
        <div className="shrink-0 bg-white p-2 rounded-xl border-2 border-purple-200 shadow-inner">
          <img
            src={qrUrl}
            alt="Event QR Code"
            className="w-36 h-36 rounded-lg block"
          />
        </div>

        {/* Ticket Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-lg">{r.events.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            📅 {r.events.event_date || "Date TBA"} &nbsp;·&nbsp;
            👥 {r.events.expected_footfall || "—"} attendees
          </p>
          <div className="mt-1 inline-block">
            <span className="font-mono text-xs bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 text-purple-800 tracking-widest">
              {r.qr_code}
            </span>
          </div>

          {r.checked_in ? (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-2 w-fit">
              <span className="text-green-600 font-semibold text-sm animate-pulse">
                ✓ Check-In Confirmed!
              </span>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              📲 Show this QR code to a volunteer at the entry gate.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Timeline({ timeline }: { timeline?: any[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        Event Timeline
      </h3>
      {timeline && Array.isArray(timeline) && timeline.length > 0 ? (
        <ol className="relative border-l-2 border-border pl-6 space-y-4">
          {timeline.map((s, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-primary" />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-primary">
                    {s.start_time} - {s.end_time} — {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {s.location || "TBA"} • {s.category}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm italic text-muted-foreground">No timeline added</p>
      )}
    </div>
  );
}

function Networking({ eventId }: { eventId: string }) {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNetworking = async () => {
      setLoading(true);
      // Step 1: Get checked-in participant IDs for this event
      const { data: checkins } = await supabase
        .from("registrations")
        .select("participant_id")
        .eq("event_id", eventId)
        .eq("checked_in", true);

      if (!checkins || checkins.length === 0) {
        setPeople([]);
        setLoading(false);
        return;
      }

      const ids = checkins.map((c) => c.participant_id);

      // Step 2: Get profile info for those participants
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, hashtags, github_url, linkedin_url")
        .in("id", ids);

      // Step 3: Get participant_profiles for interests
      const { data: partProfiles } = await supabase
        .from("participant_profiles")
        .select("profile_id, interests, github_url, linkedin_url")
        .in("profile_id", ids);

      // Merge
      const merged = (profiles || []).map((p) => {
        const extra = (partProfiles || []).find((pp) => pp.profile_id === p.id);
        return {
          ...p,
          github_url: p.github_url || extra?.github_url || null,
          linkedin_url: p.linkedin_url || extra?.linkedin_url || null,
          extra,
        };
      });

      setPeople(merged);
      setLoading(false);
    };

    loadNetworking();

    // Realtime: refresh when someone checks in
    const ch = supabase
      .channel(`networking-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "registrations",
          filter: `event_id=eq.${eventId}`,
        },
        loadNetworking
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId]);

  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-primary" /> AI Networking Hub
      </h3>
      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
        <Users className="inline h-3 w-3" /> {people.length} participants checked in
        {loading && " · Loading..."}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {people.slice(0, 6).map((p, i) => (
          <div
            key={p.id}
            className="rounded-xl bg-white/70 p-3 border border-border/60 hover:shadow-sm transition"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-medium text-sm">{p.full_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.hashtags || "—"}</p>
              </div>
              {i < 2 && (
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full gradient-cta text-white">
                  Smart match
                </span>
              )}
            </div>
            {/* Interests */}
            {p.extra?.interests && Array.isArray(p.extra.interests) && p.extra.interests.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {p.extra.interests.slice(0, 3).map((int: string) => (
                  <span key={int} className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                    {int}
                  </span>
                ))}
              </div>
            )}
            {/* Links */}
            <div className="mt-2 flex gap-3">
              {p.github_url && (
                <a
                  href={p.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> GitHub
                </a>
              )}
              {p.linkedin_url && (
                <a
                  href={p.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        ))}
        {!loading && !people.length && (
          <p className="col-span-full text-sm text-muted-foreground text-center py-4">
            No participants have checked in yet. Be the first! 🎉
          </p>
        )}
      </div>
    </div>
  );
}
