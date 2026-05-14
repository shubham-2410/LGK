import { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui";
import { Download } from "lucide-react";
import { format, parseISO } from "date-fns";

export type BoardingPassData = {
  booking: {
    id: number;
    fullName: string;
    contactNumber: string;
    date: string;
    timeSlot: string;
    pax: number;
    totalPayable: number;
    amountPaid: number;
    balance: number;
    status: string;
    couponCode?: string | null;
    couponDiscount?: number | null;
    gstAmount?: number | null;
    cgstAmount?: number | null;
    sgstAmount?: number | null;
  };
  serviceName: string;
  staffName?: string | null;
  staffContact?: string | null;
  paymentSettings: {
    companyName?: string;
    upiLink?: string;
    boardingLocation?: string;
    boardingPassTerms?: string;
    boardingPassDisclaimer?: string;
    googleReviewUrl?: string;
    siteUrl?: string;
    gstNumber?: string;
    contactPerson?: string;
    contactNumber?: string;
    boardingMessage?: string;
    proprietorName?: string;
    proprietorNumber?: string;
  };
  salesNumber?: string | null;
};

function genTicketId(id: number): string {
  return (id + 1000).toString(36).toUpperCase().padStart(5, "0").slice(-5);
}

// Spaced uppercase heading like the reference PDF
function Heading({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.28em",
      color: "#1a1a2e",
      textTransform: "uppercase",
      marginBottom: 10,
      paddingBottom: 6,
      borderBottom: "1px solid #e5e7eb",
    }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: "0.14em", color: "#9ca3af", textTransform: "uppercase", marginBottom: 3 }}>
      {children}
    </div>
  );
}

function Value({ children, color = "#111827", size = 12 }: { children: React.ReactNode; color?: string; size?: number }) {
  return (
    <div style={{ fontSize: size, fontWeight: 700, color, lineHeight: 1.3 }}>
      {children}
    </div>
  );
}

function TearLine() {
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "0 -1px" }}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f3f4f6", border: "1px solid #e5e7eb", flexShrink: 0, marginLeft: -6 }} />
      <div style={{ flex: 1, borderTop: "2px dashed #d1d5db" }} />
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f3f4f6", border: "1px solid #e5e7eb", flexShrink: 0, marginRight: -6 }} />
    </div>
  );
}

