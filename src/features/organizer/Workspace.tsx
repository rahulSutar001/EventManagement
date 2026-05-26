import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles, Mail, MessageSquare, Check, Star, Plus, Trash2, QrCode } from "lucide-react";
import { Chat } from "@/components/Chat";

type Event = { id: string; title: string; themes: any; total_budget: number; itemized_budget: any; sponsor_kanban_enabled: boolean };

export function OrganizerWorkspace() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState<string>("");
  const [tab, setTab] = useState<"sponsor"|"volunteer"|"kanban"|"chats">("kanban");
  const [activeChatSponsorId, setActiveChatSponsorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("events").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setEvents((data as any) || []); if (data?.[0]) setEventId(data[0].id); });
  }, [user]);

  const event = events.find(e => e.id === eventId);

  if (!events.length) return <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Publish an event first to open its workspace.</div>;

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      <aside className="space-y-2">
        <label className="text-xs text-muted-foreground px-2">Event</label>
        <select className="w-full rounded-lg border border-input bg-white/70 px-3 py-2" value={eventId} onChange={(e)=>setEventId(e.target.value)}>
          {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <nav className="mt-4 space-y-1">
          {[
            { id: "sponsor", label: "Sponsor Match Feed" },
            { id: "volunteer", label: "Volunteer Screening" },
            { id: "kanban", label: "Live Kanban" },
            { id: "chats", label: "Sponsor Chats" },
          ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id as any)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm ${tab===t.id ? "gradient-cta text-white" : "hover:bg-white/60"}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <div>
        {event && tab === "sponsor" && <SponsorFeed event={event} onOpenChat={(spId)=>{ setActiveChatSponsorId(spId); setTab("chats"); }}/>}
        {event && tab === "volunteer" && <VolunteerScreen event={event}/>}
        {event && tab === "kanban" && <OrgKanban event={event} refresh={()=>{
          if (user) supabase.from("events").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false }).then(({data})=>setEvents((data as any)||[]));
        }}/>}
        {event && tab === "chats" && <SponsorChats event={event} initialSponsorId={activeChatSponsorId || undefined}/>}
      </div>
    </div>
  );
}

