import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import { useEffect, useState, useRef } from "react";
import { format, addDays } from "date-fns";
import { Button, Input, Label, Card } from "@/components/ui";
import {
  LogOut, Image as ImageIcon, Settings as SettingsIcon, Pencil, X, Plus,
  Clock, Users, Tag, FileText, ChevronDown, ChevronUp, Save, AlarmClock, MapPin,
  Trash2, EyeOff, Eye, CalendarDays, ToggleLeft, ToggleRight, QrCode,
  Smartphone, MessageSquare, ChevronRight, ArrowLeft, User, Phone,
  Mail, KeyRound, Shield, MessageCircle, CheckSquare, Ticket, CreditCard,
  Gift, BadgePercent, Calendar as CalIcon, CheckCircle2, HelpCircle, UserCog,
  Upload, Link2, Maximize2, Minimize2, MessageCircleMore, HardDrive, Globe,
  Crop as CropIcon, Download, Database, Star, MonitorSmartphone, BadgeCheck, Play,
  Search, Loader2,
} from "lucide-react";
import { useServices, useCreateService, useUpdateService, useDeleteService } from "@/hooks/use-services";
import { useCreateBanner, useUpdateBanner, useDeleteBanner, useBanners } from "@/hooks/use-banners";
import { usePaymentSettings, useUpdatePaymentSettings } from "@/hooks/use-payment-settings";
import { useInclusions, useCreateInclusion, useDeleteInclusion } from "@/hooks/use-inclusions";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-categories";
import { InclusionIcon, INCLUSION_ICON_OPTIONS } from "@/lib/inclusion-icons";
import { useToast } from "@/hooks/use-toast";
import { ImageCropModal } from "@/components/image-crop-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Service, Banner } from "@shared/schema";

type Section = "profile" | "edit-profile" | "manage-services" | "manage-banners" | "manage-qr" | "manage-coupons" | "manage-faqs" | "manage-staffs" | "faq" | "whatsapp" | "email" | "storage" | "manage-categories" | "seo" | "booking-reminders" | "boarding-pass" | "delete-bookings" | "manage-generated-coupons" | "manage-referrals" | "my-coupons" | "chat-widget" | "sea-level" | "app-policies" | "business-details";

const AGE_GROUP_OPTIONS = ["All Ages", "Only Adults"];

function isBannerExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt); expiry.setHours(0, 0, 0, 0);
  return expiry < today;
}

// ─── Shared Confirm Dialog ────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel, isPending }: {
  message: string; onConfirm: () => void; onCancel: () => void; isPending?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-2xl border border-border p-6 w-full max-w-sm">
        <p className="text-foreground font-medium mb-5 text-center">{message}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-white" onClick={onConfirm} isLoading={isPending} data-testid="button-confirm-delete">Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Avatar Circle ────────────────────────────────────────────────────────────
function AvatarCircle({ name, size = "lg" }: { name?: string | null; size?: "sm" | "lg" }) {
  const initials = name ? name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";
  const dim = size === "lg" ? "w-24 h-24 text-3xl" : "w-14 h-14 text-xl";
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold select-none shadow-lg`}>
      {initials}
    </div>
  );
}

// ─── Edit Profile View ────────────────────────────────────────────────────────
function EditProfileSection({ onBack }: { onBack: () => void }) {
  const { user, updateProfile, isUpdatingProfile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Email OTP verification flow
  const [emailOtpStep, setEmailOtpStep] = useState<"idle" | "sending" | "verifying">("idle");
  const [emailOtp, setEmailOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  // Sync form fields when user data loads (fixes fullName not populating)
  const initialized = useRef(false);
  useEffect(() => {
    if (user && !initialized.current) {
      initialized.current = true;
      setFullName(user.fullName ?? "");
      setPhoneNumber(user.phoneNumber ?? user.mobileNumber ?? "");
      setWhatsappNumber(user.whatsappNumber ?? "");
      setEmail(user.email ?? "");
      setDateOfBirth(user.dateOfBirth ?? "");
      setUsername(user.username ?? "");
      setLoginPin(user.loginPin ?? "");
    }
  }, [user]);

  const hasChanges =
    fullName.trim() !== (user?.fullName ?? "") ||
    phoneNumber.trim() !== (user?.phoneNumber ?? user?.mobileNumber ?? "") ||
    whatsappNumber.trim() !== (user?.whatsappNumber ?? "") ||
    email.trim() !== (user?.email ?? "") ||
    dateOfBirth !== (user?.dateOfBirth ?? "") ||
    username.trim() !== (user?.username ?? "") ||
    loginPin.trim() !== (user?.loginPin ?? "") ||
    password.length > 0;

  const emailChanged = email.trim() !== (user?.email ?? "") && email.trim() !== "";

  const doSave = async (verifiedEmail?: string) => {
    const payload: Record<string, string> = {};
    if (fullName.trim()) payload.fullName = fullName.trim();
    if (phoneNumber.trim()) payload.phoneNumber = phoneNumber.trim();
    if (whatsappNumber.trim()) payload.whatsappNumber = whatsappNumber.trim();
    const emailToSave = verifiedEmail ?? (emailChanged ? "" : email.trim());
    if (emailToSave) payload.email = emailToSave;
    if (dateOfBirth) payload.dateOfBirth = dateOfBirth;
    if (username.trim()) payload.username = username.trim();
    if (password) payload.password = password;
    if (loginPin.trim()) payload.loginPin = loginPin.trim();

    await updateProfile(payload);
    toast({ title: "Profile updated successfully." });
    onBack();
  };

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      return toast({ title: "Passwords don't match", variant: "destructive" });
    }
    if (password && password.length < 6) {
      return toast({ title: "Password must be at least 6 characters", variant: "destructive" });
    }
    if (loginPin && !/^\d{4,6}$/.test(loginPin)) {
      return toast({ title: "Login PIN must be 4-6 digits", variant: "destructive" });
    }

    // If email changed, trigger OTP verification first
    if (emailChanged) {
      setEmailOtpStep("sending");
      setPendingEmail(email.trim());
      setEmailOtp("");
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), purpose: "register" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        toast({ title: "OTP Sent", description: `Enter the 6-digit code sent to ${email.trim()}` });
        setEmailOtpStep("verifying");
      } catch (err: any) {
        setEmailOtpStep("idle");
        toast({ title: "Failed to send OTP", description: err.message, variant: "destructive" });
      }
      return;
    }

    try {
      await doSave();
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtp.length !== 6) {
      return toast({ title: "Invalid OTP", description: "Enter the 6-digit code sent to your new email.", variant: "destructive" });
    }
    // Verify OTP via reset-password endpoint logic reuse — we'll verify server-side when saving
    // Instead, pass otp to backend via a dedicated verify endpoint approach.
    // Here we verify by attempting to call send-otp with verify mode — simpler: just save with otp field
    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, otp: emailOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // OTP verified — now save profile with the new email
      setEmailOtpStep("idle");
      await doSave(pendingEmail);
    } catch (err: any) {
      toast({ title: "OTP Verification Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" data-testid="button-back-profile">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold font-display text-foreground">Edit Profile</h2>
      </div>

      {/* Email OTP Verification Panel */}
      {emailOtpStep === "verifying" && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-4">
          <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Verify New Email
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Enter the 6-digit OTP sent to <span className="font-semibold text-foreground">{pendingEmail}</span>
          </p>
          <Input
            data-testid="input-email-otp"
            placeholder="6-digit OTP"
            value={emailOtp}
            onChange={e => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            className="mb-3"
          />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              onClick={handleVerifyEmailOtp}
              disabled={emailOtp.length !== 6}
              data-testid="button-verify-email-otp"
            >
              Verify & Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setEmailOtpStep("idle"); setEmailOtp(""); }}
              data-testid="button-cancel-email-otp"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <AvatarCircle name={fullName || user?.fullName || user?.mobileNumber} size="lg" />
        <p className="text-xs text-muted-foreground mt-2">Your initials are shown as avatar</p>
      </div>

      {/* Form */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm mb-4">
        <div>
          <Label>Full Name</Label>
          <Input data-testid="input-full-name" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div>
          <Label>Phone Number</Label>
          <Input data-testid="input-phone-number" placeholder="+91 9876543210" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} type="tel" />
        </div>
        <div>
          <Label>WhatsApp Number</Label>
          <Input data-testid="input-whatsapp-number" placeholder="+91 9876543210" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} type="tel" />
        </div>
        <div>
          <Label>Email ID</Label>
          <div className="relative">
            <Input
              data-testid="input-email"
              placeholder="yourmail@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              className={emailChanged ? "border-primary pr-24" : ""}
            />
            {emailChanged && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full pointer-events-none">
                Needs OTP
              </span>
            )}
          </div>
          {emailChanged && (
            <p className="text-xs text-muted-foreground mt-1 ml-1">A verification OTP will be sent to the new email before saving</p>
          )}
        </div>
        <div>
          <Label>Date of Birth</Label>
          <Input data-testid="input-date-of-birth" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} type="date" />
        </div>
        <div>
          <Label>Username</Label>
          <Input data-testid="input-username" placeholder="@yourusername" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        {/* Role read-only */}
        <div>
          <Label>Role</Label>
          <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-muted/40">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className={`text-sm font-semibold ${user?.isAdmin ? "text-primary" : "text-muted-foreground"}`}>{user?.isAdmin ? "Admin" : "Customer"}</span>
            <span className="text-xs text-muted-foreground">(not editable)</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> Security
        </h3>
        <div>
          <Label>New Password</Label>
          <div className="relative">
            <Input data-testid="input-password" className="pr-10" placeholder="Leave blank to keep current" value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? "text" : "password"} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <Label>Confirm Password</Label>
          <Input data-testid="input-confirm-password" placeholder="Re-enter new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type={showPassword ? "text" : "password"} />
        </div>
        <div>
          <Label>Login PIN (4–6 digits)</Label>
          <Input data-testid="input-login-pin" placeholder="e.g. 1234" value={loginPin} onChange={e => setLoginPin(e.target.value)} type="password" maxLength={6} inputMode="numeric" />
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={handleSave}
        isLoading={isUpdatingProfile || emailOtpStep === "sending"}
        disabled={!hasChanges || emailOtpStep === "verifying"}
        data-testid="button-save-profile"
      >
        <Save className="w-4 h-4 mr-2" /> {emailChanged ? "Send OTP & Save" : "Save"}
      </Button>
    </div>
  );
}

// ─── Profile Card View ────────────────────────────────────────────────────────
function ProfileSection({ onNavigate, onLogout }: { onNavigate: (s: Section) => void; onLogout: () => void }) {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ "Manage Details": true, "Message Setup": false, "App Configuration": false });
  const toggleGroup = (label: string) =>
    setOpenGroups(prev => {
      const isCurrentlyOpen = prev[label];
      const allClosed = Object.fromEntries(Object.keys(prev).map(k => [k, false]));
      return { ...allClosed, [label]: !isCurrentlyOpen };
    });
  const { data: myWallet } = useQuery<any | null>({ queryKey: ["/api/referrals/my-wallet"], enabled: !!user });
  const { data: visitorData } = useQuery<{ total: number; active: number }>({
    queryKey: ["/api/visitors/today"],
    enabled: isAdmin,
    refetchInterval: 5000,
    staleTime: 0,
  });

  type MenuItem = { label: string; icon: React.ReactNode; section?: Section; href?: string; download?: boolean; testId: string };
  type MenuGroup = { label: string; items: MenuItem[] };

  const adminGroups: MenuGroup[] = isAdmin ? [
    {
      label: "Manage Details",
      items: [
        { label: "Categories", icon: <Tag className="w-5 h-5 text-violet-500" />, section: "manage-categories", testId: "menu-manage-categories" },
        { label: "Services", icon: <SettingsIcon className="w-5 h-5 text-accent" />, section: "manage-services", testId: "menu-manage-services" },
        { label: "Banners", icon: <ImageIcon className="w-5 h-5 text-primary" />, section: "manage-banners", testId: "menu-manage-banners" },
        { label: "Add Staffs", icon: <UserCog className="w-5 h-5 text-indigo-500" />, section: "manage-staffs", testId: "menu-manage-staffs" },
        { label: "Manage FAQs", icon: <HelpCircle className="w-5 h-5 text-sky-500" />, section: "manage-faqs", testId: "menu-manage-faqs" },
        { label: "Create Coupons", icon: <Ticket className="w-5 h-5 text-purple-500" />, section: "manage-coupons", testId: "menu-manage-coupons" },
        { label: "Booking Auto Coupons", icon: <Gift className="w-5 h-5 text-amber-500" />, section: "manage-generated-coupons", testId: "menu-manage-generated-coupons" },
        { label: "Referrals", icon: <Users className="w-5 h-5 text-blue-500" />, section: "manage-referrals", testId: "menu-manage-referrals" },
      ],
    },
    {
      label: "Message Setup",
      items: [
        { label: "WhatsApp Messages", icon: <MessageCircleMore className="w-5 h-5 text-green-500" />, section: "whatsapp", testId: "menu-whatsapp" },
        { label: "Email Notifications", icon: <Mail className="w-5 h-5 text-blue-500" />, section: "email", testId: "menu-email" },
        { label: "Booking Reminders", icon: <AlarmClock className="w-5 h-5 text-amber-500" />, section: "booking-reminders", testId: "menu-booking-reminders" },
        { label: "Chat Widget", icon: <MessageCircle className="w-5 h-5 text-emerald-500" />, section: "chat-widget", testId: "menu-chat-widget" },
      ],
    },
    {
      label: "App Configuration",
      items: [
        { label: "Business Details", icon: <BadgeCheck className="w-5 h-5 text-violet-500" />, section: "business-details", testId: "menu-business-details" },
        { label: "Payment & QR Settings", icon: <QrCode className="w-5 h-5 text-emerald-500" />, section: "manage-qr", testId: "menu-manage-qr" },
        { label: "Boarding Pass Settings", icon: <Ticket className="w-5 h-5 text-cyan-500" />, section: "boarding-pass", testId: "menu-boarding-pass" },
        { label: "Storage Settings", icon: <HardDrive className="w-5 h-5 text-orange-500" />, section: "storage", testId: "menu-storage" },
        { label: "SEO & Discoverability", icon: <Globe className="w-5 h-5 text-teal-500" />, section: "seo", testId: "menu-seo" },
        { label: "Sea Level Tracker", icon: <Play className="w-5 h-5 text-blue-500" />, section: "sea-level", testId: "menu-sea-level" },
        { label: "App Policies", icon: <FileText className="w-5 h-5 text-indigo-500" />, section: "app-policies", testId: "menu-app-policies" },
        { label: "Backup Database", icon: <Database className="w-5 h-5 text-cyan-500" />, href: "/api/admin/backup", download: true, testId: "button-download-backup" },
        { label: "Delete Bookings", icon: <Trash2 className="w-5 h-5 text-red-500" />, section: "delete-bookings", testId: "menu-delete-bookings" },
      ],
    },
  ] : [];

  return (
    <div className="animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-6 pt-2">
        <h1 className="text-2xl font-bold font-display text-foreground">Settings</h1>
        {isAdmin && visitorData !== undefined && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5" data-testid="text-active-users" title="Visitors active in last 15 minutes">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Active: {visitorData.active}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5" data-testid="text-total-visits" title="Total unique visitors today">
              <MonitorSmartphone className="w-3 h-3" />
              Visited: {visitorData.total}
            </span>
          </div>
        )}
      </div>

      {/* Admin accordion menu */}
      {adminGroups.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-4">
          {adminGroups.map((group, gi) => {
            const isOpen = !!openGroups[group.label];
            return (
              <div key={group.label} className={gi < adminGroups.length - 1 && !isOpen ? "border-b border-border/60" : ""}>
                {/* Parent row */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left ${isOpen ? "border-b border-border/60" : ""}`}
                  data-testid={`group-${group.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <span className="flex-1 font-semibold text-foreground">{group.label}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {/* Child items */}
                {isOpen && (
                  <div className="bg-muted/20">
                    {group.items.map((item, i) => {
                      const cls = `w-full flex items-center gap-3 pl-8 pr-5 py-3.5 hover:bg-muted/40 transition-colors text-left ${i < group.items.length - 1 ? "border-b border-border/40" : ""}`;
                      const inner = (
                        <>
                          <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center flex-shrink-0 shadow-sm border border-border/50">{item.icon}</div>
                          <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                          {item.download ? <Download className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        </>
                      );
                      return item.href ? (
                        <a key={item.testId} href={item.href} download={item.download} data-testid={item.testId} className={cls}>{inner}</a>
                      ) : (
                        <button key={item.testId} data-testid={item.testId} onClick={() => item.section && onNavigate(item.section)} className={cls}>{inner}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Referral Wallet — shown only when user's phone matches a referral */}
      {myWallet && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm overflow-hidden mb-4 p-5" data-testid="referral-wallet-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-blue-900 dark:text-blue-100">Referral Wallet</h3>
                <span className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">Your earnings from confirmed bookings</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Code: <span className="font-mono font-semibold">{myWallet.code}</span></p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white/60 dark:bg-white/10 rounded-xl p-2.5 text-center">
              <div className="font-bold text-lg text-blue-900 dark:text-blue-100">{myWallet.confirmedCount}</div>
              <div className="text-blue-600 dark:text-blue-400">Bookings</div>
            </div>
            <div className="bg-white/60 dark:bg-white/10 rounded-xl p-2.5 text-center">
              <div className="font-bold text-lg text-blue-900 dark:text-blue-100">₹{myWallet.totalEarned}</div>
              <div className="text-blue-600 dark:text-blue-400">Total Earned</div>
            </div>
            <div className={`rounded-xl p-2.5 text-center ${myWallet.pendingAmount > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-white/60 dark:bg-white/10"}`}>
              <div className={`font-bold text-lg ${myWallet.pendingAmount > 0 ? "text-amber-700 dark:text-amber-400" : "text-blue-900 dark:text-blue-100"}`}>₹{myWallet.pendingAmount}</div>
              <div className={myWallet.pendingAmount > 0 ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"}>Pending</div>
            </div>
          </div>
          {myWallet.totalPaidOut > 0 && (
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">₹{myWallet.totalPaidOut} already received</p>
          )}
        </div>
      )}

      {/* User Details / Logout / FAQ — flat rows */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* User Details */}
        <button
          data-testid="menu-user-details"
          onClick={() => onNavigate("edit-profile")}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors text-left border-b border-border/60"
        >
          <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <span className="font-medium text-foreground">User Details</span>
            <p className="text-xs text-muted-foreground">Manage your profile</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Log Out */}
        <button
          data-testid="button-logout"
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left border-b border-border/60 group"
        >
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <span className="flex-1 font-medium text-red-600 dark:text-red-400">Log Out</span>
          <ChevronRight className="w-4 h-4 text-red-400" />
        </button>

        {/* FAQ's */}
        <button
          data-testid="menu-faq"
          onClick={() => onNavigate("faq")}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-sky-500" />
          </div>
          <div className="flex-1">
            <span className="font-medium text-foreground">FAQ's</span>
            <p className="text-xs text-muted-foreground">Any doubts? Read here</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// ─── Sub-section wrapper with back button ─────────────────────────────────────
function SubSection({ title, onBack, children, addButton }: {
  title: string; onBack: () => void; children: React.ReactNode; addButton?: React.ReactNode;
}) {
  return (
    <div className="animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" data-testid="button-back-subsection">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold font-display text-foreground flex-1">{title}</h2>
        {addButton}
      </div>
      {children}
    </div>
  );
}

// ─── Google Drive URL converter ──────────────────────────────────────────────
function toDirectImageUrl(url: string): string {
  if (!url) return url;
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  return url;
}

// ─── Service Editor Modal ────────────────────────────────────────────────────
const MAX_PHOTOS = 5;

async function uploadPhotoToServer(file: File): Promise<string> {
  const form = new FormData();
  form.append("photo", file);
  const res = await fetch("/api/upload/photo", { method: "POST", body: form, credentials: "include" });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Upload failed"); }
  return (await res.json()).url as string;
}

async function fetchAsFile(url: string, name = "image"): Promise<File> {
  const fetchUrl = url.startsWith("/") ? url : `/api/proxy-image?url=${encodeURIComponent(url)}`;
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error("Could not fetch image");
  const blob = await res.blob();
  const ext = (blob.type || "image/jpeg").includes("png") ? "png" : "jpg";
  return new File([blob], `${name}.${ext}`, { type: blob.type || "image/jpeg" });
}

