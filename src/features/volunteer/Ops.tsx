import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Award, MessageSquare, Download, ExternalLink } from "lucide-react";
import { downloadCertificate } from "@/lib/certificate";

export function VolunteerOps() {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [eventId, setEventId] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("volunteer_applications")
      .select("*, events(*)")
      .eq("volunteer_id", user.id)
      .eq("status", "approved")
      .then(({ data }) => {
        setApps(data || []);
        if (data?.[0]) setEventId(data[0].event_id);
      });
  }, [user]);

  if (!apps.length)
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
        Get approved for an event to unlock your live ops workspace.
      </div>
    );

  const app = apps.find((a) => a.event_id === eventId);

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      <aside className="space-y-2">
        <label className="text-xs text-muted-foreground px-2">Approved events</label>
        {apps.map((a) => (
          <button
            key={a.id}
            onClick={() => setEventId(a.event_id)}
            className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
              eventId === a.event_id
                ? "gradient-cta text-white"
                : "bg-white/60 hover:bg-white"
            }`}
          >
            {a.events.title}
            {a.is_lead && " 🌟"}
          </button>
        ))}
      </aside>
      {app && (
        <div className="space-y-6">
          <MyKanban eventId={app.event_id} />
          <DiscordWidget isLead={app.is_lead} eventTitle={app.events.title} />
          <Timeline timeline={app.events?.timeline} />
          <PerformanceCard app={app} />
        </div>
      )}
    </div>
  );
}

function Timeline({ timeline }: { timeline?: any[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-4 text-sm text-foreground">
        📍 Event Timeline
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
                    📍 {s.location || "TBA"} • {s.category}
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

function MyKanban({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [doneNote, setDoneNote] = useState<{ id: string; title: string } | null>(null);
  const [noteText, setNoteText] = useState("");

  const load = () =>
    supabase
      .from("tasks")
      .select("*")
      .eq("event_id", eventId)
      .eq("assigned_to", user!.id)
      .then(({ data }) => setTasks(data || []));

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`my-tasks-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `event_id=eq.${eventId}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId, user]);

  const move = async (t: any, status: "todo" | "in_progress" | "done") => {
    if (status === "done") {
      setNoteText("");
      setDoneNote({ id: t.id, title: t.title });
      return;
    }
    await supabase.from("tasks").update({ status }).eq("id", t.id);
    toast.success(`Task moved to "${status.replace("_", " ")}"`);
  };

  const completeWithNote = async () => {
    if (!doneNote) return;
    await supabase.from("tasks").update({ status: "done", notes: noteText }).eq("id", doneNote.id);
    toast.success("Task complete! 🎉 Discord notified.");
    setDoneNote(null);
    setNoteText("");
  };

  const cols: { id: "todo" | "in_progress" | "done"; label: string; color: string }[] = [
    { id: "todo", label: "To-Do", color: "border-t-amber-400" },
    { id: "in_progress", label: "In Progress", color: "border-t-blue-400" },
    { id: "done", label: "Done ✓", color: "border-t-green-400" },
  ];

  if (!tasks.length)
    return (
      <div className="glass rounded-2xl p-6 text-sm text-muted-foreground text-center">
        No tasks assigned to you yet. Check back once the organizer assigns tasks.
      </div>
    );

  return (
    <div>
      <h3 className="font-semibold mb-3">My Tasks</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {cols.map((c) => (
          <div key={c.id} className={`glass rounded-2xl p-4 border-t-4 ${c.color}`}>
            <h4 className="font-semibold text-sm mb-3 flex items-center justify-between">
              {c.label}
              <span className="text-xs text-muted-foreground bg-white/60 rounded-full px-2 py-0.5">
                {tasks.filter((t) => t.status === c.id).length}
              </span>
            </h4>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.status === c.id)
                .map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-xl p-3 border border-border/60 shadow-sm"
                  >
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.category}</p>
                    {t.notes && (
                      <p className="mt-1.5 text-[10px] text-muted-foreground italic border-t border-border/40 pt-1.5">
                        {t.notes}
                      </p>
                    )}
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {cols
                        .filter((x) => x.id !== c.id)
                        .map((x) => (
                          <button
                            key={x.id}
                            onClick={() => move(t, x.id)}
                            className="text-[10px] px-2 py-1 rounded-lg border border-input bg-white/80 hover:bg-accent transition"
                          >
                            → {x.label}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Done confirmation modal */}
      {doneNote && (
        <div
          className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"
          onClick={() => setDoneNote(null)}
        >
          <div
            className="glass-strong rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold">
              Mark "{doneNote.title}" complete
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add a completion note or photo URLs (optional).
            </p>
            <textarea
              rows={3}
              placeholder="Notes / photo URLs..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="mt-3 w-full rounded-lg border border-input bg-white/70 p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setDoneNote(null)}
                className="rounded-lg border border-input px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={completeWithNote}
                className="rounded-lg gradient-cta px-4 py-2 text-sm"
              >
                Confirm Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiscordWidget({ isLead, eventTitle }: { isLead: boolean; eventTitle: string }) {
  const [discordUrl, setDiscordUrl] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from localStorage per event
  useEffect(() => {
    const stored = localStorage.getItem(`discord_url_${eventTitle}`);
    if (stored) {
      setDiscordUrl(stored);
      setSaved(true);
    }
  }, [eventTitle]);

  const handleSave = () => {
    if (discordUrl.trim()) {
      localStorage.setItem(`discord_url_${eventTitle}`, discordUrl.trim());
      setSaved(true);
      setEditing(false);
      toast.success("Discord invite saved!");
    }
  };

  const handleJoin = () => {
    if (discordUrl) {
      window.open(discordUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.error("No Discord invite link set yet. Ask your lead volunteer or organizer.");
    }
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Discord
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Role:{" "}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isLead ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
              }`}
            >
              {isLead ? "Lead Volunteer" : "Volunteer"}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {isLead && (
            <button
              onClick={() => setEditing(!editing)}
              className="rounded-lg border border-input bg-white/70 px-3 py-2 text-xs hover:bg-accent"
            >
              {editing ? "Cancel" : "Set Invite Link"}
            </button>
          )}
          <button
            onClick={handleJoin}
            className="rounded-lg gradient-cta px-4 py-2 text-sm flex items-center gap-1.5"
          >
            <ExternalLink className="h-4 w-4" /> Join Event Discord
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-input bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://discord.gg/..."
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
          />
          <button
            onClick={handleSave}
            className="rounded-lg gradient-cta px-4 py-2 text-sm"
          >
            Save
          </button>
        </div>
      )}

      {saved && !editing && discordUrl && (
        <p className="mt-2 text-xs text-muted-foreground font-mono truncate">
          🔗 {discordUrl}
        </p>
      )}
    </div>
  );
}

