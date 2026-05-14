import { AppLayout } from "@/components/layout";
import { useNotifications, useMarkAllRead, useMarkRead, useDeleteNotification } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Bell, BellOff, CheckCheck, Calendar, UserPlus, XCircle, X, Trash2, Ticket, CheckCircle2, Phone } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Notification } from "@shared/schema";

function notifIcon(type: string) {
  if (type === "booking_created") return <Calendar className="w-5 h-5 text-primary" />;
  if (type === "booking_confirmed") return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (type === "user_registered") return <UserPlus className="w-5 h-5 text-emerald-500" />;
  if (type === "booking_cancelled") return <XCircle className="w-5 h-5 text-red-500" />;
  if (type === "coupon_earned") return <Ticket className="w-5 h-5 text-amber-500" />;
  return <Bell className="w-5 h-5 text-muted-foreground" />;
}

function notifBg(type: string) {
  if (type === "booking_created") return "bg-primary/10";
  if (type === "booking_confirmed") return "bg-emerald-500/10";
  if (type === "user_registered") return "bg-emerald-500/10";
  if (type === "booking_cancelled") return "bg-red-500/10";
  if (type === "coupon_earned") return "bg-amber-400/15";
  return "bg-muted";
}

function groupByDate(notifs: Notification[]): { label: string; items: Notification[] }[] {
  const map = new Map<string, Notification[]>();
  for (const n of notifs) {
    const d = n.createdAt ? new Date(n.createdAt) : new Date();
    let label: string;
    if (isToday(d)) label = "Today";
    else if (isYesterday(d)) label = "Yesterday";
    else label = format(d, "dd MMM yyyy");
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(n);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function extractPhone(message: string): string | null {
  const match = message.match(/(\+?[\d\s\-]{10,15})/);
  return match ? match[1].replace(/\s+/g, "") : null;
}

function NotificationItem({ notif }: { notif: Notification }) {
  const { mutate: markRead } = useMarkRead();
  const { mutate: deleteNotif, isPending: deleting } = useDeleteNotification();
  const [, setLocation] = useLocation();

  const isCoupon = notif.type === "coupon_earned";
  const isBookingRelated = ["booking_created", "booking_confirmed", "booking_cancelled"].includes(notif.type);
  const isUserRegistered = notif.type === "user_registered";
  const registeredPhone = isUserRegistered ? extractPhone(notif.message) : null;

  const handleClick = () => {
    if (!notif.isRead) markRead(notif.id);
    if (isBookingRelated && notif.bookingId) {
      setLocation(`/bookings?highlight=${notif.bookingId}`);
    }
  };

  const waMessage = encodeURIComponent("Welcome to Local Goa Kayaking! Looking for any assistance in booking? I am here to help you.");

  return (
    <div
      data-testid={`notif-item-${notif.id}`}
      onClick={handleClick}
      className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
        isCoupon
          ? notif.isRead
            ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-700/30 opacity-80 hover:opacity-100"
            : "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 shadow-sm shadow-amber-100 dark:shadow-amber-900/20"
          : notif.isRead
          ? "bg-card border-border opacity-70 hover:opacity-100"
          : "bg-card border-primary/20 shadow-sm"
      }`}
    >
      <div className="relative mt-0.5 flex-shrink-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notifBg(notif.type)}`}>
          {notifIcon(notif.type)}
        </div>
        {!notif.isRead && (
          <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-card ${isCoupon ? "bg-amber-500" : "bg-primary"}`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${!notif.isRead ? (isCoupon ? "text-amber-800 dark:text-amber-300" : "text-foreground") : "text-muted-foreground"}`}>
          {notif.title}
        </p>
        {isCoupon && !notif.isRead && (
          <div className="mt-1.5 mb-1">
            {(() => {
              const match = notif.message.match(/Use code ([A-Z0-9-]+) for/);
              if (match) return (
                <span className="inline-block font-mono font-bold text-sm bg-amber-500 text-white px-3 py-1 rounded-lg tracking-wider shadow-sm">
                  {match[1]}
                </span>
              );
              return null;
            })()}
          </div>
        )}
        {isUserRegistered && registeredPhone ? (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed flex items-center flex-wrap gap-1">
            {notif.message}
            <span className="inline-flex items-center ml-1" style={{ gap: "15px" }} onClick={e => e.stopPropagation()}>
              <a
                href={`tel:${registeredPhone}`}
                data-testid={`button-call-user-${notif.id}`}
                className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex-shrink-0"
                title="Call"
              >
                <Phone className="w-2.5 h-2.5" />
              </a>
              <a
                href={`https://wa.me/${registeredPhone.replace(/^\+/, "")}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`button-whatsapp-user-${notif.id}`}
                className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex-shrink-0"
                title="WhatsApp"
              >
                <SiWhatsapp className="w-2.5 h-2.5" />
              </a>
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {notif.message}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {notif.createdAt && (
            <p className="text-[10px] text-muted-foreground/60">
              {format(new Date(notif.createdAt), "h:mm a")}
            </p>
          )}
          {isBookingRelated && notif.bookingId && (
            <span className="text-[10px] text-primary font-medium">Tap to view booking →</span>
          )}
        </div>
      </div>

      <button
        data-testid={`button-delete-notif-${notif.id}`}
        onClick={e => { e.stopPropagation(); deleteNotif(notif.id); }}
        disabled={deleting}
        className="flex-shrink-0 w-7 h-7 rounded-full bg-transparent hover:bg-muted flex items-center justify-center text-muted-foreground/40 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Clear notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function Notifications() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: notifs, isLoading } = useNotifications();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead();
  const { mutate: deleteNotif } = useDeleteNotification();
  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [user, authLoading, setLocation]);

  if (authLoading) return <AppLayout><div className="p-8">Loading...</div></AppLayout>;
  if (!user) return null;

  const unread = notifs?.filter(n => !n.isRead).length ?? 0;
  const groups = notifs && notifs.length > 0 ? groupByDate(notifs) : [];

  const handleClearAll = () => {
    if (!notifs) return;
    notifs.forEach(n => deleteNotif(n.id));
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 animate-in fade-in">
        <div className="flex items-start justify-between mb-5 gap-3">
          <h1 className="text-2xl font-bold font-display text-foreground" data-testid="text-page-title">
            Notifications
          </h1>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-3">
              {unread > 0 ? (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Bell className="w-3.5 h-3.5" />
                  {unread} new
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                  <CheckCheck className="w-3.5 h-3.5" />
                  All caught up
                </span>
              )}
              {notifs && notifs.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BellOff className="w-3.5 h-3.5" />
                  {notifs.length} total
                </span>
              )}
            </div>
          {notifs && notifs.length > 0 && (
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <Button variant="outline" size="sm" onClick={() => markAllRead()} disabled={markingAll} data-testid="button-mark-all-read" className="flex items-center gap-1.5 text-xs">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                  <span className="sm:hidden">Read all</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleClearAll} data-testid="button-clear-all" className="flex items-center gap-1.5 text-xs text-red-500 border-red-200 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10">
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear all</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            </div>
          )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-sm">
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No notifications yet</h3>
            <p className="text-sm text-muted-foreground">You'll be notified about bookings and important updates here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(({ label, items }) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest" data-testid={`notif-date-group-${label}`}>{label}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground/60 font-medium">{items.length} {items.length === 1 ? "alert" : "alerts"}</span>
                </div>
                <div className="space-y-2">
                  {items.map(n => <NotificationItem key={n.id} notif={n} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