function ServiceCategorySelector({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const { data: categories = [] } = useCategories();
  return (
    <div>
      <Label>Category <span className="text-muted-foreground font-normal text-xs">— Optional</span></Label>
      <select
        data-testid="select-service-category"
        value={value ?? ""}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">No Category</option>
        {categories.map((c: any) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}

function ServiceEditor({ service, onClose }: { service?: Service; onClose: () => void }) {
  const { mutateAsync: createService, isPending: creating } = useCreateService();
  const { mutateAsync: updateService, isPending: updating } = useUpdateService();
  const { mutateAsync: createInclusion, isPending: creatingInclusion } = useCreateInclusion();
  const { data: allInclusions } = useInclusions();
  const { data: allServices = [] } = useServices();
  const { toast } = useToast();
  const isPending = creating || updating;
  const isNew = !service;

  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [imageUrl, setImageUrl] = useState(service?.imageUrl ?? "");
  const [price, setPrice] = useState(service ? String(service.price) : "");
  const [mrpPrice, setMrpPrice] = useState(service?.mrpPrice ? String(service.mrpPrice) : "");
  const [priceType, setPriceType] = useState<"pax" | "group" | "night">(
    (service?.priceType as any) === "group" ? "group" : (service?.priceType as any) === "night" ? "night" : "pax"
  );
  const [categoryId, setCategoryId] = useState<number | null>(service?.categoryId ?? null);
  const [checkInTime, setCheckInTime] = useState(service?.checkInTime ?? "");
  const [checkOutTime, setCheckOutTime] = useState(service?.checkOutTime ?? "");
  const [bedrooms, setBedrooms] = useState<number>((service as any)?.bedrooms ?? 0);
  const [adultOccupancy, setAdultOccupancy] = useState<number>((service as any)?.adultOccupancy ?? 0);
  const [kidsOccupancy, setKidsOccupancy] = useState<number>((service as any)?.kidsOccupancy ?? 0);
  const [duration, setDuration] = useState(service?.duration ?? "2 Hours");
  const [ageGroup, setAgeGroup] = useState(service?.ageGroup ?? "All Ages");
  const [timeSlots, setTimeSlots] = useState<string[]>(
    service?.timeSlots && service.timeSlots.length > 0 ? service.timeSlots : ["06:00 AM", "08:30 AM", "04:00 PM", "05:30 PM"]
  );
  const [newSlot, setNewSlot] = useState("");
  const [photos, setPhotos] = useState<string[]>(service?.photos ?? []);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [cropPending, setCropPending] = useState<{ file: File; defaultAspect: number; onCropped: (f: File) => Promise<void> } | null>(null);
  const [selectedInclusionIds, setSelectedInclusionIds] = useState<number[]>((service as any)?.inclusionIds ?? []);
  const [minPax, setMinPax] = useState(service?.minPax ?? 0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [newInclusionName, setNewInclusionName] = useState("");
  const [newInclusionIcon, setNewInclusionIcon] = useState("Star");
  const [showAddInclusion, setShowAddInclusion] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [bookingType, setBookingType] = useState<"online" | "manual">((service as any)?.bookingType === "manual" ? "manual" : "online");
  const [manualWaNumber, setManualWaNumber] = useState((service as any)?.manualWaNumber ?? "");
  const [manualEmail, setManualEmail] = useState((service as any)?.manualEmail ?? "");
  const [videoUrl, setVideoUrl] = useState((service as any)?.videoUrl ?? "");
  const [gstPercent, setGstPercent] = useState<number>((service as any)?.gstPercent ?? 0);
  const [gstMode, setGstMode] = useState<"exclusive" | "inclusive">((service as any)?.gstMode === "inclusive" ? "inclusive" : "exclusive");
  const [displaySequence, setDisplaySequence] = useState<number | null>((service as any)?.displaySequence ?? null);
  const [seqDropOpen, setSeqDropOpen] = useState(false);
  const seqDropRef = useRef<HTMLDivElement>(null);

  // Compute taken sequences and next available for the selected category
  const takenSequences = (allServices as any[])
    .filter(s => s.categoryId === categoryId && s.id !== service?.id && s.displaySequence != null)
    .map(s => s.displaySequence as number);

  const nextAvailable = (() => {
    const taken = new Set(takenSequences);
    let n = 1;
    while (taken.has(n)) n++;
    return n;
  })();

  // Auto-populate when category changes (and sequence not manually set)
  useEffect(() => {
    if (categoryId != null) {
      setDisplaySequence(nextAvailable);
    } else {
      setDisplaySequence(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  // Close seq dropdown on outside click
  useEffect(() => {
    if (!seqDropOpen) return;
    const h = (e: MouseEvent) => { if (seqDropRef.current && !seqDropRef.current.contains(e.target as Node)) setSeqDropOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [seqDropOpen]);

  // Build the 5-slot dropdown options: show 1..max where max = max(taken, nextAvailable)+4, always ≥ 5
  const seqOptions = (() => {
    const maxTaken = takenSequences.length > 0 ? Math.max(...takenSequences) : 0;
    const upperBound = Math.max(maxTaken, nextAvailable) + 4;
    const count = Math.max(5, upperBound);
    return Array.from({ length: count }, (_, i) => i + 1);
  })();

  const toggleInclusion = (id: number) => {
    setSelectedInclusionIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddInclusion = async () => {
    if (!newInclusionName.trim()) return;
    try {
      const created = await createInclusion({ name: newInclusionName.trim(), icon: newInclusionIcon });
      setSelectedInclusionIds(prev => [...prev, created.id]);
      setNewInclusionName("");
      setNewInclusionIcon("Star");
      setShowAddInclusion(false);
      toast({ title: "Inclusion created and selected." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddSlot = () => {
    const trimmed = newSlot.trim();
    if (!trimmed) return;
    if (timeSlots.includes(trimmed)) { toast({ title: "Slot already exists", variant: "destructive" }); return; }
    setTimeSlots(prev => [...prev, trimmed]);
    setNewSlot("");
  };

  const handlePhotoFileChange = (slotIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCropPending({
      file,
      defaultAspect: 4 / 3,
      onCropped: async (croppedFile) => {
        setCropPending(null);
        setUploadingIdx(slotIdx);
        try {
          const url = await uploadPhotoToServer(croppedFile);
          setPhotos(prev => {
            const next = [...prev];
            next[slotIdx] = url;
            return next;
          });
          toast({ title: "Photo uploaded successfully." });
        } catch (err: any) {
          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        } finally {
          setUploadingIdx(null);
        }
      },
    });
  };

  const handlePhotoRemove = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCropPending({
      file,
      defaultAspect: 16 / 9,
      onCropped: async (croppedFile) => {
        setCropPending(null);
        setUploadingCover(true);
        try {
          const url = await uploadPhotoToServer(croppedFile);
          setImageUrl(url);
          toast({ title: "Cover image uploaded!" });
        } catch (err: any) {
          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        } finally {
          setUploadingCover(false);
        }
      },
    });
  };

  const handleAdjustCover = async () => {
    if (!imageUrl) return;
    try {
      const file = await fetchAsFile(toDirectImageUrl(imageUrl), "cover");
      setCropPending({
        file,
        defaultAspect: 16 / 9,
        onCropped: async (croppedFile) => {
          setCropPending(null);
          setUploadingCover(true);
          try {
            const url = await uploadPhotoToServer(croppedFile);
            setImageUrl(url);
            toast({ title: "Cover image updated!" });
          } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" });
          } finally {
            setUploadingCover(false);
          }
        },
      });
    } catch (err: any) {
      toast({ title: "Could not load image", description: err.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    if (!price || isNaN(Number(price)) || Number(price) < 0) return toast({ title: "Valid price is required", variant: "destructive" });
    if (priceType !== "night" && timeSlots.length === 0) return toast({ title: "Add at least one time slot", variant: "destructive" });
    const resolvedImageUrl = toDirectImageUrl(imageUrl.trim());
    const parsedMrp = mrpPrice.trim() ? Number(mrpPrice) : null;
    const payload = { name: name.trim(), description: description.trim(), imageUrl: resolvedImageUrl || undefined, price: Number(price), mrpPrice: parsedMrp, priceType, duration: duration.trim(), ageGroup: priceType === "night" ? null : ageGroup, timeSlots: priceType === "night" ? [] : timeSlots, isActive: true, photos, inclusionIds: selectedInclusionIds, minPax: priceType === "night" ? 0 : Math.max(0, minPax), categoryId: categoryId ?? null, checkInTime: priceType === "night" ? checkInTime.trim() || null : null, checkOutTime: priceType === "night" ? checkOutTime.trim() || null : null, bedrooms: priceType === "night" ? bedrooms : 0, adultOccupancy: priceType === "night" ? adultOccupancy : 0, kidsOccupancy: priceType === "night" ? kidsOccupancy : 0, bookingType, manualWaNumber: bookingType === "manual" ? manualWaNumber.trim() || null : null, manualEmail: bookingType === "manual" ? manualEmail.trim() || null : null, videoUrl: videoUrl.trim() || null, gstPercent: Math.max(0, Math.min(28, gstPercent || 0)), gstMode, displaySequence: categoryId != null ? displaySequence : null };
    try {
      if (isNew) { await createService(payload as any); toast({ title: "Service created successfully." }); }
      else { await updateService({ id: service!.id, ...payload }); toast({ title: "Service updated successfully." }); }
      onClose();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const emptySlots = MAX_PHOTOS - photos.length;

  return (
    <>
    {cropPending && (
      <ImageCropModal
        file={cropPending.file}
        defaultAspect={cropPending.defaultAspect}
        onDone={cropPending.onCropped}
        onCancel={() => setCropPending(null)}
      />
    )}
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm pb-20 sm:pb-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border flex flex-col" style={{ maxHeight: "min(88dvh, 88vh)" }}>
        <div className="bg-background border-b border-border px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold font-display">{isNew ? "Add New Service" : "Edit Service"}</h2>
            {!isNew && <p className="text-xs text-muted-foreground mt-0.5">{service!.name}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center" data-testid="button-close-editor">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-6 min-h-0">
          <section>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Basic Info</h3>
            <div className="space-y-4">
              <div><Label>Service Name</Label><Input data-testid="input-service-name" placeholder="e.g. Sunrise Kayaking" value={name} onChange={e => setName(e.target.value)} /></div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Description</Label>
                  <button
                    type="button"
                    onClick={() => setDescExpanded(v => !v)}
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:opacity-70 transition-opacity"
                    data-testid="button-expand-description"
                  >
                    {descExpanded ? <><Minimize2 className="w-3.5 h-3.5" /> Collapse</> : <><Maximize2 className="w-3.5 h-3.5" /> Expand</>}
                  </button>
                </div>
                <textarea
                  data-testid="input-service-description"
                  rows={descExpanded ? 30 : 5}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground transition-all duration-200"
                  placeholder="Describe this kayaking experience in detail..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                {(() => {
                  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
                  const over = wordCount > 2000;
                  return (
                    <p className={`text-xs mt-1 text-right ${over ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                      {wordCount} / 2000 words{over ? " — over limit" : ""}
                    </p>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* Cover Image */}
          <section>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Cover Image</h3>
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                data-testid="button-upload-cover"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingCover ? "Uploading…" : "Upload from Device"}
              </Button>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFileChange} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" /><span>or paste URL</span><div className="flex-1 h-px bg-border" />
              </div>
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input
                  data-testid="input-service-image"
                  placeholder="https://… or Google Drive share link"
                  value={imageUrl}
                  onChange={e => setImageUrl(toDirectImageUrl(e.target.value))}
                  className="flex-1"
                />
              </div>
              {imageUrl.includes("drive.google.com/uc?") && (
                <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Drive link auto-converted to direct URL</p>
              )}
            </div>
            {imageUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border border-border h-36 relative group cursor-pointer">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <Button size="sm" variant="secondary" type="button" onClick={handleAdjustCover} disabled={uploadingCover} className="gap-1.5 text-xs">
                    <CropIcon className="w-3.5 h-3.5" /> Adjust / Re-crop
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Gallery Photos */}
          <section>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-1 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Gallery Photos</h3>
            <p className="text-xs text-muted-foreground mb-3">Upload up to {MAX_PHOTOS} photos · Shown to users when they view the service (max 5MB each)</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {/* Existing photos */}
              {photos.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted group" data-testid={`photo-slot-${idx}`}>
                  <img
                    src={url}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3C/svg%3E"; }}
                  />
                  {/* Replace + Remove overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                    <label className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center cursor-pointer hover:bg-white shadow-sm">
                      <Plus className="w-3.5 h-3.5 text-foreground" />
                      <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoFileChange(idx, e)} disabled={uploadingIdx !== null} />
                    </label>
                    <button onClick={() => handlePhotoRemove(idx)} className="w-7 h-7 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-600 shadow-sm" data-testid={`button-remove-photo-${idx}`}>
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/50 rounded px-1">{idx + 1}</span>
                </div>
              ))}
              {/* Empty slots */}
              {photos.length < MAX_PHOTOS && Array.from({ length: emptySlots }).map((_, i) => {
                const slotIdx = photos.length + i;
                const isUploading = uploadingIdx === slotIdx;
                return (
                  <label
                    key={`empty-${i}`}
                    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                      isUploading ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                    } ${i > 0 && uploadingIdx !== null ? "opacity-50 pointer-events-none" : ""}`}
                    data-testid={`photo-upload-slot-${slotIdx}`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-[9px] text-primary font-medium">Uploading</span>
                      </div>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-muted-foreground/60" />
                        <span className="text-[9px] text-muted-foreground font-medium">Add Photo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handlePhotoFileChange(slotIdx, e)}
                      disabled={uploadingIdx !== null}
                    />
                  </label>
                );
              })}
            </div>
            {photos.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">{photos.length}/{MAX_PHOTOS} photos · Hover over a photo to replace or remove it</p>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2"><Tag className="w-4 h-4" /> Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Selling Price (₹)</Label>
                <div className="flex gap-2">
                  <Input data-testid="input-service-price" type="number" min={0} placeholder="1500" value={price} onChange={e => setPrice(e.target.value)} className="flex-1" />
                  <select
                    data-testid="select-price-type"
                    value={priceType}
                    onChange={e => setPriceType(e.target.value as "pax" | "group" | "night")}
                    className="h-10 w-32 flex-shrink-0 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="pax">Per Pax</option>
                    <option value="group">Per Group</option>
                    <option value="night">Per Night</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>MRP Price (₹) <span className="text-muted-foreground font-normal text-xs">— Optional</span></Label>
                <Input data-testid="input-service-mrp" type="number" min={0} placeholder="2000" value={mrpPrice} onChange={e => setMrpPrice(e.target.value)} />
              </div>
              {priceType === "night" ? (
                <>
                  <div>
                    <Label>Check-in Time</Label>
                    <Input data-testid="input-service-checkin" placeholder="e.g. 2:00 PM" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">Standard check-in time (1 Night = 12 hrs)</p>
                  </div>
                  <div>
                    <Label>Check-out Time</Label>
                    <Input data-testid="input-service-checkout" placeholder="e.g. 2:00 PM next day" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} />
                  </div>
                </>
              ) : (
                <div>
                  <Label>{priceType === "group" ? "Maximum Pax In Group" : "Minimum Pax Required"}</Label>
                  <Input
                    data-testid="input-service-minpax"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={minPax}
                    onChange={e => setMinPax(Math.max(0, parseInt(e.target.value || "0", 10)))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {priceType === "group"
                      ? "Set 0 for no limit. Customers cannot book more pax than this for a group."
                      : "Set 0 for no minimum. Customers cannot book fewer than this number of pax."}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* GST / Tax Configuration */}
          <section>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2"><BadgePercent className="w-4 h-4" /> Tax / GST</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <Label>GST Rate (%)</Label>
                  <Input
                    data-testid="input-service-gst"
                    type="number"
                    min={0}
                    max={28}
                    placeholder="0"
                    value={gstPercent === 0 ? "" : String(gstPercent)}
                    onChange={e => {
                      const v = parseInt(e.target.value || "0", 10);
                      setGstPercent(Math.max(0, Math.min(28, isNaN(v) ? 0 : v)));
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Set 0 to disable GST. CGST &amp; SGST will be split equally.</p>
                </div>
                <div>
                  {gstPercent > 0 && (
                    <div className="flex gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2.5 border border-border">
                      <span>CGST {gstPercent / 2}%</span>
                      <span className="text-border">|</span>
                      <span>SGST {gstPercent / 2}%</span>
                    </div>
                  )}
                </div>
              </div>

              {gstPercent > 0 && (
                <div>
                  <Label className="mb-2 block">Tax Mode</Label>
                  <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border w-fit">
                    <button
                      type="button"
                      data-testid="btn-gst-exclusive"
                      onClick={() => setGstMode("exclusive")}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${gstMode === "exclusive" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Tax Exclusive
                    </button>
                    <button
                      type="button"
                      data-testid="btn-gst-inclusive"
                      onClick={() => setGstMode("inclusive")}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${gstMode === "inclusive" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Tax Inclusive
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {gstMode === "exclusive"
                      ? "GST is added on top of the selling price. Customer pays: Price + GST."
                      : "GST is included in the selling price. Customer pays the displayed price (GST embedded)."}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {priceType !== "night" && (
                <>
                  <div><Label>Duration</Label><Input data-testid="input-service-duration" placeholder="e.g. 2 Hours" value={duration} onChange={e => setDuration(e.target.value)} /></div>
                  <div><Label>Age Group</Label><select data-testid="select-service-agegroup" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>{AGE_GROUP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                </>
              )}
              {priceType === "night" && (
                <>
                  <div>
                    <Label>No of Bedrooms</Label>
                    <Input data-testid="input-service-bedrooms" type="number" min={0} placeholder="0" value={bedrooms} onChange={e => setBedrooms(Math.max(0, parseInt(e.target.value || "0", 10)))} />
                    <p className="text-xs text-muted-foreground mt-1">Number of bedrooms in the property</p>
                  </div>
                  <div>
                    <Label>Adult Occupancy</Label>
                    <Input data-testid="input-service-adult-occupancy" type="number" min={0} placeholder="0" value={adultOccupancy} onChange={e => setAdultOccupancy(Math.max(0, parseInt(e.target.value || "0", 10)))} />
                    <p className="text-xs text-muted-foreground mt-1">Max adults allowed. Set 0 for no limit.</p>
                  </div>
                  <div>
                    <Label>Kids Occupancy</Label>
                    <Input data-testid="input-service-kids-occupancy" type="number" min={0} placeholder="0" value={kidsOccupancy} onChange={e => setKidsOccupancy(Math.max(0, parseInt(e.target.value || "0", 10)))} />
                    <p className="text-xs text-muted-foreground mt-1">Max kids allowed. Set 0 for no limit.</p>
                  </div>
                </>
              )}
              <ServiceCategorySelector value={categoryId} onChange={setCategoryId} />

              {/* Display Sequence */}
              {categoryId != null && (
                <div>
                  <Label>Display Sequence (Home Page)</Label>
                  <div ref={seqDropRef} className="relative mt-1.5">
                    <button
                      type="button"
                      data-testid="btn-display-sequence"
                      onClick={() => setSeqDropOpen(o => !o)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg text-sm bg-background hover:bg-muted transition-colors"
                    >
                      <span>
                        {displaySequence != null ? (
                          <span className="font-semibold">#{displaySequence}{takenSequences.includes(displaySequence) ? <span className="ml-2 text-xs text-amber-500 font-normal">(will displace current holder)</span> : <span className="ml-2 text-xs text-green-600 font-normal">(available)</span>}</span>
                        ) : "Select position…"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${seqDropOpen ? "rotate-180" : ""}`} />
                    </button>
                    {seqDropOpen && (
                      <div className="absolute left-0 top-full mt-1 z-50 bg-background border border-border rounded-xl shadow-lg w-full overflow-hidden">
                        {seqOptions.map(seq => {
                          const isTaken = takenSequences.includes(seq);
                          const isSelected = displaySequence === seq;
                          return (
                            <button
                              key={seq}
                              type="button"
                              data-testid={`seq-option-${seq}`}
                              onClick={() => { setDisplaySequence(seq); setSeqDropOpen(false); }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-muted ${isSelected ? "bg-primary/5 text-primary font-semibold" : ""}`}
                            >
                              <span className={isTaken && !isSelected ? "text-muted-foreground" : ""}>Position #{seq}</span>
                              {isTaken ? (
                                <span className="text-xs text-muted-foreground ml-2">Taken</span>
                              ) : (
                                <span className="text-xs text-green-600 ml-2">Available</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Controls the order services appear within their category. Choosing a taken position bumps the other service to the next available spot.</p>
                </div>
              )}
            </div>
          </section>
          {priceType !== "night" && (
          <section>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Time Slots</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {timeSlots.map(slot => (
                <div key={slot} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-sm font-medium">
                  <AlarmClock className="w-3.5 h-3.5" />{slot}
                  <button onClick={() => setTimeSlots(p => p.filter(s => s !== slot))} className="ml-1 text-primary/60 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                </div>
              ))}
              {timeSlots.length === 0 && <p className="text-sm text-muted-foreground">No time slots yet.</p>}
            </div>
            <div className="flex gap-2">
              <Input data-testid="input-new-timeslot" placeholder="e.g. 07:00 AM" value={newSlot} onChange={e => setNewSlot(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddSlot()} />
              <Button variant="outline" onClick={handleAddSlot} data-testid="button-add-timeslot"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Format: 06:00 AM — Press Enter or click Add</p>
          </section>
          )}

          {/* Inclusions */}
          <section>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> Inclusions
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Select what's included in this service. Tap to toggle.</p>
            {allInclusions && allInclusions.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {allInclusions.map(inc => {
                  const selected = selectedInclusionIds.includes(inc.id);
                  return (
                    <button
                      key={inc.id}
                      type="button"
                      data-testid={`inclusion-toggle-${inc.id}`}
                      onClick={() => toggleInclusion(inc.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      <InclusionIcon icon={inc.icon} className="w-3.5 h-3.5" />
                      {inc.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">No inclusions yet.</p>
            )}

            {showAddInclusion ? (
              <div className="border border-border rounded-2xl p-4 bg-muted/30 space-y-3">
                <p className="text-xs font-semibold text-foreground">New Inclusion</p>
                <Input
                  data-testid="input-new-inclusion-name"
                  placeholder="e.g. Towel, First Aid Kit…"
                  value={newInclusionName}
                  onChange={e => setNewInclusionName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddInclusion()}
                />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Pick an icon:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {INCLUSION_ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        title={icon}
                        onClick={() => setNewInclusionIcon(icon)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                          newInclusionIcon === icon
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        <InclusionIcon icon={icon} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowAddInclusion(false)}>Cancel</Button>
                  <Button size="sm" className="flex-1" onClick={handleAddInclusion} isLoading={creatingInclusion} data-testid="button-create-inclusion">
                    Create & Select
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                data-testid="button-show-add-inclusion"
                onClick={() => setShowAddInclusion(true)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Create new inclusion
              </button>
            )}
          </section>

          {/* Video Link */}
          <section>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Play className="w-4 h-4" /> Video Link
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Add a YouTube or Instagram video link for this service. It will appear as a clickable icon on the service card.</p>
            <Input
              data-testid="input-video-url"
              placeholder="https://youtube.com/watch?v=... or https://instagram.com/reel/..."
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
            />
          </section>

          {/* Booking Setup */}
          <section>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Booking Setup
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setBookingType("online")}
                data-testid="button-booking-type-online"
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${bookingType === "online" ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40"}`}
              >
                <QrCode className="w-7 h-7" />
                <div className="text-center">
                  <p className="font-semibold text-sm">Online Booking</p>
                  <p className={`text-xs mt-0.5 ${bookingType === "online" ? "text-primary/70" : "text-muted-foreground"}`}>UPI / QR payment</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setBookingType("manual")}
                data-testid="button-booking-type-manual"
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${bookingType === "manual" ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40"}`}
              >
                <MessageCircleMore className="w-7 h-7" />
                <div className="text-center">
                  <p className="font-semibold text-sm">Manual Booking</p>
                  <p className={`text-xs mt-0.5 ${bookingType === "manual" ? "text-primary/70" : "text-muted-foreground"}`}>WhatsApp / Email</p>
                </div>
              </button>
            </div>
            {bookingType === "manual" && (
              <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border animate-in slide-in-from-top-2">
                <p className="text-xs text-muted-foreground">Customers will contact you directly. QR code is hidden. Enter the contact details for this service.</p>
                <div>
                  <Label className="flex items-center gap-1.5 mb-1"><Phone className="w-3.5 h-3.5" /> WhatsApp Number</Label>
                  <Input
                    data-testid="input-manual-wa-number"
                    placeholder="91XXXXXXXXXX (with country code)"
                    value={manualWaNumber}
                    onChange={e => setManualWaNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Customers tap a button to open WhatsApp with booking details pre-filled.</p>
                </div>
                <div>
                  <Label className="flex items-center gap-1.5 mb-1"><Mail className="w-3.5 h-3.5" /> Email Address</Label>
                  <Input
                    data-testid="input-manual-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={manualEmail}
                    onChange={e => setManualEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Booking details will be emailed to this address when a customer submits.</p>
                </div>
              </div>
            )}
          </section>
        </div>
        <div className="bg-background border-t border-border p-4 flex gap-3 flex-shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} isLoading={isPending} disabled={uploadingIdx !== null} data-testid="button-save-service"><Save className="w-4 h-4 mr-2" />{isNew ? "Create" : "Save"}</Button>
        </div>
      </div>
    </div>
    </>
  );
}

// ─── Service Row ─────────────────────────────────────────────────────────────
function ServiceRow({ service }: { service: Service }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutateAsync: updateService, isPending: toggling } = useUpdateService();
  const { mutateAsync: deleteService, isPending: deleting } = useDeleteService();
  const { toast } = useToast();

  const handleToggleActive = async () => {
    try { await updateService({ id: service.id, isActive: !service.isActive }); toast({ title: service.isActive ? "Service hidden from customers." : "Service is now active." }); }
    catch { toast({ title: "Failed to update service", variant: "destructive" }); }
  };
  const handleDelete = async () => {
    try { await deleteService(service.id); toast({ title: "Service deleted." }); }
    catch { toast({ title: "Failed to delete service", variant: "destructive" }); }
    setConfirmDelete(false);
  };

  return (
    <>
      {editing && <ServiceEditor service={service} onClose={() => setEditing(false)} />}
      {confirmDelete && <ConfirmDialog message={`Delete "${service.name}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} isPending={deleting} />}
      <div className={`rounded-xl border overflow-hidden transition-colors ${service.isActive ? "border-border bg-card" : "border-border/50 bg-muted/30"}`}>
        <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/20 transition-colors" onClick={() => setExpanded(v => !v)} data-testid={`button-expand-service-${service.id}`}>
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
            {service.imageUrl ? <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10"><ImageIcon className="w-5 h-5 text-primary/40" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-bold truncate ${!service.isActive ? "text-muted-foreground" : "text-foreground"}`}>{service.name}</p>
              {!service.isActive && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium flex-shrink-0">Hidden</span>}
            </div>
            <p className="text-sm text-muted-foreground">₹{service.price}/pax &middot; {service.duration || "—"}</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        </button>
        {expanded && (
          <div className="border-t border-border px-4 py-4 bg-muted/10 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{service.description}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-4 h-4 text-primary" />{service.duration || "Duration not set"}</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="w-4 h-4 text-primary" />{service.ageGroup || "All Ages"}</div>
              {(service.minPax ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400"><Users className="w-4 h-4" />{service.priceType === "group" ? `Max ${service.minPax} pax` : `Min ${service.minPax} pax`}</div>
              )}
            </div>
            {service.timeSlots && service.timeSlots.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Time Slots</p>
                <div className="flex flex-wrap gap-2">{service.timeSlots.map((slot, i) => <span key={i} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-medium">{slot}</span>)}</div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid={`button-edit-service-${service.id}`}><Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>
              <Button size="sm" variant="outline" onClick={handleToggleActive} isLoading={toggling} data-testid={`button-toggle-service-${service.id}`}>{service.isActive ? <><EyeOff className="w-3.5 h-3.5 mr-1.5" /> Hide</> : <><Eye className="w-3.5 h-3.5 mr-1.5" /> Show</>}</Button>
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:border-destructive hover:bg-destructive/5" onClick={() => setConfirmDelete(true)} data-testid={`button-delete-service-${service.id}`}><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Banner Editor Modal ─────────────────────────────────────────────────────
function BannerEditor({ banner, onClose }: { banner?: Banner; onClose: () => void }) {
  const { mutateAsync: createBanner, isPending: creating } = useCreateBanner();
  const { mutateAsync: updateBanner, isPending: updating } = useUpdateBanner();
  const { toast } = useToast();
  const isPending = creating || updating;
  const isNew = !banner;

  const [title, setTitle] = useState(banner?.title ?? "");
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? "");
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [expiresAt, setExpiresAt] = useState(banner?.expiresAt ?? "");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerImgInputRef = useRef<HTMLInputElement>(null);
  const [cropPending, setCropPending] = useState<{ file: File; defaultAspect: number; onCropped: (f: File) => Promise<void> } | null>(null);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCropPending({
      file,
      defaultAspect: 16 / 9,
      onCropped: async (croppedFile) => {
        setCropPending(null);
        setUploadingBanner(true);
        try {
          const url = await uploadPhotoToServer(croppedFile);
          setImageUrl(url);
          toast({ title: "Banner image uploaded!" });
        } catch (err: any) {
          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        } finally {
          setUploadingBanner(false);
        }
      },
    });
  };

  const handleAdjustBanner = async () => {
    if (!imageUrl) return;
    try {
      const file = await fetchAsFile(toDirectImageUrl(imageUrl), "banner");
      setCropPending({
        file,
        defaultAspect: 16 / 9,
        onCropped: async (croppedFile) => {
          setCropPending(null);
          setUploadingBanner(true);
          try {
            const url = await uploadPhotoToServer(croppedFile);
            setImageUrl(url);
            toast({ title: "Banner image updated!" });
          } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" });
          } finally {
            setUploadingBanner(false);
          }
        },
      });
    } catch (err: any) {
      toast({ title: "Could not load image", description: err.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return toast({ title: "Title is required", variant: "destructive" });
    if (!imageUrl.trim()) return toast({ title: "Image URL is required", variant: "destructive" });
    const resolvedImageUrl = toDirectImageUrl(imageUrl.trim());
    const payload = { title: title.trim(), imageUrl: resolvedImageUrl, isActive, expiresAt: expiresAt || null };
    try {
      if (isNew) { await createBanner(payload as any); toast({ title: "Banner created successfully." }); }
      else { await updateBanner({ id: banner!.id, ...payload }); toast({ title: "Banner updated successfully." }); }
      onClose();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  return (
    <>
    {cropPending && (
      <ImageCropModal
        file={cropPending.file}
        defaultAspect={cropPending.defaultAspect}
        onDone={cropPending.onCropped}
        onCancel={() => setCropPending(null)}
      />
    )}
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm pb-20 sm:pb-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border flex flex-col" style={{ maxHeight: "min(88dvh, 88vh)" }}>
        <div className="bg-background border-b border-border px-5 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold font-display">{isNew ? "Add New Banner" : "Edit Banner"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 min-h-0">
          <div><Label>Banner Title</Label><Input data-testid="input-banner-title" placeholder="e.g. Summer Special Offer!" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-3">
            <Label>Banner Image</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => bannerImgInputRef.current?.click()}
              disabled={uploadingBanner}
              data-testid="button-upload-banner"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadingBanner ? "Uploading…" : "Upload from Device"}
            </Button>
            <input ref={bannerImgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFileChange} />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" /><span>or paste URL</span><div className="flex-1 h-px bg-border" />
            </div>
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                data-testid="input-banner-image"
                placeholder="https://… or Google Drive share link"
                value={imageUrl}
                onChange={e => setImageUrl(toDirectImageUrl(e.target.value))}
                className="flex-1"
              />
            </div>
            {imageUrl.includes("drive.google.com/uc?") && (
              <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Drive link auto-converted to direct URL</p>
            )}
            {imageUrl && (
              <div className="rounded-xl overflow-hidden border border-border h-28 relative group cursor-pointer">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <Button size="sm" variant="secondary" type="button" onClick={handleAdjustBanner} disabled={uploadingBanner} className="gap-1.5 text-xs">
                    <CropIcon className="w-3.5 h-3.5" /> Adjust / Re-crop
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
            <div><p className="font-medium text-sm">Active</p><p className="text-xs text-muted-foreground">Show this banner on the home screen</p></div>
            <button onClick={() => setIsActive(v => !v)} data-testid="toggle-banner-active" className="transition-colors">{isActive ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}</button>
          </div>
          <div>
            <Label className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-primary" /> Expiry Date (optional)</Label>
            <Input data-testid="input-banner-expiry" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">After this date the banner is automatically hidden and the default banner shows.</p>
          </div>
        </div>
        <div className="bg-background border-t border-border p-4 flex gap-3 flex-shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} isLoading={isPending} data-testid="button-save-banner"><Save className="w-4 h-4 mr-2" />{isNew ? "Create" : "Save"}</Button>
        </div>
      </div>
    </div>
    </>
  );
}

// ─── Banner Row ───────────────────────────────────────────────────────────────
function BannerRow({ banner }: { banner: Banner }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutateAsync: updateBanner, isPending: toggling } = useUpdateBanner();
  const { mutateAsync: deleteBanner, isPending: deleting } = useDeleteBanner();
  const { toast } = useToast();
  const expired = isBannerExpired(banner.expiresAt);

  const handleToggle = async () => {
    try { await updateBanner({ id: banner.id, isActive: !banner.isActive }); toast({ title: banner.isActive ? "Banner hidden." : "Banner is now active." }); }
    catch { toast({ title: "Failed to update banner", variant: "destructive" }); }
  };
  const handleDelete = async () => {
    try { await deleteBanner(banner.id); toast({ title: "Banner deleted." }); }
    catch { toast({ title: "Failed to delete banner", variant: "destructive" }); }
    setConfirmDelete(false);
  };

  return (
    <>
      {editing && <BannerEditor banner={banner} onClose={() => setEditing(false)} />}
      {confirmDelete && <ConfirmDialog message={`Delete banner "${banner.title}"?`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} isPending={deleting} />}
      <div className={`rounded-xl border overflow-hidden transition-colors ${banner.isActive && !expired ? "border-border bg-card" : "border-border/50 bg-muted/30"}`}>
        <div className="flex items-center gap-3 p-4">
          <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
            <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className={`font-bold text-sm truncate ${!banner.isActive || expired ? "text-muted-foreground" : "text-foreground"}`}>{banner.title}</p>
              {!banner.isActive && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">Hidden</span>}
              {expired && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-medium">Expired</span>}
            </div>
            {banner.expiresAt && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><CalendarDays className="w-3 h-3" />Expires {new Date(banner.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={handleToggle} className="transition-colors" data-testid={`toggle-banner-${banner.id}`} disabled={toggling}>{banner.isActive ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}</button>
            <button onClick={() => setEditing(true)} className="w-7 h-7 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors" data-testid={`button-edit-banner-${banner.id}`}><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => setConfirmDelete(true)} className="w-7 h-7 rounded-lg bg-muted hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors" data-testid={`button-delete-banner-${banner.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── QR Management ───────────────────────────────────────────────────────────
function QRManagement() {
  const { data: settings, isLoading } = usePaymentSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdatePaymentSettings();
  const { toast } = useToast();

  const [initialized, setInitialized] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"manual" | "phonepe">("manual");
  const [companyName, setCompanyName] = useState("");
  const [upiLink, setUpiLink] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [failedMessage, setFailedMessage] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [phonePeClientId, setPhonePeClientId] = useState("");
  const [phonePeClientSecret, setPhonePeClientSecret] = useState("");
  const [phonePeClientVersion, setPhonePeClientVersion] = useState("1");
  const [phonePeEnv, setPhonePeEnv] = useState<"sandbox" | "production">("sandbox");
  const [phonePeWebhookUsername, setPhonePeWebhookUsername] = useState("");
  const [phonePeWebhookPassword, setPhonePeWebhookPassword] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setInitialized(true);
      setPaymentMode(((settings as any).paymentMode as "manual" | "phonepe") || "manual");
      setCompanyName(settings.companyName ?? "");
      setUpiLink(settings.upiLink ?? "");
      setSuccessMessage(settings.successMessage ?? "");
      setFailedMessage(settings.failedMessage ?? "");
      setSiteUrl(settings.siteUrl ?? "");
      setPhonePeClientId((settings as any).phonePeClientId ?? "");
      setPhonePeClientSecret((settings as any).phonePeClientSecret ?? "");
      setPhonePeClientVersion(String((settings as any).phonePeClientVersion ?? 1));
      setPhonePeEnv(((settings as any).phonePeEnv as "sandbox" | "production") || "sandbox");
      setPhonePeWebhookUsername((settings as any).phonePeWebhookUsername ?? "");
      setPhonePeWebhookPassword((settings as any).phonePeWebhookPassword ?? "");
    }
  }, [settings, initialized]);

  const handleSave = async () => {
    if (!companyName.trim()) return toast({ title: "Company name is required", variant: "destructive" });
    if (paymentMode === "manual" && !upiLink.trim()) return toast({ title: "UPI ID / Link is required for manual payment", variant: "destructive" });
    if (paymentMode === "phonepe" && (!phonePeClientId.trim() || !phonePeClientSecret.trim())) {
      return toast({ title: "PhonePe Client ID and Secret are required", variant: "destructive" });
    }
    try {
      await updateSettings({
        companyName: companyName.trim(),
        upiLink: upiLink.trim(),
        successMessage: successMessage.trim(),
        failedMessage: failedMessage.trim(),
        siteUrl: siteUrl.trim(),
        paymentMode,
        phonePeClientId: phonePeClientId.trim(),
        phonePeClientSecret: phonePeClientSecret.trim(),
        phonePeClientVersion: parseInt(phonePeClientVersion) || 1,
        phonePeEnv,
        phonePeWebhookUsername: phonePeWebhookUsername.trim(),
        phonePeWebhookPassword: phonePeWebhookPassword.trim(),
      } as any);
      toast({ title: "Payment settings saved." });
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const previewQr = (() => {
    const trimmed = upiLink.trim();
    if (!trimmed) return null;
    const cn = companyName.trim() || "Business";
    if (trimmed.includes("@") && !trimmed.startsWith("upi://")) {
      const upiDeep = `upi://pay?pa=${encodeURIComponent(trimmed)}&pn=${encodeURIComponent(cn)}&am=0&cu=INR`;
      return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiDeep)}`;
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(trimmed)}`;
  })();

  if (isLoading || !initialized) return <div className="text-sm text-muted-foreground py-4">Loading payment settings...</div>;

  return (
    <div className="space-y-5">
      {/* Payment Mode Selector */}
      <div>
        <Label className="flex items-center gap-1.5 mb-2"><CreditCard className="w-4 h-4 text-primary" /> Payment Mode</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "manual", label: "Manual (UPI / QR)", desc: "Customer scans QR, enters Txn ID" },
            { id: "phonepe", label: "Online (PhonePe PG)", desc: "Auto-redirect to PhonePe checkout" },
          ].map(opt => (
            <button
              key={opt.id}
              data-testid={`button-payment-mode-${opt.id}`}
              onClick={() => setPaymentMode(opt.id as "manual" | "phonepe")}
              className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${paymentMode === opt.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
            >
              <span className="text-sm font-semibold text-foreground">{opt.label}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Company Name (shared) */}
      <div>
        <Label className="flex items-center gap-1.5 mb-1"><Smartphone className="w-4 h-4 text-primary" /> Company / Business Name</Label>
        <Input data-testid="input-company-name" placeholder="Local Goa Kayaking" value={companyName} onChange={e => setCompanyName(e.target.value)} />
        <p className="text-xs text-muted-foreground mt-1">Displayed on the payment screen</p>
      </div>

      {/* Website URL (shared) */}
      <div>
        <Label className="flex items-center gap-1.5 mb-1"><Globe className="w-4 h-4 text-primary" /> Website / Domain URL</Label>
        <Input data-testid="input-site-url" placeholder="https://localgoakayaking.com" value={siteUrl} onChange={e => setSiteUrl(e.target.value)} />
        <p className="text-xs text-muted-foreground mt-1">
          {paymentMode === "phonepe"
            ? "Used as the base URL for PhonePe redirect after payment — must be your public domain"
            : "Used when sharing service links"}
        </p>
      </div>

      {/* ── Manual mode fields ── */}
      {paymentMode === "manual" && (
        <>
          <div>
            <Label className="flex items-center gap-1.5 mb-1"><QrCode className="w-4 h-4 text-primary" /> UPI ID or UPI Deep Link</Label>
            <Input data-testid="input-upi-link" placeholder="yourname@upi  or  upi://pay?pa=..." value={upiLink} onChange={e => setUpiLink(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Enter your UPI ID (e.g. business@ybl) or full UPI link</p>
          </div>
          {previewQr && (
            <div className="flex flex-col items-center bg-muted/30 rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">QR Preview</p>
              <div className="bg-white p-3 rounded-2xl border-4 border-primary shadow-lg shadow-primary/10 mb-3"><img src={previewQr} alt="QR Preview" className="w-36 h-36" data-testid="img-qr-preview" /></div>
              <p className="text-sm font-bold text-primary">{companyName || "Business Name"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{upiLink}</p>
            </div>
          )}
        </>
      )}

      {/* ── PhonePe mode fields ── */}
      {paymentMode === "phonepe" && (
        <div className="space-y-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700/30 rounded-2xl p-4">
          <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] flex items-center justify-center font-bold">₱</span>
            PhonePe Payment Gateway Credentials
          </p>
          <p className="text-xs text-muted-foreground -mt-2">
            Get these from your <a href="https://business.phonepe.com" target="_blank" rel="noreferrer" className="text-primary underline">PhonePe Business Dashboard</a> → API Credentials
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Client ID <span className="text-destructive">*</span></Label>
              <Input
                data-testid="input-phonepe-client-id"
                placeholder="e.g. MERCHANT_CLIENT_ID"
                value={phonePeClientId}
                onChange={e => setPhonePeClientId(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Client Secret <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  data-testid="input-phonepe-client-secret"
                  type={showSecret ? "text" : "password"}
                  placeholder="••••••••••"
                  value={phonePeClientSecret}
                  onChange={e => setPhonePeClientSecret(e.target.value)}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(s => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Client Version</Label>
              <Input
                data-testid="input-phonepe-client-version"
                type="number"
                min={1}
                placeholder="1"
                value={phonePeClientVersion}
                onChange={e => setPhonePeClientVersion(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Environment</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["sandbox", "production"] as const).map(env => (
                  <button
                    key={env}
                    data-testid={`button-phonepe-env-${env}`}
                    onClick={() => setPhonePeEnv(env)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${phonePeEnv === env ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"}`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-orange-200 dark:border-orange-700/30 pt-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Webhook Credentials (optional — for server-to-server callbacks)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Webhook Username</Label>
                <Input data-testid="input-phonepe-webhook-user" placeholder="username" value={phonePeWebhookUsername} onChange={e => setPhonePeWebhookUsername(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Webhook Password</Label>
                <Input data-testid="input-phonepe-webhook-pass" type="password" placeholder="••••••••" value={phonePeWebhookPassword} onChange={e => setPhonePeWebhookPassword(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Webhook URL to register in PhonePe dashboard: <code className="bg-muted px-1 rounded text-[10px]">{siteUrl || window.location.origin}/api/phonepe/callback</code></p>
          </div>
        </div>
      )}

      {/* Success / Failed messages (shared) */}
      <div>
        <Label className="flex items-center gap-1.5 mb-1"><MessageSquare className="w-4 h-4 text-emerald-500" /> Payment Success Message</Label>
        <textarea data-testid="input-success-message" rows={2} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground" placeholder="Thank you! Your booking is confirmed..." value={successMessage} onChange={e => setSuccessMessage(e.target.value)} />
        <p className="text-xs text-muted-foreground mt-1">Shown to customer after successful payment & booking</p>
      </div>
      <div>
        <Label className="flex items-center gap-1.5 mb-1"><MessageSquare className="w-4 h-4 text-red-500" /> Payment Failed Message</Label>
        <textarea data-testid="input-failed-message" rows={2} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground" placeholder="Payment could not be confirmed. Please contact us..." value={failedMessage} onChange={e => setFailedMessage(e.target.value)} />
        <p className="text-xs text-muted-foreground mt-1">Shown when payment or booking confirmation fails</p>
      </div>
      <Button className="w-full" onClick={handleSave} isLoading={isPending} data-testid="button-save-payment-settings">
        <Save className="w-4 h-4 mr-2" /> Save
      </Button>
    </div>
  );
}

// ─── Boarding Pass Settings ────────────────────────────────────────────────────
function BoardingPassSettings() {
  const { data: ps, isLoading } = usePaymentSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdatePaymentSettings();
  const { toast } = useToast();

  const [boardingLocation, setBoardingLocation] = useState("");
  const [terms, setTerms] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [proprietorName, setProprietorName] = useState("");
  const [proprietorNumber, setProprietorNumber] = useState("");

  useEffect(() => {
    if (!ps) return;
    setBoardingLocation((ps as any).boardingLocation ?? "");
    setTerms((ps as any).boardingPassTerms ?? "");
    setDisclaimer((ps as any).boardingPassDisclaimer ?? "");
    setGoogleReviewUrl((ps as any).googleReviewUrl ?? "");
    setProprietorName((ps as any).proprietorName ?? "");
    setProprietorNumber((ps as any).proprietorNumber ?? "");
  }, [ps]);

  const handleSave = async () => {
    await updateSettings({
      ...(ps as any),
      boardingLocation: boardingLocation.trim(),
      boardingPassTerms: terms.trim(),
      boardingPassDisclaimer: disclaimer.trim(),
      googleReviewUrl: googleReviewUrl.trim(),
      proprietorName: proprietorName.trim(),
      proprietorNumber: proprietorNumber.trim(),
    });
    toast({ title: "Boarding pass settings saved." });
  };

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;

  const googleQr = googleReviewUrl.trim()
    ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(googleReviewUrl)}`
    : null;

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Configure what appears on the boarding pass PDF that customers can download after their booking is confirmed.</p>

      <div>
        <Label className="flex items-center gap-1.5 mb-1"><MapPin className="w-4 h-4 text-primary" /> Boarding Location</Label>
        <Input
          data-testid="input-boarding-location"
          placeholder="e.g. https://maps.app.goo.gl/... or Dock No.3, Panaji"
          value={boardingLocation}
          onChange={e => setBoardingLocation(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">Shown on the boarding pass under Guest &amp; Journey. Can be a Google Maps link or address.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="flex items-center gap-1.5 mb-1"><UserCog className="w-4 h-4 text-primary" /> Proprietor Name</Label>
          <Input
            data-testid="input-proprietor-name"
            placeholder="e.g. Rahul Desai"
            value={proprietorName}
            onChange={e => setProprietorName(e.target.value)}
          />
        </div>
        <div>
          <Label className="flex items-center gap-1.5 mb-1"><Phone className="w-4 h-4 text-primary" /> Proprietor Number</Label>
          <Input
            data-testid="input-proprietor-number"
            type="tel"
            placeholder="e.g. 9876543210"
            value={proprietorNumber}
            onChange={e => setProprietorNumber(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label className="flex items-center gap-1.5 mb-1"><FileText className="w-4 h-4 text-primary" /> Terms &amp; Conditions</Label>
        <textarea
          data-testid="input-boarding-pass-terms"
          rows={6}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          placeholder={"1. Please arrive 10 minutes before departure.\n2. Token amount is non-refundable in case of no-show.\n3. Full refund if cancelled due to weather or operator side issues.\n4. Complete payment before boarding."}
          value={terms}
          onChange={e => setTerms(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">Each line becomes a separate condition on the boarding pass.</p>
      </div>

      <div>
        <Label className="flex items-center gap-1.5 mb-1"><Shield className="w-4 h-4 text-primary" /> Disclaimer</Label>
        <textarea
          data-testid="input-boarding-pass-disclaimer"
          rows={2}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          placeholder="This is an electronically generated boarding pass. Please carry a valid photo ID."
          value={disclaimer}
          onChange={e => setDisclaimer(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">Shown in italics at the bottom of the Terms section.</p>
      </div>

      <div>
        <Label className="flex items-center gap-1.5 mb-1"><Star className="w-4 h-4 text-yellow-500" /> Google Review URL</Label>
        <Input
          data-testid="input-google-review-url"
          placeholder="https://g.page/r/..."
          value={googleReviewUrl}
          onChange={e => setGoogleReviewUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">A QR code to this URL will appear at the bottom of the boarding pass so customers can easily rate you.</p>
        {googleQr && (
          <div className="mt-3 rounded-2xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" /> Preview of your Google Review QR code
            </p>
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-xl border border-yellow-200 shadow-sm inline-block shrink-0">
                <img src={googleQr} alt="Google Review QR" className="w-24 h-24 block" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Scan to rate us</p>
                <p className="text-xs text-muted-foreground leading-relaxed">This QR code will appear at the bottom of every boarding pass so customers can quickly leave a Google review.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Button className="w-full" onClick={handleSave} isLoading={isPending} data-testid="button-save-boarding-pass">
        <Save className="w-4 h-4 mr-2" /> Save Boarding Pass Settings
      </Button>
    </div>
  );
}

// ─── Manage Coupons Section ───────────────────────────────────────────────────
const EXPIRY_MONTH_OPTIONS = [1, 2, 3, 6, 12, 24, 36];

type CouponData = {
  id: number; code: string; type: string; discountType: string; discountValue: number;
  expiresAt: string; isActive: boolean; isUsed: boolean; createdForUserId: number | null; createdAt: string; minPax: number;
  categoryId: number | null; serviceId: number | null; maxUses: number; usedCount: number;
};
type CouponSettingsData = {
  id: number; bookingCouponEnabled: boolean; bookingCouponExpiryMonths: number;
  bookingCouponDiscountType: string; bookingCouponDiscountValue: number;
  bookingCouponCategoryId: number | null; bookingCouponServiceId: number | null;
};

function ManageReferralsSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [commissionType, setCommissionType] = useState<"fixed" | "percentage">("fixed");
  const [commissionValue, setCommissionValue] = useState("");
  const [linkedCouponCode, setLinkedCouponCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [payAmounts, setPayAmounts] = useState<Record<number, string>>({});
  const [showPayInput, setShowPayInput] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; code: string; phone: string; commissionType: "fixed" | "percentage"; commissionValue: string; linkedCouponCode: string }>({ name: "", code: "", phone: "", commissionType: "fixed", commissionValue: "", linkedCouponCode: "" });
  const [editError, setEditError] = useState<string | null>(null);

  const { data: referrals, isLoading } = useQuery<any[]>({ queryKey: ["/api/referrals"] });
  const { data: paymentSettings } = useQuery<any>({ queryKey: ["/api/payment-settings"] });
  const { data: allCoupons } = useQuery<any[]>({ queryKey: ["/api/coupons"] });
  const specialCouponsForReferral = (allCoupons ?? []).filter((c: any) => c.type === "special" && c.isActive);
  const baseUrl = (paymentSettings?.siteUrl ?? "").trim().replace(/\/$/, "") || window.location.origin;

  function copyLink(r: any) {
    const url = `${baseUrl}/?ref=${r.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(r.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/referrals", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({ title: "Referral created" });
      setShowForm(false);
      setName(""); setCode(""); setPhone(""); setCommissionValue(""); setLinkedCouponCode(""); setFormError(null);
    },
    onError: (e: any) => setFormError(e?.message ?? "Failed to create referral"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/referrals/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/referrals"] }); toast({ title: "Referral deleted" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/referrals/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({ title: "Referral updated" });
      setEditId(null);
      setEditError(null);
    },
    onError: (e: any) => setEditError(e?.message ?? "Failed to update referral"),
  });

  function startEdit(r: any) {
    setEditId(r.id);
    setEditError(null);
    setEditForm({ name: r.name, code: r.code, phone: r.phone ?? "", commissionType: r.commissionType, commissionValue: String(r.commissionValue), linkedCouponCode: r.linkedCouponCode ?? "" });
  }

  function handleUpdate() {
    setEditError(null);
    const val = parseInt(editForm.commissionValue);
    if (!editForm.name.trim() || !editForm.code.trim()) return setEditError("Name and code are required");
    if (isNaN(val) || val < 0) return setEditError("Commission value must be a positive number");
    if (editForm.commissionType === "percentage" && val > 100) return setEditError("Percentage cannot exceed 100");
    updateMutation.mutate({ id: editId!, data: { name: editForm.name.trim(), code: editForm.code.trim().toUpperCase(), phone: editForm.phone.trim() || null, commissionType: editForm.commissionType, commissionValue: val, linkedCouponCode: editForm.linkedCouponCode || null } });
  }

  const markPaidMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount?: number }) =>
      apiRequest("PATCH", `/api/referrals/${id}/mark-paid`, amount !== undefined ? { amount } : {}),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({ title: "Payment recorded" });
      setShowPayInput(prev => ({ ...prev, [vars.id]: false }));
      setPayAmounts(prev => ({ ...prev, [vars.id]: "" }));
    },
  });

  function handleCreate() {
    setFormError(null);
    const val = parseInt(commissionValue);
    if (!name.trim() || !code.trim()) return setFormError("Name and code are required");
    if (isNaN(val) || val < 0) return setFormError("Commission value must be a positive number");
    if (commissionType === "percentage" && val > 100) return setFormError("Percentage cannot exceed 100");
    createMutation.mutate({ name: name.trim(), code: code.trim().toUpperCase(), phone: phone.trim() || undefined, commissionType, commissionValue: val, linkedCouponCode: linkedCouponCode || null });
  }

  return (
    <SubSection title="Referrals" onBack={onBack}>
      <div className="space-y-4 -mt-3">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Track referral agents and their commissions.</p>
          <button onClick={() => setShowForm(v => !v)} data-testid="button-add-referral" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showForm && (
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">New Referral</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Name</Label>
                <Input placeholder="Agent / Partner name" value={name} onChange={e => setName(e.target.value)} data-testid="input-referral-name" />
              </div>
              <div className="col-span-2">
                <Label>Phone Number <span className="text-muted-foreground font-normal">(agent's mobile — for their wallet)</span></Label>
                <Input placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} data-testid="input-referral-phone" />
              </div>
              <div className="col-span-2">
                <Label>Referral Code</Label>
                <Input placeholder="e.g. JOHN20" value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="uppercase" data-testid="input-referral-code-admin" />
              </div>
              <div>
                <Label>Commission Type</Label>
                <select
                  value={commissionType}
                  onChange={e => setCommissionType(e.target.value as "fixed" | "percentage")}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  data-testid="select-commission-type"
                >
                  <option value="fixed">Fixed ₹</option>
                  <option value="percentage">Percentage %</option>
                </select>
              </div>
              <div>
                <Label>Value</Label>
                <Input type="number" min={0} placeholder={commissionType === "fixed" ? "e.g. 200" : "e.g. 10"} value={commissionValue} onChange={e => setCommissionValue(e.target.value)} data-testid="input-commission-value" />
              </div>
              <div className="col-span-2">
                <Label>Link Special Discount <span className="text-muted-foreground font-normal">(optional — auto-applied for users via this link)</span></Label>
                <select
                  value={linkedCouponCode}
                  onChange={e => setLinkedCouponCode(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  data-testid="select-linked-coupon"
                >
                  <option value="">— None —</option>
                  {specialCouponsForReferral.map((c: any) => (
                    <option key={c.id} value={c.code}>{c.code} ({c.discountType === "fixed" ? `₹${c.discountValue} off` : `${c.discountValue}% off`})</option>
                  ))}
                </select>
              </div>
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setFormError(null); }}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} isLoading={createMutation.isPending} data-testid="button-save-referral">Save</Button>
            </div>
          </Card>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !referrals?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No referrals yet.</p>
        ) : (
          <div className="space-y-3">
            {referrals.map((r: any) => (
              <Card key={r.id} className="p-4" data-testid={`card-referral-${r.id}`}>
                {/* Link row — always visible at top */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 min-w-0 bg-muted rounded-lg px-3 py-1.5 font-mono text-xs text-muted-foreground truncate">
                    {baseUrl}/?ref={r.code}
                  </div>
                  <Button
                    size="sm"
                    variant={copiedId === r.id ? "default" : "outline"}
                    className={`h-8 px-3 text-xs shrink-0 gap-1.5 ${copiedId === r.id ? "bg-emerald-500 hover:bg-emerald-500 text-white border-emerald-500" : ""}`}
                    onClick={() => copyLink(r)}
                    data-testid={`button-copy-link-${r.id}`}
                  >
                    {copiedId === r.id ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</>
                    ) : (
                      <><Link2 className="w-3.5 h-3.5" /> Copy</>
                    )}
                  </Button>
                </div>

                {editId === r.id ? (
                  /* ── Inline edit form ── */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <Label className="text-xs">Name</Label>
                        <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-sm" data-testid="input-edit-referral-name" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Phone</Label>
                        <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="h-8 text-sm" placeholder="+91 98765 43210" data-testid="input-edit-referral-phone" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Referral Code</Label>
                        <Input value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="h-8 text-sm uppercase" data-testid="input-edit-referral-code" />
                      </div>
                      <div>
                        <Label className="text-xs">Commission Type</Label>
                        <select value={editForm.commissionType} onChange={e => setEditForm(f => ({ ...f, commissionType: e.target.value as "fixed" | "percentage" }))} className="w-full border rounded-md px-2 py-1.5 text-sm bg-background h-8">
                          <option value="fixed">Fixed ₹</option>
                          <option value="percentage">Percentage %</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Value</Label>
                        <Input type="number" min={0} value={editForm.commissionValue} onChange={e => setEditForm(f => ({ ...f, commissionValue: e.target.value }))} className="h-8 text-sm" data-testid="input-edit-commission-value" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Link Special Discount <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <select value={editForm.linkedCouponCode} onChange={e => setEditForm(f => ({ ...f, linkedCouponCode: e.target.value }))} className="w-full border rounded-md px-2 py-1.5 text-sm bg-background h-8">
                          <option value="">— None —</option>
                          {specialCouponsForReferral.map((c: any) => (
                            <option key={c.id} value={c.code}>{c.code} ({c.discountType === "fixed" ? `₹${c.discountValue} off` : `${c.discountValue}% off`})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {editError && <p className="text-xs text-destructive">{editError}</p>}
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setEditId(null); setEditError(null); }}>Cancel</Button>
                      <Button size="sm" className="h-7 text-xs" onClick={handleUpdate} isLoading={updateMutation.isPending} data-testid={`button-save-edit-${r.id}`}>Save</Button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal view ── */
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{r.name}</span>
                          <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">{r.code}</span>
                          <span className="text-xs text-muted-foreground">
                            {r.commissionType === "fixed" ? `₹${r.commissionValue}` : `${r.commissionValue}%`} per booking
                          </span>
                          {r.linkedCouponCode && (
                            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Ticket className="w-3 h-3" />{r.linkedCouponCode}
                            </span>
                          )}
                        </div>
                        {r.phone && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</p>}
                        <div className="mt-2 grid grid-cols-4 gap-2 text-xs w-full">
                          <div className="bg-muted rounded-lg p-2 flex flex-col items-center justify-center text-center">
                            <div className="font-semibold text-base">{r.confirmedCount}</div>
                            <div className="text-muted-foreground">Bookings</div>
                          </div>
                          <div className="bg-muted rounded-lg p-2 flex flex-col items-center justify-center text-center">
                            <div className="font-semibold text-base">₹{r.totalEarned}</div>
                            <div className="text-muted-foreground">Wallet Bal.</div>
                          </div>
                          <div className={`rounded-lg p-2 flex flex-col items-center justify-center text-center ${r.pendingAmount > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-muted"}`}>
                            <div className={`font-semibold text-base ${r.pendingAmount > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>₹{r.pendingAmount}</div>
                            <div className="text-muted-foreground">Pending</div>
                          </div>
                          <div className={`rounded-lg p-2 flex flex-col items-center justify-center text-center ${r.totalPaidOut > 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-muted"}`}>
                            <div className={`font-semibold text-base ${r.totalPaidOut > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>₹{r.totalPaidOut}</div>
                            <div className="text-muted-foreground">Paid Out</div>
                          </div>
                        </div>
                        {r.pendingAmount > 0 && (
                          <div className="mt-2">
                            {showPayInput[r.id] ? (
                              <div className="flex gap-2 items-center">
                                <Input type="number" min={1} max={r.pendingAmount} placeholder={`Amount (max ₹${r.pendingAmount})`} value={payAmounts[r.id] ?? ""} onChange={e => setPayAmounts(prev => ({ ...prev, [r.id]: e.target.value }))} className="h-8 text-sm" data-testid={`input-pay-amount-${r.id}`} />
                                <Button size="sm" className="h-8 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white" onClick={() => { const amt = parseInt(payAmounts[r.id] ?? ""); if (!isNaN(amt) && amt > 0) markPaidMutation.mutate({ id: r.id, amount: amt }); }} isLoading={markPaidMutation.isPending} data-testid={`button-confirm-pay-${r.id}`}>Pay</Button>
                                <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => setShowPayInput(prev => ({ ...prev, [r.id]: false }))}>Cancel</Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-xs h-7 px-3 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20" onClick={() => setShowPayInput(prev => ({ ...prev, [r.id]: true }))} data-testid={`button-pay-partial-${r.id}`}>Pay Amount</Button>
                                <Button size="sm" variant="outline" className="text-xs h-7 px-3 text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => markPaidMutation.mutate({ id: r.id })} isLoading={markPaidMutation.isPending} data-testid={`button-mark-paid-${r.id}`}>Pay All ₹{r.pendingAmount}</Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-row gap-1 shrink-0">
                        <button onClick={() => startEdit(r)} data-testid={`button-edit-referral-${r.id}`} className="w-8 h-8 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(r.id)} disabled={deleteMutation.isPending} data-testid={`button-delete-referral-${r.id}`} className="w-8 h-8 rounded-lg bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center justify-center transition-colors disabled:opacity-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </SubSection>
  );
}

function GeneratedCouponsSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: coupons, isLoading } = useQuery<any[]>({ queryKey: ["/api/coupons"] });
  const { data: allServices } = useQuery<any[]>({ queryKey: ["/api/services"] });
  const { data: allCategories } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const { data: allBookings } = useQuery<any[]>({ queryKey: ["/api/bookings"] });

  const bookingCoupons = (coupons ?? []).filter((c: any) => c.type === "booking");

  function getBookingForCoupon(c: any): any | null {
    if (!allBookings) return null;
    if (c.earnedFromBookingId) return (allBookings as any[]).find(b => b.id === c.earnedFromBookingId) ?? null;
    if (c.createdForUserId) return (allBookings as any[]).find(b => b.userId === c.createdForUserId) ?? null;
    return null;
  }

  const deleteCoupon = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/coupons/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/coupons"] }); toast({ title: "Coupon deleted" }); },
  });

  function couponStatusBadge(c: any) {
    const now = new Date();
    const exp = new Date(c.expiresAt);
    if (c.isUsed) return <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-medium line-through">Used</span>;
    if (!c.isActive) return <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">Voided</span>;
    if (exp < now) return <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full font-medium">Expired</span>;
    return <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Active</span>;
  }

  function formatExpiry(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" data-testid="button-back-generated-coupons">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold font-display text-foreground flex-1">Booking Auto Coupons</h2>
        <span className="text-sm font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{bookingCoupons.length}</span>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
        ) : bookingCoupons.length === 0 ? (
          <div className="text-center py-10">
            <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No generated coupons yet.</p>
            <p className="text-xs text-muted-foreground mt-1">They appear here once customers receive confirmed bookings.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...bookingCoupons].reverse().map((c: any) => (
              <div key={c.id} className="flex items-start justify-between p-3 rounded-xl border border-border bg-muted/20" data-testid={`coupon-generated-${c.id}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-foreground">{c.code}</span>
                    {couponStatusBadge(c)}
                  </div>
                  {(() => {
                    const bk = getBookingForCoupon(c);
                    return bk ? (
                      <p className="text-xs mt-0.5 flex items-center gap-1 text-primary font-medium">
                        <User className="w-3 h-3" />
                        {bk.fullName}
                        {c.earnedFromBookingId && <span className="text-muted-foreground font-normal">· #{String(c.earnedFromBookingId).padStart(4, "0")}</span>}
                      </p>
                    ) : null;
                  })()}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.discountType === "fixed" ? `₹${c.discountValue} off` : `${c.discountValue}% off`} · Expires {formatExpiry(c.expiresAt)}
                  </p>
                  {(c.serviceId || c.categoryId) && (
                    <p className="text-xs mt-0.5 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-violet-500" />
                      {c.serviceId
                        ? <span className="text-violet-600 dark:text-violet-400 font-medium">Only: {(allServices ?? []).find((s: any) => s.id === c.serviceId)?.name ?? `Service #${c.serviceId}`}</span>
                        : <span className="text-violet-600 dark:text-violet-400 font-medium">Category: {(allCategories ?? []).find((cat: any) => cat.id === c.categoryId)?.name ?? `Cat #${c.categoryId}`}</span>
                      }
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteCoupon.mutate(c.id)}
                  className="ml-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  data-testid={`button-delete-generated-coupon-${c.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ManageCouponsSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"booking" | "special">("booking");

  const { data: settings, isLoading: loadingSettings } = useQuery<CouponSettingsData>({ queryKey: ["/api/coupon-settings"] });
  const { data: coupons, isLoading: loadingCoupons } = useQuery<CouponData[]>({ queryKey: ["/api/coupons"] });

  const { mutate: saveSettings, isPending: savingSettings } = useMutation({
    mutationFn: (data: Partial<CouponSettingsData>) => apiRequest("PATCH", "/api/coupon-settings", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/coupon-settings"] }); toast({ title: "Settings saved" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const { mutate: createCoupon, isPending: creatingCoupon } = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/coupons", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/coupons"] }); toast({ title: "Coupon created!" }); setNewCode(""); setNewExpiry(""); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const { mutate: deleteCoupon } = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/coupons/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/coupons"] }); toast({ title: "Coupon deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  // Booking coupon settings local state
  const [enabled, setEnabled] = useState<boolean | undefined>(undefined);
  const [expiryMonths, setExpiryMonths] = useState<number | undefined>(undefined);
  const [discountType, setDiscountType] = useState<string | undefined>(undefined);
  const [discountValue, setDiscountValue] = useState<string | undefined>(undefined);
  const [bookingScopeType, setBookingScopeType] = useState<"all" | "category" | "service">("all");
  const [bookingCategoryId, setBookingCategoryId] = useState<number | null>(null);
  const [bookingServiceId, setBookingServiceId] = useState<number | null>(null);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.bookingCouponEnabled);
      setExpiryMonths(settings.bookingCouponExpiryMonths);
      setDiscountType(settings.bookingCouponDiscountType);
      setDiscountValue(String(settings.bookingCouponDiscountValue));
      if (settings.bookingCouponServiceId) {
        setBookingScopeType("service");
        setBookingServiceId(settings.bookingCouponServiceId);
        setBookingCategoryId(null);
      } else if (settings.bookingCouponCategoryId) {
        setBookingScopeType("category");
        setBookingCategoryId(settings.bookingCouponCategoryId);
        setBookingServiceId(null);
      } else {
        setBookingScopeType("all");
        setBookingCategoryId(null);
        setBookingServiceId(null);
      }
    }
  }, [settings]);

  const { data: allCategories = [] } = useCategories();
  const { data: allServices = [] } = useServices();

  // Special coupon form state
  const [newCode, setNewCode] = useState("");
  const [newDiscountType, setNewDiscountType] = useState("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newMinPax, setNewMinPax] = useState("0");
  const [newMaxUses, setNewMaxUses] = useState("0");
  const [newScopeType, setNewScopeType] = useState<"all" | "category" | "service">("all");
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [newServiceId, setNewServiceId] = useState<number | null>(null);

  const handleSaveBookingSettings = () => {
    if (!discountValue || isNaN(Number(discountValue)) || Number(discountValue) < 1) {
      return toast({ title: "Enter a valid discount value", variant: "destructive" });
    }
    if (bookingScopeType === "category" && !bookingCategoryId) {
      return toast({ title: "Please select a category", variant: "destructive" });
    }
    if (bookingScopeType === "service" && !bookingServiceId) {
      return toast({ title: "Please select a service", variant: "destructive" });
    }
    saveSettings({
      bookingCouponEnabled: enabled,
      bookingCouponExpiryMonths: expiryMonths,
      bookingCouponDiscountType: discountType,
      bookingCouponDiscountValue: Number(discountValue),
      bookingCouponCategoryId: bookingScopeType === "category" ? bookingCategoryId : null,
      bookingCouponServiceId: bookingScopeType === "service" ? bookingServiceId : null,
    });
  };

  const handleCreateSpecial = () => {
    if (!newCode.trim()) return toast({ title: "Coupon code is required", variant: "destructive" });
    if (!newDiscountValue || isNaN(Number(newDiscountValue)) || Number(newDiscountValue) < 1)
      return toast({ title: "Enter a valid discount value", variant: "destructive" });
    if (!newExpiry) return toast({ title: "Expiry date is required", variant: "destructive" });
    if (new Date(newExpiry) <= new Date()) return toast({ title: "Expiry date must be in the future", variant: "destructive" });
    if (newScopeType === "category" && !newCategoryId) return toast({ title: "Please select a category", variant: "destructive" });
    if (newScopeType === "service" && !newServiceId) return toast({ title: "Please select a service", variant: "destructive" });
    const minPaxVal = parseInt(newMinPax || "0", 10);
    const maxUsesVal = parseInt(newMaxUses || "0", 10);
    createCoupon({
      code: newCode.trim().toUpperCase(),
      discountType: newDiscountType,
      discountValue: Number(newDiscountValue),
      expiresAt: newExpiry,
      minPax: isNaN(minPaxVal) ? 0 : minPaxVal,
      maxUses: isNaN(maxUsesVal) ? 0 : maxUsesVal,
      categoryId: newScopeType === "category" ? newCategoryId : null,
      serviceId: newScopeType === "service" ? newServiceId : null,
    });
    setNewMinPax("0");
    setNewMaxUses("0");
    setNewScopeType("all");
    setNewCategoryId(null);
    setNewServiceId(null);
  };

  const bookingCoupons = (coupons ?? []).filter(c => c.type === "booking");
  const specialCoupons = (coupons ?? []).filter(c => c.type === "special");

  function couponStatusBadge(c: CouponData) {
    const now = new Date();
    const exp = new Date(c.expiresAt);
    const limitReached = c.type === "special" && c.maxUses > 0 && c.usedCount >= c.maxUses;
    if (limitReached) return <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-medium">Limit Reached</span>;
    if (c.isUsed) return <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-medium line-through">Used</span>;
    if (!c.isActive) return <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium line-through">Voided</span>;
    if (exp < now) return <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full font-medium">Expired</span>;
    return <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Active</span>;
  }

  function formatExpiry(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" data-testid="button-back-coupons">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold font-display text-foreground flex-1">Manage Coupons</h2>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-5 bg-muted/40 rounded-xl p-1">
        <button
          onClick={() => setTab("booking")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "booking" ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}
          data-testid="tab-booking-coupons"
        >
          <Gift className="w-4 h-4" /> Booking Coupons
        </button>
        <button
          onClick={() => setTab("special")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "special" ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}
          data-testid="tab-special-coupons"
        >
          <BadgePercent className="w-4 h-4" /> Special Coupons
        </button>
      </div>

      {tab === "booking" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Settings Card */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" /> Booking Coupon Settings
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When enabled, a unique coupon code is automatically sent to customers after their booking is confirmed. They can use it on their next booking or share it as a referral.
            </p>

            {loadingSettings ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Loading...</div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                  <div>
                    <p className="font-medium text-sm">Auto-generate on Booking Confirm</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Customers get a coupon when admin confirms their booking</p>
                  </div>
                  <button onClick={() => setEnabled(v => !v)} className="transition-colors" data-testid="toggle-booking-coupon-enabled">
                    {enabled ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                  </button>
                </div>

                {enabled && (
                  <div className="space-y-3 animate-in slide-in-from-top-2">
                    <div>
                      <Label className="flex items-center gap-1.5 mb-1"><AlarmClock className="w-4 h-4 text-primary" /> Coupon Valid For</Label>
                      <div className="flex flex-wrap gap-2">
                        {EXPIRY_MONTH_OPTIONS.map(m => (
                          <button
                            key={m}
                            onClick={() => setExpiryMonths(m)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${expiryMonths === m ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted/40"}`}
                            data-testid={`button-expiry-${m}`}
                          >
                            {m} {m === 1 ? "Month" : "Months"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="flex items-center gap-1.5 mb-1"><BadgePercent className="w-4 h-4 text-primary" /> Discount Type</Label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDiscountType("percentage")}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${discountType === "percentage" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted/40"}`}
                          data-testid="button-discount-type-percentage"
                        >
                          % Percentage
                        </button>
                        <button
                          onClick={() => setDiscountType("fixed")}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${discountType === "fixed" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted/40"}`}
                          data-testid="button-discount-type-fixed"
                        >
                          ₹ Fixed Amount
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label>{discountType === "fixed" ? "Discount Amount (₹)" : "Discount Percentage (%)"}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={discountType === "percentage" ? 100 : undefined}
                        placeholder={discountType === "fixed" ? "e.g. 200" : "e.g. 10"}
                        value={discountValue ?? ""}
                        onChange={e => setDiscountValue(e.target.value)}
                        data-testid="input-discount-value"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1.5 mb-1">
                        <Tag className="w-4 h-4 text-primary" /> Coupon Applicable To
                      </Label>
                      <div className="flex gap-2">
                        {(["all", "category", "service"] as const).map(opt => (
                          <button
                            key={opt}
                            onClick={() => { setBookingScopeType(opt); setBookingCategoryId(null); setBookingServiceId(null); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${bookingScopeType === opt ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted/40"}`}
                            data-testid={`button-booking-scope-${opt}`}
                          >
                            {opt === "all" ? "All" : opt === "category" ? "Category" : "Service"}
                          </button>
                        ))}
                      </div>
                      {bookingScopeType === "category" && (
                        <select
                          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          value={bookingCategoryId ?? ""}
                          onChange={e => setBookingCategoryId(e.target.value ? Number(e.target.value) : null)}
                          data-testid="select-booking-coupon-category"
                        >
                          <option value="">— Select Category —</option>
                          {allCategories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      )}
                      {bookingScopeType === "service" && (
                        <select
                          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          value={bookingServiceId ?? ""}
                          onChange={e => setBookingServiceId(e.target.value ? Number(e.target.value) : null)}
                          data-testid="select-booking-coupon-service"
                        >
                          <option value="">— Select Service —</option>
                          {(allServices as any[]).map((svc: any) => (
                            <option key={svc.id} value={svc.id}>{svc.name}</option>
                          ))}
                        </select>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {bookingScopeType === "all"
                          ? "Coupon will be valid for any service."
                          : bookingScopeType === "category"
                          ? "Coupon will only work for services in the selected category."
                          : "Coupon will only work for the selected service."}
                      </p>
                    </div>
                  </div>
                )}

                <Button className="w-full" onClick={handleSaveBookingSettings} isLoading={savingSettings} data-testid="button-save-coupon-settings">
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </>
            )}
          </div>

        </div>
      )}

      {tab === "special" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Create special coupon */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <BadgePercent className="w-4 h-4 text-accent" /> Create Special Coupon
            </h3>
            <p className="text-xs text-muted-foreground">Create promo codes to share on social media. Customers can enter these during booking to get a discount.</p>
            <div>
              <Label>Coupon Code</Label>
              <Input
                placeholder="e.g. GOA20, SUMMER25"
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                className="uppercase font-mono"
                data-testid="input-new-coupon-code"
              />
              <p className="text-xs text-muted-foreground mt-1">Letters, numbers, hyphens only. Will be saved in UPPERCASE.</p>
            </div>
            <div>
              <Label>Discount Type</Label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setNewDiscountType("percentage")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${newDiscountType === "percentage" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted/40"}`}
                  data-testid="button-new-discount-type-percentage"
                >
                  % Percentage
                </button>
                <button
                  onClick={() => setNewDiscountType("fixed")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${newDiscountType === "fixed" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted/40"}`}
                  data-testid="button-new-discount-type-fixed"
                >
                  ₹ Fixed Amount
                </button>
              </div>
            </div>
            <div>
              <Label>{newDiscountType === "fixed" ? "Discount Amount (₹)" : "Discount Percentage (%)"}</Label>
              <Input
                type="number"
                min={1}
                max={newDiscountType === "percentage" ? 100 : undefined}
                placeholder={newDiscountType === "fixed" ? "e.g. 300" : "e.g. 20"}
                value={newDiscountValue}
                onChange={e => setNewDiscountValue(e.target.value)}
                data-testid="input-new-discount-value"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><CalIcon className="w-4 h-4 text-primary" /> Expiry Date</Label>
              <Input
                type="date"
                value={newExpiry}
                onChange={e => setNewExpiry(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                data-testid="input-new-coupon-expiry"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Minimum Pax Required
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="0 (no minimum)"
                value={newMinPax}
                onChange={e => setNewMinPax(e.target.value)}
                data-testid="input-new-coupon-min-pax"
              />
              <p className="text-xs text-muted-foreground mt-1">Set to 0 for no restriction. Set to 5 to allow only group bookings of 5+ pax.</p>
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-primary" /> Booking Limit
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="0 (unlimited)"
                value={newMaxUses}
                onChange={e => setNewMaxUses(e.target.value)}
                data-testid="input-new-coupon-max-uses"
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum number of bookings this coupon can be applied to. Set to 0 for unlimited.</p>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-1">
                <Tag className="w-4 h-4 text-primary" /> Applicable To
              </Label>
              <div className="flex gap-2">
                {(["all", "category", "service"] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setNewScopeType(opt); setNewCategoryId(null); setNewServiceId(null); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${newScopeType === opt ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted/40"}`}
                    data-testid={`button-coupon-scope-${opt}`}
                  >
                    {opt === "all" ? "All Services" : opt === "category" ? "Category" : "Service"}
                  </button>
                ))}
              </div>
              {newScopeType === "category" && (
                <select
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={newCategoryId ?? ""}
                  onChange={e => setNewCategoryId(e.target.value ? Number(e.target.value) : null)}
                  data-testid="select-coupon-category"
                >
                  <option value="">— Select Category —</option>
                  {allCategories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
              {newScopeType === "service" && (
                <select
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={newServiceId ?? ""}
                  onChange={e => setNewServiceId(e.target.value ? Number(e.target.value) : null)}
                  data-testid="select-coupon-service"
                >
                  <option value="">— Select Service —</option>
                  {(allServices as any[]).map((svc: any) => (
                    <option key={svc.id} value={svc.id}>{svc.name}</option>
                  ))}
                </select>
              )}
              <p className="text-xs text-muted-foreground mt-1">Restrict this coupon to only work on a specific category or service. Leave as "All Services" for a general promo code.</p>
            </div>
            <Button className="w-full" onClick={handleCreateSpecial} isLoading={creatingCoupon} data-testid="button-create-special-coupon">
              <Plus className="w-4 h-4 mr-2" /> Create Coupon
            </Button>
          </div>

          {/* List of special coupons */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Ticket className="w-4 h-4" /> Active Special Coupons ({specialCoupons.length})
            </h3>
            {loadingCoupons ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : specialCoupons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No special coupons yet. Create one above and share the code on your social media.</p>
            ) : (
              <div className="space-y-2">
                {[...specialCoupons].reverse().map(c => (
                  <div key={c.id} className="flex items-start justify-between p-3 rounded-xl border border-border bg-muted/20" data-testid={`coupon-special-${c.id}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-foreground">{c.code}</span>
                        {couponStatusBadge(c)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.discountType === "fixed" ? `₹${c.discountValue} off` : `${c.discountValue}% off`} · Expires {formatExpiry(c.expiresAt)}
                        {c.minPax > 0 && <span className="ml-1.5 text-amber-600 dark:text-amber-400 font-medium">· Min {c.minPax} pax</span>}
                      </p>
                      {(c.serviceId || c.categoryId) && (
                        <p className="text-xs mt-0.5 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-violet-500" />
                          {c.serviceId
                            ? <span className="text-violet-600 dark:text-violet-400 font-medium">Only: {(allServices as any[]).find((s: any) => s.id === c.serviceId)?.name ?? `Service #${c.serviceId}`}</span>
                            : <span className="text-violet-600 dark:text-violet-400 font-medium">Category: {allCategories.find((cat: any) => cat.id === c.categoryId)?.name ?? `Cat #${c.categoryId}`}</span>
                          }
                        </p>
                      )}
                      {c.usedCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Used {c.usedCount}{c.maxUses > 0 ? ` / ${c.maxUses}` : ""} time{c.usedCount !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteCoupon(c.id)}
                      className="ml-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 mt-0.5"
                      data-testid={`button-delete-special-${c.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FAQ User View ────────────────────────────────────────────────────────────
type FaqData = { id: number; summary: string; description: string; sortOrder: number; createdAt: string };

function FAQSection({ onBack }: { onBack: () => void }) {
  const { data: faqs, isLoading } = useQuery<FaqData[]>({ queryKey: ["/api/faqs"] });
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" data-testid="button-back-faq">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold font-display text-foreground flex-1">Frequently Asked Questions</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : !faqs?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No FAQs yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map(faq => (
            <div key={faq.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden" data-testid={`faq-item-${faq.id}`}>
              <button
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                data-testid={`faq-toggle-${faq.id}`}
              >
                <span className="flex-1 font-semibold text-foreground leading-snug">{faq.summary}</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${openId === faq.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {openId === faq.id ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
              </button>
              {openId === faq.id && (
                <div className="px-5 pb-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{faq.description}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Manage FAQs Admin Section ────────────────────────────────────────────────
function ManageFAQsSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: faqs, isLoading } = useQuery<FaqData[]>({ queryKey: ["/api/faqs"] });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSummary, setEditSummary] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { mutate: createFaq, isPending: creating } = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/faqs", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/faqs"] }); toast({ title: "FAQ created!" }); setNewSummary(""); setNewDescription(""); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const { mutate: updateFaq, isPending: updating } = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/faqs/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/faqs"] }); toast({ title: "FAQ updated" }); setEditingId(null); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const { mutate: deleteFaq, isPending: deleting } = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/faqs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/faqs"] }); toast({ title: "FAQ deleted" }); setConfirmDelete(null); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const handleCreate = () => {
    if (!newSummary.trim()) return toast({ title: "Summary is required", variant: "destructive" });
    if (!newDescription.trim()) return toast({ title: "Description is required", variant: "destructive" });
    createFaq({ summary: newSummary.trim(), description: newDescription.trim(), sortOrder: faqs?.length ?? 0 });
  };

  const startEdit = (faq: FaqData) => { setEditingId(faq.id); setEditSummary(faq.summary); setEditDescription(faq.description); };
  const cancelEdit = () => setEditingId(null);
  const handleUpdate = () => {
    if (!editSummary.trim()) return toast({ title: "Summary is required", variant: "destructive" });
    if (!editDescription.trim()) return toast({ title: "Description is required", variant: "destructive" });
    updateFaq({ id: editingId, summary: editSummary.trim(), description: editDescription.trim() });
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-200">
      {confirmDelete !== null && (
        <ConfirmDialog
          message="Delete this FAQ? This cannot be undone."
          onConfirm={() => deleteFaq(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          isPending={deleting}
        />
      )}

      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" data-testid="button-back-manage-faqs">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold font-display text-foreground flex-1">Manage FAQs</h2>
      </div>

      {/* Add new FAQ */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3 mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Add New FAQ
        </h3>
        <div>
          <Label>Summary (Question)</Label>
          <Input placeholder="e.g. What should I wear?" value={newSummary} onChange={e => setNewSummary(e.target.value)} data-testid="input-faq-summary" />
        </div>
        <div>
          <Label>Description (Answer)</Label>
          <textarea
            placeholder="Provide a detailed answer..."
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            data-testid="input-faq-description"
          />
        </div>
        <Button className="w-full" onClick={handleCreate} isLoading={creating} data-testid="button-create-faq">
          <Plus className="w-4 h-4 mr-2" /> Add FAQ
        </Button>
      </div>

      {/* Existing FAQs */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4" /> Existing FAQs ({faqs?.length ?? 0})
        </h3>
        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : !faqs?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">No FAQs yet. Add one above.</p>
        ) : (
          <div className="space-y-3">
            {faqs.map(faq => (
              <div key={faq.id} className="border border-border rounded-xl overflow-hidden" data-testid={`faq-admin-${faq.id}`}>
                {editingId === faq.id ? (
                  <div className="p-4 space-y-3 bg-muted/20">
                    <div>
                      <Label>Summary</Label>
                      <Input value={editSummary} onChange={e => setEditSummary(e.target.value)} data-testid={`input-edit-faq-summary-${faq.id}`} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <textarea
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        data-testid={`input-edit-faq-description-${faq.id}`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdate} isLoading={updating} data-testid={`button-save-faq-${faq.id}`}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{faq.summary}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.description}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(faq)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" data-testid={`button-edit-faq-${faq.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete(faq.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-destructive transition-colors" data-testid={`button-delete-faq-${faq.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Manage Staffs Section ────────────────────────────────────────────────────
const SHIFTS_OPTIONS = ["Morning", "Afternoon", "Evening", "Full Day"];

type StaffEntry = { id: number; fullName: string; contactNumber: string; address: string; shifts: string[]; isActive: boolean };

function ManageStaffsSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: staffs = [], isLoading } = useQuery<StaffEntry[]>({ queryKey: ["/api/staffs"] });

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffEntry | null>(null);
  const [formData, setFormData] = useState({ fullName: "", contactNumber: "", address: "", shifts: [] as string[] });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditTarget(null); setFormData({ fullName: "", contactNumber: "", address: "", shifts: [] }); setShowForm(true); };
  const openEdit = (s: StaffEntry) => { setEditTarget(s); setFormData({ fullName: s.fullName, contactNumber: s.contactNumber, address: s.address || "", shifts: s.shifts || [] }); setShowForm(true); };

  const toggleShift = (shift: string) => {
    setFormData(f => ({ ...f, shifts: f.shifts.includes(shift) ? f.shifts.filter(s => s !== shift) : [...f.shifts, shift] }));
  };

  const handleSave = async () => {
    if (!formData.fullName.trim() || !formData.contactNumber.trim()) {
      toast({ title: "Required", description: "Name and contact number are required.", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const url = editTarget ? `/api/staffs/${editTarget.id}` : "/api/staffs";
      const method = editTarget ? "PATCH" : "POST";
      await apiRequest(method, url, formData);
      await queryClient.invalidateQueries({ queryKey: ["/api/staffs"] });
      toast({ title: editTarget ? "Staff updated" : "Staff added", description: formData.fullName });
      setShowForm(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove ${name} from active staff?`)) return;
    try {
      await apiRequest("DELETE", `/api/staffs/${id}`, undefined);
      await queryClient.invalidateQueries({ queryKey: ["/api/staffs"] });
      toast({ title: "Staff removed", description: name });
    } catch { toast({ title: "Error", description: "Failed to remove staff", variant: "destructive" }); }
  };

  return (
    <div className="animate-in fade-in duration-200">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" data-testid="button-back-manage-staffs">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">Manage Staffs</h2>
          <p className="text-xs text-muted-foreground">Contact persons assigned to confirmed bookings</p>
        </div>
        <Button size="sm" onClick={openAdd} className="ml-auto" data-testid="button-add-staff">
          <Plus className="w-4 h-4 mr-1" /> Add Staff
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-5 shadow-sm animate-in fade-in">
          <h3 className="font-bold text-foreground mb-4">{editTarget ? "Edit Staff" : "Add New Staff"}</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full Name *</Label>
              <Input value={formData.fullName} onChange={e => setFormData(f => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Ravi Kumar" data-testid="input-staff-name" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Contact Number *</Label>
              <Input value={formData.contactNumber} onChange={e => setFormData(f => ({ ...f, contactNumber: e.target.value }))} placeholder="+91 98765 43210" data-testid="input-staff-contact" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address (optional)</Label>
              <Input value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} placeholder="e.g. Dona Paula, Goa" data-testid="input-staff-address" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Available Shifts</Label>
              <div className="flex flex-wrap gap-2">
                {SHIFTS_OPTIONS.map(shift => (
                  <button
                    key={shift}
                    type="button"
                    onClick={() => toggleShift(shift)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${formData.shifts.includes(shift) ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border hover:bg-muted/80"}`}
                    data-testid={`toggle-shift-${shift}`}
                  >
                    {shift}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1" data-testid="button-save-staff">
              <Save className="w-4 h-4 mr-1.5" />{saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3"><div className="h-20 bg-muted rounded-2xl animate-pulse" /><div className="h-20 bg-muted rounded-2xl animate-pulse" /></div>
      ) : staffs.length === 0 ? (
        <div className="text-center py-14 bg-card rounded-2xl border border-border">
          <UserCog className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">No staff added yet</p>
          <p className="text-sm text-muted-foreground">Add staff who can be assigned as contact persons on confirmed bookings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staffs.map(staff => (
            <div key={staff.id} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 shadow-sm" data-testid={`card-staff-${staff.id}`}>
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                <UserCog className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">{staff.fullName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{staff.contactNumber}</p>
                {staff.address && <p className="text-xs text-muted-foreground mt-0.5">{staff.address}</p>}
                {staff.shifts && staff.shifts.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {staff.shifts.map(s => (
                      <span key={s} className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-lg px-2 py-0.5 font-semibold">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => openEdit(staff)} className="w-8 h-8 rounded-xl bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors" data-testid={`button-edit-staff-${staff.id}`}>
                  <Pencil className="w-3.5 h-3.5 text-primary" />
                </button>
                <button onClick={() => handleDelete(staff.id, staff.fullName)} className="w-8 h-8 rounded-xl bg-muted hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors" data-testid={`button-delete-staff-${staff.id}`}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WhatsApp Messages Section ───────────────────────────────────────────────
const WA_STATUSES = [
  { key: "booking_created", label: "Booking Created", color: "text-blue-600" },
  { key: "pending_confirmation", label: "Pending Payment", color: "text-amber-600" },
  { key: "booking_confirmed", label: "Confirmed", color: "text-green-600" },
  { key: "booking_cancelled", label: "Cancelled", color: "text-red-600" },
  { key: "booking_rescheduled", label: "Rescheduled", color: "text-purple-600" },
];

const WA_FIELDS = [
  "[Full Name]", "[Phone]", "[Service Name]", "[Booking Date]",
  "[Booking Time]", "[Pax Number]", "[Total Amount]", "[Status]",
  "[Booking ID]", "[Cancel Reason]", "[Booking Coupon]", "[Coupon Expiry Days]",
  "[GST Amount]", "[CGST Amount]", "[SGST Amount]", "[GST Summary]",
];

function WhatsAppSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(WA_STATUSES[0].key);
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [adminNumber, setAdminNumber] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const { data: waSettings, isLoading: loadingSettings } = useQuery<any>({ queryKey: ["/api/whatsapp-settings"] });
  const { data: waTemplates, isLoading: loadingTemplates } = useQuery<any[]>({ queryKey: ["/api/whatsapp-templates"] });

  useEffect(() => {
    if (waSettings) { setAdminNumber(waSettings.adminNumber || ""); setEnabled(waSettings.enabled ?? true); setMetaPhoneNumberId(waSettings.metaPhoneNumberId || ""); setMetaAccessToken(waSettings.metaAccessToken || ""); }
  }, [waSettings]);

  useEffect(() => {
    if (waTemplates) {
      const map: Record<string, string> = {};
      waTemplates.forEach((t: any) => { map[t.status] = t.template; });
      setTemplates(map);
    }
  }, [waTemplates]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/whatsapp-settings", { adminNumber: adminNumber.replace(/\D/g, ""), enabled, metaPhoneNumberId: metaPhoneNumberId.trim(), metaAccessToken: metaAccessToken.trim() });
      return res.json();
    },
    onSuccess: (saved: any) => {
      queryClient.setQueryData(["/api/whatsapp-settings"], saved);
      toast({ title: "WhatsApp settings saved." });
    },
    onError: (e: any) => toast({ title: "Error saving settings", description: e.message, variant: "destructive" }),
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (status: string) => {
      const text = templates[status] || "";
      if (!text.trim()) { throw new Error("Template cannot be empty"); }
      const res = await apiRequest("PUT", `/api/whatsapp-templates/${status}`, { template: text });
      return res.json();
    },
    onSuccess: (saved: any) => {
      queryClient.setQueryData(["/api/whatsapp-templates"], (old: any[]) =>
        old ? old.map(t => t.status === saved.status ? saved : t) : [saved]
      );
      toast({ title: "Template saved." });
    },
    onError: (e: any) => toast({ title: "Error saving template", description: e.message, variant: "destructive" }),
  });

  const lastChipClickRef = useRef<number>(0);
  const insertField = (field: string) => {
    const now = Date.now();
    if (now - lastChipClickRef.current < 500) return;
    lastChipClickRef.current = now;
    const ta = textareaRefs.current[activeTab];
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const current = templates[activeTab] || "";
    const updated = current.slice(0, start) + field + current.slice(end);
    setTemplates(prev => ({ ...prev, [activeTab]: updated }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + field.length, start + field.length); }, 0);
  };

  if (loadingSettings || loadingTemplates) return <div className="space-y-3 p-4"><div className="h-20 bg-muted rounded-2xl animate-pulse" /><div className="h-40 bg-muted rounded-2xl animate-pulse" /></div>;

  return (
    <SubSection title="WhatsApp Messages" onBack={onBack}>
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
              <MessageCircleMore className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">WhatsApp Notifications</p>
              <p className="text-xs text-muted-foreground">Tap a send button on any booking to open WhatsApp with the pre-filled message</p>
            </div>
            <button onClick={() => setEnabled(!enabled)} className="flex-shrink-0" data-testid="toggle-wa-enabled">
              {enabled ? <ToggleRight className="w-7 h-7 text-green-500" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
            </button>
          </div>
          <div>
            <Label>Admin WhatsApp Number</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="Country code + number e.g. 919876543210"
                value={adminNumber}
                onChange={e => setAdminNumber(e.target.value.replace(/\D/g, "").slice(0, 15))}
                data-testid="input-wa-number"
                maxLength={15}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Enter without + sign. E.g. 919876543210 for India</p>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground mb-0.5">Meta WhatsApp Cloud API</p>
              <p className="text-xs text-muted-foreground">Optional — fill these to send messages directly without opening WhatsApp. Get these from your Meta Business &gt; WhatsApp &gt; API Setup page.</p>
            </div>
            <div>
              <Label>Phone Number ID</Label>
              <Input
                type="text"
                placeholder="e.g. 123456789012345"
                value={metaPhoneNumberId}
                onChange={e => setMetaPhoneNumberId(e.target.value.trim())}
                data-testid="input-meta-phone-number-id"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Access Token</Label>
              <Input
                type="password"
                placeholder="EAAxxxxxx..."
                value={metaAccessToken}
                onChange={e => setMetaAccessToken(e.target.value.trim())}
                data-testid="input-meta-access-token"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Use a permanent System User token for production. Never share this token.</p>
            </div>
          </div>

          <Button onClick={() => saveSettingsMutation.mutate()} isLoading={saveSettingsMutation.isPending} size="sm" data-testid="button-save-wa-settings">
            Save Settings
          </Button>
        </div>

        <div>
          <p className="font-bold text-foreground mb-1">Message Templates</p>
          <p className="text-xs text-muted-foreground mb-3">Configure the message sent to customers for each booking event. Tap a field chip to insert it at the cursor.</p>

          <div className="flex overflow-x-auto gap-2 pb-2 mb-4 scrollbar-hide">
            {WA_STATUSES.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveTab(s.key)}
                data-testid={`tab-wa-${s.key}`}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  activeTab === s.key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted text-muted-foreground border-transparent"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Tap a field to insert at cursor:</p>
              <div className="flex flex-wrap gap-1.5">
                {WA_FIELDS.map(f => (
                  <button
                    key={f}
                    onClick={() => insertField(f)}
                    data-testid={`chip-field-${f}`}
                    className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-mono font-semibold hover:bg-primary/20 transition-colors"
                  >
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">💡 <strong>[Booking Coupon]</strong> auto-fills with the earned coupon code on Confirmed bookings, and is blank on other statuses. <strong>[GST Summary]</strong> inserts a formatted tax breakdown (CGST + SGST) when GST applies, or is blank when no GST is charged.</p>
            </div>

            <div>
              <Label className="mb-1 block">{WA_STATUSES.find(s => s.key === activeTab)?.label} Template</Label>
              <textarea
                ref={el => { textareaRefs.current[activeTab] = el; }}
                value={templates[activeTab] || ""}
                onChange={e => setTemplates(prev => ({ ...prev, [activeTab]: e.target.value }))}
                rows={10}
                data-testid={`textarea-wa-template-${activeTab}`}
                placeholder="Type your message template here. Use the field chips above to insert dynamic values."
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all placeholder:text-muted-foreground text-foreground font-mono resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">{(templates[activeTab] || "").length} characters</p>
            </div>

            <Button
              onClick={() => saveTemplateMutation.mutate(activeTab)}
              isLoading={saveTemplateMutation.isPending}
              size="sm"
              data-testid={`button-save-wa-template-${activeTab}`}
            >
              Save Template
            </Button>
          </div>
        </div>
      </div>
    </SubSection>
  );
}

// ─── Email Notifications Section ─────────────────────────────────────────────
const EMAIL_STATUSES = [
  { key: "booking_created", label: "Booking Created" },
  { key: "booking_confirmed", label: "Confirmed" },
  { key: "booking_cancelled", label: "Cancelled" },
  { key: "booking_rescheduled", label: "Rescheduled" },
];

const EMAIL_FIELDS = ["[Full Name]", "[Service Name]", "[Booking Date]", "[Booking Time]", "[Pax Number]", "[Total Amount]", "[Booking ID]", "[Cancel Reason]", "[Booking Coupon]", "[Coupon Expiry Days]", "[GST Amount]", "[CGST Amount]", "[SGST Amount]", "[GST Summary]"];

function EmailSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(EMAIL_STATUSES[0].key);
  const [templates, setTemplates] = useState<Record<string, { subject: string; body: string }>>({});
  const subjectRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const bodyRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const [activeField, setActiveField] = useState<"subject" | "body">("body");

  const [fromName, setFromName] = useState("Local Goa Kayaking");
  const [fromEmail, setFromEmail] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const lastChipRef = useRef<number>(0);

  const { data: emailSettings, isLoading: loadingSettings } = useQuery<any>({ queryKey: ["/api/email-settings"] });
  const { data: emailTemplatesData, isLoading: loadingTemplates } = useQuery<any[]>({ queryKey: ["/api/email-templates"] });

  useEffect(() => {
    if (emailSettings) {
      setFromName(emailSettings.fromName || "Local Goa Kayaking");
      setFromEmail(emailSettings.fromEmail || "");
      setSmtpHost(emailSettings.smtpHost || "");
      setSmtpPort(emailSettings.smtpPort || 587);
      setSmtpUser(emailSettings.smtpUser || "");
      setSmtpPassword(emailSettings.smtpPassword || "");
      setSmtpSecure(emailSettings.smtpSecure ?? false);
      setEnabled(emailSettings.enabled ?? false);
    }
  }, [emailSettings]);

  useEffect(() => {
    if (emailTemplatesData) {
      const map: Record<string, { subject: string; body: string }> = {};
      emailTemplatesData.forEach((t: any) => { map[t.status] = { subject: t.subject, body: t.body }; });
      setTemplates(map);
    }
  }, [emailTemplatesData]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/email-settings", { fromName: fromName.trim(), fromEmail: fromEmail.trim(), smtpHost: smtpHost.trim(), smtpPort: Number(smtpPort), smtpUser: smtpUser.trim(), smtpPassword, smtpSecure, enabled });
      return res.json();
    },
    onSuccess: (saved: any) => {
      queryClient.setQueryData(["/api/email-settings"], saved);
      toast({ title: "Email settings saved." });
    },
    onError: (e: any) => toast({ title: "Error saving settings", description: e.message, variant: "destructive" }),
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (status: string) => {
      const tpl = templates[status];
      if (!tpl?.subject?.trim() || !tpl?.body?.trim()) throw new Error("Subject and body cannot be empty");
      const res = await apiRequest("PUT", `/api/email-templates/${status}`, { subject: tpl.subject, body: tpl.body });
      return res.json();
    },
    onSuccess: (saved: any) => {
      queryClient.setQueryData(["/api/email-templates"], (old: any[]) =>
        old ? old.map(t => t.status === saved.status ? saved : t) : [saved]
      );
      toast({ title: "Template saved." });
    },
    onError: (e: any) => toast({ title: "Error saving template", description: e.message, variant: "destructive" }),
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      if (!testEmail.trim()) throw new Error("Enter a test email address first");
      const res = await apiRequest("POST", "/api/email-settings/test", { to: testEmail.trim() });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      return res.json();
    },
    onSuccess: () => toast({ title: "Test email sent!", description: `Check ${testEmail} for the test message.` }),
    onError: (e: any) => toast({ title: "Test failed", description: e.message, variant: "destructive" }),
  });

  const insertField = (field: string) => {
    const now = Date.now();
    if (now - lastChipRef.current < 500) return;
    lastChipRef.current = now;
    if (activeField === "subject") {
      const inp = subjectRefs.current[activeTab];
      if (!inp) return;
      const start = inp.selectionStart ?? 0;
      const end = inp.selectionEnd ?? 0;
      const cur = templates[activeTab]?.subject || "";
      setTemplates(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], subject: cur.slice(0, start) + field + cur.slice(end) } }));
    } else {
      const ta = bodyRefs.current[activeTab];
      if (!ta) return;
      const start = ta.selectionStart ?? 0;
      const end = ta.selectionEnd ?? 0;
      const cur = templates[activeTab]?.body || "";
      setTemplates(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], body: cur.slice(0, start) + field + cur.slice(end) } }));
    }
  };

  if (loadingSettings || loadingTemplates) return <div className="space-y-3 p-4"><div className="h-20 bg-muted rounded-2xl animate-pulse" /><div className="h-40 bg-muted rounded-2xl animate-pulse" /></div>;

  return (
    <SubSection title="Email Notifications" onBack={onBack}>
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Automatically email customers when a booking is created, confirmed, cancelled or rescheduled</p>
            </div>
            <button onClick={() => setEnabled(!enabled)} className="flex-shrink-0" data-testid="toggle-email-enabled">
              {enabled ? <ToggleRight className="w-7 h-7 text-blue-500" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>From Name</Label>
              <Input className="mt-1" placeholder="Local Goa Kayaking" value={fromName} onChange={e => setFromName(e.target.value)} data-testid="input-email-from-name" />
            </div>
            <div>
              <Label>From Email</Label>
              <Input className="mt-1" type="email" placeholder="bookings@yourdomain.com" value={fromEmail} onChange={e => setFromEmail(e.target.value)} data-testid="input-email-from-email" />
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            {/* Gmail App Password guide */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-3 text-xs space-y-1.5">
              <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span>⚠️</span> Gmail requires an App Password — not your regular password
              </p>
              <ol className="list-decimal list-inside space-y-1 text-amber-700 dark:text-amber-400">
                <li>Enable 2-Step Verification on your Google Account</li>
                <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-amber-800 dark:text-amber-300">myaccount.google.com/apppasswords</a></li>
                <li>Create a new App Password — select "Mail" and your device</li>
                <li>Copy the 16-character code and paste it in the Password field below</li>
              </ol>
              <p className="text-amber-600 dark:text-amber-500">Use port <strong>587</strong> (TLS) or <strong>465</strong> (SSL) with host <strong>smtp.gmail.com</strong></p>
            </div>

            <p className="text-sm font-semibold text-foreground">SMTP Server</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Host</Label>
                <Input className="mt-1" placeholder="smtp.gmail.com" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} data-testid="input-smtp-host" />
              </div>
              <div>
                <Label>Port</Label>
                <Input className="mt-1" type="number" placeholder="587" value={smtpPort} onChange={e => setSmtpPort(Number(e.target.value))} data-testid="input-smtp-port" />
              </div>
            </div>
            <div>
              <Label>Username</Label>
              <Input className="mt-1" placeholder="your@gmail.com" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} data-testid="input-smtp-user" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                App Password
                <span className="text-xs font-normal text-muted-foreground">(NOT your regular Gmail password)</span>
                {smtpPassword === "••••••••" && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ saved</span>}
              </Label>
              <div className="relative mt-1">
                <Input type={showPassword ? "text" : "password"} placeholder="16-character App Password from Google" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)} data-testid="input-smtp-password" className="pr-10" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSmtpSecure(v => !v)} data-testid="toggle-smtp-secure">
                {smtpSecure ? <ToggleRight className="w-7 h-7 text-blue-500" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
              </button>
              <span className="text-sm">Use SSL/TLS (port 465)</span>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Test Connection</p>
            <div className="flex gap-2">
              <Input type="email" placeholder="Send a test to this email..." value={testEmail} onChange={e => setTestEmail(e.target.value)} data-testid="input-test-email" className="flex-1" />
              <Button onClick={() => testMutation.mutate()} isLoading={testMutation.isPending} size="sm" variant="outline" data-testid="button-test-email">
                Send Test
              </Button>
            </div>
            {testMutation.isError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-3 text-xs text-red-700 dark:text-red-400">
                <p className="font-semibold mb-0.5">Test failed:</p>
                <p>{(testMutation.error as any)?.message}</p>
              </div>
            )}
            {testMutation.isSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                ✓ Test email sent successfully! Check your inbox.
              </div>
            )}
          </div>

          <Button onClick={() => saveSettingsMutation.mutate()} isLoading={saveSettingsMutation.isPending} size="sm" data-testid="button-save-email-settings">
            Save Settings
          </Button>
        </div>

        <div>
          <p className="font-bold text-foreground mb-1">Email Templates</p>
          <p className="text-xs text-muted-foreground mb-3">Configure the subject and body for each booking event. Click a field to insert it at the cursor. Last clicked field (subject/body) determines where it's inserted.</p>

          <div className="flex overflow-x-auto gap-2 pb-2 mb-4 scrollbar-hide">
            {EMAIL_STATUSES.map(s => (
              <button key={s.key} onClick={() => setActiveTab(s.key)} data-testid={`tab-email-${s.key}`}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${activeTab === s.key ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted text-muted-foreground border-transparent"}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Click a field to insert at cursor (in whichever field is focused):</p>
              <div className="flex flex-wrap gap-1.5">
                {EMAIL_FIELDS.map(f => (
                  <button key={f} onClick={() => insertField(f)} data-testid={`chip-email-field-${f}`}
                    className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-mono font-semibold hover:bg-primary/20 transition-colors">
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">💡 <strong>[Booking Coupon]</strong> auto-fills with the earned coupon code on Confirmed bookings. <strong>[GST Summary]</strong> inserts a formatted tax breakdown (CGST + SGST) when GST applies, or is blank when no GST is charged.</p>
            </div>

            <div>
              <Label className="mb-1 block">Subject</Label>
              <input
                ref={el => { subjectRefs.current[activeTab] = el; }}
                value={templates[activeTab]?.subject || ""}
                onChange={e => setTemplates(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], subject: e.target.value } }))}
                onFocus={() => setActiveField("subject")}
                data-testid={`input-email-subject-${activeTab}`}
                placeholder="Email subject line..."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <Label className="mb-1 block">Body</Label>
              <textarea
                ref={el => { bodyRefs.current[activeTab] = el; }}
                value={templates[activeTab]?.body || ""}
                onChange={e => setTemplates(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], body: e.target.value } }))}
                onFocus={() => setActiveField("body")}
                rows={12}
                data-testid={`textarea-email-body-${activeTab}`}
                placeholder="Email body text..."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              />
            </div>

            <Button onClick={() => saveTemplateMutation.mutate(activeTab)} isLoading={saveTemplateMutation.isPending} size="sm" data-testid={`button-save-email-template-${activeTab}`}>
              Save Template
            </Button>
          </div>
        </div>
      </div>
    </SubSection>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────────
export default function Settings() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { data: services } = useServices();
  const { data: banners } = useBanners();

  const [section, setSection] = useState<Section>("profile");
  const [addingService, setAddingService] = useState(false);
  const [addingBanner, setAddingBanner] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/login");
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("edit") === "1") {
      setSection("edit-profile");
      setLocation("/settings", { replace: true });
    } else if (params.get("m") === "1") {
      setSection("profile");
      setLocation("/settings", { replace: true });
    }
  }, [search]);

  if (authLoading) return <AppLayout><div className="p-8 text-muted-foreground text-sm">Loading...</div></AppLayout>;
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <AppLayout>
      {addingService && <ServiceEditor onClose={() => setAddingService(false)} />}
      {addingBanner && <BannerEditor onClose={() => setAddingBanner(false)} />}

      <div className="p-4 sm:p-6 max-w-lg mx-auto animate-in fade-in">
        {section === "profile" && (
          <ProfileSection onNavigate={setSection} onLogout={handleLogout} />
        )}

        {section === "edit-profile" && (
          <EditProfileSection onBack={() => setSection("profile")} />
        )}

        {section === "manage-services" && (
          <SubSection
            title="Manage Services"
            onBack={() => setSection("profile")}
            addButton={
              <Button size="sm" onClick={() => setAddingService(true)} data-testid="button-add-service">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            }
          >
            <div className="space-y-3">
              {services?.map(service => <ServiceRow key={service.id} service={service} />)}
              {!services?.length && <p className="text-sm text-muted-foreground text-center py-10">No services yet. Click "Add" to create one.</p>}
            </div>
          </SubSection>
        )}

        {section === "manage-banners" && (
          <SubSection
            title="Manage Banners"
            onBack={() => setSection("profile")}
            addButton={
              <Button size="sm" onClick={() => setAddingBanner(true)} data-testid="button-add-banner">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            }
          >
            <p className="text-xs text-muted-foreground mb-4">When all banners are hidden or expired, the default Kayaking In Goa banner is shown automatically.</p>
            <div className="space-y-3">
              {banners?.map(banner => <BannerRow key={banner.id} banner={banner} />)}
              {!banners?.length && <p className="text-sm text-muted-foreground text-center py-10">No banners yet. Click "Add" to create one.</p>}
            </div>
          </SubSection>
        )}

        {section === "manage-coupons" && (
          <ManageCouponsSection onBack={() => setSection("profile")} />
        )}

        {section === "manage-generated-coupons" && (
          <GeneratedCouponsSection onBack={() => setSection("profile")} />
        )}

        {section === "manage-referrals" && (
          <ManageReferralsSection onBack={() => setSection("profile")} />
        )}

        {section === "manage-qr" && (
          <SubSection title="Payment & QR Settings" onBack={() => setSection("profile")}>
            <QRManagement />
          </SubSection>
        )}

        {section === "boarding-pass" && (
          <SubSection title="Boarding Pass Settings" onBack={() => setSection("profile")}>
            <BoardingPassSettings />
          </SubSection>
        )}

        {section === "faq" && (
          <FAQSection onBack={() => setSection("profile")} />
        )}

        {section === "manage-faqs" && (
          <ManageFAQsSection onBack={() => setSection("profile")} />
        )}

        {section === "manage-staffs" && (
          <ManageStaffsSection onBack={() => setSection("profile")} />
        )}

        {section === "whatsapp" && (
          <WhatsAppSection onBack={() => setSection("profile")} />
        )}

        {section === "email" && (
          <EmailSection onBack={() => setSection("profile")} />
        )}

        {section === "storage" && (
          <StorageSection onBack={() => setSection("profile")} />
        )}

        {section === "manage-categories" && (
          <ManageCategoriesSection onBack={() => setSection("profile")} />
        )}

        {section === "seo" && (
          <SEOSection onBack={() => setSection("profile")} />
        )}

        {section === "booking-reminders" && (
          <BookingRemindersSection onBack={() => setSection("profile")} />
        )}

        {section === "delete-bookings" && (
          <DeleteBookingsSection onBack={() => setSection("profile")} />
        )}

        {section === "chat-widget" && (
          <ChatWidgetSection onBack={() => setSection("profile")} />
        )}

        {section === "sea-level" && (
          <SeaLevelSection onBack={() => setSection("profile")} />
        )}

        {section === "app-policies" && (
          <AppPoliciesSection onBack={() => setSection("profile")} />
        )}

        {section === "business-details" && (
          <BusinessDetailsSection onBack={() => setSection("profile")} />
        )}
      </div>
    </AppLayout>
  );
}

type ReminderOffset = { id: string; label: string; value: number; unit: "days" | "hours"; enabled: boolean };
type ReminderSettingsData = {
  id: number; reminders: ReminderOffset[]; emailEnabled: boolean; waEnabled: boolean;
  emailSubject: string; emailBody: string; waTemplate: string;
  reviewEnabled: boolean; reviewAfterValue: number; reviewAfterUnit: "hours" | "days";
  reviewTriggers: ReminderOffset[];
  reviewEmailSubject: string; reviewEmailBody: string; reviewWaTemplate: string;
};
const REMINDER_FIELDS = ["[Full Name]", "[Service Name]", "[Booking Date]", "[Booking Time]", "[Pax Number]", "[Total Amount]", "[Booking ID]", "[Staff Name]", "[Staff Contact]"];

function BookingRemindersSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: serverData, isLoading } = useQuery<ReminderSettingsData>({ queryKey: ["/api/reminder-settings"] });

  const [emailEnabled, setEmailEnabled] = useState(false);
  const [waEnabled, setWaEnabled] = useState(false);
  const [reminders, setReminders] = useState<ReminderOffset[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [waTemplate, setWaTemplate] = useState("");
  const [newValue, setNewValue] = useState("1");
  const [newUnit, setNewUnit] = useState<"days" | "hours">("days");
  const [newLabel, setNewLabel] = useState("");
  const [reviewEnabled, setReviewEnabled] = useState(false);
  const [reviewTriggers, setReviewTriggers] = useState<ReminderOffset[]>([]);
  const [newReviewValue, setNewReviewValue] = useState("24");
  const [newReviewUnit, setNewReviewUnit] = useState<"days" | "hours">("hours");
  const [newReviewLabel, setNewReviewLabel] = useState("");
  const [reviewEmailSubject, setReviewEmailSubject] = useState("How was your experience? — Local Goa Kayaking");
  const [reviewEmailBody, setReviewEmailBody] = useState(`Hello [Full Name] sir/madam,\n\nHope you had a lovely experience with us. We can't wait to see you again!\n\nPlease help us by rating our business on Google:\n\nThank you so much for your support! 🙏\n\nWarm regards,\nLocal Goa Kayaking`);
  const [reviewWaTemplate, setReviewWaTemplate] = useState(`Hello [Full Name] sir/madam,\n\nHope you had a lovely experience with us. We can't wait to see you again! 🚣\n\nPlease help us to rate our business on Google:\n\nThank you! 🙏`);

  const emailBodyRef = useRef<HTMLTextAreaElement | null>(null);
  const waRef = useRef<HTMLTextAreaElement | null>(null);
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const reviewEmailBodyRef = useRef<HTMLTextAreaElement | null>(null);
  const reviewWaRef = useRef<HTMLTextAreaElement | null>(null);
  const reviewSubjectRef = useRef<HTMLInputElement | null>(null);
  const [activeField, setActiveField] = useState<"subject" | "emailBody" | "wa" | "reviewSubject" | "reviewEmailBody" | "reviewWa">("emailBody");

  useEffect(() => {
    if (serverData) {
      setEmailEnabled(serverData.emailEnabled);
      setWaEnabled(serverData.waEnabled);
      setReminders(serverData.reminders || []);
      setEmailSubject(serverData.emailSubject || "");
      setEmailBody(serverData.emailBody || "");
      setWaTemplate(serverData.waTemplate || "");
      setReviewEnabled(serverData.reviewEnabled || false);
      if (serverData.reviewTriggers && serverData.reviewTriggers.length > 0) {
        setReviewTriggers(serverData.reviewTriggers);
      } else if (serverData.reviewAfterValue) {
        const v = serverData.reviewAfterValue;
        const u = serverData.reviewAfterUnit || "hours";
        setReviewTriggers([{ id: `${v}${u[0]}-legacy`, label: `${v} ${u === "hours" ? (v === 1 ? "Hour" : "Hours") : (v === 1 ? "Day" : "Days")} After Trip`, value: v, unit: u, enabled: true }]);
      } else {
        setReviewTriggers([]);
      }
      setReviewEmailSubject(serverData.reviewEmailSubject || "How was your experience? — Local Goa Kayaking");
      setReviewEmailBody(serverData.reviewEmailBody || `Hello [Full Name] sir/madam,\n\nHope you had a lovely experience with us. We can't wait to see you again!\n\nPlease help us by rating our business on Google:\n\nThank you so much for your support! 🙏\n\nWarm regards,\nLocal Goa Kayaking`);
      setReviewWaTemplate(serverData.reviewWaTemplate || `Hello [Full Name] sir/madam,\n\nHope you had a lovely experience with us. We can't wait to see you again! 🚣\n\nPlease help us to rate our business on Google:\n\nThank you! 🙏`);
    }
  }, [serverData]);

  const saveMut = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/api/reminder-settings", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/reminder-settings"] }); toast({ title: "Reminder settings saved" }); },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const runMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/reminder-settings/run", {}),
    onSuccess: () => toast({ title: "Reminder job triggered — check logs for results" }),
    onError: () => toast({ title: "Failed to trigger job", variant: "destructive" }),
  });

  const insertField = (field: string) => {
    const insert = (el: HTMLTextAreaElement | HTMLInputElement | null, setter: (v: string) => void, current: string) => {
      if (!el) return;
      const start = el.selectionStart ?? current.length;
      const end = el.selectionEnd ?? current.length;
      const updated = current.slice(0, start) + field + current.slice(end);
      setter(updated);
      setTimeout(() => { el.focus(); el.setSelectionRange(start + field.length, start + field.length); }, 0);
    };
    if (activeField === "subject") insert(subjectRef.current, setEmailSubject, emailSubject);
    else if (activeField === "emailBody") insert(emailBodyRef.current, setEmailBody, emailBody);
    else if (activeField === "reviewSubject") insert(reviewSubjectRef.current, setReviewEmailSubject, reviewEmailSubject);
    else if (activeField === "reviewEmailBody") insert(reviewEmailBodyRef.current, setReviewEmailBody, reviewEmailBody);
    else if (activeField === "reviewWa") insert(reviewWaRef.current, setReviewWaTemplate, reviewWaTemplate);
    else insert(waRef.current, setWaTemplate, waTemplate);
  };

  const toggleReminder = (id: string) => setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const deleteReminder = (id: string) => setReminders(prev => prev.filter(r => r.id !== id));
  const addReminder = () => {
    const val = parseInt(newValue);
    if (!val || val < 1) return toast({ title: "Enter a valid number", variant: "destructive" });
    const id = `${val}${newUnit[0]}-${Date.now()}`;
    const label = newLabel.trim() || `${val} ${newUnit === "days" ? (val === 1 ? "Day" : "Days") : (val === 1 ? "Hour" : "Hours")} Before`;
    setReminders(prev => [...prev, { id, label, value: val, unit: newUnit, enabled: true }]);
    setNewValue("1"); setNewLabel("");
  };

  const toggleReviewTrigger = (id: string) => setReviewTriggers(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const deleteReviewTrigger = (id: string) => setReviewTriggers(prev => prev.filter(r => r.id !== id));
  const addReviewTrigger = () => {
    const val = parseInt(newReviewValue);
    if (!val || val < 1) return toast({ title: "Enter a valid number", variant: "destructive" });
    const id = `rev-${val}${newReviewUnit[0]}-${Date.now()}`;
    const label = newReviewLabel.trim() || `${val} ${newReviewUnit === "days" ? (val === 1 ? "Day" : "Days") : (val === 1 ? "Hour" : "Hours")} After Trip`;
    setReviewTriggers(prev => [...prev, { id, label, value: val, unit: newReviewUnit, enabled: true }]);
    setNewReviewValue("24"); setNewReviewLabel("");
  };

  const handleSave = () => {
    saveMut.mutate({
      emailEnabled, waEnabled, reminders, emailSubject, emailBody, waTemplate,
      reviewEnabled, reviewTriggers,
      reviewEmailSubject, reviewEmailBody, reviewWaTemplate,
    });
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" data-testid="button-back-reminders">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold font-display text-foreground flex-1">Booking Reminders</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">Automatically send reminder messages to customers before their trip. Reminders are sent via Email and/or WhatsApp based on your settings below.</p>

          {/* Channel Toggles + inline Templates */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <AlarmClock className="w-4 h-4 text-amber-500" /> Send Reminders Via
            </h3>

            {/* WhatsApp Toggle + Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 py-2 border-b border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">WhatsApp Reminders</p>
                  <p className="text-xs text-muted-foreground">Adds reminder to WhatsApp queue (manual send)</p>
                </div>
                <button onClick={() => setWaEnabled(v => !v)} className="flex-shrink-0" data-testid="toggle-wa-reminders">
                  {waEnabled ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                </button>
              </div>
              {waEnabled && (
                <div className="space-y-2 pl-1 animate-in slide-in-from-top-2">
                  <p className="text-xs text-muted-foreground">Tap inside the message first, then tap a chip to insert at cursor.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {REMINDER_FIELDS.map(f => (
                      <button key={`wa-chip-${f}`}
                        onClick={() => { const el = waRef.current; if (!el) { setWaTemplate(t => t + f); return; } const s = el.selectionStart ?? waTemplate.length; const e2 = el.selectionEnd ?? waTemplate.length; const v = waTemplate.slice(0,s)+f+waTemplate.slice(e2); setWaTemplate(v); setTimeout(()=>{el.focus();el.setSelectionRange(s+f.length,s+f.length);},0); }}
                        data-testid={`chip-wa-field-${f}`}
                        className="px-2 py-1 bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 rounded-lg text-xs font-mono font-semibold hover:bg-green-500/20 transition-colors">
                        {f}
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={waRef} value={waTemplate} onChange={e => setWaTemplate(e.target.value)}
                    onFocus={() => setActiveField("wa")}
                    rows={8} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono resize-y"
                    placeholder="Write your WhatsApp reminder template..." data-testid="textarea-reminder-wa-template"
                  />
                </div>
              )}
            </div>

            {/* Email Toggle + Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 py-2 border-b border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Email Reminders</p>
                  <p className="text-xs text-muted-foreground">Sends reminder to customer's email address</p>
                </div>
                <button onClick={() => setEmailEnabled(v => !v)} className="flex-shrink-0" data-testid="toggle-email-reminders">
                  {emailEnabled ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                </button>
              </div>
              {emailEnabled && (
                <div className="space-y-3 pl-1 animate-in slide-in-from-top-2">
                  <p className="text-xs text-muted-foreground">Tap subject or body first, then tap a chip to insert at cursor.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {REMINDER_FIELDS.map(f => (
                      <button key={`email-chip-${f}`}
                        onClick={() => { const el = activeField === "subject" ? subjectRef.current : emailBodyRef.current; const setter = activeField === "subject" ? setEmailSubject : setEmailBody; const cur = activeField === "subject" ? emailSubject : emailBody; if (!el) { setter((t:string) => t + f); return; } const s = el.selectionStart ?? cur.length; const e2 = el.selectionEnd ?? cur.length; const v = cur.slice(0,s)+f+cur.slice(e2); setter(v); setTimeout(()=>{el.focus();el.setSelectionRange(s+f.length,s+f.length);},0); }}
                        data-testid={`chip-email-field-${f}`}
                        className="px-2 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 rounded-lg text-xs font-mono font-semibold hover:bg-blue-500/20 transition-colors">
                        {f}
                      </button>
                    ))}
                  </div>
                  <div>
                    <Label className="mb-1 block">Subject</Label>
                    <input
                      ref={subjectRef} value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                      onFocus={() => setActiveField("subject")}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Email subject line" data-testid="input-reminder-email-subject"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block">Body</Label>
                    <textarea
                      ref={emailBodyRef} value={emailBody} onChange={e => setEmailBody(e.target.value)}
                      onFocus={() => setActiveField("emailBody")}
                      rows={10} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono resize-y"
                      placeholder="Write your email reminder template..." data-testid="textarea-reminder-email-body"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Reminder Schedule */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Reminder Schedule
            </h3>
            <p className="text-xs text-muted-foreground">Choose when to send reminders before each trip. Toggle to enable/disable individual offsets.</p>
            <div className="space-y-2">
              {reminders.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20" data-testid={`reminder-offset-${r.id}`}>
                  <button onClick={() => toggleReminder(r.id)}>
                    {r.enabled ? <ToggleRight className="w-7 h-7 text-primary flex-shrink-0" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground flex-shrink-0" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${r.enabled ? "text-foreground" : "text-muted-foreground"}`}>{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.value} {r.unit} before trip</p>
                  </div>
                  <button onClick={() => deleteReminder(r.id)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`button-delete-reminder-${r.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {reminders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">No reminder times configured. Add one below.</p>
              )}
            </div>

            {/* Add new */}
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Add Custom Reminder</p>
              <div className="flex gap-2 flex-wrap">
                <Input
                  type="number" min={1} value={newValue} onChange={e => setNewValue(e.target.value)}
                  placeholder="e.g. 3" className="w-20 flex-shrink-0" data-testid="input-new-reminder-value"
                />
                <select
                  value={newUnit} onChange={e => setNewUnit(e.target.value as "days" | "hours")}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm flex-shrink-0"
                  data-testid="select-new-reminder-unit"
                >
                  <option value="days">Days</option>
                  <option value="hours">Hours</option>
                </select>
                <Input
                  value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="Label (optional)" className="flex-1 min-w-32" data-testid="input-new-reminder-label"
                />
                <Button variant="outline" onClick={addReminder} data-testid="button-add-reminder">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>

          {/* Review Rating Reminder */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" /> Review Rating Reminder
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Fires once per booking after the trip ends, via channels enabled above.</p>
              </div>
              <button onClick={() => setReviewEnabled(v => !v)} className="flex-shrink-0" data-testid="toggle-review-reminder">
                {reviewEnabled ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </button>
            </div>

            {reviewEnabled && (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                {/* Trigger Schedule */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Send After Trip Ends</p>
                  {reviewTriggers.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20" data-testid={`review-trigger-${r.id}`}>
                      <button onClick={() => toggleReviewTrigger(r.id)}>
                        {r.enabled ? <ToggleRight className="w-7 h-7 text-primary flex-shrink-0" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground flex-shrink-0" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${r.enabled ? "text-foreground" : "text-muted-foreground"}`}>{r.label}</p>
                        <p className="text-xs text-muted-foreground">{r.value} {r.unit} after trip ends</p>
                      </div>
                      <button onClick={() => deleteReviewTrigger(r.id)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`button-delete-review-trigger-${r.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {reviewTriggers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-3">No send times configured. Add one below.</p>
                  )}
                  {/* Add Custom */}
                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Add Custom Trigger</p>
                    <div className="flex gap-2 flex-wrap">
                      <Input
                        type="number" min={1} value={newReviewValue} onChange={e => setNewReviewValue(e.target.value)}
                        placeholder="e.g. 24" className="w-20 flex-shrink-0" data-testid="input-new-review-trigger-value"
                      />
                      <select
                        value={newReviewUnit} onChange={e => setNewReviewUnit(e.target.value as "days" | "hours")}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm flex-shrink-0"
                        data-testid="select-new-review-trigger-unit"
                      >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                      <Input
                        value={newReviewLabel} onChange={e => setNewReviewLabel(e.target.value)}
                        placeholder="Label (optional)" className="flex-1 min-w-32" data-testid="input-new-review-trigger-label"
                      />
                      <Button variant="outline" onClick={addReviewTrigger} data-testid="button-add-review-trigger">
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Field chips */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Tap inside a template first, then tap a chip to insert at cursor.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...REMINDER_FIELDS, "[Google Review URL]", "[Proprietor Name]", "[Proprietor Number]"].map(f => (
                      <button key={`review-chip-${f}`} onClick={() => insertField(f)} data-testid={`chip-review-field-${f}`}
                        className={`px-2 py-1 border rounded-lg text-xs font-mono font-semibold transition-colors ${
                          ["[Google Review URL]", "[Proprietor Name]", "[Proprietor Number]"].includes(f)
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                        }`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* WhatsApp review template */}
                {waEnabled && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MessageCircleMore className="w-4 h-4 text-green-500" /> WhatsApp Template
                    </p>
                    <textarea
                      ref={reviewWaRef} value={reviewWaTemplate}
                      onChange={e => setReviewWaTemplate(e.target.value)}
                      onFocus={() => setActiveField("reviewWa")}
                      rows={7} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono resize-y"
                      placeholder="Write your WhatsApp review request..." data-testid="textarea-review-wa-template"
                    />
                  </div>
                )}

                {/* Email review template */}
                {emailEnabled && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" /> Email Template
                    </p>
                    <div>
                      <Label className="mb-1 block">Subject</Label>
                      <input
                        ref={reviewSubjectRef} value={reviewEmailSubject}
                        onChange={e => setReviewEmailSubject(e.target.value)}
                        onFocus={() => setActiveField("reviewSubject")}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Review email subject" data-testid="input-review-email-subject"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Body</Label>
                      <textarea
                        ref={reviewEmailBodyRef} value={reviewEmailBody}
                        onChange={e => setReviewEmailBody(e.target.value)}
                        onFocus={() => setActiveField("reviewEmailBody")}
                        rows={8} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono resize-y"
                        placeholder="Write your review request email..." data-testid="textarea-review-email-body"
                      />
                    </div>
                  </div>
                )}

                {!waEnabled && !emailEnabled && (
                  <p className="text-xs text-muted-foreground text-center py-2 border border-dashed border-border rounded-xl">Enable WhatsApp or Email reminders in "Send Reminders Via" to edit review templates.</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleSave} isLoading={saveMut.isPending} data-testid="button-save-reminder-settings">
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
            <Button variant="outline" onClick={() => runMut.mutate()} isLoading={runMut.isPending} data-testid="button-run-reminder-job">
              <AlarmClock className="w-4 h-4 mr-2" /> Test Now
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">Reminders run automatically every 15 minutes. Use "Test Now" to trigger immediately.</p>
        </div>
      )}
    </div>
  );
}

function StorageSection({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/upload-settings"] });

  const [storageMode, setStorageMode] = useState<"local" | "drive" | "cpanel">("local");
  const [folderUrl, setFolderUrl] = useState("");
  const [cpanelHost, setCpanelHost] = useState("");
  const [cpanelUsername, setCpanelUsername] = useState("");
  const [cpanelPassword, setCpanelPassword] = useState("");
  const [cpanelPort, setCpanelPort] = useState(21);
  const [cpanelRemotePath, setCpanelRemotePath] = useState("/public_html/uploads/");
  const [cpanelPublicUrl, setCpanelPublicUrl] = useState("");
  const [showCpanelPass, setShowCpanelPass] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data) {
      const mode = data.storageMode === "drive" ? "drive" : data.storageMode === "cpanel" ? "cpanel" : "local";
      setStorageMode(mode);
      const folderId = data.googleDriveFolderId || "";
      setFolderUrl(folderId ? `https://drive.google.com/drive/folders/${folderId}` : "");
      setCpanelHost(data.cpanelHost || "");
      setCpanelUsername(data.cpanelUsername || "");
      setCpanelPassword(data.cpanelPassword || "");
      setCpanelPort(data.cpanelPort || 21);
      setCpanelRemotePath(data.cpanelRemotePath || "/public_html/uploads/");
      setCpanelPublicUrl(data.cpanelPublicUrl || "");
    }
  }, [data]);

  function parseFolderId(url: string): string {
    const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : url.trim();
  }

  const saveMutation = useMutation({
    mutationFn: async (pin: string) => {
      await apiRequest("PUT", "/api/upload-settings", {
        storageMode,
        googleDriveFolderId: parseFolderId(folderUrl),
        cpanelHost: cpanelHost.trim(),
        cpanelUsername: cpanelUsername.trim(),
        cpanelPassword,
        cpanelPort: Number(cpanelPort),
        cpanelRemotePath: cpanelRemotePath.trim(),
        cpanelPublicUrl: cpanelPublicUrl.trim().replace(/\/$/, ""),
        adminPin: pin,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upload-settings"] });
      setShowPin(false);
      setPinValue("");
      setPinError("");
    },
    onError: (err: any) => {
      setPinError(err?.message || "Incorrect PIN");
      setPinValue("");
      setTimeout(() => pinRef.current?.focus(), 50);
    },
  });

  function handlePinChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setPinValue(digits);
    setPinError("");
    if (digits.length === 4) saveMutation.mutate(digits);
  }

  function handleSaveClick() {
    setShowPin(true);
    setPinValue("");
    setPinError("");
    setTimeout(() => pinRef.current?.focus(), 80);
  }

  const modes: { key: "local" | "drive" | "cpanel"; label: string; desc: string }[] = [
    { key: "local", label: "Local Server", desc: "Files stored on this server. May reset on redeploy." },
    { key: "drive", label: "Google Drive", desc: "Files stored in your Drive folder. Permanent cloud." },
    { key: "cpanel", label: "cPanel Hosting", desc: "Upload via FTP to your cPanel hosting server." },
  ];

  return (
    <div className="animate-in fade-in duration-200">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" data-testid="button-back-storage">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-xl font-bold font-display">Storage Settings</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Mode selector */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4" /> Storage Mode
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {modes.map(m => (
                <button
                  key={m.key}
                  data-testid={`button-storage-${m.key}`}
                  onClick={() => setStorageMode(m.key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${storageMode === m.key ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${storageMode === m.key ? "border-primary" : "border-muted-foreground"}`}>
                    {storageMode === m.key && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{m.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Google Drive config */}
          {storageMode === "drive" && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Google Drive Folder
              </h3>
              <div>
                <Label>Drive Folder URL</Label>
                <Input
                  data-testid="input-drive-folder-url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={folderUrl}
                  onChange={e => setFolderUrl(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">Paste the full Google Drive folder URL.</p>
              </div>
              {folderUrl && parseFolderId(folderUrl) && (
                <div className="bg-muted/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Folder ID detected:</p>
                  <p className="text-sm font-mono font-medium break-all">{parseFolderId(folderUrl)}</p>
                </div>
              )}
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-4 space-y-2 border border-orange-200 dark:border-orange-900">
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-400">Setup Required</p>
                <ol className="text-xs text-orange-700 dark:text-orange-400 space-y-1 list-decimal list-inside">
                  <li>Enable <strong>Drive API</strong> in Google Cloud Console</li>
                  <li>Create a <strong>Service Account</strong> and download JSON key</li>
                  <li>Share your Drive folder with the service account email</li>
                  <li>Add JSON key as secret <strong>GOOGLE_SERVICE_ACCOUNT_JSON</strong></li>
                </ol>
                {data?.hasCredentials ? (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium">Service account credentials are configured</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <Shield className="w-4 h-4 text-orange-600" />
                    <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">No credentials — set GOOGLE_SERVICE_ACCOUNT_JSON secret</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* cPanel FTP config */}
          {storageMode === "cpanel" && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-4 h-4" /> cPanel FTP Settings
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>FTP Host</Label>
                  <Input
                    data-testid="input-cpanel-host"
                    placeholder="ftp.yourdomain.com"
                    value={cpanelHost}
                    onChange={e => setCpanelHost(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input
                    data-testid="input-cpanel-port"
                    type="number"
                    placeholder="21"
                    value={cpanelPort}
                    onChange={e => setCpanelPort(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>FTP Username</Label>
                <Input
                  data-testid="input-cpanel-username"
                  placeholder="your_cpanel_username"
                  value={cpanelUsername}
                  onChange={e => setCpanelUsername(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>FTP Password</Label>
                <div className="relative mt-1">
                  <Input
                    data-testid="input-cpanel-password"
                    type={showCpanelPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={cpanelPassword}
                    onChange={e => setCpanelPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCpanelPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-cpanel-pass"
                  >
                    {showCpanelPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label>Remote Upload Path</Label>
                <Input
                  data-testid="input-cpanel-remote-path"
                  placeholder="/public_html/uploads/"
                  value={cpanelRemotePath}
                  onChange={e => setCpanelRemotePath(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">Absolute path on the server where files will be uploaded.</p>
              </div>

              <div>
                <Label>Public URL Base</Label>
                <Input
                  data-testid="input-cpanel-public-url"
                  placeholder="https://yourdomain.com/uploads"
                  value={cpanelPublicUrl}
                  onChange={e => setCpanelPublicUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">The public web URL that corresponds to the remote path above.</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-900">
                <p className="text-xs text-blue-800 dark:text-blue-400">
                  Use your cPanel FTP credentials. The FTP host is usually <strong>ftp.yourdomain.com</strong> or your server hostname. Make sure the remote path exists and the FTP user has write access.
                </p>
              </div>
            </div>
          )}

          {!showPin ? (
            <Button
              onClick={handleSaveClick}
              data-testid="button-save-storage"
              className="w-full"
            >
              Save Storage Settings
            </Button>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
              <p className="text-sm font-semibold text-center text-foreground">Enter Admin PIN to confirm</p>
              <div className="flex justify-center">
                <input
                  ref={pinRef}
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinValue}
                  onChange={e => handlePinChange(e.target.value)}
                  disabled={saveMutation.isPending}
                  placeholder="••••"
                  className={`w-28 text-center text-2xl tracking-[0.5em] font-bold rounded-xl border-2 px-3 py-3 bg-background outline-none transition-colors ${pinError ? "border-red-400 text-red-500" : "border-primary focus:border-primary/70"}`}
                  data-testid="input-admin-pin"
                />
              </div>
              {saveMutation.isPending && <p className="text-center text-xs text-muted-foreground">Verifying…</p>}
              {pinError && <p className="text-center text-sm text-red-500 font-medium">{pinError}</p>}
              <button
                onClick={() => { setShowPin(false); setPinValue(""); setPinError(""); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-cancel-pin"
              >
                Cancel
              </button>
            </div>
          )}

          {saveMutation.isSuccess && !showPin && (
            <p className="text-center text-sm text-green-600 font-medium">Settings saved successfully</p>
          )}
        </div>
      )}
    </div>
  );
}

function ManageCategoriesSection({ onBack }: { onBack: () => void }) {
  const { data: categories = [], isLoading } = useCategories();
  const { mutateAsync: createCategory, isPending: creating } = useCreateCategory();
  const { mutateAsync: updateCategory, isPending: updating } = useUpdateCategory();
  const { mutateAsync: deleteCategory } = useDeleteCategory();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return toast({ title: "Category name is required", variant: "destructive" });
    await createCategory(newName.trim());
    setNewName("");
    toast({ title: "Category created" });
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return toast({ title: "Category name is required", variant: "destructive" });
    await updateCategory({ id, name: editingName.trim() });
    setEditingId(null);
    toast({ title: "Category updated" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category? Services using it will become uncategorised.")) return;
    await deleteCategory(id);
    toast({ title: "Category deleted" });
  };

  return (
    <SubSection title="Manage Categories" onBack={onBack}>
      <p className="text-xs text-muted-foreground mb-5">Categories group your services on the home page (e.g. Day Trips, Night Stays, Rentals).</p>
      <div className="flex gap-2 mb-6">
        <Input
          data-testid="input-new-category"
          placeholder="New category name..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCreate()}
          className="flex-1"
        />
        <Button data-testid="button-add-category" onClick={handleCreate} disabled={creating || !newName.trim()}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No categories yet. Add your first one above.</p>
      ) : (
        <div className="space-y-2">
          {(categories as any[]).map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
              {editingId === cat.id ? (
                <>
                  <Input
                    data-testid={`input-edit-category-${cat.id}`}
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleUpdate(cat.id)}
                    className="flex-1 h-8"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleUpdate(cat.id)} disabled={updating} data-testid={`button-save-category-${cat.id}`}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} data-testid={`button-cancel-edit-category-${cat.id}`}>Cancel</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-foreground" data-testid={`text-category-name-${cat.id}`}>{cat.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }} data-testid={`button-edit-category-${cat.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(cat.id)} data-testid={`button-delete-category-${cat.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </SubSection>
  );
}

function SEOSection({ onBack }: { onBack: () => void }) {
  const { data: paymentSettings, isLoading } = usePaymentSettings();
  const { mutateAsync: updatePaymentSettings, isPending: saving } = useUpdatePaymentSettings();
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    if (paymentSettings?.seoKeywords) setKeywords(paymentSettings.seoKeywords);
  }, [paymentSettings]);

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw) return;
    if (keywords.includes(kw)) { toast({ title: "Keyword already added", variant: "destructive" }); return; }
    setKeywords([...keywords, kw]);
    setNewKeyword("");
  };

  const removeKeyword = (kw: string) => setKeywords(keywords.filter(k => k !== kw));

  const handleSave = async () => {
    await updatePaymentSettings({ ...paymentSettings, seoKeywords: keywords });
    toast({ title: "SEO keywords saved." });
  };

  return (
    <SubSection title="SEO & Discoverability" onBack={onBack}>
      <p className="text-xs text-muted-foreground mb-5">Keywords are injected into the page <code className="bg-muted px-1 rounded text-xs">{"<meta name=\"keywords\">"}</code> tag to help search engines discover your site.</p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <Input
              data-testid="input-new-keyword"
              placeholder="Add keyword…"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addKeyword()}
              className="flex-1"
            />
            <Button data-testid="button-add-keyword" onClick={addKeyword} disabled={!newKeyword.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          {keywords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No keywords yet. Add your first one above.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-6">
              {keywords.map(kw => (
                <span key={kw} data-testid={`badge-keyword-${kw}`} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-sm font-medium">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} data-testid={`button-remove-keyword-${kw}`} className="hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <Button data-testid="button-save-seo" onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save Keywords"}
          </Button>
        </>
      )}
    </SubSection>
  );
}

function NameAutocomplete({ value, onChange, names }: { value: string; onChange: (v: string) => void; names: string[] }) {
  const [open, setOpen] = useState(false);
  const suggestions = value.trim()
    ? names.filter(n => n.toLowerCase().includes(value.trim().toLowerCase()))
    : [];

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="e.g. Rahul"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        data-testid="input-name-contains"
        className="w-full"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map(name => (
            <button
              key={name}
              type="button"
              onMouseDown={() => { onChange(name); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── My Coupons Section (non-admin) ──────────────────────────────────────────
function MyCouponsSection({ onBack }: { onBack: () => void }) {
  const { data: myCoupons = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/coupons/my"] });

  const now = new Date();
  const active = myCoupons.filter(c => c.isActive && !c.isUsed && new Date(c.expiresAt) > now);
  const used = myCoupons.filter(c => c.isUsed);
  const voided = myCoupons.filter(c => !c.isUsed && !c.isActive);
  const expired = myCoupons.filter(c => !c.isUsed && c.isActive && new Date(c.expiresAt) <= now);

  const formatDiscount = (c: any) =>
    c.discountType === "percentage" ? `${c.discountValue}% off` : `₹${c.discountValue} off`;

  const daysLeft = (expiresAt: string) => {
    const diff = Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 86400000);
    return diff;
  };

  const CouponCard = ({ c, dim, voided: isVoided }: { c: any; dim?: boolean; voided?: boolean }) => (
    <div
      data-testid={`coupon-card-${c.id}`}
      className={`rounded-2xl border p-4 transition-all ${
        isVoided
          ? "bg-muted/30 border-border opacity-50"
          : dim
          ? "bg-muted/40 border-border opacity-60"
          : "bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-700/40 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dim || isVoided ? "bg-muted" : "bg-amber-100 dark:bg-amber-900/30"}`}>
            <Ticket className={`w-4 h-4 ${dim || isVoided ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}`} />
          </div>
          <div>
            <p className={`text-base font-bold tracking-wider font-mono ${isVoided ? "line-through text-muted-foreground" : dim ? "text-muted-foreground" : "text-amber-700 dark:text-amber-300"}`}>
              {c.code}
            </p>
            <p className="text-xs text-muted-foreground">{formatDiscount(c)}</p>
          </div>
        </div>
        {isVoided ? (
          <span className="text-[10px] font-bold uppercase bg-red-100 dark:bg-red-900/20 text-red-500 px-2 py-0.5 rounded-full">Cancelled</span>
        ) : c.isUsed ? (
          <span className="text-[10px] font-bold uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Used</span>
        ) : new Date(c.expiresAt) <= now ? (
          <span className="text-[10px] font-bold uppercase bg-red-100 dark:bg-red-900/20 text-red-500 px-2 py-0.5 rounded-full">Expired</span>
        ) : (
          <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Active</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalIcon className="w-3.5 h-3.5" />
        {isVoided ? (
          <span>Booking was cancelled — coupon voided</span>
        ) : c.isUsed ? (
          <span>Already used</span>
        ) : new Date(c.expiresAt) <= now ? (
          <span>Expired on {format(new Date(c.expiresAt), "dd MMM yyyy")}</span>
        ) : (
          <span>
            Valid until <strong className="text-foreground">{format(new Date(c.expiresAt), "dd MMM yyyy")}</strong>
            {" "}· {daysLeft(c.expiresAt)} day{daysLeft(c.expiresAt) !== 1 ? "s" : ""} left
          </span>
        )}
      </div>
      {c.minPax > 0 && (
        <p className="text-xs text-muted-foreground mt-1">Min. {c.minPax} pax required</p>
      )}
    </div>
  );

  return (
    <SubSection title="My Coupons" onBack={onBack}>
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-20 rounded-2xl bg-muted animate-pulse" />
          <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        </div>
      ) : myCoupons.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-amber-300" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No coupons yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Complete a booking and you may earn a coupon code for your next trip!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {active.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Active · Ready to use</p>
              <div className="space-y-3">
                {active.map(c => <CouponCard key={c.id} c={c} />)}
              </div>
            </div>
          )}
          {used.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Used</p>
              <div className="space-y-3">
                {used.map(c => <CouponCard key={c.id} c={c} dim />)}
              </div>
            </div>
          )}
          {expired.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Expired</p>
              <div className="space-y-3">
                {expired.map(c => <CouponCard key={c.id} c={c} dim />)}
              </div>
            </div>
          )}
          {voided.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Cancelled</p>
              <div className="space-y-3">
                {voided.map(c => <CouponCard key={c.id} c={c} voided />)}
              </div>
            </div>
          )}
        </div>
      )}
    </SubSection>
  );
}

function DeleteBookingsSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("all"); // "all" | "today" | "tomorrow"
  const [beforeDate, setBeforeDate] = useState<string>("");
  const [nameContains, setNameContains] = useState<string>("");
  const [confirm, setConfirm] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const { data: allBookings = [] } = useQuery<any[]>({ queryKey: ["/api/bookings"] });

  const todayISO = format(new Date(), "yyyy-MM-dd");
  const tomorrowISO = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const getFiltered = () => {
    let filtered = [...allBookings];
    if (status) filtered = filtered.filter(b => b.status === status);
    if (dateFilter === "today") filtered = filtered.filter(b => b.date === todayISO);
    else if (dateFilter === "tomorrow") filtered = filtered.filter(b => b.date === tomorrowISO);
    else if (beforeDate) filtered = filtered.filter(b => b.date <= beforeDate);
    if (nameContains.trim()) filtered = filtered.filter(b => b.fullName?.toLowerCase().includes(nameContains.trim().toLowerCase()));
    return filtered;
  };

  const handlePreview = () => {
    const count = getFiltered().length;
    setPreviewCount(count);
    setConfirm(true);
  };

  const deleteMutation = useMutation({
    mutationFn: () => {
      const exactDate = dateFilter === "today" ? todayISO : dateFilter === "tomorrow" ? tomorrowISO : undefined;
      return apiRequest("DELETE", "/api/bookings/bulk", { status: status || undefined, exactDate, beforeDate: exactDate ? undefined : (beforeDate || undefined), nameContains: nameContains.trim() || undefined });
    },
    onSuccess: async (res: any) => {
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/bookings"] });
      setConfirm(false);
      setStatus(""); setBeforeDate(""); setNameContains("");
      setPreviewCount(null);
      toast({ title: `${data.deleted} booking${data.deleted !== 1 ? "s" : ""} deleted successfully.` });
    },
    onError: () => toast({ title: "Failed to delete bookings", variant: "destructive" }),
  });

  const [newStatus, setNewStatus] = useState<string>("");
  const [confirmUpdate, setConfirmUpdate] = useState(false);

  const bulkStatusMutation = useMutation({
    mutationFn: () => {
      const exactDate = dateFilter === "today" ? todayISO : dateFilter === "tomorrow" ? tomorrowISO : undefined;
      return apiRequest("PATCH", "/api/bookings/bulk-status", { status: status || undefined, exactDate, beforeDate: exactDate ? undefined : (beforeDate || undefined), nameContains: nameContains.trim() || undefined, newStatus });
    },
    onSuccess: async (res: any) => {
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/bookings"] });
      setConfirmUpdate(false);
      setConfirm(false);
      toast({ title: `${data.updated} booking${data.updated !== 1 ? "s" : ""} updated to "${newStatus}".` });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const NEW_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <SubSection title="Manage Bookings" onBack={onBack}>

      <div className="space-y-4 mb-6">
        {/* Status filter */}
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Filter by Status</Label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                data-testid={`filter-status-${opt.value || "all"}`}
                onClick={() => { setStatus(opt.value); setDateFilter("all"); setBeforeDate(""); setConfirm(false); setConfirmUpdate(false); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  status === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date filter */}
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Filter by Date</Label>
          {status ? (
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All Dates" },
                { value: "today", label: "Today" },
                { value: "tomorrow", label: "Tomorrow" },
              ].map(opt => (
                <button
                  key={opt.value}
                  data-testid={`filter-date-${opt.value}`}
                  onClick={() => { setDateFilter(opt.value); setBeforeDate(""); setConfirm(false); setConfirmUpdate(false); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    dateFilter === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <>
              <Input
                type="date"
                value={beforeDate}
                onChange={e => { setBeforeDate(e.target.value); setDateFilter("all"); }}
                data-testid="input-before-date"
                className="w-full"
              />
              {beforeDate && <p className="text-xs text-muted-foreground mt-1">Filtering bookings on or before {beforeDate}.</p>}
            </>
          )}
        </div>

        {/* Name filter with autocomplete */}
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Filter by Customer Name (contains)</Label>
          <NameAutocomplete
            value={nameContains}
            onChange={setNameContains}
            names={Array.from(new Set((allBookings as any[]).map(b => b.fullName).filter(Boolean)))}
          />
        </div>
      </div>

      {/* Matched count */}
      <div className="p-3 bg-muted rounded-xl text-sm mb-5">
        <span className="font-semibold text-foreground">{getFiltered().length}</span>
        <span className="text-muted-foreground"> booking{getFiltered().length !== 1 ? "s" : ""} match the current filters</span>
      </div>

      {/* ── Update Status ─────────────────────────── */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">Update Status</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {NEW_STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              data-testid={`new-status-${opt.value}`}
              onClick={() => setNewStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                newStatus === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {!confirmUpdate ? (
          <Button
            variant="outline"
            className="w-full border-primary/40 text-primary hover:bg-primary/10"
            disabled={getFiltered().length === 0 || !newStatus}
            onClick={() => setConfirmUpdate(true)}
            data-testid="button-preview-update-status"
          >
            <BadgeCheck className="w-4 h-4 mr-2" />
            Change {getFiltered().length} booking{getFiltered().length !== 1 ? "s" : ""} to "{newStatus || "…"}"
          </Button>
        ) : (
          <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Update <span className="text-primary">{getFiltered().length}</span> booking{getFiltered().length !== 1 ? "s" : ""} to <span className="text-primary capitalize">{newStatus}</span>?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmUpdate(false)} data-testid="button-cancel-update-status">Cancel</Button>
              <Button
                className="flex-1"
                disabled={bulkStatusMutation.isPending}
                onClick={() => bulkStatusMutation.mutate()}
                data-testid="button-confirm-update-status"
              >
                {bulkStatusMutation.isPending ? "Updating…" : "Confirm Update"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Bookings ─────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Delete Bookings</h3>
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-sm text-red-700 dark:text-red-300">
          ⚠️ This permanently deletes bookings. This action cannot be undone.
        </div>

        {!confirm ? (
          <Button
            variant="destructive"
            className="w-full"
            disabled={getFiltered().length === 0}
            onClick={handlePreview}
            data-testid="button-preview-delete"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Review & Delete {getFiltered().length} booking{getFiltered().length !== 1 ? "s" : ""}
          </Button>
        ) : (
          <div className="border border-red-300 dark:border-red-700 rounded-xl p-4 bg-red-50 dark:bg-red-900/20 space-y-3">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              Permanently delete <span className="text-lg">{previewCount}</span> booking{previewCount !== 1 ? "s" : ""}? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirm(false)} data-testid="button-cancel-delete">Cancel</Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? "Deleting…" : `Delete ${previewCount}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </SubSection>
  );
}

// ─── Chat Widget Section ──────────────────────────────────────────────────────
type ChatWidgetData = {
  id: number;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappCorner: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  whatsappMessage: string;
  tawkEnabled: boolean;
  tawkScript: string;
  showOnMobile: boolean;
};

const CORNER_OPTIONS: { value: ChatWidgetData["whatsappCorner"]; label: string }[] = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
];

function ChatWidgetSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<ChatWidgetData>({ queryKey: ["/api/chat-widget-settings"] });

  const [waEnabled, setWaEnabled] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [waCorner, setWaCorner] = useState<ChatWidgetData["whatsappCorner"]>("bottom-right");
  const [waMessage, setWaMessage] = useState("");
  const [showOnMobile, setShowOnMobile] = useState(true);
  const [tawkEnabled, setTawkEnabled] = useState(false);
  const [tawkScript, setTawkScript] = useState("");

  useEffect(() => {
    if (data) {
      setWaEnabled(data.whatsappEnabled);
      setWaNumber(data.whatsappNumber);
      setWaCorner(data.whatsappCorner);
      setWaMessage(data.whatsappMessage);
      setShowOnMobile(data.showOnMobile ?? true);
      setTawkEnabled(data.tawkEnabled);
      setTawkScript(data.tawkScript);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (body: Partial<ChatWidgetData>) =>
      apiRequest("PATCH", "/api/chat-widget-settings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/chat-widget-settings"] });
      toast({ title: "Saved", description: "Chat widget settings updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }),
  });

  const handleSave = () => {
    saveMutation.mutate({
      whatsappEnabled: waEnabled,
      whatsappNumber: waNumber.trim(),
      whatsappCorner: waCorner,
      whatsappMessage: waMessage,
      showOnMobile,
      tawkEnabled,
      tawkScript: tawkScript.trim(),
    });
  };

  if (isLoading) return <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>;

  return (
    <SubSection title="Message Buttons" onBack={onBack}>
      <div className="space-y-6">

        {/* WhatsApp Floating Button */}
        <div className="border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              <span className="font-semibold text-foreground">WhatsApp Floating Button</span>
            </div>
            <button
              type="button"
              onClick={() => setWaEnabled(v => !v)}
              data-testid="toggle-whatsapp-widget"
            >
              {waEnabled
                ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
            </button>
          </div>

          {waEnabled && (
            <div className="space-y-3">

              {/* Show on Mobile toggle */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-foreground">Show on Mobile</p>
                  <p className="text-xs text-muted-foreground">Display the WhatsApp button on mobile screens</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOnMobile(v => !v)}
                  data-testid="toggle-whatsapp-mobile"
                >
                  {showOnMobile
                    ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                    : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                </button>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Phone Number (with country code)</Label>
                <Input
                  value={waNumber}
                  onChange={e => setWaNumber(e.target.value)}
                  placeholder="e.g. 919876543210"
                  data-testid="input-whatsapp-number"
                />
                <p className="text-xs text-muted-foreground mt-1">Enter digits only, no + or spaces.</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Button Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CORNER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWaCorner(opt.value)}
                      data-testid={`corner-${opt.value}`}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        waCorner === opt.value
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium"
                          : "border-border text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Pre-filled Message (optional)</Label>
                <textarea
                  value={waMessage}
                  onChange={e => setWaMessage(e.target.value)}
                  placeholder="Hello! I'd like to enquire about kayaking."
                  rows={3}
                  data-testid="textarea-whatsapp-message"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tawk.to Chat */}
        <div className="border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-foreground">Tawk.to Live Chat</span>
            </div>
            <button
              type="button"
              onClick={() => setTawkEnabled(v => !v)}
              data-testid="toggle-tawk-widget"
            >
              {tawkEnabled
                ? <ToggleRight className="w-8 h-8 text-blue-500" />
                : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
            </button>
          </div>

          {tawkEnabled && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Tawk.to Script or Property URL</Label>
              <textarea
                value={tawkScript}
                onChange={e => setTawkScript(e.target.value)}
                placeholder={`Paste your Tawk.to <script> embed code or property URL here.\ne.g. https://embed.tawk.to/XXXXXXXXX/default`}
                rows={5}
                data-testid="textarea-tawk-script"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                From your Tawk.to dashboard → Administration → Chat Widget → copy the embed script or the direct URL.
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="w-full"
          data-testid="button-save-chat-widget"
        >
          {saveMutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </SubSection>
  );
}

// ─── Sea Level Tracker Section ────────────────────────────────────────────────
type TideExtreme = { time: string; height: number; type: "HIGH" | "LOW" };

function TideChart({ events }: { events: TideExtreme[] }) {
  if (!events.length) return null;

  const W = 340;
  const H = 160;
  const PAD_X = 32;
  const PAD_TOP = 20;
  const PAD_BOT = 28;
  const chartH = H - PAD_TOP - PAD_BOT;
  const chartW = W - PAD_X * 2;

  const heights = events.map(e => e.height);
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  const rangeH = maxH - minH || 1;

  function toXY(e: TideExtreme) {
    const d = new Date(e.time);
    const offsetMs = 5.5 * 60 * 60 * 1000;
    const ist = new Date(d.getTime() + offsetMs);
    const frac = (ist.getUTCHours() * 60 + ist.getUTCMinutes()) / (24 * 60);
    const x = PAD_X + frac * chartW;
    const y = PAD_TOP + chartH - ((e.height - minH) / rangeH) * chartH;
    return { x, y };
  }

  const pts = events.map(toXY);

  // Build smooth path using cubic bezier through extremes
  function buildPath() {
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      d += ` C ${mx} ${pts[i].y}, ${mx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
    }
    return d;
  }

  // Build fill area below the curve (close to bottom)
  function buildFill() {
    if (pts.length === 1) return "";
    const bottom = PAD_TOP + chartH;
    let d = `M ${pts[0].x} ${bottom} L ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      d += ` C ${mx} ${pts[i].y}, ${mx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
    }
    d += ` L ${pts[pts.length - 1].x} ${bottom} Z`;
    return d;
  }

  function fmtTime(isoTime: string) {
    const d = new Date(isoTime);
    const offsetMs = 5.5 * 60 * 60 * 1000;
    const ist = new Date(d.getTime() + offsetMs);
    const h = ist.getUTCHours();
    const m = ist.getUTCMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      <defs>
        <linearGradient id="tideGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const x = PAD_X + f * chartW;
        const label = `${Math.round(f * 24)}:00`;
        return (
          <g key={f}>
            <line x1={x} y1={PAD_TOP} x2={x} y2={PAD_TOP + chartH} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
            <text x={x} y={H - 4} textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.4">{label}</text>
          </g>
        );
      })}

      {/* Fill area */}
      {pts.length > 1 && (
        <path d={buildFill()} fill="url(#tideGrad)" />
      )}

      {/* Curve */}
      <path d={buildPath()} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Extreme dots + labels */}
      {events.map((e, i) => {
        const { x, y } = pts[i];
        const isHigh = e.type === "HIGH";
        const color = isHigh ? "#3b82f6" : "#f97316";
        const labelY = isHigh ? y - 14 : y + 18;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={5} fill={color} stroke="white" strokeWidth="2" />
            <text x={x} y={labelY} textAnchor="middle" fontSize="8.5" fontWeight="600" fill={color}>{fmtTime(e.time)}</text>
            <text x={x} y={labelY + (isHigh ? -9 : 9)} textAnchor="middle" fontSize="7.5" fill={color} fillOpacity="0.8">{e.height.toFixed(2)}m</text>
          </g>
        );
      })}
    </svg>
  );
}

type TideSettingsData = {
  id: number;
  stormglassApiKey: string;
  latitude: string;
  longitude: string;
  locationName: string;
  showOnHome: boolean;
};

type TideResponse = { data: TideExtreme[] };

function SeaLevelSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);

  const { data: settings } = useQuery<TideSettingsData>({
    queryKey: ["/api/admin/tide-settings"],
  });

  const [apiKey, setApiKey] = useState("");
  const [latitude, setLatitude] = useState("15.2736");
  const [longitude, setLongitude] = useState("73.9296");
  const [locationName, setLocationName] = useState("Colva, Goa");
  const [showOnHome, setShowOnHome] = useState(true);
  const hasApiKey = apiKey.trim().length > 0;

  // Location picker state
  type LocationSuggestion = { name: string; displayName: string; lat: string; lon: string };
  const [locationSearch, setLocationSearch] = useState("Colva, Goa");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const locationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settings) {
      setApiKey(settings.stormglassApiKey ?? "");
      setLatitude(settings.latitude ?? "15.2736");
      setLongitude(settings.longitude ?? "73.9296");
      setLocationName(settings.locationName ?? "Colva, Goa");
      setLocationSearch(settings.locationName ?? "Colva, Goa");
      setShowOnHome(settings.showOnHome ?? true);
    }
  }, [settings]);

  function handleLocationSearch(val: string) {
    setLocationSearch(val);
    setLocationName(val);
    if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    if (!val.trim() || val.trim().length < 2) { setLocationSuggestions([]); return; }
    locationTimerRef.current = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=6&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json() as Array<{ name: string; display_name: string; lat: string; lon: string }>;
        setLocationSuggestions(data.map(d => ({
          name: d.name || d.display_name.split(",")[0].trim(),
          displayName: d.display_name,
          lat: d.lat,
          lon: d.lon,
        })));
      } catch { setLocationSuggestions([]); }
      finally { setIsSearchingLocation(false); }
    }, 500);
  }

  function pickLocation(s: LocationSuggestion) {
    const label = s.displayName.split(",").slice(0, 2).join(", ").trim();
    setLocationName(label);
    setLocationSearch(label);
    setLatitude(parseFloat(s.lat).toFixed(4));
    setLongitude(parseFloat(s.lon).toFixed(4));
    setLocationSuggestions([]);
  }

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/admin/tide-settings", {
      stormglassApiKey: apiKey.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      locationName: locationName.trim(),
      showOnHome,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tide-settings"] });
      toast({ title: "Tide settings saved." });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const { data: tideData, isLoading: tideLoading, refetch: fetchTide, error: tideError } = useQuery<TideResponse>({
    queryKey: ["/api/admin/tide", date],
    queryFn: async (): Promise<TideResponse> => {
      const res = await fetch(`/api/admin/tide?date=${date}`);
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message || "Failed to fetch tide data");
      }
      return res.json() as Promise<TideResponse>;
    },
    enabled: hasApiKey,
    retry: false,
  });

  const extremes: TideExtreme[] = (tideData?.data ?? []);

  return (
    <SubSection title="Sea Level Tracker" onBack={onBack}>
      <div className="space-y-5">
        {/* API Config */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" /> Stormglass API Configuration
          </h3>
          {/* Show on Home toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-foreground">Show on Home Page</p>
              <p className="text-xs text-muted-foreground">Display the tide widget to admins on the dashboard</p>
            </div>
            <button
              type="button"
              onClick={() => setShowOnHome(v => !v)}
              data-testid="toggle-tide-show-on-home"
              className="flex-shrink-0"
            >
              {showOnHome
                ? <ToggleRight className="w-8 h-8 text-blue-500" />
                : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
            </button>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Stormglass API Key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Your Stormglass.io API key"
              data-testid="input-stormglass-api-key"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get your free key at <span className="text-blue-500">stormglass.io</span> — up to 10 requests/day on free tier.
            </p>
          </div>
          <div className="relative">
            <Label className="text-xs text-muted-foreground mb-1 block">Location</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={locationSearch}
                onChange={e => handleLocationSearch(e.target.value)}
                onFocus={() => locationSearch.trim().length >= 2 && locationSuggestions.length === 0 && handleLocationSearch(locationSearch)}
                placeholder="Search for a location…"
                className="pl-8 pr-8"
                data-testid="input-tide-location-name"
              />
              {isSearchingLocation && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
              )}
            </div>
            {locationSuggestions.length > 0 && (
              <div
                ref={suggestionBoxRef}
                className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
              >
                {locationSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); pickLocation(s); }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
                    data-testid={`location-suggestion-${i}`}
                  >
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-xs text-muted-foreground block truncate">{s.displayName}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Search to auto-fill coordinates, or enter lat/lng manually below.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Latitude</Label>
              <Input
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                placeholder="15.2736"
                data-testid="input-tide-latitude"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Longitude</Label>
              <Input
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                placeholder="73.9296"
                data-testid="input-tide-longitude"
              />
            </div>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            isLoading={saveMutation.isPending}
            className="w-full"
            data-testid="button-save-tide-settings"
          >
            <Save className="w-4 h-4 mr-2" /> Save Configuration
          </Button>
        </div>

        {/* Tide Viewer */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-500" /> Tide Data for {locationName || "your location"}
          </h3>
          <div className="flex gap-2">
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="flex-1"
              data-testid="input-tide-date"
            />
            <Button
              onClick={() => fetchTide()}
              isLoading={tideLoading}
              disabled={!apiKey.trim()}
              data-testid="button-fetch-tide"
            >
              Fetch
            </Button>
          </div>

          {!apiKey.trim() && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Configure your API key above to fetch tide data.{" "}
              <a href="https://stormglass.io" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-600">Get a free key at stormglass.io</a>
            </p>
          )}

          {tideError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              {(tideError as Error).message?.toLowerCase().includes("quota")
                ? "Too many attempts. Try again later."
                : (tideError as Error).message}
            </div>
          )}

          {extremes.length > 0 && (
            <>
              {/* Chart */}
              <div className="bg-muted/30 rounded-xl p-3 border border-border">
                <TideChart events={extremes} />
                <div className="flex items-center gap-4 mt-2 justify-center">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> High Tide
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Low Tide
                  </span>
                </div>
              </div>

              {/* Events list */}
              <div className="space-y-2">
                {extremes.map((e, i) => {
                  const d = new Date(e.time);
                  const istOffset = 5.5 * 60 * 60 * 1000;
                  const ist = new Date(d.getTime() + istOffset);
                  const h = ist.getUTCHours();
                  const m = ist.getUTCMinutes().toString().padStart(2, "0");
                  const ampm = h >= 12 ? "PM" : "AM";
                  const h12 = h % 12 || 12;
                  const timeStr = `${h12}:${m} ${ampm}`;
                  const isHigh = e.type === "HIGH";
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-lg px-4 py-3 border ${isHigh ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"}`}
                      data-testid={`tide-event-${i}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isHigh ? "bg-blue-500" : "bg-orange-500"}`} />
                        <div>
                          <p className={`text-sm font-semibold ${isHigh ? "text-blue-700 dark:text-blue-300" : "text-orange-700 dark:text-orange-300"}`}>
                            {isHigh ? "High Tide" : "Low Tide"}
                          </p>
                          <p className="text-xs text-muted-foreground">{timeStr}</p>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${isHigh ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>
                        {e.height.toFixed(2)}<span className="text-xs font-normal ml-0.5">m</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Data powered by <span className="text-blue-500">Stormglass.io</span> · Times shown in IST (India Standard Time)
              </p>
            </>
          )}

          {tideData && extremes.length === 0 && !tideLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">No tide extremes found for this date.</p>
          )}
        </div>
      </div>
    </SubSection>
  );
}

// ─── App Policies Section ──────────────────────────────────────────────────────

const POLICY_CONFIGS = [
  { type: "terms",   label: "Terms & Conditions", url: "/terms-conditions" },
  { type: "refund",  label: "Refund Policy",       url: "/refundpolicy" },
  { type: "privacy", label: "Privacy Policy",      url: "/privacypolicy" },
  { type: "return",  label: "Return Policy",       url: "/returnpolicy" },
] as const;

function AppPoliciesSection({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: policies = [] } = useQuery<{ id: number; policyType: string; header: string; details: string; redirectUrl: string }[]>({
    queryKey: ["/api/app-policies"],
  });

  const [forms, setForms] = useState<Record<string, { header: string; details: string; redirectUrl: string }>>({});
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (initialised) return;
    const initial: Record<string, { header: string; details: string; redirectUrl: string }> = {};
    for (const cfg of POLICY_CONFIGS) {
      const p = policies.find(x => x.policyType === cfg.type);
      initial[cfg.type] = { header: p?.header ?? "", details: p?.details ?? "", redirectUrl: p?.redirectUrl ?? "" };
    }
    setForms(initial);
    if (policies.length > 0 || Object.keys(initial).length > 0) setInitialised(true);
  }, [policies, initialised]);

  const saveMutation = useMutation({
    mutationFn: ({ type, data }: { type: string; data: { header: string; details: string; redirectUrl: string } }) =>
      apiRequest("PUT", `/api/app-policies/${type}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-policies"] });
      toast({ title: "Policy saved." });
    },
    onError: () => toast({ title: "Failed to save.", variant: "destructive" }),
  });

  const updateField = (type: string, field: string, value: string) => {
    setForms(prev => ({ ...prev, [type]: { ...(prev[type] ?? { header: "", details: "", redirectUrl: "" }), [field]: value } }));
  };

  return (
    <SubSection title="App Policies" onBack={onBack}>
      <div className="space-y-6">
        {POLICY_CONFIGS.map(cfg => {
          const form = forms[cfg.type] ?? { header: "", details: "", redirectUrl: "" };
          const hasContent = !!(form.header || form.details);

          return (
            <div key={cfg.type} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Public URL:{" "}
                    <a href={cfg.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {cfg.url}
                    </a>
                  </p>
                </div>
                <button
                  onClick={() => saveMutation.mutate({ type: cfg.type, data: form })}
                  disabled={saveMutation.isPending}
                  data-testid={`btn-save-policy-${cfg.type}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex-shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>

              {/* Header */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Header</label>
                <input
                  type="text"
                  value={form.header}
                  onChange={e => updateField(cfg.type, "header", e.target.value)}
                  placeholder={`e.g. ${cfg.label}`}
                  data-testid={`input-policy-header-${cfg.type}`}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Details */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Details</label>
                <textarea
                  value={form.details}
                  onChange={e => updateField(cfg.type, "details", e.target.value)}
                  placeholder="Enter policy text. Line breaks are preserved as entered."
                  rows={6}
                  data-testid={`input-policy-details-${cfg.type}`}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
                {form.details && (
                  <div className="mt-2 p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">Preview</p>
                    <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{form.details}</p>
                  </div>
                )}
              </div>

              {/* Redirect URL — disabled when header or details are present */}
              <div>
                <label className={`text-xs font-medium mb-1 block ${hasContent ? "text-muted-foreground/40" : "text-muted-foreground"}`}>
                  Redirect URL
                  {hasContent && (
                    <span className="ml-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                      disabled — clear header & details to use a redirect
                    </span>
                  )}
                </label>
                <input
                  type="url"
                  value={form.redirectUrl}
                  onChange={e => updateField(cfg.type, "redirectUrl", e.target.value)}
                  placeholder="https://example.com/terms"
                  disabled={hasContent}
                  data-testid={`input-policy-redirect-${cfg.type}`}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          );
        })}
      </div>
    </SubSection>
  );
}

// ─── Business Details Section ─────────────────────────────────────────────────
function BusinessDetailsSection({ onBack }: { onBack: () => void }) {
  const { data: settings, isLoading } = usePaymentSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdatePaymentSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [companyName, setCompanyName] = useState("");
  const [registeredBusinessName, setRegisteredBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [boardingMessage, setBoardingMessage] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setCompanyName((settings as any).companyName ?? "");
      setRegisteredBusinessName((settings as any).registeredBusinessName ?? "");
      setBusinessAddress((settings as any).businessAddress ?? "");
      setContactPerson((settings as any).contactPerson ?? "");
      setContactNumber((settings as any).contactNumber ?? "");
      setGstNumber((settings as any).gstNumber ?? "");
      setBoardingMessage((settings as any).boardingMessage ?? "");
      setInitialized(true);
    }
  }, [settings, initialized]);

  const handleSave = async () => {
    if (!companyName.trim()) return toast({ title: "Business name is required", variant: "destructive" });
    try {
      await updateSettings({
        ...(settings as any),
        companyName: companyName.trim(),
        registeredBusinessName: registeredBusinessName.trim(),
        businessAddress: businessAddress.trim(),
        contactPerson: contactPerson.trim(),
        contactNumber: contactNumber.trim(),
        gstNumber: gstNumber.trim(),
        boardingMessage: boardingMessage.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
      toast({ title: "Business details saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading || !initialized) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;

  return (
    <SubSection title="Business Details" onBack={onBack}>
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">This information is used across the app header, invoices, and legal documents.</p>

        <div>
          <Label className="flex items-center gap-1.5 mb-1"><BadgeCheck className="w-4 h-4 text-primary" /> Business Name</Label>
          <Input
            data-testid="input-business-name"
            placeholder="Local Goa Kayaking"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Displayed in the app header and on receipts</p>
        </div>

        <div>
          <Label className="flex items-center gap-1.5 mb-1"><FileText className="w-4 h-4 text-primary" /> Registered Business Name</Label>
          <Input
            data-testid="input-registered-business-name"
            placeholder="Local Goa Kayaking Pvt. Ltd."
            value={registeredBusinessName}
            onChange={e => setRegisteredBusinessName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Legal name as registered with authorities</p>
        </div>

        <div>
          <Label className="flex items-center gap-1.5 mb-1"><MapPin className="w-4 h-4 text-primary" /> Address</Label>
          <textarea
            data-testid="input-business-address"
            rows={3}
            placeholder="123, Beach Road, Panaji, Goa - 403001"
            value={businessAddress}
            onChange={e => setBusinessAddress(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1.5 mb-1"><User className="w-4 h-4 text-primary" /> Contact Person</Label>
            <Input
              data-testid="input-contact-person"
              placeholder="Mr. Siddhant Saptoji"
              value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
            />
          </div>
          <div>
            <Label className="flex items-center gap-1.5 mb-1"><Phone className="w-4 h-4 text-primary" /> Contact Number</Label>
            <Input
              data-testid="input-contact-number"
              placeholder="+91 7770044447"
              value={contactNumber}
              onChange={e => setContactNumber(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-1.5 mb-1"><BadgePercent className="w-4 h-4 text-primary" /> GST Number</Label>
          <Input
            data-testid="input-gst-number"
            placeholder="22AAAAA0000A1Z5"
            value={gstNumber}
            onChange={e => setGstNumber(e.target.value.toUpperCase())}
            maxLength={15}
          />
          <p className="text-xs text-muted-foreground mt-1">Displayed in small font below the business name in the app header</p>
        </div>

        <div>
          <Label className="flex items-center gap-1.5 mb-1"><MessageSquare className="w-4 h-4 text-primary" /> Boarding Message</Label>
          <textarea
            data-testid="input-boarding-message"
            rows={2}
            placeholder="We wish you a wonderful and unforgettable experience."
            value={boardingMessage}
            onChange={e => setBoardingMessage(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground mt-1">Shown in the boarding pass footer. Defaults to the standard farewell message if left blank.</p>
        </div>

        <Button className="w-full" onClick={handleSave} isLoading={isPending} data-testid="button-save-business-details">
          <Save className="w-4 h-4 mr-2" /> Save Business Details
        </Button>
      </div>
    </SubSection>
  );
}
