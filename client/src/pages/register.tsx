import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button, Label, Card, Input } from "@/components/ui";
import { Eye, EyeOff, Mail, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";

function flagEmoji(code: string) {
  return code.toUpperCase().replace(/./g, ch =>
    String.fromCodePoint(127397 + ch.charCodeAt(0))
  );
}

type RegisterStep = "details" | "otp" | "password";

export default function Register() {
  const [step, setStep] = useState<RegisterStep>("details");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("IN");
  const [localNumber, setLocalNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [inlineError, setInlineError] = useState<{ type: "email" | "mobile" | "generic"; message: string } | null>(null);
  const { register, isRegistering } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const callingCode = getCountryCallingCode(country as any);
  const fullNumber = `+${callingCode}${localNumber}`;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    if (!fullName.trim()) {
      toast({ title: "Name Required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    if (!localNumber || localNumber.length < 7) {
      toast({ title: "Invalid Number", description: "Please enter a valid mobile number.", variant: "destructive" });
      return;
    }
    if (!email || !email.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), purpose: "register" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message === "email_already_registered") {
          setInlineError({ type: "email", message: email.trim() });
          return;
        }
        throw new Error(data.message);
      }
      toast({ title: "OTP Sent", description: `A 6-digit code was sent to ${email.trim()}` });
      setStep("otp");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Please enter the 6-digit OTP sent to your email.", variant: "destructive" });
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/check-register-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Incorrect OTP", description: data.message || "Please check the code and try again.", variant: "destructive" });
        return;
      }
      setStep("password");
    } catch {
      toast({ title: "Network error", description: "Could not verify OTP. Please try again.", variant: "destructive" });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords Don't Match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }
    try {
      await register({ mobileNumber: fullNumber, password, email: email.trim(), otp, fullName: fullName.trim() } as any);
      toast({ title: "Account Created!", description: "Welcome! You are now logged in." });
      setLocation("/");
    } catch (err: any) {
      const msg: string = err.message || "";
      if (msg === "email_already_registered") {
        setInlineError({ type: "email", message: email.trim() });
        setStep("details");
      } else if (msg === "mobile_already_registered") {
        setInlineError({ type: "mobile", message: fullNumber });
        setStep("details");
      } else {
        toast({ title: "Registration Failed", description: msg, variant: "destructive" });
      }
    }
  };

  const countries = getCountries();

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-background flex flex-col justify-center items-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-2">
            <img src="/lgk-logo.jpg" alt="Local Goa Kayaking" className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join Local Goa Kayaking today</p>
        </div>

        {/* Step 1 — Details */}
        {step === "details" && (
          <Card>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    data-testid="input-fullname"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Mobile Number</Label>
                <div className="mt-1 flex items-stretch rounded-xl border-2 border-border focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 bg-card overflow-hidden transition-all duration-200">
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    data-testid="select-country"
                    className="bg-muted border-r border-border text-foreground text-sm px-2 py-3 outline-none cursor-pointer"
                    style={{ maxWidth: "7rem" }}
                  >
                    {countries.map(c => (
                      <option key={c} value={c}>
                        {flagEmoji(c)} {c}
                      </option>
                    ))}
                  </select>
                  <span className="flex items-center px-2 text-muted-foreground text-sm font-medium select-none border-r border-border bg-muted/50 whitespace-nowrap">
                    +{callingCode}
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Mobile number"
                    value={localNumber}
                    onChange={e => { setLocalNumber(e.target.value.replace(/\D/g, "").slice(0, 15)); setInlineError(null); }}
                    maxLength={15}
                    data-testid="input-mobile"
                    className="flex-1 bg-transparent outline-none text-foreground text-sm px-3 py-3 placeholder:text-muted-foreground min-w-0"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setInlineError(null); }}
                    data-testid="input-email"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-1">An OTP will be sent to verify your email</p>
              </div>

              {inlineError && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center" data-testid="alert-already-registered">
                  {inlineError.type === "email"
                    ? "Email already registered. Please login or reset password."
                    : "Mobile number already registered. Please login or reset password."}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                variant="accent"
                size="lg"
                isLoading={isSendingOtp}
                data-testid="button-send-otp"
              >
                Send Verification OTP
              </Button>
            </form>
          </Card>
        )}

        {/* Step 2 — OTP Verification */}
        {step === "otp" && (
          <Card>
            <div className="mb-4">
              <h2 className="font-semibold text-foreground text-sm">Verify Your Email</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the 6-digit OTP sent to <span className="font-semibold text-foreground">{email}</span>
              </p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  data-testid="input-otp"
                  className="pl-10"
                  maxLength={6}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                variant="accent"
                size="lg"
                disabled={otp.length !== 6 || isVerifyingOtp}
                isLoading={isVerifyingOtp}
                data-testid="button-verify-otp"
              >
                Verify OTP
              </Button>
              <button
                type="button"
                onClick={() => { setStep("details"); setOtp(""); }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-back-to-details"
              >
                ← Change details / Resend OTP
              </button>
            </form>
          </Card>
        )}

        {/* Step 3 — Set Password */}
        {step === "password" && (
          <Card>
            <div className="mb-4">
              <h2 className="font-semibold text-foreground text-sm">Create Your Password</h2>
              <p className="text-xs text-muted-foreground mt-1">Email verified! Now set a secure password for your account.</p>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 6 chars)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  data-testid="input-password"
                  className="pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  data-testid="input-confirm-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                type="submit"
                className="w-full"
                variant="accent"
                size="lg"
                isLoading={isRegistering}
                data-testid="button-submit"
              >
                Create Account
              </Button>
            </form>
          </Card>
        )}

        <p className="text-center mt-4 text-muted-foreground font-medium text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
