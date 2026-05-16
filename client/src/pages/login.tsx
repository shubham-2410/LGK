import { getApiUrl } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button, Input, Card } from "@/components/ui";
import { Eye, EyeOff, KeyRound, Lock, AlertTriangle, Star, Phone, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SiInstagram, SiFacebook, SiWhatsapp } from "react-icons/si";

const REVIEWS = [
  { name: "Priya Sharma", date: "January 2025", text: "Absolutely magical experience! The guides were knowledgeable and friendly. Watching the sunset from a kayak in Goa's backwaters was breathtaking. Highly recommend!", avatar: "PS" },
  { name: "Rahul Menon", date: "February 2025", text: "Best activity in Goa! The team at Local Goa Kayaking made us feel safe and had a lot of fun. The mangrove trail was stunning. Will definitely come back!", avatar: "RM" },
  { name: "Sarah Mitchell", date: "December 2024", text: "We did the sunrise kayaking and it was worth every bit. Calm waters, gorgeous scenery, and very professional crew. A must-do for anyone visiting Goa!", avatar: "SM" },
  { name: "Arjun Patel", date: "March 2025", text: "Incredible experience from start to finish. The Gold Package was worth every rupee — great photos, delicious meal, and the kayaking itself was top notch!", avatar: "AP" },
  { name: "Natasha D'Souza", date: "November 2024", text: "Such a peaceful escape from the beach crowds. The guides know every hidden creek and bird spot. Came with family and everyone loved it — even my 60-year-old dad!", avatar: "ND" },
];

const GOOGLE_REVIEWS_URL = "https://maps.app.goo.gl/HraqnXgbfCmhdXFdA";

