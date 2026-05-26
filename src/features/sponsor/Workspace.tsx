import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Download, FileText, Send, MessageSquare, Users, TrendingUp, Lock } from "lucide-react";
import { Chat } from "@/components/Chat";

export function SponsorWorkspace() {
  const { user } = useAuth();
  const [sps, setSps] = useState<any[]>([]);
  const [active, setActive] = useState<string>("");

  const fetchSponsorData = async () => {
    if (!user) return;
    // 1. All Sponsorships (approved + pending)
    const { data: spsData } = await supabase
      .from("sponsorships")
      .select("*, events(*)")
      .eq("sponsor_id", user.id);

    // 2. Chat Pitches (events where sponsor received messages)
    const { data: msgData } = await supabase
      .from("messages")
      .select("event_id, events(*)")
      .eq("receiver_id", user.id);

    // Combine unique events
    const uniqueEvents = new Map();

    spsData?.forEach((s) => {
      if (s.events) {
        uniqueEvents.set(s.event_id, {
          id: s.event_id,
          isApprovedSponsor: s.status === "approved",
          sponsorshipData: s,
          event: s.events,
        });
      }
    });

    msgData?.forEach((m) => {
      if (m.events && !uniqueEvents.has(m.event_id)) {
        uniqueEvents.set(m.event_id, {
          id: m.event_id,
          isApprovedSponsor: false,
          sponsorshipData: null,
          event: m.events,
        });
      }
    });

    const combined = Array.from(uniqueEvents.values());
    setSps(combined);
    if (combined.length > 0 && !active) setActive(combined[0].id);
  };

  useEffect(() => {
    if (!user) return;
    fetchSponsorData();

    // Real-time subscription for sponsorship status changes
    const channel = supabase
      .channel(`sp-workspace-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sponsorships" },
        (payload) => {
          if ((payload.new as any).sponsor_id === user.id) {
            fetchSponsorData();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!sps.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
        Once an organizer pitches you or approves your sponsorship, the workspace appears here.
      </div>
    );
  }

  const s = sps.find((x) => x.id === active);
  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      <aside className="space-y-2">
        {sps.map((x) => (
          <button
            key={x.id}
            onClick={() => setActive(x.id)}
            className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
              active === x.id ? "gradient-cta text-white" : "bg-white/60 hover:bg-white"
            }`}
          >
            {x.event.title} {x.isApprovedSponsor ? "⭐" : "💬"}
          </button>
        ))}
      </aside>
      {s && (
        <div className="space-y-6">
          {!s.isApprovedSponsor && (
            <div className="glass-strong rounded-2xl p-4 border border-purple-200 bg-purple-50">
              <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> You've been pitched!
              </h3>
              <p className="text-sm text-purple-700 mt-1">
                The organizer of <strong>{s.event.title}</strong> has sent you a direct message. Chat below to discuss, then formalize a deal via the Packages tab!
              </p>
            </div>
          )}
          {s.isApprovedSponsor && s.sponsorshipData && (
            <>
              <ROI event={s.event} sponsorship={s.sponsorshipData} />
              <MoU s={s.sponsorshipData} />
            </>
          )}
          <SponsorCommAndOps event={s.event} />
        </div>
      )}
    </div>
  );
}