function PerformanceCard({ app }: { app: any }) {
  const { user } = useAuth();
  const [scoreData, setScoreData] = useState<{ score: number; xp_awarded: number } | null>(null);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("performance_scores")
      .select("score, xp_awarded")
      .eq("volunteer_id", user.id)
      .eq("event_id", app.event_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setScoreData({ score: data.score, xp_awarded: data.xp_awarded ?? 0 });
          setTimeout(() => {
            setPop(true);
            setTimeout(() => setPop(false), 2000);
          }, 200);
        }
      });
  }, [user, app.event_id]);

  const isEventOver = app.events?.status === "completed" || 
                      (app.events?.event_date && new Date(app.events.event_date).getTime() < Date.now());

  const cert = async () => {
    if (!isEventOver) {
      toast.error("You can only download the certificate after the event is over.");
      return;
    }
    const cuid = `EVT-${app.event_id.slice(0, 8).toUpperCase()}-${user!.id.slice(0, 6).toUpperCase()}`;
    await supabase.from("certificates").insert({
      user_id: user!.id,
      event_id: app.event_id,
      role: "volunteer",
      certificate_uid: cuid,
      performance_score: scoreData?.score,
    });
    const p = await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();
    downloadCertificate({
      name: p.data?.full_name || "Volunteer",
      event: app.events.title,
      role: "Volunteer",
      date: app.events.event_date || new Date().toISOString().slice(0, 10),
      uid: cuid,
      score: scoreData?.score,
    });
  };

  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className="font-semibold flex items-center gap-2">
        <Award className="h-4 w-4 text-primary" /> Performance & Certificate
      </h3>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative">
          <div
            className={`h-20 w-20 rounded-full grid place-items-center text-white text-2xl font-bold ${
              scoreData ? "gradient-cta" : "bg-muted/50"
            }`}
          >
            {scoreData ? scoreData.score : "—"}
          </div>
          {pop && (
            <div className="absolute -top-3 -right-8 px-2 py-1 rounded-full gradient-cta text-white text-xs font-bold animate-bounce whitespace-nowrap">
              +{scoreData?.xp_awarded ?? 0} XP!
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {scoreData ? `${scoreData.score}/10` : "Not yet rated"}
          </p>
          <p className="text-xs text-muted-foreground">Rated by Lead / Organizer</p>
          {scoreData && (
            <p className="text-xs text-primary font-semibold mt-1">
              +{scoreData.xp_awarded} XP earned
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={cert}
          disabled={!isEventOver}
          className="inline-flex items-center gap-2 rounded-lg gradient-cta px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" /> Download Certificate
        </button>
        {!isEventOver && (
          <p className="text-xs text-amber-600 font-medium">
            ⚠️ Certificate unlocks once the event is completed (Scheduled for: {app.events?.event_date || "TBA"}).
          </p>
        )}
      </div>
    </div>
  );
}