function ReviewCard({ r, i }: { r: typeof REVIEWS[0]; i: number }) {
  return (
    <a
      href={GOOGLE_REVIEWS_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={`review-card-${i}`}
      className="flex-shrink-0 w-52 bg-card border border-border rounded-2xl p-3 hover:border-primary/30 hover:shadow-md transition-all block mx-1.5"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white">{r.avatar}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{r.name}</p>
          <p className="text-[10px] text-muted-foreground">{r.date}</p>
        </div>
      </div>
      <div className="flex gap-0.5 mb-1.5">
        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{r.text}</p>
    </a>
  );
}

function ReviewStrip() {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <p className="text-sm font-semibold text-foreground">What our customers say</p>
          <div className="flex items-center gap-1 mt-0.5">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
            <span className="text-xs text-muted-foreground ml-1">5.0 on Google</span>
          </div>
        </div>
        <a
          href={GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary font-semibold hover:underline flex-shrink-0"
          data-testid="link-all-reviews"
        >
          See all →
        </a>
      </div>

      <div className="overflow-hidden pb-2">
        <div className="review-track flex">
          {[...REVIEWS, ...REVIEWS].map((r, i) => (
            <ReviewCard key={i} r={r} i={i % REVIEWS.length} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SocialBar() {
  return (
    <div className="flex flex-col items-center gap-2 mt-4 mb-2">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Follow &amp; connect with us</p>
      <div className="flex items-center gap-4">
        <a
          href="https://www.instagram.com/local_goa_kayaking"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-instagram"
          aria-label="Instagram"
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}
        >
          <SiInstagram className="w-5 h-5 text-white" />
        </a>
        <a
          href="https://www.facebook.com/localgoakayaking/"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-facebook"
          aria-label="Facebook"
          className="w-11 h-11 rounded-2xl bg-[#1877F2] flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-0.5 hover:bg-[#166fe5]"
        >
          <SiFacebook className="w-5 h-5 text-white" />
        </a>
        <a
          href="https://wa.me/917770044447"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-whatsapp"
          aria-label="WhatsApp"
          className="w-11 h-11 rounded-2xl bg-[#25D366] flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-0.5 hover:bg-[#20bd5a]"
        >
          <SiWhatsapp className="w-5 h-5 text-white" />
        </a>
      </div>
      <p className="text-[11px] text-muted-foreground/60 text-center flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
        <Link href="/privacypolicy" className="hover:text-primary hover:underline transition-colors" data-testid="link-privacy-notice">Privacy Notice</Link>
        <span>·</span>
        <Link href="/terms-conditions" className="hover:text-primary hover:underline transition-colors" data-testid="link-terms-of-use">Terms of Use</Link>
        <span>·</span>
        <span>© Local Goa Kayaking. Since 2015</span>
      </p>
    </div>
  );
}

// ─── PIN Failure Tracking (per-device via localStorage) ────────────────────
const FAILURES_KEY = "lkg_pin_failures";
const MAX_PIN_ATTEMPTS = 3;

function getPinFailures(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(FAILURES_KEY) || "{}"); } catch { return {}; }
}
function getFailureCount(mobile: string): number {
  return getPinFailures()[mobile] ?? 0;
}
function incrementPinFailure(mobile: string): number {
  const failures = getPinFailures();
  const count = (failures[mobile] ?? 0) + 1;
  failures[mobile] = count;
  localStorage.setItem(FAILURES_KEY, JSON.stringify(failures));
  return count;
}
function resetPinFailures(mobile: string): void {
  const failures = getPinFailures();
  delete failures[mobile];
  localStorage.setItem(FAILURES_KEY, JSON.stringify(failures));
}
function isPinLocked(mobile: string): boolean {
  return getFailureCount(mobile) >= MAX_PIN_ATTEMPTS;
}

// ─── Device Session (remembers mobile for PIN auto-fill) ────────────────────
const DEVICE_SESSION_KEY = "lkg_pin_device";

function saveDeviceMobile(mobile: string) {
  try { localStorage.setItem(DEVICE_SESSION_KEY, JSON.stringify({ mobile, savedAt: Date.now() })); } catch {}
}
function getDeviceMobile(): string | null {
  try {
    const data = JSON.parse(localStorage.getItem(DEVICE_SESSION_KEY) || "null");
    if (!data?.mobile) return null;
    const daysDiff = (Date.now() - data.savedAt) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30 ? data.mobile : null;
  } catch { return null; }
}
function clearDeviceMobile() {
  try { localStorage.removeItem(DEVICE_SESSION_KEY); } catch {}
}

// ─── PIN Input ──────────────────────────────────────────────────────────────
const PIN_LENGTH = 4;

function PinBoxInput({
  value,
  onChange,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [revealedIdx, setRevealedIdx] = useState(-1);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoFocus && !disabled) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [autoFocus, disabled]);

  return (
    <div className="relative flex gap-3 justify-center" onClick={() => !disabled && inputRef.current?.focus()}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <div
          key={i}
          className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold transition-all cursor-text select-none ${
            i === value.length && !disabled
              ? "border-primary shadow-md shadow-primary/20 bg-primary/5"
              : value[i]
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/50 bg-muted/30 text-transparent"
          } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {value[i] ? (revealedIdx === i ? value[i] : "●") : "○"}
        </div>
      ))}
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={PIN_LENGTH}
        value={value}
        onChange={e => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
          if (digits.length > value.length) {
            const newIdx = digits.length - 1;
            if (revealTimer.current) clearTimeout(revealTimer.current);
            setRevealedIdx(newIdx);
            revealTimer.current = setTimeout(() => setRevealedIdx(-1), 500);
          } else {
            setRevealedIdx(-1);
          }
          onChange(digits);
        }}
        disabled={disabled}
        data-testid="input-pin"
        className="absolute opacity-0 w-px h-px overflow-hidden"
        style={{ clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}
        autoComplete="one-time-code"
      />
    </div>
  );
}

// ─── Main Login Page ────────────────────────────────────────────────────────
type LoginMode = "password" | "pin" | "forgot";
type ForgotStep = "email" | "reset";

