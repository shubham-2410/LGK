import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { AppPolicy } from "@shared/schema";

const POLICY_MAP: Record<string, { type: string; fallbackTitle: string }> = {
  "/terms-conditions":  { type: "terms",   fallbackTitle: "Terms & Conditions" },
  "/refundpolicy":      { type: "refund",  fallbackTitle: "Refund Policy" },
  "/privacypolicy":     { type: "privacy", fallbackTitle: "Privacy Policy" },
  "/returnpolicy":      { type: "return",  fallbackTitle: "Return Policy" },
};

export default function PolicyPage() {
  const [location, navigate] = useLocation();
  const meta = POLICY_MAP[location] ?? { type: "", fallbackTitle: "Policy" };

  const { data: policies = [], isLoading } = useQuery<AppPolicy[]>({
    queryKey: ["/api/app-policies"],
  });

  const policy = policies.find(p => p.policyType === meta.type);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // If policy has a redirect URL and no content, redirect immediately
  if (policy?.redirectUrl && !policy.header && !policy.details) {
    window.location.href = policy.redirectUrl;
    return null;
  }

  const title = policy?.header || meta.fallbackTitle;
  const details = policy?.details || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            data-testid="btn-policy-back"
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h1 className="font-bold text-base text-foreground flex-1 truncate">{title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {details ? (
          <div
            className="text-sm text-foreground leading-relaxed whitespace-pre-line"
            data-testid="policy-content"
          >
            {details}
          </div>
        ) : policy?.redirectUrl ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-muted-foreground text-sm">This policy is hosted externally.</p>
            <a
              href={policy.redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-policy-redirect"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
              View Policy
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-muted-foreground text-sm">This policy has not been configured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
