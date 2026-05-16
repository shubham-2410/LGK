import { getApiUrl } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout";
import { useServices } from "@/hooks/use-services";
import { useCreateBooking } from "@/hooks/use-bookings";
import { usePaymentSettings } from "@/hooks/use-payment-settings";
import { useAuth } from "@/hooks/use-auth";
import { useInclusions } from "@/hooks/use-inclusions";
import { InclusionIcon } from "@/lib/inclusion-icons";
import { Button, Input, Label } from "@/components/ui";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  ArrowLeft, Calendar as CalIcon, Clock, Users, CreditCard, Ticket,
  CheckCircle2, XCircle, Smartphone, ShieldCheck, Images, ChevronLeft, ChevronRight, X, Gift, MessageCircleMore,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// ─── Photo Gallery Modal ────────────────────────────────────────────────────
function GalleryModal({ photos, startIdx = 0, onClose }: { photos: string[]; startIdx?: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIdx);

  const prev = () => setCurrent(i => (i - 1 + photos.length) % photos.length);
  const next = () => setCurrent(i => (i + 1) % photos.length);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white/70 text-sm font-medium">{current + 1} / {photos.length}</span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          data-testid="button-close-gallery"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center px-4 relative" onClick={e => e.stopPropagation()}>
        {photos.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
            data-testid="button-gallery-prev"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        <img
          key={current}
          src={photos[current]}
          alt={`Photo ${current + 1}`}
          className="max-h-[70dvh] max-w-full object-contain rounded-xl animate-in zoom-in-95 duration-200"
          loading="eager"
        />
        {photos.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
            data-testid="button-gallery-next"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar justify-center" onClick={e => e.stopPropagation()}>
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 transition-all border-2 ${
                i === current ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-80"
              }`}
              data-testid={`gallery-thumb-${i}`}
            >
              <img src={url} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Return to book hint */}
      <div className="flex-shrink-0 pb-safe px-4 pb-4 text-center" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-sm underline underline-offset-4 transition-colors"
          data-testid="button-back-to-book"
        >
          ← Return to booking
        </button>
      </div>
    </div>
  );
}

const DEFAULT_TIME_SLOTS = ["06:00 AM", "08:30 AM", "04:00 PM", "05:30 PM"];

function buildUpiQrUrl(upiLink: string, companyName: string, amount: number, note?: string): string {
  const trimmed = upiLink.trim();
  const enc = encodeURIComponent;
  if (!trimmed) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=UPI+Payment+%E2%82%B9${amount}`;
  }
  // If it's just a UPI ID (contains @ but not upi://)
  if (trimmed.includes("@") && !trimmed.startsWith("upi://")) {
    let upiDeep = `upi://pay?pa=${enc(trimmed)}&pn=${enc(companyName)}&am=${amount}&cu=INR`;
    if (note) upiDeep += `&tn=${enc(note)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiDeep)}`;
  }
  // Full UPI deep link provided
  let withAmount = trimmed.includes("am=")
    ? trimmed.replace(/am=[^&]+/, `am=${amount}`)
    : `${trimmed}&am=${amount}`;
  if (note) withAmount += `&tn=${enc(note)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(withAmount)}`;
}

// Format a raw number (10 digits) or existing value to +91 XXXXX XXXXX display
function formatIndianContact(raw: string): string {
  // If already has +91, return as-is
  if (raw.startsWith("+91")) return raw;
  // Strip leading 0 or 91
  const digits = raw.replace(/\D/g, "").replace(/^(91|0)/, "");
  if (digits.length === 10) return `+91 ${digits}`;
  return "+91 ";
}

function isValidIndianNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  // Should have 12 digits (91 + 10) or match 10-digit starting with 6-9
  const ten = digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(ten);
}