export default function Login() {
  const [mode, setMode] = useState<LoginMode>("password");

  // Password mode state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // PIN mode state
  const [deviceMobile, setDeviceMobile] = useState<string | null>(getDeviceMobile);
  const [pinMobile, setPinMobile] = useState("");
  const [pin, setPin] = useState("");
  const [pinFailures, setPinFailures] = useState(() => {
    const dm = getDeviceMobile();
    return dm ? getFailureCount(dm) : 0;
  });
  const [pinLocked, setPinLocked] = useState(() => {
    const dm = getDeviceMobile();
    return dm ? isPinLocked(dm) : false;
  });

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { login, isLoggingIn, loginWithPin, isLoggingInWithPin } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Recompute lock status when manual mobile changes
  useEffect(() => {
    if (deviceMobile) return; // device mobile takes priority
    if (!pinMobile.trim()) return;
    const failures = getFailureCount(pinMobile);
    setPinFailures(failures);
    setPinLocked(isPinLocked(pinMobile));
    setPin("");
  }, [pinMobile]);

  // resolved mobile = device session OR manually entered
  const resolvedMobile = (deviceMobile || pinMobile).trim();

  const doPinLogin = async (currentPin: string) => {
    if (!resolvedMobile || currentPin.length < PIN_LENGTH || pinLocked || isLoggingInWithPin) return;
    try {
      await loginWithPin({ mobileNumber: resolvedMobile, pin: currentPin });
      resetPinFailures(resolvedMobile);
      saveDeviceMobile(resolvedMobile);
      toast({ title: "Welcome back!", description: "Logged in successfully." });
      setLocation("/");
    } catch (err: any) {
      const count = incrementPinFailure(resolvedMobile);
      setPinFailures(count);
      const locked = count >= MAX_PIN_ATTEMPTS;
      setPinLocked(locked);
      setPin("");
      if (locked) {
        toast({
          title: "PIN Login Disabled",
          description: "Too many failed attempts. Please login with your password to re-enable PIN.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Incorrect PIN",
          description: `Wrong PIN. ${MAX_PIN_ATTEMPTS - count} attempt${MAX_PIN_ATTEMPTS - count !== 1 ? "s" : ""} remaining before PIN is disabled.`,
          variant: "destructive",
        });
      }
    }
  };

  // Auto-login when PIN is complete (no button press needed)
  useEffect(() => {
    if (mode !== "pin") return;
    if (pin.length === PIN_LENGTH && resolvedMobile && !pinLocked && !isLoggingInWithPin) {
      doPinLogin(pin);
    }
  }, [pin, resolvedMobile, mode, pinLocked, isLoggingInWithPin]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login({ identifier, password });
      if (result?.mobileNumber) {
        saveDeviceMobile(result.mobileNumber);
        setDeviceMobile(result.mobileNumber);
      }
      toast({ title: "Welcome back!", description: "Logged in successfully." });
      setLocation("/");
    } catch (err: any) {
      setLoginError("Invalid credentials. Try again.");
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doPinLogin(pin);
  };

  const attemptsLeft = MAX_PIN_ATTEMPTS - pinFailures;

  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsSendingOtp(true);
    try {
      const res = await fetch(getApiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), purpose: "reset" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "OTP Sent", description: `A 6-digit code was sent to ${forgotEmail.trim()}` });
      setForgotStep("reset");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch(getApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), otp: forgotOtp.trim(), newPassword: forgotNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Password Reset!", description: "You can now log in with your new password." });
      setMode("password");
      setForgotStep("email");
      setForgotEmail(""); setForgotOtp(""); setForgotNewPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-background flex flex-col justify-center items-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-2">
            <img src="/lgk-logo.jpg" alt="Local Goa Kayaking" className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">Login to manage your Kayaking bookings</p>
        </div>

        {/* Mode toggle — hidden in forgot mode */}
        <div className={`flex bg-muted rounded-2xl p-1 mb-4 gap-1 transition-all ${mode === "forgot" ? "hidden" : ""}`}>
          <button
            type="button"
            data-testid="tab-password"
            onClick={() => setMode("password")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === "password"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="w-4 h-4" />
            Password
          </button>
          <button
            type="button"
            data-testid="tab-pin"
            onClick={() => setMode("pin")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === "pin"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            PIN
          </button>
        </div>

        {/* Password Login */}
        {mode === "password" && (
          <Card>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                {identifier.includes("@")
                  ? <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  : <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                }
                <Input
                  type="text"
                  inputMode="email"
                  placeholder="Mobile number or email"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setLoginError(null); }}
                  data-testid="input-mobile"
                  className="pl-10"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginError(null); }}
                  data-testid="input-password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginError && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center" data-testid="text-login-error">
                  {loginError}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" isLoading={isLoggingIn} data-testid="button-submit">
                Sign In
              </Button>
              <button
                type="button"
                data-testid="button-forgot-password"
                onClick={() => { setMode("forgot"); setForgotStep("email"); }}
                className="w-full text-center text-sm text-primary hover:underline font-medium pt-0.5"
              >
                Forgot password?
              </button>
            </form>
          </Card>
        )}

        {/* PIN Login */}
        {mode === "pin" && (
          <Card>
            <form onSubmit={handlePinSubmit} className="space-y-4">

              {/* Mobile identifier — chip if device session, input otherwise */}
              {deviceMobile ? (
                <div className="flex items-center justify-between bg-muted/60 border border-border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground" data-testid="text-device-mobile">{deviceMobile}</span>
                  </div>
                  <button
                    type="button"
                    data-testid="button-not-you"
                    onClick={() => {
                      clearDeviceMobile();
                      setDeviceMobile(null);
                      setPinMobile("");
                      setPinFailures(0);
                      setPinLocked(false);
                      setPin("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    Not you?
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Mobile number"
                    value={pinMobile}
                    onChange={e => setPinMobile(e.target.value.replace(/\D/g, "").slice(0, 15))}
                    data-testid="input-pin-mobile"
                    maxLength={15}
                    className="pl-10"
                    disabled={isLoggingInWithPin}
                  />
                </div>
              )}

              {pinLocked ? (
                <>
                  <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl px-4 py-4">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">PIN Login Disabled</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                        Too many failed attempts. Please login with your password to re-enable PIN.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setMode("password")}
                    data-testid="button-switch-to-password"
                  >
                    Switch to Password Login
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <PinBoxInput
                      value={pin}
                      onChange={setPin}
                      disabled={isLoggingInWithPin || (!deviceMobile && pinMobile.replace(/\D/g, "").length < 10)}
                      autoFocus={!!(deviceMobile || pinMobile.replace(/\D/g, "").length >= 10)}
                    />
                    {pinFailures > 0 && attemptsLeft > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-3 font-medium">
                        {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining before PIN is disabled
                      </p>
                    )}
                    {!deviceMobile && pinMobile.replace(/\D/g, "").length < 10 && (
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        Enter your mobile number above to enable PIN entry
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isLoggingInWithPin}
                    disabled={pin.length < PIN_LENGTH || (!deviceMobile && pinMobile.replace(/\D/g, "").length < 10)}
                    data-testid="button-submit-pin"
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Login with PIN
                  </Button>
                </>
              )}
            </form>
          </Card>
        )}

        {/* Forgot Password */}
        {mode === "forgot" && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => { setMode("password"); setForgotStep("email"); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="font-semibold text-foreground text-sm">Reset Password</h2>
            </div>

            {forgotStep === "email" ? (
              <form onSubmit={handleSendForgotOtp} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="Your registered email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    data-testid="input-forgot-email"
                    className="pl-10"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" isLoading={isSendingOtp} data-testid="button-send-otp">
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-muted-foreground -mt-1">OTP sent to <span className="font-semibold text-foreground">{forgotEmail}</span></p>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit OTP"
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    data-testid="input-forgot-otp"
                    className="pl-10"
                    maxLength={6}
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showForgotPassword ? "text" : "password"}
                    placeholder="New password (min 6 chars)"
                    value={forgotNewPassword}
                    onChange={e => setForgotNewPassword(e.target.value)}
                    data-testid="input-forgot-new-password"
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showForgotPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="submit" className="w-full" size="lg" isLoading={isResetting} data-testid="button-reset-password">
                  Reset Password
                </Button>
                <button
                  type="button"
                  onClick={() => setForgotStep("email")}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Resend OTP
                </button>
              </form>
            )}
          </Card>
        )}

        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-semibold" data-testid="link-register">
              Register
            </Link>
          </p>
          <button
            type="button"
            data-testid="button-skip-login"
            onClick={() => setLocation("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium hover:underline"
          >
            Skip Login →
          </button>
        </div>

        <ReviewStrip />
        <SocialBar />

      </div>
    </div>
  );
}