export function BoardingPassCard({ data }: { data: BoardingPassData }) {
  const { booking, serviceName, staffName, staffContact, paymentSettings: ps } = data;
  const ticketId = genTicketId(booking.id);

  const fmt2 = (n: number | null | undefined) =>
    (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Always show "LOCAL GOA KAYAKING" as company name
  const COMPANY = "LOCAL GOA KAYAKING";

  const isNight = booking.timeSlot?.startsWith("Check-in:");
  let dateDisplay = "";
  let timeDisplay = "";
  if (isNight) {
    const m = booking.timeSlot.match(/Check-in:\s*(.+?)\s*→\s*Check-out:\s*(.+?)\s*\(/);
    dateDisplay = m ? `${m[1].trim()} → ${m[2].trim()}` : booking.timeSlot;
    timeDisplay = "Overnight Stay";
  } else {
    try { dateDisplay = format(parseISO(booking.date), "dd MMM yyyy"); } catch { dateDisplay = booking.date; }
    timeDisplay = booking.timeSlot;
  }

  const terms = (ps.boardingPassTerms || "1. Please arrive 10 minutes before departure.\n2. Token amount is non-refundable in case of no-show.\n3. Full refund if cancelled due to weather or operator side issues.\n4. Complete payment before boarding.").split("\n").filter(Boolean);
  const disclaimer = ps.boardingPassDisclaimer || "This is an electronically generated boarding pass. Please carry a valid photo ID.";
  const boardingLocation = ps.boardingLocation || "";
  const googleReviewUrl = ps.googleReviewUrl || "";
  const px = 22;

  return (
    <div style={{
      width: 390,
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
    }}>

      {/* ── HEADER ─────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0c1a3a 0%, #1a3565 100%)",
        padding: `18px ${px}px 16px`,
        color: "#ffffff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>

          {/* Left: Company + badge */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", color: "#93b4e8", marginBottom: 5, fontWeight: 600 }}>
              BOARDING PASS
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.09em", lineHeight: 1.15, color: "#ffffff" }}>
              {COMPANY}
            </div>
            <div style={{ fontSize: 7, color: "#93b4e8", marginTop: 3, marginBottom: 10, letterSpacing: "0.04em" }}>
              Unit of Adventure Wave and Experiences
            </div>
            {(() => {
              const s = booking.status?.toLowerCase() || "confirmed";
              const cfg: Record<string, { bg: string; border: string; dot: string; text: string; label: string }> = {
                confirmed:  { bg: "rgba(52,211,153,0.18)", border: "rgba(52,211,153,0.35)", dot: "#34d399", text: "#6ee7b7", label: "CONFIRMED" },
                pending:    { bg: "rgba(251,191,36,0.18)", border: "rgba(251,191,36,0.35)", dot: "#fbbf24", text: "#fde68a", label: "PENDING" },
                cancelled:  { bg: "rgba(248,113,113,0.18)", border: "rgba(248,113,113,0.35)", dot: "#f87171", text: "#fca5a5", label: "CANCELLED" },
                rescheduled:{ bg: "rgba(96,165,250,0.18)",  border: "rgba(96,165,250,0.35)",  dot: "#60a5fa", text: "#bfdbfe", label: "RESCHEDULED" },
              };
              const c = cfg[s] ?? cfg.confirmed;
              return (
                <div style={{
                  width: "fit-content",
                  background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999,
                  padding: "4px 10px", lineHeight: 1,
                }}>
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: c.dot, verticalAlign: "middle", marginRight: 5, position: "relative", top: 0 }} />
                  <span style={{ fontSize: 8.3, fontWeight: 700, letterSpacing: "0.18em", color: c.text, whiteSpace: "nowrap", verticalAlign: "middle", position: "relative", top: -4 }}>{c.label}</span>
                </div>
              );
            })()}
          </div>

          {/* Right: Ticket ID */}
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 7.5, letterSpacing: "0.18em", color: "#93b4e8", marginBottom: 5, fontWeight: 600 }}>
              TICKET ID
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.12em", color: "#ffffff", fontFamily: "monospace" }}>
              {ticketId}
            </div>
          </div>
        </div>
      </div>

      {/* ── TEAR LINE ──────────────────────────────── */}
      <TearLine />

      {/* ── GUEST & JOURNEY ────────────────────────── */}
      <div style={{ padding: `14px ${px}px` }}>
        <Heading>G U E S T &amp; J O U R N E Y</Heading>

        {/* Row 1: Passenger | Guests */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px", marginBottom: 10 }}>
          <div>
            <Label>Passenger Name</Label>
            <Value>{booking.fullName}</Value>
          </div>
          <div>
            <Label>Guests</Label>
            <Value color="#1d4ed8">{booking.pax} Pax</Value>
          </div>
        </div>

        {/* Row 2: Package Name — full width so long names don't truncate */}
        <div style={{ marginBottom: 10 }}>
          <Label>{isNight ? "Property" : "Package Name"}</Label>
          <Value>{serviceName}</Value>
        </div>

        {/* Row 3: Date | Time */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px", marginBottom: (staffName || boardingLocation) ? 10 : 0 }}>
          <div>
            <Label>{isNight ? "Stay Period" : "Sailing Date"}</Label>
            <Value>{dateDisplay}</Value>
          </div>
          <div>
            <Label>{isNight ? "Type" : "Departure"}</Label>
            <Value>{timeDisplay}</Value>
          </div>
        </div>

        {/* Contact Person */}
        {staffName && (
          <div style={{ marginBottom: boardingLocation ? 8 : 0, position: "relative", top: -2 }}>
            <Label>Your Contact Person</Label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "fit-content", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "5px 10px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0, position: "relative", top: 1 }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8" }}>{staffName}</span>
              {staffContact && (
                <>
                  <span style={{ fontSize: 10, color: "#93c5fd" }}>·</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{staffContact}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Boarding Location */}
        {boardingLocation && (
          <div style={{ marginTop: 1, position: "relative", top: -1 }}>
            <Label>Boarding Location</Label>
            <div style={{ display: "flex", alignItems: "center", gap: 5, width: "fit-content", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "5px 10px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0, position: "relative", top: 1 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#1d4ed8" }}>
                {boardingLocation}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── TEAR LINE ──────────────────────────────── */}
      <TearLine />

      {/* ── PAYMENT SUMMARY ────────────────────────── */}
      <div style={{ padding: `14px ${px}px` }}>
        <Heading>P A Y M E N T  S U M M A R Y</Heading>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div style={{ textAlign: "center", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 6px" }}>
            <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase", marginBottom: 5 }}>Booking Amount</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>₹{fmt2(booking.totalPayable)}</div>
          </div>
          <div style={{ textAlign: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 6px" }}>
            <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase", marginBottom: 5 }}>Token Paid</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#16a34a" }}>₹{fmt2(booking.amountPaid)}</div>
          </div>
          <div style={{ textAlign: "center", background: booking.balance > 0 ? "#fffbeb" : "#f9fafb", border: `1px solid ${booking.balance > 0 ? "#fde68a" : "#e5e7eb"}`, borderRadius: 10, padding: "10px 6px" }}>
            <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase", marginBottom: 5 }}>Pending Balance</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: booking.balance > 0 ? "#d97706" : "#9ca3af" }}>₹{fmt2(booking.balance)}</div>
          </div>
        </div>
        {booking.couponCode && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 10px" }}>
            <span style={{ fontSize: 8, fontWeight: 600, color: "#92400e" }}>COUPON:</span>
            <span style={{ fontSize: 8, fontWeight: 800, fontFamily: "monospace", color: "#78350f" }}>{booking.couponCode}</span>
            {booking.couponDiscount ? <span style={{ fontSize: 8, fontWeight: 800, color: "#16a34a", marginLeft: "auto" }}>-₹{fmt2(booking.couponDiscount)}</span> : null}
          </div>
        )}
        {(booking.gstAmount ?? 0) > 0 && (
          <div style={{ marginTop: 8, background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "7px 10px" }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: "0.1em", color: "#0369a1", textTransform: "uppercase", marginBottom: 5 }}>
              GST Breakdown
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 8, color: "#374151" }}>CGST</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: "#111827" }}>₹{fmt2(booking.cgstAmount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 8, color: "#374151" }}>SGST</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: "#111827" }}>₹{fmt2(booking.sgstAmount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #bae6fd", paddingTop: 3, marginTop: 3 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: "#0369a1" }}>Total GST</span>
              <span style={{ fontSize: 8, fontWeight: 800, color: "#0369a1" }}>₹{fmt2(booking.gstAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── TEAR LINE ──────────────────────────────── */}
      <TearLine />

      {/* ── TERMS & CONDITIONS ─────────────────────── */}
      <div style={{ padding: `14px ${px}px` }}>
        <Heading>T E R M S &amp; C O N D I T I O N S</Heading>
        <div style={{ fontSize: 9, color: "#4b5563", lineHeight: 1.7 }}>
          {terms.map((line, i) => (
            <div key={i} style={{ marginBottom: 2 }}>{line}</div>
          ))}
        </div>
        {disclaimer && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed #e5e7eb" }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", marginBottom: 3 }}>D I S C L A I M E R</div>
            <div style={{ fontSize: 8, color: "#9ca3af", fontStyle: "italic" }}>
              {disclaimer}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM FOOTER ──────────────────────────── */}
      <div style={{ background: "#0c1a3a", padding: `10px ${px}px 16px` }}>
        {/* Top row: message + contact */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <div style={{ fontSize: 8.5, color: "#93b4e8", fontStyle: "italic", lineHeight: 1.4 }}>
              {ps.boardingMessage?.trim() || "We wish you a wonderful and unforgettable experience."}
            </div>
            {ps.gstNumber?.trim() && (
              <div style={{ fontSize: 7, color: "#6b8fc4", marginTop: 4, letterSpacing: "0.06em" }}>
                GSTIN: {ps.gstNumber.trim()}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {(ps.contactPerson?.trim() || ps.proprietorName?.trim()) && (
              <div style={{ fontSize: 6.5, color: "#93b4e8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2, opacity: 0.8 }}>
                Contact Details
              </div>
            )}
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.07em", color: "#ffffff" }}>
              {ps.contactPerson?.trim() || ps.proprietorName?.trim() || COMPANY}
            </div>
            <div style={{ fontSize: 7, color: "#93b4e8", marginTop: 2, letterSpacing: "0.06em" }}>
              {ps.contactNumber?.trim() || ps.proprietorNumber?.trim() || `#${ticketId}`}
            </div>
          </div>
        </div>
        {/* Social & review row */}
        <div style={{ borderTop: "1px solid rgba(147,180,232,0.2)", paddingTop: 6 }}>
          {googleReviewUrl && (
            <div style={{ marginBottom: 3, position: "relative", top: -7, textAlign: "left" }}>
              <span style={{ fontSize: 7.5, color: "#fbbf24", fontWeight: 600 }}>⭐ <span style={{ fontSize: 7, color: "#ef4444", fontWeight: 600, letterSpacing: "0.04em" }}>Rate us on Google</span> {googleReviewUrl}</span>
            </div>
          )}
          {/* Social icons row — all three on one line */}
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "nowrap", position: "relative", top: -6 }}>
            {/* Instagram */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0, position: "relative", top: 1 }}>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span style={{ fontSize: 7.5, color: "#93b4e8", whiteSpace: "nowrap", position: "relative", top: -2 }}>@local_goa_kayaking</span>
            </span>
            {/* Facebook */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#4267B2" stroke="none" style={{ display: "block", flexShrink: 0, position: "relative", top: 1 }}>
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
              <span style={{ fontSize: 7.5, color: "#93b4e8", whiteSpace: "nowrap", position: "relative", top: -2 }}>localgoakayaking</span>
            </span>
            {/* Website */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#93b4e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0, position: "relative", top: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span style={{ fontSize: 7.5, color: "#93b4e8", whiteSpace: "nowrap", position: "relative", top: -2 }}>www.localgoakayaking.com</span>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Headless image generator (used for email attachment) ────────────────────
export async function generateBoardingPassBase64(data: BoardingPassData): Promise<string> {
  const { default: html2canvas } = await import("html2canvas");
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;top:-9999px;left:0;z-index:1;pointer-events:none;width:390px;background:white;";
  document.body.appendChild(el);
  const root = createRoot(el);
  flushSync(() => { root.render(<BoardingPassCard data={data} />); });
  try {
    const canvas = await html2canvas(el, {
      scale: 3, useCORS: false, allowTaint: true, backgroundColor: "#ffffff", logging: false,
    });
    return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
  } finally {
    root.unmount();
    document.body.removeChild(el);
  }
}

// ─── PDF generator — renders boarding pass to PDF, returns base64 string ─────
export async function generateBoardingPassPDFBase64(data: BoardingPassData): Promise<string> {
  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;top:-9999px;left:0;z-index:1;pointer-events:none;width:390px;background:white;";
  document.body.appendChild(el);
  const root = createRoot(el);
  flushSync(() => { root.render(<BoardingPassCard data={data} />); });
  try {
    const canvas = await html2canvas(el, {
      scale: 3, useCORS: false, allowTaint: true, backgroundColor: "#ffffff", logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    const pxW = canvas.width / 3;
    const pxH = canvas.height / 3;
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [pxW, pxH] });
    pdf.addImage(imgData, "PNG", 0, 0, pxW, pxH);
    const dataUri = pdf.output("datauristring");
    return dataUri.split(",")[1];
  } finally {
    root.unmount();
    document.body.removeChild(el);
  }
}

export function DownloadBoardingPassButton({
  data,
  label = "Boarding Pass",
  iconOnly = false,
}: {
  data: BoardingPassData;
  label?: string;
  iconOnly?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    const snapshot = data;
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Render the card into an off-screen element
      const el = document.createElement("div");
      el.style.cssText =
        "position:fixed;top:-9999px;left:0;z-index:1;pointer-events:none;width:390px;background:white;";
      document.body.appendChild(el);

      const root = createRoot(el);
      flushSync(() => {
        root.render(<BoardingPassCard data={snapshot} />);
      });

      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      root.unmount();
      document.body.removeChild(el);

      const imgData = canvas.toDataURL("image/png");
      const pxW = canvas.width / 3;
      const pxH = canvas.height / 3;
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [pxW, pxH] });
      pdf.addImage(imgData, "PNG", 0, 0, pxW, pxH);

      const ticketId = genTicketId(snapshot.booking.id);
      const name = snapshot.booking.fullName.replace(/\s+/g, "_");
      pdf.save(`Boarding_Pass_${name}_${ticketId}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setLoading(false);
    }
  };

  if (iconOnly) {
    return (
      <div className="relative group">
        <button
          onClick={handleDownload}
          data-testid="button-download-boarding-pass"
          disabled={loading}
          className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          {loading
            ? <span className="w-3.5 h-3.5 border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
            : <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          }
        </button>
        <div className="absolute right-0 top-8 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="bg-popover text-popover-foreground text-xs font-medium px-2 py-1 rounded-md shadow-md border border-border whitespace-nowrap">
            Download Boarding Pass
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex-1 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary"
      onClick={handleDownload}
      isLoading={loading}
      data-testid="button-download-boarding-pass"
    >
      {!loading && <Download className="w-4 h-4 mr-1.5" />}
      {label}
    </Button>
  );
}