function ROI({ event, sponsorship }: { event: any; sponsorship: any }) {
  const [registeredCount, setRegisteredCount] = useState<number>(0);

  useEffect(() => {
    supabase
      .from("registrations")
      .select("id", { count: "exact" })
      .eq("event_id", event.id)
      .then(({ count }) => {
        setRegisteredCount(count || 0);
      });
  }, [event.id]);

  // Use live DB columns for finalized metrics, fallback to calculated values
  const allocatedBudget = sponsorship?.amount_allocated ||
    Number(sponsorship?.custom_package?.budget) ||
    (sponsorship?.tier === "Gold" ? 100000 : sponsorship?.tier === "Silver" ? 50000 : 20000);
  const audienceReach = sponsorship?.target_audience_reach || registeredCount;
  const leadsGenerated = sponsorship?.expected_calls_leads || Math.max(0, Math.floor(registeredCount * 0.15));
  const brandImpressions = sponsorship?.brand_awareness_impressions || (registeredCount * 12 + 150);

  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className="font-semibold flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> ROI Dashboard — {event.title}
      </h3>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-purple-50 border border-purple-100 p-3">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Budget Allocated</p>
          <p className="text-lg font-bold text-purple-700 mt-1">₹{Number(allocatedBudget).toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Audience Reach</p>
          <p className="text-lg font-bold text-blue-700 mt-1">{Number(audienceReach).toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground">attendees targeted</p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Leads Generated</p>
          <p className="text-lg font-bold text-emerald-700 mt-1">{Number(leadsGenerated).toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground">hot prospects</p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Brand Impressions</p>
          <p className="text-lg font-bold text-amber-700 mt-1">{Number(brandImpressions).toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground">total footprint</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {registeredCount} registered attendees • Live sync from finalized deal
        </p>
        <button
          onClick={() => toast.success("Executive summary downloaded (simulated)")}
          className="inline-flex items-center gap-2 rounded-lg gradient-cta px-4 py-2 text-sm"
        >
          <Download className="h-4 w-4" /> Executive Summary
        </button>
      </div>
    </div>
  );
}

function MoU({ s }: { s: any }) {
  const [draft, setDraft] = useState("");
  const [signature, setSignature] = useState("");
  const [signed, setSigned] = useState(s.signed);

  useEffect(() => {
    setSigned(s.signed);
    setDraft("");
  }, [s]);

  const gen = () =>
    setDraft(
      `MEMORANDUM OF UNDERSTANDING\n\nBetween: ${s.events.title} Organizer\nAnd: Sponsor (You)\n\nTier: ${
        s.tier
      }\nBudget: ₹${s.custom_package?.budget?.toLocaleString() || "-"}\nIn-kind: ${
        s.custom_package?.inkind || "None"
      }\n\nDeliverables include logo placement, branding rights, and access per ${
        s.tier
      } tier benefits.\n\nSigned digitally on ${new Date().toLocaleDateString()}.`
    );

  const sign = async () => {
    if (!signature.trim()) {
      toast.error("Please enter a digital signature first.");
      return;
    }
    const { error } = await supabase.from("sponsorships").update({ signed: true }).eq("id", s.id);
    if (error) {
      toast.error("Error signing Agreement: " + error.message);
    } else {
      setSigned(true);
      toast.success("Signed & sent to organizer");
    }
  };

  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className="font-semibold flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" /> Smart Legal Automation
      </h3>
      {signed ? (
        <div className="mt-3 p-3 rounded-lg bg-green-50 text-green-800 text-xs font-semibold border border-green-200">
          Agreement Signed & Finalized ✓
        </div>
      ) : (
        <>
          <button
            onClick={gen}
            className="mt-3 rounded-lg bg-accent text-accent-foreground px-3 py-1.5 text-sm"
          >
            Draft AI Agreement
          </button>
          {draft && (
            <>
              <textarea
                rows={8}
                readOnly
                className="mt-3 w-full rounded-lg border border-input bg-white/70 p-3 text-xs font-mono"
                value={draft}
              />
              <input
                placeholder="Digital signature (type your name)"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="mt-2 w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm"
              />
              <button
                onClick={sign}
                className="mt-2 inline-flex items-center gap-2 rounded-lg gradient-cta px-4 py-2 text-sm"
              >
                <Send className="h-4 w-4" /> Send to Organizer
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function SponsorCommAndOps({ event }: { event: any }) {
  const [organizer, setOrganizer] = useState<any>(null);
  const [leadVolunteers, setLeadVolunteers] = useState<any[]>([]);
  const [chatRecipient, setChatRecipient] = useState<{ id: string; name: string; role: string } | null>(null);

  useEffect(() => {
    // 1. Fetch Organizer Profile
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", event.organizer_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setOrganizer(data);
          setChatRecipient({ id: data.id, name: data.full_name || "Organizer", role: "Organizer" });
        }
      });

    // 2. Fetch Lead Volunteers (approved, is_lead = true)
    supabase
      .from("volunteer_applications")
      .select("volunteer_id, profiles!volunteer_applications_volunteer_id_fkey(id, full_name)")
      .eq("event_id", event.id)
      .eq("status", "approved")
      .eq("is_lead", true)
      .then(({ data }) => {
        if (data) {
          const leads = data
            .map((d: any) => ({
              id: d.profiles?.id,
              name: d.profiles?.full_name || "Lead Volunteer",
            }))
            .filter((x) => x.id);
          setLeadVolunteers(leads);
        }
      });
  }, [event.id, event.organizer_id]);

  return (
    <div className="glass-strong rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/60 pb-3 gap-3">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Communication & Operational Transparency
          </h3>
          <p className="text-xs text-muted-foreground">
            Collaborate with the event team and track operational progress in real-time.
          </p>
        </div>

        {/* Recipient Selector */}
        {chatRecipient && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Chatting with:
            </span>
            <select
              className="rounded-lg border border-input bg-white/70 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
              value={chatRecipient.id}
              onChange={(e) => {
                const val = e.target.value;
                if (organizer && val === organizer.id) {
                  setChatRecipient({ id: organizer.id, name: organizer.full_name || "Organizer", role: "Organizer" });
                } else {
                  const lead = leadVolunteers.find((l) => l.id === val);
                  if (lead) {
                    setChatRecipient({ id: lead.id, name: lead.name, role: "Lead Volunteer" });
                  }
                }
              }}
            >
              {organizer && <option value={organizer.id}>{organizer.full_name} (Organizer)</option>}
              {leadVolunteers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} (Lead Volunteer)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          {chatRecipient ? (
            <Chat
              eventId={event.id}
              recipientId={chatRecipient.id}
              recipientName={chatRecipient.name}
              recipientRole={chatRecipient.role}
              title={`Message ${chatRecipient.role}`}
            />
          ) : (
            <div className="h-[400px] glass rounded-2xl flex items-center justify-center text-xs text-muted-foreground">
              Loading communication hub...
            </div>
          )}
        </div>
        <div>
          <KanbanMirror event={event} />
        </div>
      </div>
    </div>
  );
}

function KanbanMirror({ event }: { event: any }) {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const load = () =>
      supabase
        .from("tasks")
        .select("*")
        .eq("event_id", event.id)
        .then(({ data }) => setTasks(data || []));
    load();
    const ch = supabase
      .channel(`mirror-${event.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `event_id=eq.${event.id}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [event.id]);

  if (!event.sponsor_kanban_enabled) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground h-[400px] flex items-center justify-center">
        Kanban mirror is disabled by the organizer.
      </div>
    );
  }

  const cols = ["todo", "in_progress", "done"];
  const lbl: any = { todo: "To-Do", in_progress: "In Progress", done: "Done" };
  return (
    <div className="glass rounded-2xl p-4 h-[400px] flex flex-col">
      <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground">
        Live Kanban Board (Mirror)
      </h4>
      <div className="grid grid-cols-3 gap-2 flex-1 overflow-hidden">
        {cols.map((c) => (
          <div key={c} className="bg-white/40 rounded-xl p-2 flex flex-col h-full overflow-hidden">
            <h5 className="text-[10px] font-bold uppercase mb-2 text-primary">{lbl[c]}</h5>
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {tasks
                .filter((t) => t.status === c)
                .map((t) => (
                  <div key={t.id} className="bg-white rounded-lg p-2 text-[10px] shadow-sm border border-border/40 font-medium">
                    {t.title}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