function SponsorFeed({ event, onOpenChat }: { event: Event; onOpenChat: (sponsorId: string) => void }) {
  const { user } = useAuth();
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [pitchTo, setPitchTo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [messages, setMessages] = useState<any[]>([]);
  const itemsPerPage = 6;

  useEffect(() => {
    supabase.from("sponsor_profiles").select("*, profiles(full_name, email, id, hashtags)")
      .then(({ data }) => setSponsors(data || []));
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadMessages = () => {
      supabase.from("messages").select("*").eq("event_id", event.id)
        .then(({ data }) => setMessages(data || []));
    };
    loadMessages();
    const ch = supabase.channel(`sponsor-feed-msgs-${event.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `event_id=eq.${event.id}` }, loadMessages)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [event.id, user]);

  const themes = Array.isArray(event.themes) ? event.themes : [];

  const getMatchScore = (sponsor: any) => {
    let score = 40 + ((sponsor.id?.charCodeAt(0) || 0) + (sponsor.id?.charCodeAt(1) || 0)) % 45;
    const sponsorGoals = Array.isArray(sponsor.primary_goal) ? sponsor.primary_goal : [];
    
    themes.forEach((t: string) => {
      if (sponsor.industry && sponsor.industry.toLowerCase().includes(t.toLowerCase())) {
        score += 15;
      }
      sponsorGoals.forEach((g: string) => {
        if (g.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(g.toLowerCase())) {
          score += 10;
        }
      });
    });

    if (sponsor.budget_range) {
      const budget = event.total_budget || 0;
      if (sponsor.budget_range.includes("1L+") && budget >= 100000) score += 20;
      else if (sponsor.budget_range.includes("50k-1L") && budget >= 50000 && budget <= 100000) score += 20;
      else if (sponsor.budget_range.includes("10k-50k") && budget >= 10000 && budget <= 50000) score += 20;
      else if (sponsor.budget_range.includes("2L+") && budget >= 200000) score += 20;
    }
    
    return Math.min(99, score);
  };

  const totalPages = Math.ceil(sponsors.length / itemsPerPage);
  const currentSponsors = sponsors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentSponsors.map((s) => {
          const score = getMatchScore(s);
          const sponsorMsgCount = messages.filter(m => m.sender_id === s.profile_id && m.receiver_id === user?.id).length;

          return (
            <div key={s.id} className="glass rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{s.company_name || s.profiles?.full_name}</h4>
                    <p className="text-xs text-muted-foreground">{s.industry} • {s.budget_range}</p>
                  </div>
                  <div className="relative h-14 w-14 grid place-items-center rounded-full bg-gradient-to-br from-pink-500 to-red-500 text-white font-bold text-sm shadow-sm">{score}%</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(s.primary_goal || []).slice(0,2).map((g: string) => <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{g}</span>)}
                  {themes.slice(0,2).map((t: string) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">#{t}</span>)}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={()=>setPitchTo(s)} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg gradient-cta py-2 text-xs"><Mail className="h-3.5 w-3.5"/> Pitch</button>
                <button 
                  onClick={()=>onOpenChat(s.profile_id)} 
                  className="rounded-lg border border-input bg-white/70 px-3 text-xs relative flex items-center justify-center"
                >
                  <MessageSquare className="h-3.5 w-3.5"/>
                  {sponsorMsgCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-[9px] px-1.5 py-0.5 font-bold min-w-[18px] text-center shadow-sm">
                      {sponsorMsgCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
        {pitchTo && (
          <PitchModal
            sponsor={pitchTo}
            event={event}
            onClose={()=>setPitchTo(null)}
            onPitchSent={(spId) => {
              setPitchTo(null);
              onOpenChat(spId);
            }}
          />
        )}
      </div>

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

function PitchModal({ sponsor, event, onClose, onPitchSent }: { sponsor: any; event: Event; onClose: () => void; onPitchSent: (sponsorId: string) => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const draft = `Subject: Partnership opportunity — ${event.title}

Hi ${sponsor.profiles?.full_name || sponsor.company_name},

We're hosting ${event.title} and noticed your work in ${sponsor.industry || "your industry"} would be a perfect fit for our audience. With an expected reach and budget of ₹${event.total_budget}, we'd love to explore a partnership that aligns with your ${(sponsor.primary_goal||[]).join(", ") || "growth"} goals.

Themes: ${(Array.isArray(event.themes) ? event.themes : []).join(", ")}.

Looking forward to your response.

— The EventTech Team`;

  const [text, setText] = useState(draft);

  const handleSend = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("messages").insert({
      event_id: event.id,
      sender_id: user.id,
      receiver_id: sponsor.profile_id,
      content: text,
    });
    setBusy(false);
    if (error) {
      toast.error("Failed to send pitch: " + error.message);
    } else {
      toast.success("Pitch sent and chat conversation started!");
      onPitchSent(sponsor.profile_id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 max-w-xl w-full" onClick={(e)=>e.stopPropagation()}>
        <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary"/> AI-drafted pitch</h3>
        <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={12} className="mt-3 w-full rounded-lg border border-input bg-white/70 p-3 text-sm font-mono"/>
        <div className="mt-3 flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm">Close</button>
          <button disabled={busy} onClick={handleSend} className="rounded-lg gradient-cta px-4 py-2 text-sm">
            {busy ? "Sending..." : "Send to In-App Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SponsorChats({ event, initialSponsorId }: { event: Event; initialSponsorId?: string }) {
  const { user } = useAuth();
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(initialSponsorId || null);

  const loadChatSponsors = async () => {
    if (!user) return;
    const { data: msgs, error } = await supabase
      .from("messages")
      .select("sender_id, receiver_id")
      .eq("event_id", event.id);

    if (error || !msgs) return;

    const partnerIds = Array.from(
      new Set(
        msgs
          .flatMap((m) => [m.sender_id, m.receiver_id])
          .filter((id) => id !== user?.id)
      )
    );

    if (partnerIds.length === 0) {
      setSponsors([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("sponsor_profiles")
      .select("*, profiles(id, full_name, email)")
      .in("profile_id", partnerIds);

    setSponsors(profiles || []);
    if (profiles && profiles.length > 0 && !selectedSponsorId) {
      setSelectedSponsorId(profiles[0].profile_id);
    }
  };

  useEffect(() => {
    loadChatSponsors();
    // Refresh list if new message partners appear
    const channel = supabase
      .channel(`chat-list-${event.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `event_id=eq.${event.id}` }, loadChatSponsors)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, user]);

  useEffect(() => {
    if (initialSponsorId) {
      setSelectedSponsorId(initialSponsorId);
    }
  }, [initialSponsorId]);

  const activeSponsor = sponsors.find((s) => s.profile_id === selectedSponsorId);

  if (sponsors.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
        No active chats yet. Go to the "Sponsor Match Feed" and pitch a sponsor to start!
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-6">
      <div className="space-y-2 border-r border-border/60 pr-4">
        <label className="text-xs text-muted-foreground px-2">Conversations</label>
        <div className="space-y-1">
          {sponsors.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSponsorId(s.profile_id)}
              className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium transition ${
                selectedSponsorId === s.profile_id
                  ? "gradient-cta text-white"
                  : "bg-white/60 hover:bg-white"
              }`}
            >
              {s.company_name || s.profiles?.full_name}
            </button>
          ))}
        </div>
      </div>
      <div>
        {activeSponsor ? (
          <Chat
            eventId={event.id}
            recipientId={activeSponsor.profile_id}
            recipientName={activeSponsor.company_name || activeSponsor.profiles?.full_name || "Sponsor"}
            recipientRole="Sponsor"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            Select a sponsor to chat.
          </div>
        )}
      </div>
    </div>
  );
}

function VolunteerScreen({ event }: { event: Event }) {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [rateTarget, setRateTarget] = useState<any>(null);
  const [score, setScore] = useState(8);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [regs, setRegs] = useState<any[]>([]);

  const load = () => {
    supabase
      .from("volunteer_applications")
      .select("*, profiles!volunteer_applications_volunteer_id_fkey(full_name, email, hashtags)")
      .eq("event_id", event.id)
      .then(({ data }) => setApps(data || []));
    supabase
      .from("registrations")
      .select("*, profiles!registrations_participant_id_fkey(full_name, email)")
      .eq("event_id", event.id)
      .then(({ data }) => setRegs(data || []));
  };

  useEffect(() => { load(); }, [event.id]);

  const approve = async (id: string) => {
    await supabase.from("volunteer_applications").update({ status: "approved" }).eq("id", id);
    toast.success("Volunteer approved!");
    load();
  };

  const reject = async (id: string) => {
    await supabase.from("volunteer_applications").update({ status: "rejected" }).eq("id", id);
    toast.info("Application rejected.");
    load();
  };

  const toggleLead = async (id: string, on: boolean) => {
    await supabase.from("volunteer_applications").update({ is_lead: on }).eq("id", id);
    load();
  };

  const submitRating = async () => {
    if (!rateTarget || !user) return;
    setRatingBusy(true);
    const xpAwarded = score * 15;
    // Insert performance score
    await supabase.from("performance_scores").insert({
      volunteer_id: rateTarget.volunteer_id,
      event_id: event.id,
      score,
      rated_by: user.id,
      xp_awarded: xpAwarded,
    });
    // Add XP to volunteer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp")
      .eq("id", rateTarget.volunteer_id)
      .maybeSingle();
    const newXp = (profile?.xp || 0) + xpAwarded;
    await supabase.from("profiles").update({ xp: newXp }).eq("id", rateTarget.volunteer_id);
    setRatingBusy(false);
    setRateTarget(null);
    toast.success(`Rated ${rateTarget.profiles?.full_name} — ${score}/10. +${xpAwarded} XP awarded!`);
  };

  // QR Check-in
  const handleQrCheckin = async () => {
    if (!qrInput.trim()) return;
    setQrBusy(true);
    const { data, error } = await supabase
      .from("registrations")
      .update({ checked_in: true })
      .eq("qr_code", qrInput.trim().toUpperCase())
      .eq("event_id", event.id)
      .select("*, profiles!registrations_participant_id_fkey(full_name)");
    setQrBusy(false);
    if (error || !data || data.length === 0) {
      setQrResult("❌ Invalid QR code or not registered for this event.");
    } else {
      setQrResult(`✅ Checked in: ${(data[0] as any).profiles?.full_name || "Participant"}`);
      setQrInput("");
      setRegs(regs.map(r => r.qr_code === qrInput.trim().toUpperCase() ? { ...r, checked_in: true } : r));
    }
  };

  return (
    <div className="space-y-6">
      {/* QR Check-In Panel */}
      <div className="glass-strong rounded-2xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" /> QR Check-In Scanner
        </h3>
        <div className="flex gap-3 items-center flex-wrap">
          <input
            className="rounded-lg border border-input bg-white/70 px-3 py-2 text-sm flex-1 min-w-0 font-mono outline-none focus:ring-2 focus:ring-primary"
            placeholder="Paste or type participant QR code..."
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleQrCheckin(); }}
          />
          <button
            onClick={handleQrCheckin}
            disabled={qrBusy || !qrInput.trim()}
            className="rounded-lg gradient-cta px-4 py-2 text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> {qrBusy ? "Checking..." : "Check In"}
          </button>
        </div>
        {qrResult && (
          <p className={`mt-3 text-sm font-medium ${qrResult.startsWith("✅") ? "text-green-700" : "text-red-600"}`}>
            {qrResult}
          </p>
        )}
      </div>

      {/* Live Participant Table & QR Generator */}
      <div className="glass-strong rounded-2xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <QrCode className="h-4 w-4 text-primary" /> Event Registration & Participants
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 border border-border/60 bg-white/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="bg-white p-2 rounded-xl shadow-sm mb-3">
              <QrCode className="h-24 w-24 text-primary" />
            </div>
            <p className="font-bold text-sm">Share Event QR Code</p>
            <p className="text-[10px] text-muted-foreground mt-1">Participants scan to register & check-in</p>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold mb-2">Live Participants</h4>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
              {regs.length === 0 && <p className="text-xs text-muted-foreground">No participants registered yet.</p>}
              {regs.map(r => (
                <div key={r.id} className="flex justify-between items-center bg-white/60 p-2 rounded-lg border border-border/40">
                  <div>
                    <p className="text-xs font-semibold">{r.profiles?.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.profiles?.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.checked_in ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                    {r.checked_in ? '✅ Checked-In' : '⌛ Registered'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Volunteer Applications */}
      <div className="space-y-3">
        <h3 className="font-semibold">Volunteer Applications</h3>
        {!apps.length && (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">No volunteer applications yet.</div>
        )}
        {apps.map((a, i) => (
          <div key={a.id} className={`glass rounded-2xl p-4 border-l-4 ${a.status === "approved" ? "border-l-green-400" : a.status === "rejected" ? "border-l-red-300 opacity-60" : "border-l-amber-400"}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold">{a.profiles?.full_name}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full gradient-cta text-white">#{i + 1}</span>
                  {a.is_lead && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Star className="h-3 w-3" /> Lead
                    </span>
                  )}
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    a.status === "approved" ? "bg-green-100 text-green-800" :
                    a.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-800"
                  }`}>
                    {a.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{a.preferred_dept} • {a.role_type} • {a.tshirt_size}</p>
                <p className="text-xs italic mt-1">"{a.why_volunteer?.slice(0, 120)}"</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {a.status === "pending" && (
                  <>
                    <button
                      onClick={() => approve(a.id)}
                      className="rounded-lg gradient-cta px-3 py-1.5 text-xs inline-flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => reject(a.id)}
                      className="rounded-lg border border-red-300 text-red-600 px-3 py-1.5 text-xs hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {a.status === "approved" && (
                  <>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="checkbox" checked={a.is_lead} onChange={(e) => toggleLead(a.id, e.target.checked)} />
                      Lead
                    </label>
                    <button
                      onClick={() => setRateTarget(a)}
                      className="rounded-lg border border-input bg-white/70 px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      ⭐ Rate
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rating Modal */}
      {rateTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={() => setRateTarget(null)}>
          <div className="glass-strong rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Rate {rateTarget.profiles?.full_name}</h3>
            <p className="text-xs text-muted-foreground mt-1">Score will award XP to their profile.</p>
            <div className="mt-5">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Score: <span className="font-bold text-primary text-lg">{score}</span>/10</span>
                <span>+{score * 15} XP</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Poor</span><span>Average</span><span>Excellent</span>
              </div>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setRateTarget(null)} className="rounded-lg border border-input px-4 py-2 text-sm">Cancel</button>
              <button onClick={submitRating} disabled={ratingBusy} className="rounded-lg gradient-cta px-4 py-2 text-sm disabled:opacity-60">
                {ratingBusy ? "Saving..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgKanban({ event, refresh }: { event: Event; refresh: () => void }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [vols, setVols] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("Catering");

  const load = () => {
    supabase.from("tasks").select("*").eq("event_id", event.id).then(({data})=>setTasks(data||[]));
    supabase.from("volunteer_applications").select("volunteer_id, profiles!volunteer_applications_volunteer_id_fkey(full_name)").eq("event_id", event.id).eq("status", "approved")
      .then(({data})=>setVols(data||[]));
  };
  useEffect(() => {
    load();
    const ch = supabase.channel(`tasks-${event.id}`).on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `event_id=eq.${event.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [event.id]);

  const cats = Object.keys(event.itemized_budget || {});

  const addTask = async () => {
    if (!newTitle) return;
    await supabase.from("tasks").insert({ event_id: event.id, title: newTitle, category: newCat });
    setNewTitle("");
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  };

  const toggleSponsor = async () => {
    await supabase.from("events").update({ sponsor_kanban_enabled: !event.sponsor_kanban_enabled }).eq("id", event.id);
    toast.success(`Sponsor mirror ${!event.sponsor_kanban_enabled ? "enabled" : "disabled"}`);
    refresh();
  };

  const cols: { id: "todo"|"in_progress"|"done"; label: string }[] = [
    { id: "todo", label: "To-Do" }, { id: "in_progress", label: "In Progress" }, { id: "done", label: "Done" }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 items-center">
          <input value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} placeholder="New task" className="rounded-lg border border-input bg-white/70 px-3 py-2 text-sm"/>
          <select value={newCat} onChange={(e)=>setNewCat(e.target.value)} className="rounded-lg border border-input bg-white/70 px-3 py-2 text-sm">
            {(cats.length ? cats : ["Catering","Prize Pool","Marketing/Merch","Venue/Logistics"]).map(c=><option key={c}>{c}</option>)}
          </select>
          <button onClick={addTask} className="rounded-lg gradient-cta px-3 py-2 text-sm inline-flex items-center gap-1"><Plus className="h-4 w-4"/>Add</button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={event.sponsor_kanban_enabled} onChange={toggleSponsor}/>
          Sponsor read-only mirror
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {cols.map(col => (
          <div key={col.id} className="glass rounded-2xl p-4">
            <h4 className="font-semibold mb-3 flex items-center justify-between">
              {col.label}
              <span className="text-xs text-muted-foreground">{tasks.filter(t=>t.status===col.id).length}</span>
            </h4>
            <div className="space-y-2">
              {tasks.filter(t=>t.status===col.id).map(t => (
                <div key={t.id} className="bg-white rounded-xl p-3 border border-border/60 relative group">
                  <button onClick={()=>deleteTask(t.id)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5"/></button>
                  <div className="text-sm font-medium pr-5">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.category}</div>
                  <select className="mt-2 w-full text-xs rounded border border-input bg-white px-2 py-1"
                    value={t.assigned_to || ""}
                    onChange={async (e)=>{ await supabase.from("tasks").update({ assigned_to: e.target.value || null }).eq("id", t.id); }}>
                    <option value="">Unassigned</option>
                    {vols.map(v => <option key={v.volunteer_id} value={v.volunteer_id}>{v.profiles?.full_name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
