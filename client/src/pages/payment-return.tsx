import { getApiUrl } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, XCircle, Loader2, Home, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui";
import { usePaymentSettings } from "@/hooks/use-payment-settings";

type OrderState = "PENDING" | "COMPLETED" | "FAILED" | null;

export default function PaymentReturn() {
  const [, navigate] = useLocation();
  const { data: settings } = usePaymentSettings();
  const [state, setState] = useState<OrderState>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    if (!orderId) {
      setError("Missing order ID in URL.");
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/phonepe/status/${encodeURIComponent(orderId)}`));
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.message || "Failed to check payment status.");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setState(data.state);
          if (data.bookingId) setBookingId(data.bookingId);
          if (data.state === "PENDING") {
            setAttempts(a => a + 1);
            timeoutId = setTimeout(poll, 3000);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Network error checking payment status.");
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const isPending = state === null || state === "PENDING";
  const isCompleted = state === "COMPLETED";
  const isFailed = state === "FAILED";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {error ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Button className="w-full" onClick={() => navigate("/")} data-testid="button-go-home">
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
          </div>
        ) : isPending ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Verifying Payment</h1>
            <p className="text-sm text-muted-foreground mb-1">
              Please wait while we confirm your payment with PhonePe…
            </p>
            {attempts > 3 && (
              <p className="text-xs text-muted-foreground mt-3">This is taking longer than usual. Please don't close this page.</p>
            )}
          </div>
        ) : isCompleted ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Payment Successful!</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {settings?.successMessage || "Thank you! Your booking has been confirmed. We'll see you on the water!"}
            </p>
            <div className="space-y-3">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => navigate("/bookings")} data-testid="button-view-bookings">
                <CalendarDays className="w-4 h-4 mr-2" /> View My Bookings
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/")} data-testid="button-go-home">
                <Home className="w-4 h-4 mr-2" /> Back to Home
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Payment Failed</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {settings?.failedMessage || "Payment could not be confirmed. Please try again or contact us for assistance."}
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full" onClick={() => navigate(-1 as any)} data-testid="button-retry">
                Try Again
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/")} data-testid="button-go-home">
                <Home className="w-4 h-4 mr-2" /> Go Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
