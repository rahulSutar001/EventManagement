import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { downloadCertificate } from "@/lib/certificate";
import { Download, QrCode } from "lucide-react";
import { toast } from "sonner";

export function ParticipantMyEvents() {
  const { user } = useAuth();
  const [regs, setRegs] = useState<any[]>([]);
  const [qrModal, setQrModal] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("registrations")
      .select("*, events(*)")
      .eq("participant_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRegs(data || []));
  }, [user]);

  const isEventOver = (ev: any) =>
    ev?.status === "completed" ||
    (ev?.event_date && new Date(ev.event_date).getTime() < Date.now());

  const cert = async (r: any) => {
    if (!isEventOver(r.events)) {
      toast.error("Certificate is available only after the event is over.");
      return;
    }
    const cuid = `EVT-${r.event_id.slice(0, 8).toUpperCase()}-${r.id.slice(0, 6).toUpperCase()}`;
    await supabase
      .from("certificates")
      .insert({ user_id: user!.id, event_id: r.event_id, role: "participant", certificate_uid: cuid });
    const p = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user!.id)
      .maybeSingle();
    downloadCertificate({
      name: p.data?.full_name || "Participant",
      event: r.events.title,
      role: "Participant",
      date: r.events.event_date || new Date().toISOString().slice(0, 10),
      uid: cuid,
    });
  };

  if (!regs.length)
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
        No events yet. Discover and register from the Discover tab.
      </div>
    );

  const totalPages = Math.ceil(regs.length / itemsPerPage);
  const currentRegs = regs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        {currentRegs.map((r) => {
          const eventOver = isEventOver(r.events);
          return (
            <div key={r.id} className="glass rounded-2xl overflow-hidden">
              {/* Status bar */}
              <div
                className={`h-1.5 ${r.checked_in ? "bg-green-400" : "gradient-cta"}`}
              />
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold">{r.events.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      📅 {r.events.event_date || "Date TBA"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                      r.checked_in
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.checked_in ? "✓ Checked In" : "Not Yet"}
                  </span>
                </div>

                {/* QR Preview row */}
                <div className="flex items-center gap-3 rounded-xl bg-white/60 border border-border/60 px-3 py-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(
                      r.qr_code
                    )}&color=6d28d9`}
                    alt="QR"
                    className="w-12 h-12 rounded-md border border-purple-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] text-purple-800 truncate">{r.qr_code}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Tap to enlarge</p>
                  </div>
                  <button
                    onClick={() => setQrModal(r.qr_code)}
                    className="shrink-0 rounded-lg p-2 hover:bg-purple-50 transition"
                  >
                    <QrCode className="h-4 w-4 text-primary" />
                  </button>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => cert(r)}
                    disabled={!eventOver}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg gradient-cta px-3 py-2 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Certificate
                  </button>
                  {!eventOver && (
                    <p className="text-xs text-amber-600 font-medium text-center">
                      ⚠️ Certificate unlocks after the event ends ({r.events?.event_date || "TBA"}).
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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

      {/* QR Enlargement Modal */}
      {qrModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"
          onClick={() => setQrModal(null)}
        >
          <div
            className="glass-strong rounded-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold">Your Event Ticket</h3>
            <div className="bg-white p-3 rounded-xl border-2 border-purple-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                  qrModal
                )}&color=6d28d9`}
                alt="QR Code"
                className="w-60 h-60 block"
              />
            </div>
            <p className="font-mono text-xs text-purple-800 text-center break-all">{qrModal}</p>
            <p className="text-xs text-muted-foreground text-center">
              Show this at the event entry gate for check-in.
            </p>
            <button
              onClick={() => setQrModal(null)}
              className="rounded-lg border border-input px-6 py-2 text-sm hover:bg-accent transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