export default function ServiceDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: services, isLoading: isLoadingServices } = useServices();
  const { mutateAsync: createBooking, isPending } = useCreateBooking();
  const { data: paymentSettings } = usePaymentSettings();
  const { data: couponSettingsData } = useQuery<{ bookingCouponEnabled: boolean; bookingCouponExpiryMonths: number; bookingCouponDiscountType: string; bookingCouponDiscountValue: number }>({ queryKey: ["/api/coupon-settings"] });
  const { data: publicCoupons } = useQuery<{ id: number; code: string; discountType: string; discountValue: number; minPax: number; expiresAt: string }[]>({
    queryKey: ["/api/coupons/public", id],
    queryFn: async () => {
      const svcId = !isNaN(Number(id))
        ? Number(id)
        : services?.find(s => s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") === id)?.id;
      const params = new URLSearchParams();
      if (svcId) params.set("serviceId", String(svcId));
      const res = await fetch(getApiUrl(`/api/coupons/public?${params}`), { credentials: "include" });
      return res.json();
    },
    enabled: !!id,
  });
  const { user, guestLogin, isGuestLoggingIn, updateProfile } = useAuth();
  const { data: allInclusions } = useInclusions();
  const { toast } = useToast();

  const toSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const service = services?.find(s =>
    isNaN(Number(id)) ? toSlug(s.name) === id : s.id === Number(id)
  );

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [timeSlot, setTimeSlot] = useState<string>("");

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  // Collapse description when user navigates to a different step
  useEffect(() => { setDescExpanded(false); }, [step, id]);

  // Auto-fill from user profile once loaded
  useEffect(() => {
    if (!user) return;
    if (user.fullName) setFullName(prev => prev || user.fullName!);
    if (user.email) setEmail(prev => prev || user.email!);
    // Use phoneNumber if present, else fall back to mobileNumber
    const raw = user.phoneNumber || user.mobileNumber || "";
    if (raw) setContact(prev => (prev && prev !== "+91 ") ? prev : formatIndianContact(raw));
  }, [user?.id, user?.fullName, user?.email, user?.phoneNumber, user?.mobileNumber]);

  const [pax, setPax] = useState<number>(1);
  const [adults, setAdults] = useState<number>(1);
  const [kids, setKids] = useState<number>(0);
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(undefined);
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(undefined);
  const paxInitialized = useRef(false);
  useEffect(() => {
    if (service && !paxInitialized.current) {
      paxInitialized.current = true;
      const min = service.minPax ?? 0;
      if (min > 1) setPax(min);
    }
  }, [service]);

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: number; code: string; discountType: string; discountValue: number; minPax: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Referral code
  const [referralInput, setReferralInput] = useState("");
  const [referralApplied, setReferralApplied] = useState<{ name: string; code: string; commissionType: string; commissionValue: number; linkedCouponCode?: string | null } | null>(null);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [couponFromReferral, setCouponFromReferral] = useState(false);
  const [cameViaReferral, setCameViaReferral] = useState(false);
  const [autoRefCode, setAutoRefCode] = useState<string | null>(null);
  // Capture ?ref= URL param on mount — also falls back to sessionStorage set by home page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || sessionStorage.getItem("_ref");
    if (ref) {
      const code = ref.trim().toUpperCase();
      setReferralInput(code);
      setCameViaReferral(true);
      setAutoRefCode(code);
      // Keep _ref in session so back-navigation still works; it's cleared when session ends
    }
  }, []);
  // Auto-validate and apply referral once service is loaded
  useEffect(() => {
    if (!service || !autoRefCode || referralApplied) return;
    setIsValidatingReferral(true);
    fetch(getApiUrl(`/api/referrals/validate?code=${encodeURIComponent(autoRefCode)}`), { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setReferralApplied(data.referral);
          if (data.referral.linkedCouponCode) {
            const cParams = new URLSearchParams({ code: data.referral.linkedCouponCode, serviceId: String(service.id) });
            fetch(getApiUrl(`/api/coupons/validate?${cParams}`), { credentials: "include" })
              .then(r => r.json())
              .then(cData => {
                if (cData.valid) {
                  const c = cData.coupon;
                  const initSubtotal = service.priceType === "group" ? service.price : service.price;
                  const discountAmount = c.discountType === "fixed"
                    ? Math.min(c.discountValue, initSubtotal)
                    : Math.floor(initSubtotal * c.discountValue / 100);
                  setAppliedCoupon(c);
                  setDiscount(discountAmount);
                  setCouponFromReferral(true);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsValidatingReferral(false));
  }, [service, autoRefCode]);
  const [paymentOption, setPaymentOption] = useState<"1pax" | "custom" | "full">("full");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [bookingResult, setBookingResult] = useState<"success" | "failed" | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [isInitiatingPhonePe, setIsInitiatingPhonePe] = useState(false);

  // Profile completion modal (shown to guest users after booking)
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePin, setProfilePin] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAuthMode, setProfileAuthMode] = useState<"password" | "pin">("password");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  if (isLoadingServices) {
    return <AppLayout><div className="p-8 text-center text-muted-foreground">Loading...</div></AppLayout>;
  }
  if (!service) {
    return <AppLayout><div className="p-8 text-center text-red-500">Service not found.</div></AppLayout>;
  }

  const isGroupPricing = service.priceType === "group";
  const isNightPricing = (service as any).priceType === "night";
  const nights = isNightPricing && checkInDate && checkOutDate
    ? Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const subtotal = isGroupPricing ? service.price : isNightPricing ? service.price * nights : service.price * pax;
  const totalPayable = Math.max(0, subtotal - discount);
  const minCustomAmount = isNightPricing ? service.price : Math.ceil(service.price / 2);
  let amountToPay = totalPayable;
  if (paymentOption === "1pax") amountToPay = service.price;
  if (paymentOption === "custom") amountToPay = Math.max(0, Number(customAmount) || 0);
  const balance = Math.max(0, totalPayable - amountToPay);

  // GST Calculations — keep 2 decimal places; CGST = SGST exactly
  const svcGstPercent = (service as any).gstPercent ?? 0;
  const svcGstMode: "exclusive" | "inclusive" = (service as any).gstMode === "inclusive" ? "inclusive" : "exclusive";
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const fmt2 = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let gstAmount = 0;
  let gstBase = amountToPay;
  let finalPayAmount = amountToPay;
  if (svcGstPercent > 0 && amountToPay > 0) {
    if (svcGstMode === "exclusive") {
      gstAmount = round2(amountToPay * svcGstPercent / 100);
      finalPayAmount = round2(amountToPay + gstAmount);
    } else {
      gstAmount = round2(amountToPay * svcGstPercent / (100 + svcGstPercent));
      gstBase = round2(amountToPay - gstAmount);
      finalPayAmount = amountToPay;
    }
  }
  // Both CGST and SGST are exactly equal (gstAmount / 2, to 2 decimal places)
  const cgstAmount = round2(gstAmount / 2);
  const sgstAmount = cgstAmount;

  const companyName = paymentSettings?.companyName || "Local Goa Kayaking";
  const upiLink = paymentSettings?.upiLink || "";
  const bookingNote = [
    fullName.trim() || "Guest",
    isNightPricing
      ? (checkInDate && checkOutDate ? `${format(checkInDate, "dd-MMM")} → ${format(checkOutDate, "dd-MMM")} (${nights}N)` : "")
      : (date ? `Date: ${format(date, "dd-MMM")}` : ""),
    isNightPricing ? `Adults:${adults} Kids:${kids}` : `${pax} pax`,
    "Payment",
  ].filter(Boolean).join(", ");
  const qrUrl = buildUpiQrUrl(upiLink, companyName, finalPayAmount, bookingNote);

  const handleValidateReferral = async () => {
    const code = referralInput.trim().toUpperCase();
    if (!code) return;
    // Mutual exclusion: clear any manually-applied coupon before applying referral
    if (appliedCoupon && !couponFromReferral) {
      handleRemoveCoupon();
    }
    setReferralError(null);
    setIsValidatingReferral(true);
    try {
      const res = await fetch(getApiUrl(`/api/referrals/validate?code=${encodeURIComponent(code)}`), { credentials: "include" });
      const data = await res.json();
      if (data.valid) {
        setReferralApplied(data.referral);
        setReferralError(null);
        // Silently apply linked coupon if referral has one
        if (data.referral.linkedCouponCode && !appliedCoupon) {
          try {
            const cParams = new URLSearchParams({ code: data.referral.linkedCouponCode });
            if (service?.id) cParams.set("serviceId", String(service.id));
            const cRes = await fetch(getApiUrl(`/api/coupons/validate?${cParams}`), { credentials: "include" });
            const cData = await cRes.json();
            if (cData.valid) {
              const c = cData.coupon;
              const discountAmount = c.discountType === "fixed"
                ? Math.min(c.discountValue, subtotal)
                : Math.floor(subtotal * c.discountValue / 100);
              setAppliedCoupon(c);
              setDiscount(discountAmount);
              setCouponFromReferral(true);
            }
          } catch { /* silent fail */ }
        }
        toast({ title: "Referral Applied!", description: `Code from ${data.referral.name}` });
      } else {
        setReferralApplied(null);
        setReferralError(data.message ?? "Invalid referral code");
      }
    } catch {
      setReferralError("Could not validate referral code");
    } finally {
      setIsValidatingReferral(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    // Mutual exclusion: clear any active referral before applying a manual coupon
    if (referralApplied) {
      handleRemoveReferral();
    }
    setCouponError(null);
    setIsValidatingCoupon(true);
    try {
      const params = new URLSearchParams({ code: coupon.trim() });
      if (service?.id) params.set("serviceId", String(service.id));
      const res = await fetch(getApiUrl(`/api/coupons/validate?${params}`), { credentials: "include" });
      const data = await res.json();
      if (data.valid) {
        const c = data.coupon;
        if (c.minPax > 0 && pax < c.minPax) {
          setAppliedCoupon(null);
          setDiscount(0);
          setCouponError(`Valid for ${c.minPax}+ pax only`);
        } else {
          const discountAmount = c.discountType === "fixed"
            ? Math.min(c.discountValue, subtotal)
            : Math.floor(subtotal * c.discountValue / 100);
          setAppliedCoupon(c);
          setDiscount(discountAmount);
          setCouponError(null);
          toast({ title: "Coupon Applied!", description: c.discountType === "fixed" ? `₹${c.discountValue} off` : `${c.discountValue}% off` });
        }
      } else {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponError(data.message ?? "Invalid coupon code");
      }
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon("");
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponError(null);
    setCouponFromReferral(false);
  };

  const handleRemoveReferral = () => {
    setReferralInput("");
    setReferralApplied(null);
    setReferralError(null);
    // If the discount was coming from the referral's linked coupon, clear that too
    if (couponFromReferral) {
      setAppliedCoupon(null);
      setDiscount(0);
      setCoupon("");
      setCouponFromReferral(false);
    }
  };

  const handleQuickApplyCoupon = async (code: string) => {
    // Mutual exclusion: clear any active referral before applying a manual coupon
    if (referralApplied) {
      handleRemoveReferral();
    }
    setCouponError(null);
    setIsValidatingCoupon(true);
    setCoupon(code);
    try {
      const params = new URLSearchParams({ code });
      if (service?.id) params.set("serviceId", String(service.id));
      const res = await fetch(getApiUrl(`/api/coupons/validate?${params}`), { credentials: "include" });
      const data = await res.json();
      if (data.valid) {
        const c = data.coupon;
        if (c.minPax > 0 && pax < c.minPax) {
          setAppliedCoupon(null);
          setDiscount(0);
          setCouponError(`Valid for ${c.minPax}+ pax only`);
        } else {
          const discountAmount = c.discountType === "fixed"
            ? Math.min(c.discountValue, subtotal)
            : Math.floor(subtotal * c.discountValue / 100);
          setAppliedCoupon(c);
          setDiscount(discountAmount);
          setCouponError(null);
          toast({ title: "Coupon Applied!", description: c.discountType === "fixed" ? `₹${c.discountValue} off` : `${c.discountValue}% off` });
        }
      } else {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponError(data.message ?? "Invalid coupon code");
      }
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleContactChange = (value: string) => {
    // Always keep +91 prefix
    if (!value.startsWith("+91")) {
      setContact("+91 ");
      return;
    }
    setContact(value);
  };

  const handleProceedToPayment = async () => {
    if (!fullName.trim()) {
      toast({ title: "Full name is required", variant: "destructive" }); return;
    }
    if (!isValidIndianNumber(contact)) {
      toast({ title: "Invalid phone number", description: "Enter a valid 10-digit Indian mobile number after +91.", variant: "destructive" }); return;
    }
    if (email.trim() && !email.includes("@")) {
      toast({ title: "Invalid email", description: "Please enter a valid email address or leave it blank.", variant: "destructive" }); return;
    }
    if (isNightPricing) {
      const maxAdults = (service as any).adultOccupancy ?? 0;
      const maxKids = (service as any).kidsOccupancy ?? 0;
      if (adults < 1) { toast({ title: "At least 1 adult required", variant: "destructive" }); return; }
      if (maxAdults > 0 && adults > maxAdults) { toast({ title: `Maximum ${maxAdults} adults allowed`, variant: "destructive" }); return; }
      if (maxKids > 0 && kids > maxKids) { toast({ title: `Maximum ${maxKids} kids allowed`, variant: "destructive" }); return; }
    } else {
      if (pax < 1) {
        toast({ title: "At least 1 person required", variant: "destructive" }); return;
      }
      const paxLimit = service.minPax ?? 0;
      if (isGroupPricing) {
        if (paxLimit > 0 && pax > paxLimit) {
          toast({ title: `Maximum ${paxLimit} pax per group`, description: `This group trip allows at most ${paxLimit} people.`, variant: "destructive" }); return;
        }
      } else {
        if (paxLimit > 0 && pax < paxLimit) {
          toast({ title: `Minimum ${paxLimit} pax required`, description: `This trip needs at least ${paxLimit} people to operate.`, variant: "destructive" }); return;
        }
      }
    }
    // Guest users: create a temporary session from their contact number
    if (!user) {
      const rawMobile = contact.replace(/\s+/g, "").replace("+91", "").trim();
      const mobile10 = `+91${rawMobile}`;
      try {
        await guestLogin({ mobileNumber: mobile10, fullName: fullName.trim() });
      } catch (err: any) {
        if (err.message?.includes("already registered")) {
          toast({ title: "Account exists", description: "This number is registered. Please log in first.", variant: "destructive" });
          setLocation("/login");
          return;
        }
        toast({ title: "Could not continue", description: err.message, variant: "destructive" });
        return;
      }
    }
    setStep(3);
  };

  const handlePhonePePayment = async () => {
    if (paymentOption === "custom" && (!customAmount || Number(customAmount) < minCustomAmount)) return;
    setIsInitiatingPhonePe(true);
    try {
      const bookingDate = isNightPricing ? format(checkInDate!, "yyyy-MM-dd") : format(date!, "yyyy-MM-dd");
      const bookingTimeSlot = isNightPricing
        ? `Check-in: ${format(checkInDate!, "dd MMM")} → Check-out: ${format(checkOutDate!, "dd MMM")} (${nights} night${nights > 1 ? "s" : ""})`
        : timeSlot;
      const bookingPax = isNightPricing ? adults + kids : pax;
      const res = await fetch(getApiUrl("/api/phonepe/initiate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          serviceId: service.id,
          date: bookingDate,
          timeSlot: bookingTimeSlot,
          fullName,
          contactNumber: contact,
          email,
          pax: bookingPax,
          totalPayable,
          amountPaid: amountToPay,
          balance,
          couponCode: appliedCoupon?.code ?? null,
          couponDiscount: discount,
          whatsappConsent,
          referralCode: referralApplied?.code ?? null,
          gstAmount: Math.round(gstAmount),
          cgstAmount: Math.round(cgstAmount),
          sgstAmount: Math.round(sgstAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to initiate payment");
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      toast({ title: "Payment initiation failed", description: err.message, variant: "destructive" });
      setIsInitiatingPhonePe(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (isNightPricing) {
      if (!checkInDate || !checkOutDate) return;
    } else {
      if (!date || !timeSlot) return;
    }
    const txnTrimmed = transactionId.trim();
    if (!txnTrimmed || !/^\d{6,15}$/.test(txnTrimmed)) {
      toast({ title: "Transaction ID required", description: "Please enter the last 6 digits (or full transaction ID, up to 15 digits) of your payment.", variant: "destructive" });
      return;
    }
    try {
      const bookingDate = isNightPricing ? format(checkInDate!, "yyyy-MM-dd") : format(date!, "yyyy-MM-dd");
      const bookingTimeSlot = isNightPricing
        ? `Check-in: ${format(checkInDate!, "dd MMM")} → Check-out: ${format(checkOutDate!, "dd MMM")} (${nights} night${nights > 1 ? "s" : ""})`
        : timeSlot;
      const bookingPax = isNightPricing ? adults + kids : pax;
      await createBooking({
        serviceId: service.id,
        date: bookingDate,
        timeSlot: bookingTimeSlot,
        fullName,
        contactNumber: contact,
        email,
        pax: bookingPax,
        totalPayable,
        amountPaid: amountToPay,
        balance,
        status: "pending",
        couponCode: appliedCoupon?.code ?? null,
        couponDiscount: discount,
        whatsappConsent,
        referralCode: referralApplied?.code ?? null,
        transactionId: txnTrimmed,
        gstAmount: Math.round(gstAmount),
        cgstAmount: Math.round(cgstAmount),
        sgstAmount: Math.round(sgstAmount),
      } as any);
      setBookingResult("success");
      // For guest users (no password set), prompt them to secure their account
      if (!user?.password && !user?.loginPin) {
        setProfileName(fullName);
        setProfileEmail(email);
        setShowProfileModal(true);
      }
    } catch (err: any) {
      if (err?.message === "COUPON_ALREADY_APPLIED") {
        setAppliedCoupon(null);
        setCouponError("Coupon already Applied. Complete your current trip to use it again.");
      } else {
        setBookingResult("failed");
      }
    }
  };

  const handleManualBooking = async () => {
    if (isNightPricing) {
      if (!checkInDate || !checkOutDate) return;
    } else {
      if (!date || !timeSlot) return;
    }
    try {
      const bookingDate = isNightPricing ? format(checkInDate!, "yyyy-MM-dd") : format(date!, "yyyy-MM-dd");
      const bookingTimeSlot = isNightPricing
        ? `Check-in: ${format(checkInDate!, "dd MMM")} → Check-out: ${format(checkOutDate!, "dd MMM")} (${nights} night${nights > 1 ? "s" : ""})`
        : timeSlot;
      const bookingPax = isNightPricing ? adults + kids : pax;
      await createBooking({
        serviceId: service.id,
        date: bookingDate,
        timeSlot: bookingTimeSlot,
        fullName,
        contactNumber: contact,
        email,
        pax: bookingPax,
        totalPayable,
        amountPaid: 0,
        balance: totalPayable,
        status: "pending",
        couponCode: appliedCoupon?.code ?? null,
        couponDiscount: discount,
        whatsappConsent,
        referralCode: referralApplied?.code ?? null,
        gstAmount: Math.round(gstAmount),
        cgstAmount: Math.round(cgstAmount),
        sgstAmount: Math.round(sgstAmount),
      } as any);
      setBookingResult("success");

      const waNumber = (service as any)?.manualWaNumber;
      if (waNumber) {
        const lines = [
          `*New Booking Request — ${service.name}*`,
          `Name: ${fullName}`,
          `Contact: ${contact}`,
          ...(email ? [`Email: ${email}`] : []),
          isNightPricing
            ? `Check-in: ${format(checkInDate!, "dd MMM yyyy")}\nCheck-out: ${format(checkOutDate!, "dd MMM yyyy")}\nNights: ${nights}\nGuests: ${adults} adult${adults !== 1 ? "s" : ""}${kids > 0 ? ` + ${kids} kid${kids !== 1 ? "s" : ""}` : ""}`
            : `Date: ${format(date!, "dd MMM yyyy")}\nTime: ${timeSlot}\nPeople: ${pax}`,
          ...(appliedCoupon ? [`Coupon: ${appliedCoupon.code} (-₹${discount})`] : []),
          `Total: ₹${totalPayable}`,
          `Please confirm my booking. Thank you!`,
        ];
        const text = encodeURIComponent(lines.join("\n"));
        window.open(`https://wa.me/${waNumber}?text=${text}`, "_blank");
      }
    } catch (err: any) {
      if (err?.message === "COUPON_ALREADY_APPLIED") {
        setAppliedCoupon(null);
        setCouponError("Coupon already Applied. Complete your current trip to use it again.");
      } else {
        setBookingResult("failed");
      }
    }
  };

  // Profile completion submit
  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast({ title: "Full name is required", variant: "destructive" }); return;
    }
    if (profileAuthMode === "password" && profilePassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" }); return;
    }
    if (profileAuthMode === "pin" && profilePin.length !== 4) {
      toast({ title: "PIN must be 4 digits", variant: "destructive" }); return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({
        fullName: profileName.trim(),
        password: profileAuthMode === "password" ? profilePassword : undefined,
        loginPin: profileAuthMode === "pin" ? profilePin : undefined,
        email: profileEmail.trim() || undefined,
      });
      toast({ title: "Account created!", description: "You can now log in using your credentials." });
      setShowProfileModal(false);
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Booking result screen
  if (bookingResult === "success") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 shadow-lg shadow-amber-200 dark:shadow-amber-900/20 relative">
            <Clock className="w-10 h-10 text-amber-500" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-foreground mb-2">Booking Received!</h2>
          <p className="text-amber-600 dark:text-amber-400 font-semibold text-sm mb-3">Pending Payment Verification</p>
          <p className="text-muted-foreground leading-relaxed max-w-sm mb-6 text-sm">
            We've received your booking request. Once we verify your UPI payment, your booking will be confirmed and you'll get a notification.
          </p>
          <div className="bg-muted/50 rounded-2xl p-4 border border-border mb-6 w-full max-w-xs text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span className="font-semibold">{service.name}</span>
            </div>
            {isNightPricing ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-semibold">{checkInDate ? format(checkInDate, "dd MMM yyyy") : ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-semibold">{checkOutDate ? format(checkOutDate, "dd MMM yyyy") : ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nights</span>
                  <span className="font-semibold">{nights}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Adults / Kids</span>
                  <span className="font-semibold">{adults} / {kids}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-semibold">{date ? format(date, "dd MMM yyyy") : ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-semibold">{timeSlot}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pax</span>
                  <span className="font-semibold">{pax}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm font-bold text-amber-600 dark:text-amber-400 pt-1 border-t border-border">
              <span>Amount Paid</span>
              <span>₹{amountToPay}</span>
            </div>
          </div>
          {/* Coupon used in this booking */}
          {appliedCoupon && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 mb-3 w-full max-w-xs text-left">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" /> {couponFromReferral ? "Special Discount Applied" : "Coupon Applied on This Booking"}
              </p>
              {!couponFromReferral && <p className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-base">{appliedCoupon.code}</p>}
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                {appliedCoupon.discountType === "fixed" ? `₹${appliedCoupon.discountValue}` : `${appliedCoupon.discountValue}%`} discount was applied · Saved ₹{discount}
              </p>
            </div>
          )}

          {/* Earn a coupon teaser */}
          {couponSettingsData?.bookingCouponEnabled && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3 mb-3 w-full max-w-xs text-left">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" /> Earn a Reward Coupon
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                Once your booking is confirmed, you'll receive a unique coupon code valid for{" "}
                <strong>{couponSettingsData.bookingCouponExpiryMonths} {couponSettingsData.bookingCouponExpiryMonths === 1 ? "month" : "months"}</strong>.
                Use it on your next booking or share it with a friend as a referral!
              </p>
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3 mb-6 w-full max-w-xs text-left">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">You'll receive a notification once the admin verifies your payment and confirms your booking.</p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Button className="w-full" onClick={() => setLocation("/")}>
              Browse More Services
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              onClick={() => setLocation("/bookings")}
            >
              View My Bookings
            </button>
          </div>
        </div>

        {/* Profile Completion Modal for guest users */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-sm rounded-3xl border border-border shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg leading-tight">Secure Your Booking</h3>
                  <p className="text-xs text-muted-foreground">Create an account to track your booking</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    data-testid="input-profile-name"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    data-testid="input-profile-email"
                    type="email"
                    value={profileEmail}
                    onChange={e => setProfileEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-2 block">Set Login Method <span className="text-red-500">*</span></Label>
                  <div className="flex bg-muted rounded-xl p-1 gap-1 mb-3">
                    <button
                      type="button"
                      data-testid="tab-profile-password"
                      onClick={() => setProfileAuthMode("password")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${profileAuthMode === "password" ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      data-testid="tab-profile-pin"
                      onClick={() => setProfileAuthMode("pin")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${profileAuthMode === "pin" ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
                    >
                      4-digit PIN
                    </button>
                  </div>
                  {profileAuthMode === "password" ? (
                    <Input
                      data-testid="input-profile-password"
                      type="password"
                      value={profilePassword}
                      onChange={e => setProfilePassword(e.target.value)}
                      placeholder="Min 6 characters"
                    />
                  ) : (
                    <Input
                      data-testid="input-profile-pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={profilePin}
                      onChange={e => setProfilePin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="4-digit PIN"
                    />
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  data-testid="button-save-profile"
                  className="w-full"
                  onClick={handleSaveProfile}
                  isLoading={isSavingProfile}
                >
                  Create Account
                </Button>
                <button
                  type="button"
                  data-testid="button-skip-profile"
                  onClick={() => setShowProfileModal(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  if (bookingResult === "failed") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6 shadow-lg shadow-red-200">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold font-display text-foreground mb-3">Payment Issue</h2>
          <p className="text-muted-foreground leading-relaxed max-w-sm mb-8">
            {paymentSettings?.failedMessage || "Payment could not be confirmed. Please contact us for assistance."}
          </p>
          <Button variant="outline" className="w-full max-w-xs" onClick={() => setBookingResult(null)}>
            Try Again
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {galleryOpen && service?.photos && service.photos.length > 0 && (
        <GalleryModal
          photos={service.photos}
          startIdx={galleryIdx}
          onClose={() => setGalleryOpen(false)}
        />
      )}
      <div className="bg-primary pt-4 pb-24 px-4 sm:px-8 sm:rounded-b-[3rem] relative z-0 text-white">
        <button
          onClick={() => step > 1 ? setStep(step - 1 as any) : setLocation("/")}
          className="mb-6 flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-3xl font-bold font-display">{service.name}</h1>
        <div className="mt-2 max-w-2xl">
          <p className={`opacity-90 text-sm leading-relaxed whitespace-pre-line ${descExpanded ? "" : "line-clamp-4"}`}>
            {service.description}
          </p>
          {service.description && service.description.length > 180 && (
            <button
              onClick={() => setDescExpanded(v => !v)}
              className="mt-1 text-xs text-white/80 underline underline-offset-2 hover:text-white transition-colors"
              data-testid="button-desc-read-more"
            >
              {descExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {service.duration && (
            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
              <Clock className="w-3.5 h-3.5" /> {service.duration}
            </span>
          )}
          {service.ageGroup && (
            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
              <Users className="w-3.5 h-3.5" /> {service.ageGroup}
            </span>
          )}
          {service.photos && service.photos.length > 0 && (
            <button
              onClick={() => setGalleryOpen(true)}
              className="flex items-center gap-1.5 bg-secondary/80 text-secondary-foreground hover:bg-secondary backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              data-testid="button-view-photos"
            >
              <Images className="w-3.5 h-3.5" /> {service.photos.length} Photo{service.photos.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
        {/* What's Included chips — in hero so always visible */}
        {allInclusions && (service as any)?.inclusionIds?.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> What's Included
            </p>
            <div className="flex flex-wrap gap-2">
              {((service as any).inclusionIds as number[]).map((incId: number) => {
                const inc = allInclusions.find(i => i.id === incId);
                if (!inc) return null;
                return (
                  <span
                    key={incId}
                    className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-full px-3 py-1.5 text-sm font-medium"
                  >
                    <InclusionIcon icon={inc.icon} className="w-3.5 h-3.5" />
                    {inc.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {service.photos && service.photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 pb-1">
            {service.photos.map((url, i) => (
              <button
                key={i}
                onClick={() => { setGalleryIdx(i); setGalleryOpen(true); }}
                className="flex-shrink-0 w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border-2 border-white/30 hover:border-white transition-all"
                data-testid={`gallery-thumb-strip-${i}`}
              >
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 sm:px-8 -mt-16 relative z-10 mb-8">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-5 sm:p-8">

          {/* Progress */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => step > 1 ? setStep(step - 1 as any) : setLocation("/")}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors"
              data-testid="button-step-back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <div className="flex-1 flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-muted -z-10 rounded-full"></div>
              <div className="absolute left-0 top-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }}></div>
              {[1, 2, 3].map((s) => (
                <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= s ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground"}`}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              {isNightPricing ? (
                <>
                  <h3 className="text-xl font-bold mb-1 flex items-center gap-2"><CalIcon className="text-primary w-5 h-5" /> Select Dates</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {!checkInDate ? "Pick a check-in date" : !checkOutDate ? "Now pick a check-out date" : `${format(checkInDate, "dd MMM")} → ${format(checkOutDate, "dd MMM")} · ${nights} night${nights > 1 ? "s" : ""}`}
                  </p>
                  <div className="flex justify-center border rounded-xl p-2 bg-muted/30 mb-3">
                    <Calendar
                      mode="range"
                      selected={{ from: checkInDate, to: checkOutDate }}
                      onSelect={(range) => {
                        setCheckInDate(range?.from);
                        setCheckOutDate(range?.to);
                      }}
                      className="rounded-md"
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      numberOfMonths={1}
                    />
                  </div>
                  {checkInDate && checkOutDate && (
                    <div className="bg-primary/10 rounded-xl px-4 py-3 mb-4 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Check-in</span>
                        <span className="font-semibold">{format(checkInDate, "dd MMM yyyy")}{(service as any).checkInTime && <span className="text-muted-foreground font-normal"> at {(service as any).checkInTime}</span>}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Check-out</span>
                        <span className="font-semibold">{format(checkOutDate, "dd MMM yyyy")}{(service as any).checkOutTime && <span className="text-muted-foreground font-normal"> at {(service as any).checkOutTime}</span>}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-primary pt-1 border-t border-primary/20">
                        <span>{nights} night{nights > 1 ? "s" : ""}</span>
                        <span>₹{service.price * nights} total</span>
                      </div>
                    </div>
                  )}
                  <Button className="w-full" size="lg" disabled={!checkInDate || !checkOutDate} onClick={() => setStep(2)} data-testid="button-continue-to-details">
                    Continue to Details
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CalIcon className="text-primary w-5 h-5" /> Select Date</h3>
                  <div className="flex justify-center border rounded-xl p-2 bg-muted/30 mb-8">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md"
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock className="text-primary w-5 h-5" /> Select Time Slot</h3>
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {(service.timeSlots && service.timeSlots.length > 0 ? service.timeSlots : DEFAULT_TIME_SLOTS).map(slot => (
                      <button
                        key={slot}
                        onClick={() => setTimeSlot(slot)}
                        className={`py-3 rounded-xl border-2 font-semibold transition-all ${timeSlot === slot ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <Button className="w-full" size="lg" disabled={!date || !timeSlot} onClick={() => setStep(2)} data-testid="button-continue-to-details">
                    Continue to Details
                  </Button>
                </>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-5">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Users className="text-primary w-5 h-5" /> Your Details</h3>
              <div>
                <Label>Full Name</Label>
                <Input placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <Label>Contact Number</Label>
                <div className="relative">
                  <Input
                    placeholder="+91 9876543210"
                    type="tel"
                    value={contact}
                    onChange={e => handleContactChange(e.target.value)}
                    className={!isValidIndianNumber(contact) && contact.length > 4 ? "border-red-400 focus-visible:ring-red-400/30" : ""}
                  />
                </div>
                {!isValidIndianNumber(contact) && contact.length > 4 && (
                  <p className="text-xs text-red-500 mt-1">Enter a valid 10-digit Indian mobile number (6-9XXXXXXXXX)</p>
                )}
              </div>
              <div>
                <Label>Email ID</Label>
                <Input placeholder="john@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              {isNightPricing ? (
                <>
                  <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm text-muted-foreground mb-1">
                    <span className="font-semibold text-foreground">{nights} night{nights > 1 ? "s" : ""}</span> · {checkInDate && format(checkInDate, "dd MMM")} → {checkOutDate && format(checkOutDate, "dd MMM")}
                    {((service as any).bedrooms > 0) && <span className="ml-2">· {(service as any).bedrooms} Bedroom{(service as any).bedrooms > 1 ? "s" : ""}</span>}
                  </div>
                  <div>
                    <Label>Adults</Label>
                    <div className="flex items-center gap-4 mt-1">
                      <Button variant="outline" size="sm" data-testid="button-adults-decrease" onClick={() => setAdults(n => Math.max(1, n - 1))}>-</Button>
                      <span className="text-xl font-bold w-8 text-center" data-testid="text-adults-count">{adults}</span>
                      <Button variant="outline" size="sm" data-testid="button-adults-increase" onClick={() => {
                        const max = (service as any).adultOccupancy ?? 0;
                        setAdults(n => max > 0 ? Math.min(max, n + 1) : n + 1);
                      }}>+</Button>
                    </div>
                    {((service as any).adultOccupancy > 0) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Max {(service as any).adultOccupancy} adults</p>
                    )}
                  </div>
                  <div>
                    <Label>Kids</Label>
                    <div className="flex items-center gap-4 mt-1">
                      <Button variant="outline" size="sm" data-testid="button-kids-decrease" onClick={() => setKids(n => Math.max(0, n - 1))}>-</Button>
                      <span className="text-xl font-bold w-8 text-center" data-testid="text-kids-count">{kids}</span>
                      <Button variant="outline" size="sm" data-testid="button-kids-increase" onClick={() => {
                        const max = (service as any).kidsOccupancy ?? 0;
                        setKids(n => max > 0 ? Math.min(max, n + 1) : n + 1);
                      }}>+</Button>
                    </div>
                    {((service as any).kidsOccupancy > 0) && (
                      <p className="text-xs text-muted-foreground mt-1">Max {(service as any).kidsOccupancy} kids</p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <Label>{isGroupPricing ? "Number of People in Group" : "Total Pax (Number of People)"}</Label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" data-testid="button-pax-decrease" onClick={() => setPax(p => Math.max(isGroupPricing ? 1 : Math.max(1, service.minPax ?? 0), p - 1))}>-</Button>
                    <span className="text-xl font-bold w-8 text-center" data-testid="text-pax-count">{pax}</span>
                    <Button variant="outline" size="sm" data-testid="button-pax-increase" onClick={() => setPax(p => isGroupPricing && (service.minPax ?? 0) > 0 ? Math.min(service.minPax!, p + 1) : p + 1)}>+</Button>
                  </div>
                  {(service.minPax ?? 0) > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                      <span>⚠</span> {isGroupPricing ? `Maximum ${service.minPax} pax per group` : `Minimum ${service.minPax} pax required for this trip`}
                    </p>
                  )}
                </div>
              )}
              <Button className="w-full mt-4" size="lg" onClick={handleProceedToPayment} data-testid="button-proceed-to-payment">
                Proceed to Payment (₹{isGroupPricing ? service.price : isNightPricing ? service.price * nights : service.price * pax})
              </Button>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard className="text-primary w-5 h-5" /> Payment Summary</h3>

              <div className="bg-muted/30 rounded-xl p-4 space-y-3 mb-6 border border-border">
                <div className="flex justify-between text-muted-foreground">
                  <span>{isGroupPricing ? "Group Price" : isNightPricing ? "Price per Night" : "Price per Pax"}</span><span>₹{service.price}</span>
                </div>
                {isNightPricing ? (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Check-in</span><span>{checkInDate && format(checkInDate, "dd MMM yyyy")}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Check-out</span><span>{checkOutDate && format(checkOutDate, "dd MMM yyyy")}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Nights</span><span>{nights}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Adults / Kids</span><span>{adults} / {kids}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Subtotal</span><span>₹{subtotal}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Number of People</span><span>{pax}</span>
                    </div>
                    {!isGroupPricing && (
                      <div className="flex justify-between font-semibold">
                        <span>Subtotal</span><span>₹{subtotal}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="pt-3 border-t border-border">
                  {cameViaReferral ? (
                    /* User came via referral link — only show silent discount badge, no coupon input */
                    appliedCoupon && couponFromReferral ? (
                      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
                        <Ticket className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                          Special discount included — {appliedCoupon.discountType === "fixed" ? `₹${appliedCoupon.discountValue} off` : `${appliedCoupon.discountValue}% off`}
                        </span>
                      </div>
                    ) : null
                  ) : (
                    /* Normal flow — show coupon input/applied state */
                    <>
                      {!couponFromReferral && <Label>Have a Coupon?</Label>}
                      {appliedCoupon && couponFromReferral ? (
                        <div className="mt-1 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
                          <Ticket className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                            Special discount included — {appliedCoupon.discountType === "fixed" ? `₹${appliedCoupon.discountValue} off` : `${appliedCoupon.discountValue}% off`}
                          </span>
                        </div>
                      ) : appliedCoupon ? (
                        <div className="mt-1 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">{appliedCoupon.code}</span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-500">
                              {appliedCoupon.discountType === "fixed" ? `₹${appliedCoupon.discountValue} off` : `${appliedCoupon.discountValue}% off`}
                            </span>
                          </div>
                          <button onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-foreground" data-testid="button-remove-coupon">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : referralApplied ? (
                        /* Referral is active — coupon input is blocked */
                        <div className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                          <Ticket className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Remove the referral code below to apply a coupon instead.</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2 mt-1">
                            <Input
                              placeholder="Enter coupon code"
                              value={coupon}
                              onChange={e => { setCoupon(e.target.value); setCouponError(null); }}
                              onKeyDown={e => { if (e.key === "Enter") handleApplyCoupon(); }}
                              className="py-2 uppercase"
                              data-testid="input-coupon-code"
                            />
                            <Button variant="secondary" onClick={handleApplyCoupon} isLoading={isValidatingCoupon} data-testid="button-apply-coupon">
                              <Ticket className="w-4 h-4 mr-2" /> Apply
                            </Button>
                          </div>
                          {publicCoupons && publicCoupons.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Gift className="w-3 h-3" /> Available offers — tap to apply
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {publicCoupons.map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => handleQuickApplyCoupon(c.code)}
                                    data-testid={`button-quick-coupon-${c.id}`}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-semibold"
                                  >
                                    <Ticket className="w-3 h-3 flex-shrink-0" />
                                    <span className="font-mono">{c.code}</span>
                                    <span className="font-normal text-emerald-600 dark:text-emerald-500">
                                      {c.discountType === "fixed" ? `₹${c.discountValue} off` : `${c.discountValue}% off`}
                                      {c.minPax > 0 ? ` · ${c.minPax}+ pax` : ""}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {couponError && (
                        <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> {couponError}
                        </p>
                      )}
                    </>
                  )}
                  {discount > 0 && appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 mt-2 font-medium">
                      <span>Discount</span><span>-₹{discount}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border">
                  {cameViaReferral ? (
                    /* Auto-applied from referral link */
                    referralApplied ? (
                      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2">
                        <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="font-semibold text-blue-700 dark:text-blue-400 text-sm">{referralApplied.code}</span>
                        <span className="text-xs text-blue-600 dark:text-blue-500">via {referralApplied.name}</span>
                      </div>
                    ) : isValidatingReferral ? (
                      <p className="text-xs text-muted-foreground mt-1">Verifying referral…</p>
                    ) : null
                  ) : (
                    /* Manual referral entry */
                    <>
                      <Label>Referred by Someone?</Label>
                      {referralApplied ? (
                        <div className="mt-1 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="font-semibold text-blue-700 dark:text-blue-400 text-sm">{referralApplied.code}</span>
                            <span className="text-xs text-blue-600 dark:text-blue-500">via {referralApplied.name}</span>
                          </div>
                          <button onClick={handleRemoveReferral} className="text-muted-foreground hover:text-foreground" data-testid="button-remove-referral">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : appliedCoupon && !couponFromReferral ? (
                        /* Manual coupon is active — referral input is blocked */
                        <div className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Remove the coupon above to apply a referral code instead.</span>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-1">
                          <Input
                            placeholder="Enter referral code"
                            value={referralInput}
                            onChange={e => { setReferralInput(e.target.value.toUpperCase()); setReferralError(null); }}
                            onKeyDown={e => { if (e.key === "Enter") handleValidateReferral(); }}
                            className="py-2 uppercase"
                            data-testid="input-referral-code"
                          />
                          <Button variant="secondary" onClick={handleValidateReferral} isLoading={isValidatingReferral} data-testid="button-apply-referral">
                            <Users className="w-4 h-4 mr-2" /> Apply
                          </Button>
                        </div>
                      )}
                      {referralError && (
                        <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> {referralError}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="pt-3 border-t border-border flex justify-between text-xl font-bold font-display text-primary">
                  <span>Total Payable</span><span>₹{totalPayable}</span>
                </div>
              </div>

              {(service as any).bookingType === "manual" ? (
                <>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-6 text-center">
                    <MessageCircleMore className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <p className="font-semibold text-foreground mb-1">This is a manual booking</p>
                    <p className="text-sm text-muted-foreground">Tap the button below to open WhatsApp and send your booking details to us. We'll confirm your booking shortly.</p>
                  </div>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/30 cursor-pointer mb-4" data-testid="label-whatsapp-consent">
                    <input
                      type="checkbox"
                      checked={whatsappConsent}
                      onChange={e => setWhatsappConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                      data-testid="checkbox-whatsapp-consent"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">I wish to receive booking details over WhatsApp</p>
                      <p className="text-xs text-muted-foreground mt-0.5">We'll send booking confirmations and updates to your registered number</p>
                    </div>
                  </label>

                  <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
                    size="lg"
                    onClick={handleManualBooking}
                    isLoading={isPending}
                    data-testid="button-manual-book-wa"
                  >
                    <MessageCircleMore className="w-5 h-5 mr-2" /> Book via WhatsApp
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Your booking request will be recorded and we'll contact you on WhatsApp to confirm
                  </p>
                </>
              ) : (
                <>
                  <h4 className="font-bold mb-3">How would you like to pay?</h4>
                  <div className="space-y-2 mb-6">
                    {[
                      { id: "full", label: `Full Amount (₹${totalPayable})` },
                      ...(!isGroupPricing && !isNightPricing ? [{ id: "1pax", label: `Pay for 1 Pax (₹${service.price})` }] : []),
                      { id: "custom", label: "Custom Amount" },
                    ].map(opt => (
                      <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${paymentOption === opt.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                        <input type="radio" name="payment" checked={paymentOption === opt.id} onChange={() => setPaymentOption(opt.id as any)} className="w-4 h-4 accent-primary" />
                        <span className="font-medium">{opt.label}</span>
                      </label>
                    ))}
                    {paymentOption === "custom" && (
                      <div className="pl-8 pt-2 animate-in slide-in-from-top-2 space-y-2">
                        <Input
                          placeholder={`Min ₹${minCustomAmount}`}
                          type="number"
                          min={minCustomAmount}
                          value={customAmount}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === "" || val === "-") { setCustomAmount(""); return; }
                            setCustomAmount(String(Math.max(0, Number(val))));
                          }}
                          onBlur={e => {
                            const val = Number(e.target.value);
                            if (!e.target.value || val < minCustomAmount) {
                              setCustomAmount(String(minCustomAmount));
                            }
                          }}
                          data-testid="input-custom-amount"
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum advance: ₹{minCustomAmount} ({isNightPricing ? "1 night price" : "50% of 1 pax"})
                        </p>
                        {customAmount && Number(customAmount) < minCustomAmount && (
                          <p className="text-xs text-amber-600 font-medium">
                            Amount will be auto-set to ₹{minCustomAmount} (minimum)
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* GST Breakdown — always visible */}
                  <div className="rounded-xl border border-border bg-muted/30 p-3 mb-4 space-y-1.5 text-sm" data-testid="gst-breakdown">
                    {svcGstPercent === 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <span className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-semibold">GST 0%</span>
                          Tax / GST
                        </span>
                        <span className="text-muted-foreground font-medium">Not applicable</span>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-foreground flex items-center gap-1.5 mb-2">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                            Tax {svcGstMode === "inclusive" ? "Inclusive" : "Exclusive"} · GST {svcGstPercent}%
                          </span>
                        </p>
                        {svcGstMode === "exclusive" ? (
                          <>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Base Amount</span>
                              <span>₹{fmt2(amountToPay)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>CGST ({svcGstPercent / 2}%)</span>
                              <span>+ ₹{fmt2(cgstAmount)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>SGST ({svcGstPercent / 2}%)</span>
                              <span>+ ₹{fmt2(sgstAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border">
                              <span>Total (incl. GST)</span>
                              <span className="text-primary">₹{fmt2(finalPayAmount)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Base (excl. tax)</span>
                              <span>₹{fmt2(gstBase)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>CGST ({svcGstPercent / 2}%)</span>
                              <span>₹{fmt2(cgstAmount)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>SGST ({svcGstPercent / 2}%)</span>
                              <span>₹{fmt2(sgstAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border">
                              <span>Amount to Pay</span>
                              <span className="text-primary">₹{fmt2(finalPayAmount)}</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <div className="bg-secondary/30 rounded-xl p-4 mb-6 border border-secondary/50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-muted-foreground">Remaining Balance (Pay later)</span>
                      <span className="text-lg font-bold text-foreground">₹{balance}</span>
                    </div>
                    {balance > 0 && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        GST may be applicable on the remaining balance based on mode of payment at boarding point.
                      </p>
                    )}
                  </div>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/30 cursor-pointer mb-4" data-testid="label-whatsapp-consent">
                    <input
                      type="checkbox"
                      checked={whatsappConsent}
                      onChange={e => setWhatsappConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                      data-testid="checkbox-whatsapp-consent"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">I wish to receive booking details over WhatsApp</p>
                      <p className="text-xs text-muted-foreground mt-0.5">We'll send booking confirmations and updates to your registered number</p>
                    </div>
                  </label>

                  {(paymentSettings as any)?.paymentMode === "phonepe" ? (
                    /* ── PhonePe Online Payment ── */
                    !(paymentOption === "custom" && (!customAmount || Number(customAmount) < minCustomAmount)) && (
                      <div className="space-y-3">
                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700/30 rounded-2xl p-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                            <span className="text-orange-600 font-bold text-lg">₱</span>
                          </div>
                          <p className="font-semibold text-foreground text-sm mb-1">Pay securely via PhonePe</p>
                          <p className="text-2xl font-bold font-display text-orange-600 mb-1">₹{fmt2(finalPayAmount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {svcGstPercent > 0 ? "Incl. GST · " : ""}You'll be redirected to PhonePe checkout
                          </p>
                        </div>
                        <Button
                          className="w-full bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30 text-white"
                          size="lg"
                          onClick={handlePhonePePayment}
                          isLoading={isInitiatingPhonePe}
                          data-testid="button-phonepe-pay"
                        >
                          <span className="font-bold mr-2 text-base">₱</span> Pay ₹{fmt2(finalPayAmount)} via PhonePe
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          After payment you'll be redirected back to confirm your booking
                        </p>
                      </div>
                    )
                  ) : (
                    /* ── Manual UPI / QR Payment ── */
                    <>
                      {!showQR && !(paymentOption === "custom" && (!customAmount || Number(customAmount) < minCustomAmount)) && (
                        <Button className="w-full" size="lg" onClick={() => setShowQR(true)} data-testid="button-generate-qr">
                          <Smartphone className="w-5 h-5 mr-2" /> Scan QR & Pay ₹{finalPayAmount}
                          {svcGstPercent > 0 && svcGstMode === "exclusive" && <span className="ml-1.5 text-xs opacity-80">(incl. GST)</span>}
                        </Button>
                      )}
                      {showQR && (
                        <div className="animate-in zoom-in-95 duration-300">
                          {/* QR Card */}
                          <div className="bg-gradient-to-b from-primary/5 to-background rounded-2xl border-2 border-primary/20 p-5 mb-5 text-center">
                            <p className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Pay via UPI</p>
                            <p className="text-xl font-bold font-display text-primary mb-4">{companyName}</p>

                            <div className="bg-white p-3 inline-block rounded-2xl border-4 border-primary shadow-xl shadow-primary/10 mb-4">
                              <img
                                src={qrUrl}
                                alt="UPI QR Code"
                                className="w-52 h-52"
                                data-testid="img-payment-qr"
                              />
                            </div>

                            <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-2">
                              <p className="text-2xl font-bold font-display text-accent">₹{fmt2(finalPayAmount)}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {svcGstPercent > 0 ? "Amount to pay now (GST included)" : "Amount to pay now"}
                              </p>
                              {svcGstPercent > 0 && gstAmount > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  CGST ₹{fmt2(cgstAmount)} + SGST ₹{fmt2(sgstAmount)} = ₹{fmt2(gstAmount)} GST
                                </p>
                              )}
                            </div>

                            {balance > 0 && (
                              <p className="text-xs text-muted-foreground">
                                + ₹{balance} remaining balance due at venue
                              </p>
                            )}
                          </div>

                          {/* Instructions */}
                          <div className="bg-muted/40 rounded-xl p-4 mb-4 space-y-2">
                            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-primary" /> How to pay
                            </p>
                            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                              <li>Open any UPI app (GPay, PhonePe, Paytm)</li>
                              <li>Tap "Scan QR" and scan the code above</li>
                              <li>Enter ₹{finalPayAmount} and complete payment</li>
                              <li>Come back here, enter the last 6 digits of transaction and tap the Complete button below</li>
                            </ol>
                          </div>

                          {/* Transaction ID */}
                          <div className="mb-5">
                            <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">₹</span>
                              Transaction ID
                              <span className="text-muted-foreground font-normal">(last 6 digits or full ID)</span>
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={15}
                              placeholder="e.g. 123456"
                              value={transactionId}
                              onChange={e => setTransactionId(e.target.value.replace(/\D/g, "").slice(0, 15))}
                              data-testid="input-transaction-id"
                              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono tracking-widest placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                            {transactionId.length > 0 && transactionId.length < 6 && (
                              <p className="text-xs text-destructive mt-1">Minimum 6 digits required</p>
                            )}
                          </div>

                          <Button
                            className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
                            size="lg"
                            onClick={handleConfirmPayment}
                            isLoading={isPending}
                            data-testid="button-confirm-payment"
                          >
                            <CheckCircle2 className="w-5 h-5 mr-2" /> Complete the Booking
                          </Button>
                          <p className="text-xs text-center text-muted-foreground mt-3">
                            Your booking will be confirmed only after clicking this button
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
