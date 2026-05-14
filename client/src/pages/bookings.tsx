import { AppLayout } from "@/components/layout";
import { useBookings, useCancelBooking, useConfirmBooking, useRescheduleBooking } from "@/hooks/use-bookings";
import { useAuth } from "@/hooks/use-auth";
import { useServices } from "@/hooks/use-services";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo, useRef } from "react";
import { format, isThisMonth, parseISO } from "date-fns";
import {
  Calendar, Users, User, Ship, XCircle, ChevronDown, ChevronLeft, ChevronRight,
  ChevronUp, CheckCircle2, AlertCircle, Clock, Ticket, UserCog, Phone, RefreshCw, IndianRupee, Tag, Mail, MapPin, BadgeCheck, Landmark, Wallet, Bell, BellRing,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SiWhatsapp } from "react-icons/si";
import { MessageCircleMore } from "lucide-react";
import type { Booking, BookingManualReminder } from "@shared/schema";
import { DownloadBoardingPassButton, generateBoardingPassPDFBase64 } from "@/components/boarding-pass";
import { usePaymentSettings } from "@/hooks/use-payment-settings";

function toWhatsAppLink(phone: string, name: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("91") && digits.length === 12 ? digits : digits.length === 10 ? `91${digits}` : digits;
  const msg = encodeURIComponent(`Hi ${name}, I have a query about my kayaking booking.`);
  return `https://wa.me/${number}?text=${msg}`;
}

