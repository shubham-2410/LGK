import { Link, useLocation } from "wouter";
import { Home, CalendarDays, Settings, Bell, LogOut, UserCircle, BarChart2, CreditCard } from "lucide-react";
import { ReactNode, useEffect } from "react";
import lgkLogo from "@assets/LGK_Logo_1772691141992.jpg";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useQuery } from "@tanstack/react-query";

function useVisitorPing() {
  useEffect(() => {
    try {
      let id = localStorage.getItem("_vsid");
      if (!id) {
        id = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("_vsid", id);
      }
      fetch("/api/visitors/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
        credentials: "include",
      }).catch(() => {});
    } catch {}
  }, []);
}

function ProfileAvatar({ name, sidebar }: { name?: string | null; sidebar?: boolean }) {
  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  if (sidebar) {
    return (
      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0 ring-2 ring-primary/30" style={{ fontSize: "15px", fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1 }}>
        {initials}
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center text-primary-foreground flex-shrink-0 ring-2 ring-white/40" style={{ fontSize: "15px", fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1 }}>
      {initials}
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = !!user?.isAdmin;
  const bookingsLabel = isAdmin ? "Manage Bookings" : "My Bookings";
  const { data: unreadData } = useUnreadCount();
  const unread = unreadData?.count ?? 0;
  const { data: paymentSettings } = useQuery<{ gstNumber?: string; registeredBusinessName?: string }>({ queryKey: ["/api/payment-settings"] });
  const gstNumber = (paymentSettings?.gstNumber ?? "").trim();
  const registeredBusinessName = (paymentSettings?.registeredBusinessName ?? "").trim();
  const headerSubline = user ? (gstNumber ? `GSTIN: ${gstNumber}` : null) : (registeredBusinessName || null);
  useVisitorPing();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    navigate("/");
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="flex-shrink-0 z-40 w-full bg-primary text-primary-foreground shadow-md md:hidden safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <img src={lgkLogo} alt="Local Goa Kayaking" className="h-8 w-8 rounded-full object-cover" />
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight leading-tight">Local Goa Kayaking</h1>
              {headerSubline && <p className="text-[10px] text-primary-foreground/70 leading-none mt-0.5">{headerSubline}</p>}
            </div>
          </Link>
          {user ? (
            <button
              onClick={handleLogout}
              data-testid="button-top-logout"
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              title="Log Out"
            >
              <LogOut className="w-5 h-5 text-primary-foreground" />
            </button>
          ) : (
            <Link
              href="/login"
              data-testid="button-top-login"
              className="w-9 h-9 rounded-full flex items-center justify-center ring-2 ring-red-400 bg-white/10 hover:bg-white/20 transition-colors"
              title="Login"
            >
              <UserCircle className="w-5 h-5 text-white" />
            </Link>
          )}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border flex-shrink-0 overflow-y-auto">
        <Link href="/" className="p-6 flex items-center gap-3 border-b border-border hover:bg-muted/40 transition-colors">
          <div className="rounded-xl overflow-hidden w-14 h-14 flex-shrink-0">
            <img src={lgkLogo} alt="Local Goa Kayaking" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground leading-tight">Local Goa<br/><span className="text-primary">Kayaking</span></h1>
            {headerSubline && <p className="text-[10px] text-muted-foreground leading-none mt-1">{headerSubline}</p>}
          </div>
        </Link>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem href="/" icon={<Home className="w-5 h-5" />} label="Home" />
          <SidebarItem href="/bookings" icon={<CalendarDays className="w-5 h-5" />} label={bookingsLabel} requiresAuth authRedirect="/login" />
          <SidebarItem
            href="/notifications"
            icon={<Bell className="w-5 h-5" />}
            label="Notifications"
            badge={unread}
            requiresAuth
            authRedirect="/login"
          />
          {isAdmin && (
            <SidebarItem href="/reports" icon={<BarChart2 className="w-5 h-5" />} label="Reports" requiresAuth authRedirect="/login" />
          )}
          {isAdmin && (
            <SidebarItem href="/accounting" icon={<CreditCard className="w-5 h-5" />} label="Accounting" requiresAuth authRedirect="/login" />
          )}
          <SidebarItem href="/settings?m=1" icon={<Settings className="w-5 h-5" />} label="Settings" requiresAuth authRedirect="/login" />
        </nav>
        <div className="p-4 border-t border-border">
          {user ? (
            <button onClick={handleLogout} data-testid="button-sidebar-logout" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Log Out</p>
                <p className="text-xs text-muted-foreground truncate">{user.fullName || user.mobileNumber}</p>
              </div>
            </button>
          ) : (
            <Link href="/login" data-testid="button-sidebar-login" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors group">
              <div className="w-9 h-9 rounded-full flex items-center justify-center ring-2 ring-red-400 bg-red-50 dark:bg-red-900/20 flex-shrink-0">
                <UserCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Sign In</p>
                <p className="text-xs text-red-500">Not logged in</p>
              </div>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content — only this area scrolls */}
      <main className="flex-1 min-h-0 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="flex-shrink-0 z-50 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <NavItem href="/" icon={<Home className="w-6 h-6" />} label="Home" />
          <NavItem href="/bookings" icon={<CalendarDays className="w-6 h-6" />} label={isAdmin ? "Manage" : "Bookings"} requiresAuth authRedirect="/login" />
          <NavItem
            href="/notifications"
            icon={<Bell className="w-6 h-6" />}
            label="Alerts"
            badge={unread}
            requiresAuth
            authRedirect="/login"
          />
          <NavItem href="/settings?m=1" icon={<Settings className="w-6 h-6" />} label="Settings" requiresAuth authRedirect="/login" />
        </div>
      </nav>
      <ChatFloatingWidgets />
    </div>
  );
}

function NavItem({ href, icon, label, badge, requiresAuth, authRedirect = "/" }: { href: string; icon: ReactNode; label: string; badge?: number; requiresAuth?: boolean; authRedirect?: string }) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const basePath = href.split("?")[0];
  const isActive = location === basePath;

  const handleClick = (e: React.MouseEvent) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      navigate(authRedirect);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className={`relative transition-transform duration-300 ${isActive ? "scale-110" : "scale-100"}`}>
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

type ChatWidgetSettings = {
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappCorner: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  whatsappMessage: string;
  tawkEnabled: boolean;
  tawkScript: string;
  showOnMobile: boolean;
};

// On mobile we offset above the bottom nav (h-16 = 64px) + a small gap
const CORNER_CLASS: Record<string, { mobile: string; desktop: string }> = {
  "bottom-right": { mobile: "bottom-[72px] right-3", desktop: "md:bottom-6 md:right-6" },
  "bottom-left":  { mobile: "bottom-[72px] left-3",  desktop: "md:bottom-6 md:left-6"  },
  "top-right":    { mobile: "top-20 right-3",         desktop: "md:top-6 md:right-6"    },
  "top-left":     { mobile: "top-20 left-3",          desktop: "md:top-6 md:left-6"     },
};

function ChatFloatingWidgets() {
  const { data } = useQuery<ChatWidgetSettings>({ queryKey: ["/api/chat-widget-settings"] });

  useEffect(() => {
    if (!data?.tawkEnabled || !data.tawkScript.trim()) return;
    const src = data.tawkScript.trim();
    const scriptSrc = src.startsWith("http") ? src : null;
    const inlineScript = !scriptSrc ? src.replace(/<\/?script[^>]*>/gi, "").trim() : null;

    if (document.getElementById("tawk-widget-script")) return;
    const s = document.createElement("script");
    s.id = "tawk-widget-script";
    s.async = true;
    if (scriptSrc) {
      s.src = scriptSrc;
    } else if (inlineScript) {
      s.text = inlineScript;
    }
    document.body.appendChild(s);
  }, [data?.tawkEnabled, data?.tawkScript]);

  const { user } = useAuth();

  if (!data) return null;

  const { whatsappEnabled, whatsappNumber, whatsappCorner, whatsappMessage } = data;
  // Default showOnMobile to true if field not yet returned by API
  const showOnMobile = data.showOnMobile !== false;

  if (!whatsappEnabled || !whatsappNumber.trim()) return null;

  // Never show to admins — this button is for customer contact
  if (user?.isAdmin) return null;

  const pos = CORNER_CLASS[whatsappCorner] ?? CORNER_CLASS["bottom-right"];
  const waUrl = `https://wa.me/${whatsappNumber.trim()}${whatsappMessage.trim() ? `?text=${encodeURIComponent(whatsappMessage.trim())}` : ""}`;

  // On mobile: hide entirely if showOnMobile is false
  const mobileVisibility = showOnMobile ? "" : "hidden md:flex";

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      data-testid="button-whatsapp-float"
      className={`fixed ${pos.mobile} ${pos.desktop} z-[9999] w-[42px] h-[42px] md:w-[52px] md:h-[52px] rounded-full bg-[#25D366] shadow-lg flex items-center justify-center hover:scale-110 transition-transform ${mobileVisibility}`}
    >
      <svg viewBox="0 0 24 24" fill="white" className="w-[21px] h-[21px] md:w-[26px] md:h-[26px]">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12.004 2C6.481 2 2.002 6.477 2.002 12c0 1.869.514 3.619 1.407 5.117L2 22l5.032-1.391A9.958 9.958 0 0012.004 22C17.523 22 22 17.523 22 12S17.523 2 12.004 2zm0 18.182a8.174 8.174 0 01-4.163-1.136l-.298-.178-3.087.852.876-3.005-.196-.308a8.16 8.16 0 01-1.313-4.407C3.823 7.476 7.478 3.82 12.004 3.82c4.527 0 8.178 3.657 8.178 8.18 0 4.524-3.651 8.182-8.178 8.182z"/>
      </svg>
    </a>
  );
}

function SidebarItem({ href, icon, label, badge, requiresAuth, authRedirect = "/" }: { href: string; icon: ReactNode; label: string; badge?: number; requiresAuth?: boolean; authRedirect?: string }) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const basePath = href.split("?")[0];
  const isActive = location === basePath;

  const handleClick = (e: React.MouseEvent) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      navigate(authRedirect);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
        isActive
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      data-testid={`sidebar-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center leading-none">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
