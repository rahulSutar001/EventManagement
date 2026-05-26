import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Send, User } from "lucide-react";
import { toast } from "sonner";

interface ChatProps {
  eventId: string;
  recipientId: string;
  recipientName: string;
  recipientRole?: string;
  title?: string;
}

export function Chat({ eventId, recipientId, recipientName, recipientRole, title }: ChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    if (!user || !recipientId) return;
    
    // Fetch messages where:
    // (sender = user AND receiver = recipient) OR (sender = recipient AND receiver = user)
    // and event_id = eventId
    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)")
      .eq("event_id", eventId)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  const [sponsorship, setSponsorship] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loadingDeal, setLoadingDeal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const loadSponsorship = async () => {
    if (!user || !eventId || !recipientId) return;
    
    // Fetch event first to know organizer
    const { data: ev } = await supabase
      .from("events")
      .select("id, title, organizer_id, expected_footfall, status")
      .eq("id", eventId)
      .maybeSingle();
      
    if (!ev) return;
    setEventData(ev);

    // Determine sponsor ID
    const sponsorId = ev.organizer_id === user.id ? recipientId : user.id;

    const { data: sp } = await supabase
      .from("sponsorships")
      .select("*")
      .eq("event_id", eventId)
      .eq("sponsor_id", sponsorId)
      .maybeSingle();

    setSponsorship(sp || null);
  };

  const handleFinalize = async () => {
    if (!user || !sponsorship || !eventData) return;
    setLoadingDeal(true);
    try {
      const budgetAmount = Number(sponsorship?.custom_package?.budget) || 
        (sponsorship?.tier === "Gold" ? 100000 : sponsorship?.tier === "Silver" ? 50000 : 20000);
      const footfall = Number(eventData.expected_footfall) || 1000;
      const reach = footfall;
      const leads = Math.round(footfall * 0.15);
      const impressions = footfall * 3;

      // 1. Update sponsorships table
      const { error: spError } = await supabase
        .from("sponsorships")
        .update({
          status: "approved",
          signed: true,
          amount_allocated: budgetAmount,
          target_audience_reach: reach,
          expected_calls_leads: leads,
          brand_awareness_impressions: impressions
        })
        .eq("id", sponsorship.id);

      if (spError) throw spError;

      // 2. Update events table
      const { error: evError } = await supabase
        .from("events")
        .update({
          status: "published",
          sponsor_kanban_enabled: true
        })
        .eq("id", eventData.id);

      if (evError) throw evError;

      // 3. Send automated system message
      const systemMessage = "🎉 System Notification: Deal formally locked! Budget allocated and contract signed.";
      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          event_id: eventId,
          sender_id: user.id,
          receiver_id: recipientId,
          content: systemMessage
        });

      if (msgError) throw msgError;

      toast.success("Deal finalized successfully!");
      setShowConfirmModal(false);
      
      // Reload states
      await loadSponsorship();
      await loadMessages();
    } catch (err: any) {
      console.error(err);
      toast.error("Error finalizing deal: " + err.message);
    } finally {
      setLoadingDeal(false);
    }
  };

  useEffect(() => {
    loadMessages();
    loadSponsorship();

    // Subscribe to messages changes
    const channel = supabase
      .channel(`chat-${eventId}-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          // Verify if the message is between these two users
          if (
            (newMsg.sender_id === user?.id && newMsg.receiver_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.receiver_id === user?.id)
          ) {
            // Load messages again to get sender profile info or append it
            loadMessages();
            loadSponsorship();
          }
        }
      )
      .subscribe();

    // Subscribe to sponsorship status changes for instant deal status updates
    const spChannel = supabase
      .channel(`sp-status-${eventId}-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sponsorships",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          loadSponsorship();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(spChannel);
    };
  }, [eventId, recipientId, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !recipientId) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      event_id: eventId,
      sender_id: user.id,
      receiver_id: recipientId,
      content: text.trim(),
    });

    setSending(false);
    if (error) {
      toast.error("Failed to send message: " + error.message);
    } else {
      setText("");
      loadMessages();
    }
  };

  return (
    <div className="flex flex-col h-[400px] glass rounded-2xl overflow-hidden border border-border/60 relative">
      {/* Header */}
      <div className="px-4 py-3 bg-white/40 border-b border-border/60 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm">{title || `Chat with ${recipientName}`}</h4>
          {recipientRole && (
            <span className="text-[10px] uppercase font-bold text-primary px-1.5 py-0.5 rounded bg-purple-100">
              {recipientRole}
            </span>
          )}
        </div>
      </div>

      {/* Contextual Action Box */}
      {sponsorship && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-white/60 border border-border/50 shadow-sm flex items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Sponsorship: {sponsorship.tier} tier</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Budget Proposal: ₹{(Number(sponsorship?.custom_package?.budget) || (sponsorship?.tier === "Gold" ? 100000 : sponsorship?.tier === "Silver" ? 50000 : 20000)).toLocaleString()}
            </p>
          </div>
          
          <div className="shrink-0">
            {eventData?.organizer_id === user?.id ? (
              // For Organizer
              sponsorship.status === "pending" ? (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="rounded-lg gradient-cta px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-105 transition animate-pulse"
                >
                  🤝 Finalize Deal & Lock Sponsorship
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  ✅ Deal Contract Signed
                </span>
              )
            ) : (
              // For Sponsor
              sponsorship.status === "pending" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 animate-pulse">
                  ⏳ Awaiting Organizer Finalization
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  ✅ Deal Contract Signed
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* Deal Finalize Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm grid place-items-center p-4">
          <div className="glass-strong rounded-2xl p-6 max-w-md w-full border border-border/80 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
              🤝 Finalize Sponsorship Deal
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Are you sure you want to finalize this sponsorship deal? This will lock the tier, activate ROI metrics, publish your event live, and enable the Kanban task mirror for the sponsor.
            </p>
            
            {sponsorship && (
              <div className="mt-4 p-4 rounded-xl bg-white/40 border border-border/60 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sponsor:</span>
                  <span className="font-semibold text-foreground">{recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sponsorship Tier:</span>
                  <span className="font-semibold text-primary">{sponsorship.tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Allocated Budget:</span>
                  <span className="font-bold text-green-600">
                    ₹{(Number(sponsorship?.custom_package?.budget) || (sponsorship?.tier === "Gold" ? 100000 : sponsorship?.tier === "Silver" ? 50000 : 20000)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Reach:</span>
                  <span className="font-semibold">{Number(eventData?.expected_footfall) || 1000} attendees</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-input bg-white/70 px-4 py-2 text-sm hover:bg-accent transition"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                disabled={loadingDeal}
                className="rounded-lg gradient-cta px-4 py-2 text-sm font-semibold text-white hover:brightness-105 transition disabled:opacity-60"
              >
                {loadingDeal ? "Finalizing..." : "Confirm & Sign Deal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/10">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No messages yet. Send a message to start the conversation!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user?.id;
            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 max-w-[85%] ${
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {!isMe && (
                  <div className="h-6 w-6 rounded-full bg-accent grid place-items-center flex-shrink-0">
                    <User className="h-3 w-3 text-accent-foreground" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 text-xs shadow-sm ${
                    isMe
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-white/95 text-foreground rounded-bl-none border border-border/50"
                  }`}
                >
                  <p className="break-all whitespace-pre-wrap">{m.content}</p>
                  <span
                    className={`block text-[9px] text-right mt-1 opacity-70 ${
                      isMe ? "text-purple-100" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSend} className="p-3 bg-white/40 border-t border-border/60 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 rounded-xl border border-input bg-white/80 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="h-8 w-8 rounded-xl gradient-cta flex items-center justify-center text-white hover:brightness-105 transition disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