function toCustomerWaLink(customerPhone: string, message: string): string {
  const digits = customerPhone.replace(/\D/g, "");
  const number = digits.startsWith("91") && digits.length === 12 ? digits : digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function renderWaTemplate(template: string, booking: Booking, serviceName: string): string {
  const gstAmount = booking.gstAmount ?? 0;
  const cgstAmount = booking.cgstAmount ?? 0;
  const sgstAmount = booking.sgstAmount ?? 0;
  const gstSummary = gstAmount > 0
    ? `\n💰 Tax Breakdown:\n  • CGST      : ₹${cgstAmount}\n  • SGST      : ₹${sgstAmount}\n  • Total GST : ₹${gstAmount}`
    : "";
  return template
    .replace(/\[Full Name\]/g, booking.fullName)
    .replace(/\[Phone\]/g, booking.contactNumber)
    .replace(/\[Service Name\]/g, serviceName)
    .replace(/\[Booking Date\]/g, booking.date)
    .replace(/\[Booking Time\]/g, booking.timeSlot)
    .replace(/\[Pax Number\]/g, String(booking.pax))
    .replace(/\[Total Amount\]/g, `₹${booking.totalPayable}`)
    .replace(/\[Status\]/g, booking.status)
    .replace(/\[Booking ID\]/g, `#${booking.id.toString().padStart(4, "0")}`)
    .replace(/\[Cancel Reason\]/g, booking.cancelReason || "N/A")
    .replace(/\[GST Amount\]/g, String(gstAmount))
    .replace(/\[CGST Amount\]/g, String(cgstAmount))
    .replace(/\[SGST Amount\]/g, String(sgstAmount))
    .replace(/\[GST Summary\]/g, gstSummary);
}

const WA_SEND_OPTIONS = [
  { key: "booking_created", label: "Booking Created", color: "bg-blue-500 hover:bg-blue-600" },
  { key: "pending_confirmation", label: "Pending Payment", color: "bg-amber-500 hover:bg-amber-600" },
  { key: "booking_confirmed", label: "Confirmed ✅", color: "bg-emerald-600 hover:bg-emerald-700" },
  { key: "booking_cancelled", label: "Cancelled ❌", color: "bg-red-500 hover:bg-red-600" },
  { key: "booking_rescheduled", label: "Rescheduled 🔄", color: "bg-purple-500 hover:bg-purple-600" },
];

function getAutoTemplateKey(status: string): string {
  if (status === "confirmed") return "booking_confirmed";
  if (status === "cancelled") return "booking_cancelled";
  return "booking_created";
}

type StaffData = { id: number; fullName: string; contactNumber: string; shifts: string[] };

// ─── Cancel Reason Options ─────────────────────────────────────────────────
const CANCEL_REASONS = [
  { value: "No Availability (Sold Out)", label: "No Availability (Sold Out)" },
  { value: "Guest Cancelled", label: "Guest Cancelled" },
  { value: "Violated the Policy", label: "Violated the Policy" },
  { value: "Payment/Token Not Received", label: "Payment/Token Not Received" },
  { value: "Other", label: "Other (specify reason)" },
];

// ─── Cancel Modal ──────────────────────────────────────────────────────────
function CancelModal({
  booking,
  serviceName,
  onClose,
  onConfirm,
  isPending,
}: {
  booking: Booking;
  serviceName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [selected, setSelected] = useState<string>("");
  const [otherText, setOtherText] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const finalReason = selected === "Other" ? otherText.trim() : selected;
  const canSubmit = selected !== "" && (selected !== "Other" || otherText.trim().length > 0);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in pb-20 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border p-6 mx-0 sm:mx-4 animate-in slide-in-from-bottom-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-2xl p-2.5">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">Cancel Booking</h2>
            <p className="text-sm text-muted-foreground">
              #{booking.id.toString().padStart(4, "0")} — {serviceName}
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-2xl p-3 mb-5 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{booking.fullName}</span>
          {" · "}{booking.pax} pax{" · "}
          {format(parseISO(booking.date), "dd MMM yyyy")}{" · "}{booking.timeSlot}
        </div>

        <p className="text-sm font-semibold text-foreground mb-3">Select cancellation reason:</p>
        <div className="space-y-2 mb-4">
          {CANCEL_REASONS.map(r => (
            <button
              key={r.value}
              data-testid={`cancel-reason-${r.value.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => setSelected(r.value)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                selected === r.value
                  ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                  : "border-border bg-background hover:bg-muted text-foreground"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                selected === r.value ? "border-red-500" : "border-muted-foreground/40"
              }`}>
                {selected === r.value && <div className="w-2 h-2 rounded-full bg-red-500" />}
              </div>
              {r.label}
            </button>
          ))}
        </div>

        {selected === "Other" && (
          <textarea
            data-testid="input-cancel-other-reason"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400/40 placeholder:text-muted-foreground mb-4"
            rows={3}
            placeholder="Please specify the reason for cancellation..."
            value={otherText}
            onChange={e => setOtherText(e.target.value)}
            autoFocus
          />
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-testid="button-cancel-modal-close"
          >
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={!canSubmit || isPending}
            onClick={() => onConfirm(finalReason)}
            data-testid="button-confirm-cancel"
          >
            {isPending ? "Cancelling..." : "Cancel Booking"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Reschedule Modal ──────────────────────────────────────────────────────
function RescheduleModal({
  booking,
  serviceName,
  timeSlots,
  onClose,
  onConfirm,
  isPending,
}: {
  booking: Booking;
  serviceName: string;
  timeSlots: string[];
  onClose: () => void;
  onConfirm: (date: string, timeSlot: string) => void;
  isPending: boolean;
}) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(booking.date);
  const [selectedSlot, setSelectedSlot] = useState(booking.timeSlot);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const slots = timeSlots.length > 0 ? timeSlots : ["06:00 AM", "08:30 AM", "04:00 PM", "05:30 PM"];
  const isUnchanged = selectedDate === booking.date && selectedSlot === booking.timeSlot;
  const canSubmit = selectedDate !== "" && selectedSlot !== "" && !isUnchanged;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in pb-20 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border p-6 mx-0 sm:mx-4 animate-in slide-in-from-bottom-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-2xl p-2.5">
            <RefreshCw className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">Reschedule Booking</h2>
            <p className="text-sm text-muted-foreground">
              #{booking.id.toString().padStart(4, "0")} — {serviceName}
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-2xl p-3 mb-5 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{booking.fullName}</span>
          {" · "}{booking.pax} pax{" · "}
          <span className="line-through opacity-60">{format(parseISO(booking.date), "dd MMM yyyy")}{" · "}{booking.timeSlot}</span>
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground mb-2">New Date</p>
          <input
            type="date"
            data-testid="input-reschedule-date"
            min={todayISO}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="mb-5">
          <p className="text-sm font-semibold text-foreground mb-2">New Time Slot</p>
          <div className="grid grid-cols-2 gap-2">
            {slots.map(slot => (
              <button
                key={slot}
                data-testid={`slot-${slot.replace(/\s+/g, "-").toLowerCase()}`}
                onClick={() => setSelectedSlot(slot)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  selectedSlot === slot
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted text-foreground"
                }`}
              >
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                {slot}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-testid="button-reschedule-cancel"
          >
            Keep Original
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!canSubmit || isPending}
            onClick={() => onConfirm(selectedDate, selectedSlot)}
            data-testid="button-reschedule-confirm"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            {isPending ? "Saving…" : "Reschedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Booking Modal (with staff picker + bank account selector) ────────
function ConfirmBookingModal({
  booking,
  serviceName,
  staffs,
  onClose,
  onConfirm,
  isPending,
}: {
  booking: Booking;
  serviceName: string;
  staffs: StaffData[];
  onClose: () => void;
  onConfirm: (staffId: number | null) => void;
  isPending: boolean;
}) {
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);

  const { data: accountHeads = [] } = useQuery<{ id: number; name: string; type: string; bookingMapping: string }[]>({
    queryKey: ["/api/accounting/heads"],
  });
  // Accounts that will auto-record on confirm
  const mappedAccounts = accountHeads.filter(
    (h) => (h.type === "bank" || h.type === "cash") && h.bookingMapping && h.bookingMapping !== "none"
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in pb-20 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border mx-0 sm:mx-4 animate-in slide-in-from-bottom-4 flex flex-col"
        style={{ maxHeight: "min(90dvh, 90vh)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed header */}
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl p-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Confirm Booking</h2>
              <p className="text-sm text-muted-foreground">#{booking.id.toString().padStart(4, "0")} — {serviceName}</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-2xl p-3 mb-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{booking.fullName}</span>
            {" · "}{booking.pax} pax{" · "}
            {format(parseISO(booking.date), "dd MMM yyyy")}{" · "}{booking.timeSlot}
          </div>

          <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-primary" /> Assign Contact Staff <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </p>
        </div>

        {/* Scrollable content — overscroll-contain stops page scroll bleeding through */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-2 min-h-0">
          <div className="space-y-2">
            <button
              onClick={() => setSelectedStaff(null)}
              className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${selectedStaff === null ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedStaff === null ? "border-primary" : "border-muted-foreground/40"}`}>
                {selectedStaff === null && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              No staff assigned
            </button>
            {staffs.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStaff(s.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${selectedStaff === s.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedStaff === s.id ? "border-primary" : "border-muted-foreground/40"}`}>
                  {selectedStaff === s.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{s.fullName}</p>
                  <p className="text-xs text-muted-foreground">{s.contactNumber}{s.shifts.length > 0 ? ` · ${s.shifts.join(", ")}` : ""}</p>
                </div>
              </button>
            ))}
            {staffs.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No staff added yet. Add staff from Settings → Staffs.</p>
            )}
          </div>

          {/* Auto-mapping summary */}
          {mappedAccounts.length > 0 && (
            <div className="mt-4 border-t border-border pt-4 space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Landmark className="w-4 h-4 text-primary" /> Auto-Ledger Entries
              </p>
              <p className="text-xs text-muted-foreground">The following entries will be recorded automatically:</p>
              <div className="space-y-1.5">
                {mappedAccounts.map(acc => {
                  const wantsToken   = acc.bookingMapping === "token"   || acc.bookingMapping === "both";
                  const wantsBalance = acc.bookingMapping === "balance" || acc.bookingMapping === "both";
                  const icon = acc.type === "bank" ? <Landmark className="w-3.5 h-3.5 flex-shrink-0" /> : <Wallet className="w-3.5 h-3.5 flex-shrink-0" />;
                  const amounts: string[] = [];
                  if (wantsToken && booking.amountPaid > 0)  amounts.push(`Token ₹${booking.amountPaid.toLocaleString("en-IN")}`);
                  if (wantsBalance && booking.balance > 0)   amounts.push(`Balance ₹${booking.balance.toLocaleString("en-IN")}`);
                  if (amounts.length === 0) return null;
                  return (
                    <div key={acc.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm">
                      {icon}
                      <span className="font-medium text-foreground">{acc.name}</span>
                      <span className="text-muted-foreground text-xs">← {amounts.join(" + ")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Fixed footer — always visible at bottom */}
        <div className="px-6 py-4 flex-shrink-0 border-t border-border bg-card rounded-b-3xl sm:rounded-b-3xl">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onConfirm(selectedStaff)}
              disabled={isPending}
              data-testid="button-confirm-booking-final"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> {isPending ? "Confirming…" : "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Card ──────────────────────────────────────────────────────────
function BookingCard({
  booking,
  serviceName,
  categoryName,
  isAdmin,
  onCancelClick,
  onConfirmClick,
  onRescheduleClick,
  confirmPending,
  staff,
  highlighted,
  waNumber,
  waTemplates,
  metaApiConfigured,
  earnedCoupon,
  couponPending,
  manualReminder,
}: {
  booking: Booking;
  serviceName: string;
  categoryName?: string | null;
  isAdmin: boolean;
  onCancelClick?: (b: Booking) => void;
  onConfirmClick?: (b: Booking) => void;
  onRescheduleClick?: (b: Booking) => void;
  confirmPending?: boolean;
  staff?: StaffData | null;
  highlighted?: boolean;
  waNumber?: string;
  waTemplates?: Record<string, string>;
  metaApiConfigured?: boolean;
  earnedCoupon?: any;
  couponPending?: boolean;
  manualReminder?: BookingManualReminder | null;
}) {
  const isCancelled = booking.status === "cancelled";
  const isPending = booking.status === "pending";
  const isConfirmed = booking.status === "confirmed";
  const isCompleted = booking.status === "completed";
  const cardRef = useRef<HTMLDivElement>(null);
  const [showWaMenu, setShowWaMenu] = useState(false);
  const [gstExpanded, setGstExpanded] = useState(false);
  const cardQueryClient = useQueryClient();
  const { toast } = useToast();
  const { data: paymentSettings } = usePaymentSettings();

  const scheduleReminderMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/manual-reminders", { bookingId: booking.id }),
    onSuccess: () => {
      cardQueryClient.invalidateQueries({ queryKey: ["/api/manual-reminders"] });
      toast({ title: "Reminder scheduled", description: "WhatsApp reminder will be sent in 1 hour." });
    },
    onError: (e: any) => toast({ title: "Failed to schedule reminder", description: e.message, variant: "destructive" }),
  });
  const sendWaMutation = useMutation({
    mutationFn: async ({ to, message }: { to: string; message: string }) => {
      const res = await apiRequest("POST", "/api/whatsapp-send", { to, message });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to send"); }
      return res.json();
    },
    onSuccess: () => toast({ title: "WhatsApp message sent successfully." }),
    onError: (e: any) => toast({ title: "Failed to send", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  return (
    <div
      ref={cardRef}
      data-testid={`card-booking-${booking.id}`}
      className={`bg-card rounded-2xl p-5 border shadow-sm transition-all relative overflow-hidden ${
        highlighted
          ? "border-primary ring-2 ring-primary/30 shadow-lg"
          : isCancelled
          ? "border-red-200 dark:border-red-800/50 opacity-80"
          : isPending
          ? "border-amber-300 dark:border-amber-700/50 hover:shadow-md"
          : isCompleted
          ? "border-indigo-200 dark:border-indigo-800/50 opacity-90 hover:shadow-md"
          : "border-border hover:shadow-md"
      }`}
    >
      {/* Status badge */}
      <div
        className={`absolute top-0 right-0 text-white text-xs font-bold px-3 py-1 rounded-bl-xl ${
          isCancelled ? "bg-red-500" : isPending ? "bg-amber-500" : isCompleted ? "bg-indigo-500" : "bg-emerald-500"
        }`}
        data-testid={`status-booking-${booking.id}`}
      >
        {isCancelled ? "CANCELLED" : isPending ? "PENDING" : isCompleted ? "COMPLETED" : "CONFIRMED"}
      </div>

      {/* Boarding pass icon + bell reminder — confirmed only, stacked below status badge */}
      {isConfirmed && paymentSettings && (
        <div className="absolute top-8 right-2 flex flex-col items-center gap-1" onClick={e => e.stopPropagation()}>
          <DownloadBoardingPassButton
            iconOnly
            data={{
              booking,
              serviceName,
              staffName: staff?.fullName ?? null,
              staffContact: staff?.contactNumber ?? null,
              paymentSettings: paymentSettings as any,
            }}
          />
          {isAdmin && (
            <button
              data-testid={`button-bell-reminder-${booking.id}`}
              disabled={scheduleReminderMutation.isPending || !!manualReminder}
              onClick={() => { if (!manualReminder) scheduleReminderMutation.mutate(); }}
              title={
                manualReminder?.isSent
                  ? "Reminder sent"
                  : manualReminder
                  ? `Reminder scheduled for ${new Date(manualReminder.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                  : "Schedule 1-hour WhatsApp reminder"
              }
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${
                manualReminder?.isSent
                  ? "bg-emerald-500/10 border-emerald-400/40 text-emerald-600 cursor-default"
                  : manualReminder
                  ? "bg-amber-500/15 border-amber-400/50 text-amber-600 cursor-default animate-pulse"
                  : "bg-card border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              }`}
            >
              {manualReminder?.isSent
                ? <Bell className="w-3.5 h-3.5" />
                : manualReminder
                ? <BellRing className="w-3.5 h-3.5" />
                : <Bell className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )}

      {categoryName && (
        <div className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-lg mb-2" data-testid={`tag-category-${booking.id}`}>
          <Tag className="w-3 h-3" />
          {categoryName}
        </div>
      )}
      <h3 className="text-base font-bold font-display text-primary mb-0.5 pr-24">
        {serviceName}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Ticket ID: #{booking.id.toString().padStart(4, "0")}
      </p>

      {(() => {
        const isNight = booking.timeSlot?.startsWith("Check-in:");
        const nightMatch = isNight ? booking.timeSlot.match(/Check-in:\s*(.+?)\s*→\s*Check-out:\s*(.+?)\s*\(/) : null;
        const checkIn = nightMatch ? nightMatch[1].trim() : null;
        const checkOut = nightMatch ? nightMatch[2].trim() : null;
        return (
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-3 text-sm font-medium">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              {isNight && checkIn && checkOut ? (
                <p className="text-foreground">{format(parseISO(booking.date), "MMMM do, yyyy")}</p>
              ) : (
                <p className="text-foreground flex items-center gap-1.5 flex-wrap">
                  {format(parseISO(booking.date), "MMMM do, yyyy")}
                  <span className="text-muted-foreground">|</span>
                  <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{booking.timeSlot}</span>
                </p>
              )}
            </div>

            {isNight && checkIn && checkOut && (
              <>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground leading-none mb-0.5">Check-in</p>
                    <p className="text-foreground">{checkIn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground leading-none mb-0.5">Check-out</p>
                    <p className="text-foreground">{checkOut}</p>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 text-sm font-medium">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-foreground flex items-center gap-1.5 flex-wrap">
                {booking.pax} PAX
                <span className="text-muted-foreground">|</span>
                <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span>{booking.fullName}</span>
              </p>
            </div>

            {isAdmin && (
              <>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">{booking.contactNumber}</p>
                </div>
                {booking.email && (
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">{booking.email}</p>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="bg-muted p-2 rounded-lg text-center">
          <p className="text-muted-foreground text-xs mb-0.5">Paid</p>
          <p className="font-bold text-emerald-600">₹{booking.amountPaid}</p>
        </div>
        <div className="bg-secondary/50 p-2 rounded-lg text-center border border-secondary">
          <p className="text-muted-foreground text-xs mb-0.5">Balance Due</p>
          <p className="font-bold text-foreground">₹{booking.balance}</p>
        </div>
      </div>
      {/* Coupon applied */}
      {booking.couponCode && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-3 py-2 mb-3">
          <Ticket className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Coupon Applied: </span>
            <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300">{booking.couponCode}</span>
          </div>
          {booking.couponDiscount != null && booking.couponDiscount > 0 && (
            <span className="text-xs font-bold text-emerald-600 flex-shrink-0">-₹{booking.couponDiscount}</span>
          )}
        </div>
      )}

      {/* GST breakdown — collapsed by default */}
      {(booking.gstAmount ?? 0) > 0 && (
        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700/40 rounded-xl mb-3 overflow-hidden">
          <button
            data-testid="button-toggle-gst"
            onClick={() => setGstExpanded(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-left"
          >
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">GST Breakdown</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-sky-700 dark:text-sky-400">₹{(booking.gstAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              {gstExpanded
                ? <ChevronUp className="w-3.5 h-3.5 text-sky-500" />
                : <ChevronDown className="w-3.5 h-3.5 text-sky-500" />}
            </div>
          </button>
          {gstExpanded && (
            <div className="px-3 pb-2 border-t border-sky-200 dark:border-sky-700/40 pt-1.5">
              <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                <span>CGST</span>
                <span className="font-medium text-foreground">₹{(booking.cgstAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                <span>SGST</span>
                <span className="font-medium text-foreground">₹{(booking.sgstAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-sky-700 dark:text-sky-400 border-t border-sky-200 dark:border-sky-700/40 pt-1 mt-1">
                <span>Total GST</span>
                <span>₹{(booking.gstAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {(booking as any).transactionId && (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl px-3 py-2 mb-3">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0">Txn ID:</span>
          <span className="text-xs font-mono font-bold text-blue-800 dark:text-blue-300 tracking-widest">{(booking as any).transactionId}</span>
        </div>
      )}

      {/* Contact Person + Boarding Location — one row */}
      {(staff || (isConfirmed && paymentSettings?.boardingLocation)) && (
        <div className="flex gap-2 mb-3">
          {staff && (
            <div className={`flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2 ${isConfirmed && paymentSettings?.boardingLocation ? "flex-1 min-w-0" : "w-full"}`}>
              <UserCog className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary leading-none">Assistant</p>
                <p className="text-xs font-medium text-foreground mt-0.5 truncate">{staff.fullName}</p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <a
                  href={`tel:${staff.contactNumber}`}
                  onClick={e => e.stopPropagation()}
                  className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                  title={`Call ${staff.fullName}`}
                  data-testid={`link-call-staff-${staff.id}`}
                >
                  <Phone className="w-3 h-3 text-primary" />
                </a>
                <a
                  href={toWhatsAppLink(staff.contactNumber, staff.fullName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="w-6 h-6 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                  title={`WhatsApp ${staff.fullName}`}
                  data-testid={`link-whatsapp-staff-${staff.id}`}
                >
                  <SiWhatsapp className="w-3 h-3 text-emerald-500" />
                </a>
              </div>
            </div>
          )}
          {isConfirmed && paymentSettings?.boardingLocation && (
            <div className={`flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl px-3 py-2 ${staff ? "flex-1 min-w-0" : "w-full"}`}>
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 leading-none">Boarding Location</p>
                {paymentSettings.boardingLocation.startsWith("http") ? (
                  <a
                    href={paymentSettings.boardingLocation}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2 mt-0.5 block truncate"
                    data-testid="link-boarding-location"
                  >
                    Tap to Open
                  </a>
                ) : (
                  <p className="text-xs font-medium text-foreground mt-0.5 truncate">{paymentSettings.boardingLocation}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {!isAdmin && (staff || (isConfirmed && paymentSettings?.boardingLocation)) && (
        <p className="text-[11px] text-muted-foreground text-center mb-3 -mt-1">
          For cancellation &amp; rescheduling, please contact your assistant.
        </p>
      )}

      {/* Cancellation reason */}
      {isCancelled && booking.cancelReason && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-3 py-2.5 mb-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">Cancellation Reason</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{booking.cancelReason}</p>
          </div>
        </div>
      )}

      {/* Coupon pending banner (non-admin, confirmed/pending, no coupon yet) */}
      {!isAdmin && couponPending && !earnedCoupon && (isPending || isConfirmed) && (
        <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5 mb-3 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/30">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-900/30">
            <Ticket className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5 text-amber-700 dark:text-amber-300">Coupon Reward Pending</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Your coupon will be available once your trip is complete!</p>
          </div>
          <span className="text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full flex-shrink-0">Soon</span>
        </div>
      )}

      {/* Earned coupon (non-admin) */}
      {!isAdmin && earnedCoupon && (
        <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 mb-3 ${
          !earnedCoupon.isActive
            ? "bg-muted/30 border-border opacity-60"
            : earnedCoupon.isUsed
            ? "bg-muted/40 border-border opacity-60"
            : "bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-700/40"
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${!earnedCoupon.isActive || earnedCoupon.isUsed ? "bg-muted" : "bg-amber-100 dark:bg-amber-900/30"}`}>
            <Ticket className={`w-4 h-4 ${!earnedCoupon.isActive || earnedCoupon.isUsed ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${!earnedCoupon.isActive || earnedCoupon.isUsed ? "text-muted-foreground" : "text-amber-700 dark:text-amber-300"}`}>
              {!earnedCoupon.isActive ? "Coupon Cancelled" : earnedCoupon.isUsed ? "Coupon Used" : "New Earned Coupon"}
            </p>
            <p className={`text-sm font-bold font-mono tracking-wider ${!earnedCoupon.isActive ? "line-through text-muted-foreground" : earnedCoupon.isUsed ? "text-muted-foreground" : "text-amber-800 dark:text-amber-200"}`}>
              {earnedCoupon.code}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {earnedCoupon.discountType === "percentage" ? `${earnedCoupon.discountValue}% off` : `₹${earnedCoupon.discountValue} off`}
              {!earnedCoupon.isUsed && earnedCoupon.isActive && ` · valid till ${format(new Date(earnedCoupon.expiresAt), "dd MMM yyyy")}`}
            </p>
          </div>
          {!earnedCoupon.isUsed && earnedCoupon.isActive && (
            <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full flex-shrink-0">Active</span>
          )}
        </div>
      )}

      {/* Admin action buttons */}
      {isAdmin && !isCancelled && (
        <div className="flex flex-col gap-2">
          {isPending && onConfirmClick && (
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onConfirmClick(booking)}
              disabled={confirmPending}
              data-testid={`button-confirm-booking-${booking.id}`}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {confirmPending ? "Confirming…" : "Confirm Payment"}
            </Button>
          )}
          <div className="flex gap-2">
            {onRescheduleClick && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                onClick={() => onRescheduleClick(booking)}
                data-testid={`button-reschedule-booking-${booking.id}`}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" /> Reschedule
              </Button>
            )}
            {onCancelClick && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => onCancelClick(booking)}
                data-testid={`button-cancel-booking-${booking.id}`}
              >
                <XCircle className="w-4 h-4 mr-1.5" /> Cancel
              </Button>
            )}
          </div>
        </div>
      )}


      {/* WhatsApp send update (admin only) */}
      {isAdmin && waNumber && waTemplates && (() => {
        const autoKey = getAutoTemplateKey(booking.status);
        const autoOpt = WA_SEND_OPTIONS.find(o => o.key === autoKey)!;
        const autoTemplate = waTemplates[autoKey];
        const autoMessage = autoTemplate ? renderWaTemplate(autoTemplate, booking, serviceName) : "";
        const autoLink = autoMessage ? toCustomerWaLink(booking.contactNumber, autoMessage) : "";
        return (
          <div className="mt-3 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              {autoMessage && (metaApiConfigured ? (
                <button
                  onClick={() => sendWaMutation.mutate({ to: booking.contactNumber, message: autoMessage })}
                  disabled={sendWaMutation.isPending}
                  data-testid={`button-wa-auto-${booking.id}`}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-colors disabled:opacity-60 ${autoOpt.color}`}
                >
                  <SiWhatsapp className="w-3.5 h-3.5 flex-shrink-0" />
                  {sendWaMutation.isPending ? "Sending..." : `Send ${autoOpt.label}`}
                </button>
              ) : (
                <a
                  href={autoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`link-wa-auto-${booking.id}`}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-colors ${autoOpt.color}`}
                >
                  <SiWhatsapp className="w-3.5 h-3.5 flex-shrink-0" />
                  Send {autoOpt.label}
                </a>
              ))}
              <button
                onClick={() => setShowWaMenu(v => !v)}
                data-testid={`button-wa-menu-${booking.id}`}
                className="flex items-center gap-1 px-3 py-2 bg-muted border border-border rounded-xl text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                More
                {showWaMenu ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            {showWaMenu && (
              <div className="mt-2 space-y-1.5">
                {WA_SEND_OPTIONS.filter(o => o.key !== autoKey).map(opt => {
                  const template = waTemplates[opt.key];
                  if (!template) return null;
                  const message = renderWaTemplate(template, booking, serviceName);
                  const link = toCustomerWaLink(booking.contactNumber, message);
                  return metaApiConfigured ? (
                    <button
                      key={opt.key}
                      onClick={() => sendWaMutation.mutate({ to: booking.contactNumber, message })}
                      disabled={sendWaMutation.isPending}
                      data-testid={`button-wa-send-${opt.key}-${booking.id}`}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-white text-xs font-semibold transition-colors disabled:opacity-60 ${opt.color}`}
                    >
                      <SiWhatsapp className="w-3.5 h-3.5 flex-shrink-0" />
                      {opt.label}
                    </button>
                  ) : (
                    <a
                      key={opt.key}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`link-wa-send-${opt.key}-${booking.id}`}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-white text-xs font-semibold transition-colors ${opt.color}`}
                    >
                      <SiWhatsapp className="w-3.5 h-3.5 flex-shrink-0" />
                      {opt.label}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Stats Strip (Admin only) ────────────────────────────────────────────────
function BookingStats({
  allBookings,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  showFinancials,
  setShowFinancials,
}: {
  allBookings: Booking[];
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  dateFilter: string;
  setDateFilter: (f: string) => void;
  showFinancials: boolean;
  setShowFinancials: (v: boolean | ((prev: boolean) => boolean)) => void;
}) {

  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(today.getDate() + 1);
  const tomorrowISO = tomorrowDate.toISOString().slice(0, 10);

  const confirmed = allBookings.filter(b => b.status === "confirmed");
  const pending = allBookings.filter(b => b.status === "pending");
  const cancelled = allBookings.filter(b => b.status === "cancelled");
  const completed = allBookings.filter(b => b.status === "completed");

  const todayCount = allBookings.filter(b => b.date === todayISO).length;
  const tomorrowCount = allBookings.filter(b => b.date === tomorrowISO).length;
  const monthCount = allBookings.filter(b => {
    try { return isThisMonth(parseISO(b.date)); } catch { return false; }
  }).length;
  const allTimeCount = allBookings.length;

  const tokensReceived = [...pending, ...confirmed].reduce((sum, b) => sum + (b.amountPaid ?? 0), 0);
  const balancePending = [...pending, ...confirmed].reduce((sum, b) => sum + (b.balance ?? 0), 0);
  const totalCollection = confirmed.reduce((sum, b) => sum + (b.totalPayable ?? 0), 0);

  const statusCards = [
    {
      label: "Pending",
      count: pending.length,
      key: "pending",
      idle: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
      active: "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200 dark:shadow-amber-900/30",
      icon: <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />,
    },
    {
      label: "Confirmed",
      count: confirmed.length,
      key: "confirmed",
      idle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
      active: "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30",
      icon: <CheckCircle2 className="w-3.5 h-3.5 opacity-70 shrink-0" />,
    },
    {
      label: "Completed",
      count: completed.length,
      key: "completed",
      idle: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20",
      active: "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30",
      icon: <BadgeCheck className="w-3.5 h-3.5 opacity-70 shrink-0" />,
    },
    {
      label: "Cancelled",
      count: cancelled.length,
      key: "cancelled",
      idle: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20",
      active: "bg-red-500 text-white border-red-600 shadow-md shadow-red-200 dark:shadow-red-900/30",
      icon: <XCircle className="w-3.5 h-3.5 opacity-70 shrink-0" />,
    },
  ];

  const dateCards = [
    { label: "Today", count: todayCount, key: "today", idle: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20", active: "bg-primary text-primary-foreground border-primary shadow-md" },
    { label: "Tomorrow", count: tomorrowCount, key: "tomorrow", idle: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20", active: "bg-cyan-600 text-white border-cyan-700 shadow-md shadow-cyan-200 dark:shadow-cyan-900/30" },
    { label: "This Month", count: monthCount, key: "this_month", idle: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20", active: "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200 dark:shadow-amber-900/30" },
    { label: "All Time", count: allTimeCount, key: "all", idle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20", active: "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30" },
  ];

  return (
    <div className="space-y-2 mb-5">
      {/* Row 1: Financial stats (collapsible) */}
      {showFinancials && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 p-3 text-center" data-testid="stat-tokens-received">
              <div className="flex items-center justify-center gap-0.5 mb-1">
                <IndianRupee className="w-3.5 h-3.5" />
                <p className="text-xl font-bold leading-none">{tokensReceived.toLocaleString("en-IN")}</p>
              </div>
              <p className="text-[10px] font-semibold opacity-80 uppercase tracking-wide">Tokens Received</p>
            </div>
            <div className="rounded-2xl border bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 p-3 text-center" data-testid="stat-bal-pending">
              <div className="flex items-center justify-center gap-0.5 mb-1">
                <IndianRupee className="w-3.5 h-3.5" />
                <p className="text-xl font-bold leading-none">{balancePending.toLocaleString("en-IN")}</p>
              </div>
              <p className="text-[10px] font-semibold opacity-80 uppercase tracking-wide">Bal. Pending</p>
            </div>
            <div className="rounded-2xl border bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20 p-3 text-center" data-testid="stat-collection">
              <div className="flex items-center justify-center gap-0.5 mb-1">
                <IndianRupee className="w-3.5 h-3.5" />
                <p className="text-xl font-bold leading-none">{totalCollection.toLocaleString("en-IN")}</p>
              </div>
              <p className="text-[10px] font-semibold opacity-80 uppercase tracking-wide">Total Collection</p>
            </div>
          </div>
        )}
      {/* Row 2: Status filter cards */}
      <div className="grid grid-cols-4 gap-2">
        {statusCards.map(({ label, count, key, idle, active, icon }) => {
          const isActive = statusFilter === key;
          return (
            <button
              key={key}
              data-testid={`filter-status-${key}`}
              onClick={() => setStatusFilter(isActive ? "all" : key)}
              className={`rounded-xl border py-2 px-1.5 text-center transition-all cursor-pointer ${isActive ? active : idle}`}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5">
                {icon}
                <p className="text-[9px] font-semibold opacity-80 uppercase tracking-wide leading-none">{label}</p>
              </div>
              <p className="text-xl font-bold leading-none">{count}</p>
            </button>
          );
        })}
      </div>
      {/* Row 3: Date shortcut cards */}
      <div className="grid grid-cols-4 gap-2">
        {dateCards.map(({ label, count, key, idle, active }) => {
          const isActive = dateFilter === key;
          return (
            <button
              key={key}
              data-testid={`stat-${key}`}
              onClick={() => setDateFilter(isActive ? "all" : key)}
              className={`rounded-xl border py-2 px-1.5 text-center transition-all cursor-pointer ${isActive ? active : idle}`}
            >
              <p className="text-xl font-bold leading-none mb-0.5">{count}</p>
              <p className="text-[9px] font-semibold opacity-80 uppercase tracking-wide">{label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Date Filter Bar ────────────────────────────────────────────────────────
type DateFilter = "today" | "all" | string;

const STAT_FILTER_KEYS = new Set(["today", "tomorrow", "this_month", "all", "range"]);

function BookingCalendar({
  allBookings,
  filter,
  onSelectDate,
}: {
  allBookings: Booking[];
  filter: DateFilter;
  onSelectDate: (iso: string) => void;
}) {
  const initialMonth = useMemo(() => {
    if (filter && !STAT_FILTER_KEYS.has(filter)) {
      try { return parseISO(filter); } catch { /* */ }
    }
    return new Date();
  }, []);

  const [viewDate, setViewDate] = useState<Date>(initialMonth);

  const dateStatusMap = useMemo(() => {
    const map: Record<string, "pending" | "confirmed" | "both"> = {};
    for (const b of allBookings) {
      if (b.status !== "pending" && b.status !== "confirmed") continue;
      const existing = map[b.date];
      if (!existing) {
        map[b.date] = b.status as "pending" | "confirmed";
      } else if (existing !== b.status) {
        map[b.date] = "both";
      }
    }
    return map;
  }, [allBookings]);

  const todayISO = new Date().toISOString().slice(0, 10);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfWeek + 6) % 7;

  const toISO = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg p-4 mb-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          data-testid="cal-prev-month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm">{format(viewDate, "MMMM yyyy")}</span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          data-testid="cal-next-month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1 uppercase tracking-wide">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISO(d);
          const status = dateStatusMap[iso];
          const isSelected = filter === iso;
          const isToday = iso === todayISO;

          let cellCls = "hover:bg-muted text-foreground";
          if (isSelected) {
            cellCls = "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-card";
          } else if (status === "confirmed") {
            cellCls = "bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-500/40";
          } else if (status === "pending" || status === "both") {
            cellCls = "bg-amber-500/25 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-500/40";
          }

          return (
            <button
              key={iso}
              data-testid={`cal-day-${iso}`}
              onClick={() => onSelectDate(iso)}
              className={`relative aspect-square rounded-lg flex items-center justify-center text-xs transition-all ${cellCls} ${isToday && !isSelected ? "ring-1 ring-primary/60" : ""}`}
            >
              {d}
              {status && !isSelected && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${status === "confirmed" ? "bg-emerald-500" : "bg-amber-500"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 inline-block" /> Confirmed
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60 inline-block" /> Pending
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full border border-primary/60 inline-block" /> Today
        </span>
      </div>
    </div>
  );
}

function DateFilterBar({
  allBookings,
  filter,
  setFilter,
  rangeFrom,
  rangeTo,
  setRangeFrom,
  setRangeTo,
}: {
  allBookings: Booking[];
  filter: DateFilter;
  setFilter: (f: DateFilter) => void;
  rangeFrom: string;
  rangeTo: string;
  setRangeFrom: (v: string) => void;
  setRangeTo: (v: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showRange, setShowRange] = useState(filter === "range");

  const isSpecialFilter = STAT_FILTER_KEYS.has(filter);
  const isPickedDate = !isSpecialFilter;

  const handleRangeClear = () => {
    setRangeFrom("");
    setRangeTo("");
    setFilter("all");
    setShowRange(false);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <button
          data-testid="filter-today"
          onClick={() => { setFilter("today"); setShowPicker(false); setShowRange(false); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            filter === "today"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-foreground hover:bg-muted"
          }`}
        >
          Today
        </button>
        <button
          data-testid="filter-all"
          onClick={() => { setFilter("all"); setShowPicker(false); setShowRange(false); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-foreground hover:bg-muted"
          }`}
        >
          All Dates
        </button>
        <button
          data-testid="filter-date-range"
          onClick={() => {
            const willClose = showRange;
            setShowRange(v => !v);
            setShowPicker(false);
            if (!showRange) {
              setFilter("range");
            } else if (willClose && !rangeFrom && !rangeTo) {
              setFilter("all");
            }
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-1.5 ${
            filter === "range" || showRange
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-foreground hover:bg-muted"
          }`}
        >
          <Calendar className="w-4 h-4" />
          {filter === "range" && !showRange && (rangeFrom || rangeTo)
            ? (rangeFrom && rangeTo
                ? `${format(parseISO(rangeFrom), "dd MMM")} – ${format(parseISO(rangeTo), "dd MMM")}`
                : rangeFrom
                ? `From ${format(parseISO(rangeFrom), "dd MMM")}`
                : `Until ${format(parseISO(rangeTo!), "dd MMM")}`)
            : "Date Range"}
          {showRange ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <button
          data-testid="filter-pick-date"
          onClick={() => { setShowPicker(v => !v); setShowRange(false); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-1.5 ${
            isPickedDate || showPicker
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-foreground hover:bg-muted"
          }`}
        >
          <Calendar className="w-4 h-4" />
          {isPickedDate ? format(parseISO(filter), "dd MMM yyyy") : "Pick Date"}
          {showPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showRange && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-2 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-xs font-semibold text-muted-foreground">From</label>
            <input
              type="date"
              data-testid="input-range-from"
              value={rangeFrom}
              max={rangeTo || undefined}
              onChange={e => {
                setRangeFrom(e.target.value);
                setFilter("range");
              }}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-xs font-semibold text-muted-foreground">To</label>
            <input
              type="date"
              data-testid="input-range-to"
              value={rangeTo}
              min={rangeFrom || undefined}
              onChange={e => {
                setRangeTo(e.target.value);
                setFilter("range");
              }}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            data-testid="button-range-clear"
            onClick={handleRangeClear}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-border bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all whitespace-nowrap"
          >
            Clear Range
          </button>
        </div>
      )}

      {showPicker && (
        <BookingCalendar
          allBookings={allBookings}
          filter={filter}
          onSelectDate={(iso) => { setFilter(iso); setShowPicker(false); }}
        />
      )}
    </div>
  );
}

// ─── WhatsApp Queue Panel ──────────────────────────────────────────────────
const TEMPLATE_KEY_LABELS: Record<string, { label: string; color: string }> = {
  booking_created: { label: "Booking Created", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  pending_confirmation: { label: "Pending Payment", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  booking_confirmed: { label: "Confirmed", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  booking_cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
  booking_rescheduled: { label: "Rescheduled", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" },
};

function WaQueuePanel({ queue, waNumber, onMarkSent }: {
  queue: any[];
  waNumber: string;
  onMarkSent: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const openWaAndMark = (item: any) => {
    const digits = item.customerPhone.replace(/\D/g, "");
    const number = digits.startsWith("91") && digits.length === 12 ? digits : digits.length === 10 ? `91${digits}` : digits;
    const link = `https://wa.me/${number}?text=${encodeURIComponent(item.message)}`;
    window.open(link, "_blank");
    onMarkSent(item.id);
  };

  return (
    <div className="rounded-2xl border border-green-500/30 bg-green-500/5 overflow-hidden mb-6">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-green-500/10 transition-colors"
        data-testid="button-toggle-wa-queue"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center">
            <MessageCircleMore className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-bold text-sm text-green-700 dark:text-green-400">WhatsApp Queue</p>
            <p className="text-xs text-muted-foreground">{queue.length} message{queue.length !== 1 ? "s" : ""} pending to send</p>
          </div>
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold">
            {queue.length}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {queue.map((item: any) => {
            const meta = TEMPLATE_KEY_LABELS[item.templateKey] ?? { label: item.templateKey, color: "bg-muted text-muted-foreground border-border" };
            return (
              <div key={item.id} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3" data-testid={`wa-queue-item-${item.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-sm text-foreground">{item.customerName}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.message.split("\n")[0]}</p>
                </div>
                <button
                  onClick={() => openWaAndMark(item)}
                  disabled={!waNumber}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                  data-testid={`button-wa-queue-send-${item.id}`}
                >
                  <SiWhatsapp className="w-3.5 h-3.5" /> Send
                </button>
              </div>
            );
          })}
          {!waNumber && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400 py-2">
              Set your WhatsApp number in Settings → WhatsApp Messages to enable sending.
            </p>
          )}
        </div>
      )}
    </div>
  );
}


// ─── Main Page ─────────────────────────────────────────────────────────────
export default function Bookings() {
  const { user, isLoading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const highlightId = useMemo(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const v = params.get("highlight");
    return v ? parseInt(v) : null;
  }, [location]);

  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const { data: services } = useServices();
  const { data: staffs = [] } = useQuery<StaffData[]>({ queryKey: ["/api/staffs"] });
  const { data: pagePaymentSettings } = usePaymentSettings();
  const { data: waSettings } = useQuery<any>({ queryKey: ["/api/whatsapp-settings"] });
  const { data: waTemplatesData = [] } = useQuery<any[]>({ queryKey: ["/api/whatsapp-templates"] });
  const waTemplateMap = useMemo(() => {
    const map: Record<string, string> = {};
    (waTemplatesData as any[]).forEach((t: any) => { map[t.status] = t.template; });
    return map;
  }, [waTemplatesData]);
  const waNumber = waSettings?.enabled ? (waSettings?.adminNumber || "") : "";
  const metaApiConfigured = !!(waSettings?.metaPhoneNumberId && waSettings?.metaAccessToken);
  const queryClient = useQueryClient();
  const { data: manualReminders = [] } = useQuery<BookingManualReminder[]>({
    queryKey: ["/api/manual-reminders"],
    enabled: !!user?.isAdmin,
    refetchInterval: 60000,
  });
  const manualReminderByBooking = useMemo(() => {
    const map = new Map<number, BookingManualReminder>();
    (manualReminders as BookingManualReminder[]).forEach(r => map.set(r.bookingId, r));
    return map;
  }, [manualReminders]);

  const { data: waQueue = [], isLoading: queueLoading } = useQuery<any[]>({
    queryKey: ["/api/whatsapp-queue"],
    enabled: !!user?.isAdmin,
    refetchInterval: 30000,
  });
  const { mutate: markWaSent } = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/whatsapp-queue/${id}/sent`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-queue"] }),
  });

  const { data: myCoupons = [] } = useQuery<any[]>({ queryKey: ["/api/coupons/my"], enabled: !!user && !user.isAdmin });
  const { data: couponSettings } = useQuery<any>({ queryKey: ["/api/coupon-settings"], enabled: !!user && !user.isAdmin });
  const getEarnedCoupon = (bookingId: number) => (myCoupons as any[]).find(c => c.earnedFromBookingId === bookingId);
  const couponPendingEnabled = !!(couponSettings?.bookingCouponEnabled);

  const { mutate: cancelBooking, isPending: cancelling } = useCancelBooking();
  const { mutate: confirmBooking, isPending: confirming, variables: confirmingVars } = useConfirmBooking();
  const { mutate: rescheduleBooking, isPending: rescheduling } = useRescheduleBooking();

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [rangeFrom, setRangeFrom] = useState<string>("");
  const [rangeTo, setRangeTo] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [cancelledExpanded, setCancelledExpanded] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFinancials, setShowFinancials] = useState(false);
  const [gstFilter, setGstFilter] = useState(false);

  const { data: categories = [] } = useQuery<{ id: number; name: string }[]>({ queryKey: ["/api/categories"] });

  const isAdmin = !!user?.isAdmin;
  const todayISO = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [user, authLoading, setLocation]);

  const getServiceCategoryId = (serviceId: number | null): number | null =>
    (services?.find(s => s.id === serviceId) as any)?.categoryId ?? null;

  const getCategoryName = (serviceId: number | null): string | null => {
    const catId = getServiceCategoryId(serviceId);
    if (!catId) return null;
    return categories.find(c => c.id === catId)?.name ?? null;
  };

  const tomorrowISO = (() => {
    const d = new Date(todayISO);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const filterDateLabel =
    dateFilter === "today" ? "today"
    : dateFilter === "tomorrow" ? "tomorrow"
    : dateFilter === "this_month" ? "this month"
    : dateFilter === "range"
      ? (rangeFrom && rangeTo ? `${format(parseISO(rangeFrom), "dd MMM")} – ${format(parseISO(rangeTo), "dd MMM")}` : rangeFrom ? `from ${format(parseISO(rangeFrom), "dd MMM")}` : rangeTo ? `until ${format(parseISO(rangeTo), "dd MMM")}` : "date range")
    : dateFilter !== "all" ? `on ${format(parseISO(dateFilter), "dd MMM")}`
    : "";

  const applyFilters = (list: Booking[]) => {
    if (!isAdmin) return list;
    let result = list;
    if (dateFilter === "today") result = result.filter(b => b.date === todayISO);
    else if (dateFilter === "tomorrow") result = result.filter(b => b.date === tomorrowISO);
    else if (dateFilter === "this_month") result = result.filter(b => { try { return isThisMonth(parseISO(b.date)); } catch { return false; } });
    else if (dateFilter === "range") {
      if (rangeFrom) result = result.filter(b => b.date >= rangeFrom);
      if (rangeTo) result = result.filter(b => b.date <= rangeTo);
    }
    else if (dateFilter !== "all") result = result.filter(b => b.date === dateFilter);
    if (categoryFilter !== null) {
      result = result.filter(b => getServiceCategoryId(b.serviceId) === categoryFilter);
    }
    if (gstFilter) {
      result = result.filter(b => (b.gstAmount ?? 0) > 0);
    }
    return result;
  };

  const applyNonDateFilters = (list: Booking[]) => {
    if (!isAdmin) return list;
    let result = list;
    if (categoryFilter !== null) {
      result = result.filter(b => getServiceCategoryId(b.serviceId) === categoryFilter);
    }
    if (gstFilter) {
      result = result.filter(b => (b.gstAmount ?? 0) > 0);
    }
    return result;
  };


  // Admin: split pending / confirmed / cancelled
  const pendingBookings = useMemo(() => {
    if (!bookings || !isAdmin) return [];
    const pending = bookings.filter(b => b.status === "pending");
    const filtered = applyFilters(pending);
    return filtered.sort((a, b) => b.id - a.id);
  }, [bookings, isAdmin, dateFilter, rangeFrom, rangeTo, categoryFilter, gstFilter, services, todayISO]);

  const confirmedBookings = useMemo(() => {
    if (!bookings) return [];
    if (!isAdmin) {
      return [...bookings].sort((a, b) => b.id - a.id);
    }
    const confirmed = bookings.filter(b => b.status === "confirmed");
    const filtered = applyFilters(confirmed);
    return filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date > b.date ? -1 : 1;
      return b.id - a.id;
    });
  }, [bookings, isAdmin, dateFilter, rangeFrom, rangeTo, categoryFilter, gstFilter, todayISO, services, categories, statusFilter]);

  const cancelledBookings = useMemo(() => {
    if (!bookings || !isAdmin) return [];
    const cancelled = bookings.filter(b => b.status === "cancelled");
    const filtered = applyNonDateFilters(cancelled);
    return filtered.sort((a, b) => b.id - a.id);
  }, [bookings, isAdmin, categoryFilter, gstFilter, services, categories, statusFilter]);

  const completedBookings = useMemo(() => {
    if (!bookings || !isAdmin) return [];
    const completed = bookings.filter(b => b.status === "completed");
    const filtered = applyNonDateFilters(completed);
    return filtered.sort((a, b) => b.id - a.id);
  }, [bookings, isAdmin, categoryFilter, gstFilter, services, categories, statusFilter]);

  const handleConfirmPayment = (booking: Booking) => {
    setConfirmTarget(booking);
  };

  const handleConfirmSubmit = (staffId: number | null) => {
    if (!confirmTarget) return;
    const bookingSnapshot = confirmTarget;
    confirmBooking({ id: bookingSnapshot.id, staffId }, {
      onSuccess: () => {
        toast({ title: "Booking confirmed!", description: "The customer has been notified." });
        setConfirmTarget(null);
        // Fire-and-forget: generate boarding pass image and email it
        if (bookingSnapshot.email?.trim() && pagePaymentSettings) {
          const assignedStaff = staffId ? staffs.find(s => s.id === staffId) : null;
          const bpData = {
            booking: { ...bookingSnapshot, status: "confirmed" },
            serviceName: getServiceName(bookingSnapshot.serviceId),
            staffName: assignedStaff?.fullName ?? null,
            staffContact: assignedStaff?.contactNumber ?? null,
            paymentSettings: pagePaymentSettings as any,
          };
          generateBoardingPassPDFBase64(bpData).then(pdfBase64 => {
            return apiRequest("POST", `/api/bookings/${bookingSnapshot.id}/email-boarding-pass`, { pdfBase64 });
          }).catch(err => {
            console.error("Boarding pass PDF email failed:", err);
          });
        }
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const handleConfirmCancel = (reason: string) => {
    if (!cancelTarget) return;
    cancelBooking(
      { id: cancelTarget.id, cancelReason: reason },
      {
        onSuccess: () => {
          toast({ title: "Booking cancelled", description: `Reason: ${reason}` });
          setCancelTarget(null);
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const getServiceName = (serviceId: number | null) =>
    services?.find(s => s.id === serviceId)?.name || "Kayaking Service";

  const getServiceTimeSlots = (serviceId: number | null): string[] =>
    services?.find(s => s.id === serviceId)?.timeSlots ?? [];

  const handleRescheduleSubmit = (date: string, timeSlot: string) => {
    if (!rescheduleTarget) return;
    rescheduleBooking({ id: rescheduleTarget.id, date, timeSlot }, {
      onSuccess: () => {
        toast({ title: "Booking rescheduled!", description: `Moved to ${format(new Date(date + "T00:00:00"), "dd MMM yyyy")} at ${timeSlot}.` });
        setRescheduleTarget(null);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  if (authLoading) return <AppLayout><div className="p-8">Loading...</div></AppLayout>;
  if (!user) return null;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 animate-in fade-in">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground" data-testid="text-page-title">
              {isAdmin ? "Manage Bookings" : "My Bookings"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAdmin
                ? "View and manage all customer bookings"
                : "Track your kayaking adventures"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowFinancials(v => !v)}
                data-testid="toggle-financials"
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${showFinancials ? "bg-blue-500 text-white border-blue-600 shadow-md" : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20"}`}
              >
                <IndianRupee className="w-4 h-4" />
              </button>
            )}
            {isAdmin && !bookingsLoading && pendingBookings.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500 text-white rounded-xl px-3 py-1.5 text-sm font-bold shadow-md shadow-amber-200 dark:shadow-amber-900/30 whitespace-nowrap">
              <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              {pendingBookings.length} Pending
            </div>
          )}
          </div>
        </div>

        {/* Admin stats strip */}
        {isAdmin && !bookingsLoading && bookings && bookings.length > 0 && (
          <BookingStats
            allBookings={bookings}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            showFinancials={showFinancials}
            setShowFinancials={setShowFinancials}
          />
        )}

        {/* Admin date filter */}
        {isAdmin && !bookingsLoading && bookings && (
          <DateFilterBar
            allBookings={bookings}
            filter={dateFilter}
            setFilter={setDateFilter}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            setRangeFrom={setRangeFrom}
            setRangeTo={setRangeTo}
          />
        )}

        {/* Admin category + GST filter */}
        {isAdmin && !bookingsLoading && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
            {categories.length > 0 && (
              <>
                <button
                  data-testid="filter-category-all"
                  onClick={() => setCategoryFilter(null)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all flex-shrink-0 ${
                    categoryFilter === null
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    data-testid={`filter-category-${cat.id}`}
                    onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all flex-shrink-0 flex items-center gap-1.5 ${
                      categoryFilter === cat.id
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    {cat.name}
                  </button>
                ))}
              </>
            )}
            <button
              data-testid="filter-has-gst"
              onClick={() => setGstFilter(v => !v)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all flex-shrink-0 flex items-center gap-1.5 ${
                gstFilter
                  ? "bg-sky-600 text-white border-sky-700 shadow-sm"
                  : "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20"
              }`}
            >
              <IndianRupee className="w-3 h-3" />
              Has GST
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {bookingsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-52 rounded-2xl" />
          </div>
        ) : confirmedBookings.length === 0 && (isAdmin ? cancelledBookings.length === 0 && pendingBookings.length === 0 : true) ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-sm">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ship className="w-10 h-10 text-primary opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {isAdmin
                ? dateFilter === "today" ? "No bookings for today" : "No bookings found"
                : "No bookings yet"}
            </h3>
            <p className="text-muted-foreground mb-2 text-sm">
              {isAdmin
                ? dateFilter === "today"
                  ? "There are no confirmed bookings for today."
                  : "Try changing the date filter above."
                : "You haven't booked any kayaking adventures yet."}
            </p>
            {!isAdmin && (
              <button
                onClick={() => setLocation("/")}
                className="text-primary font-semibold hover:underline text-sm"
                data-testid="link-explore-services"
              >
                Explore Services
              </button>
            )}
          </div>
        ) : (
          <>
            {/* WhatsApp Message Queue (admin only) */}
            {isAdmin && waQueue.length > 0 && (
              <WaQueuePanel
                queue={waQueue}
                waNumber={waNumber}
                onMarkSent={markWaSent}
              />
            )}

            {/* Pending bookings section (admin only) */}
            {isAdmin && pendingBookings.length > 0 && (statusFilter === "all" || statusFilter === "pending") && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl px-3 py-1.5 text-sm font-bold border border-amber-500/20">
                    <span className="relative flex h-2.5 w-2.5 mr-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <Clock className="w-4 h-4" />
                    <span data-testid="text-pending-count">{pendingBookings.length} pending verification</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingBookings.map(booking => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      serviceName={getServiceName(booking.serviceId)}
                      categoryName={getCategoryName(booking.serviceId)}
                      isAdmin={isAdmin}
                      onCancelClick={setCancelTarget}
                      onConfirmClick={handleConfirmPayment}
                      onRescheduleClick={setRescheduleTarget}
                      confirmPending={confirming && confirmingVars?.id === booking.id}
                      highlighted={highlightId === booking.id}
                      waNumber={waNumber}
                      waTemplates={waTemplateMap}
                      metaApiConfigured={metaApiConfigured}
                      earnedCoupon={getEarnedCoupon(booking.id)}
                      couponPending={couponPendingEnabled}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed booking count badge */}
            {isAdmin && (statusFilter === "all" || statusFilter === "confirmed") && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl px-3 py-1.5 text-sm font-bold border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span data-testid="text-booking-count">
                    {confirmedBookings.length} confirmed
                    {filterDateLabel && ` ${filterDateLabel}`}
                  </span>
                </div>
              </div>
            )}

            {/* Confirmed bookings grid */}
            {(statusFilter === "all" || statusFilter === "confirmed") && confirmedBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {confirmedBookings.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    serviceName={getServiceName(booking.serviceId)}
                    categoryName={getCategoryName(booking.serviceId)}
                    isAdmin={isAdmin}
                    onCancelClick={isAdmin ? setCancelTarget : undefined}
                    onRescheduleClick={isAdmin ? setRescheduleTarget : undefined}
                    staff={booking.staffId ? staffs.find(s => s.id === booking.staffId) ?? null : null}
                    highlighted={highlightId === booking.id}
                    waNumber={waNumber}
                    waTemplates={waTemplateMap}
                    metaApiConfigured={metaApiConfigured}
                    earnedCoupon={getEarnedCoupon(booking.id)}
                    couponPending={couponPendingEnabled}
                    manualReminder={manualReminderByBooking.get(booking.id) ?? null}
                  />
                ))}
              </div>
            ) : isAdmin ? (
              <div className="text-center py-10 bg-card rounded-2xl border border-border mb-6">
                <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {`No confirmed bookings${filterDateLabel ? ` ${filterDateLabel}` : " match this filter"}`}
                </p>
              </div>
            ) : null}

            {/* Customer: show all their bookings (confirmed + cancelled mixed) */}
            {!isAdmin && bookings && bookings.filter(b => b.status === "cancelled").length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {bookings.filter(b => b.status === "cancelled").sort((a, b) => b.id - a.id).map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    serviceName={getServiceName(booking.serviceId)}
                    categoryName={getCategoryName(booking.serviceId)}
                    isAdmin={false}
                    onCancelClick={undefined}
                    highlighted={highlightId === booking.id}
                  />
                ))}
              </div>
            )}

            {/* Admin: Collapsible Completed Bookings */}
            {isAdmin && (statusFilter === "all" || statusFilter === "completed") && (
              <div className="rounded-2xl border border-border overflow-hidden mb-4">
                <button
                  data-testid="button-toggle-completed"
                  onClick={() => setCompletedExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <BadgeCheck className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Completed Bookings</p>
                      <p className="text-xs text-muted-foreground">
                        {completedBookings.length} completed
                        {filterDateLabel && ` ${filterDateLabel}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {completedBookings.length > 0 && (
                      <span className="bg-indigo-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px] text-center">
                        {completedBookings.length}
                      </span>
                    )}
                    {(completedExpanded || statusFilter === "completed")
                      ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      : <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    }
                  </div>
                </button>

                {(completedExpanded || statusFilter === "completed") && (
                  <div className="p-4">
                    {completedBookings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {`No completed bookings${filterDateLabel ? ` ${filterDateLabel}` : ""}`}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedBookings.map(booking => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            serviceName={getServiceName(booking.serviceId)}
                            categoryName={getCategoryName(booking.serviceId)}
                            isAdmin={isAdmin}
                            onCancelClick={undefined}
                            staff={booking.staffId ? staffs.find(s => s.id === booking.staffId) ?? null : null}
                            highlighted={highlightId === booking.id}
                            waNumber={waNumber}
                            waTemplates={waTemplateMap}
                            metaApiConfigured={metaApiConfigured}
                            earnedCoupon={getEarnedCoupon(booking.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Admin: Collapsible Cancelled Bookings */}
            {isAdmin && (statusFilter === "all" || statusFilter === "cancelled") && (
              <div className="rounded-2xl border border-border overflow-hidden">
                <button
                  data-testid="button-toggle-cancelled"
                  onClick={() => setCancelledExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Cancelled Bookings</p>
                      <p className="text-xs text-muted-foreground">
                        {cancelledBookings.length} cancelled
                        {filterDateLabel && ` ${filterDateLabel}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cancelledBookings.length > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px] text-center">
                        {cancelledBookings.length}
                      </span>
                    )}
                    {(cancelledExpanded || statusFilter === "cancelled")
                      ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      : <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    }
                  </div>
                </button>

                {(cancelledExpanded || statusFilter === "cancelled") && (
                  <div className="p-4">
                    {cancelledBookings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {`No cancelled bookings${filterDateLabel ? ` ${filterDateLabel}` : ""}`}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cancelledBookings.map(booking => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            serviceName={getServiceName(booking.serviceId)}
                            categoryName={getCategoryName(booking.serviceId)}
                            isAdmin={isAdmin}
                            onCancelClick={undefined}
                            waNumber={waNumber}
                            waTemplates={waTemplateMap}
                            metaApiConfigured={metaApiConfigured}
                            earnedCoupon={getEarnedCoupon(booking.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>


      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          serviceName={getServiceName(cancelTarget.serviceId)}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleConfirmCancel}
          isPending={cancelling}
        />
      )}

      {/* Confirm (with Staff) Modal */}
      {confirmTarget && (
        <ConfirmBookingModal
          booking={confirmTarget}
          serviceName={getServiceName(confirmTarget.serviceId)}
          staffs={staffs}
          onClose={() => setConfirmTarget(null)}
          onConfirm={handleConfirmSubmit}
          isPending={confirming}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          booking={rescheduleTarget}
          serviceName={getServiceName(rescheduleTarget.serviceId)}
          timeSlots={getServiceTimeSlots(rescheduleTarget.serviceId)}
          onClose={() => setRescheduleTarget(null)}
          onConfirm={handleRescheduleSubmit}
          isPending={rescheduling}
        />
      )}
    </AppLayout>
  );
}
