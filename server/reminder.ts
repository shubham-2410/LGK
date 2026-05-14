import { storage } from "./storage";
import { sendCustomEmail } from "./email";
import type { ReminderOffset } from "@shared/schema";

function renderTemplate(template: string, booking: any, serviceName: string, staffName: string, staffContact: string, paymentSettings?: { googleReviewUrl?: string | null; proprietorName?: string | null; proprietorNumber?: string | null; boardingLocation?: string | null; contactPerson?: string | null }): string {
  return template
    .replace(/\[Full Name\]/g, booking.fullName || "Guest")
    .replace(/\[Service Name\]/g, serviceName)
    .replace(/\[Booking Date\]/g, booking.date || "")
    .replace(/\[Booking Time\]/g, booking.timeSlot || "")
    .replace(/\[Pax Number\]/g, String(booking.pax || ""))
    .replace(/\[Total Amount\]/g, String(booking.totalPayable || ""))
    .replace(/\[Booking ID\]/g, booking.id?.toString().padStart(4, "0") || "")
    .replace(/\[Staff Name\]/g, staffName || "—")
    .replace(/\[Staff Contact\]/g, staffContact || "—")
    .replace(/\[Boarding Location\]/g, paymentSettings?.boardingLocation || "")
    .replace(/\[Contact Person\]/g, paymentSettings?.contactPerson || paymentSettings?.proprietorName || "")
    .replace(/\[Google Review URL\]/g, paymentSettings?.googleReviewUrl || "")
    .replace(/\[Proprietor Name\]/g, paymentSettings?.proprietorName || "")
    .replace(/\[Proprietor Number\]/g, paymentSettings?.proprietorNumber || "");
}

function getBookingDatetime(booking: any): Date | null {
  try {
    const dateStr: string = booking.date;
    let timeStr: string;
    if (booking.timeSlot?.startsWith("Check-in:")) {
      timeStr = "12:00 PM";
    } else {
      timeStr = booking.timeSlot || "";
    }
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const dt = new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
    return isNaN(dt.getTime()) ? null : dt;
  } catch {
    return null;
  }
}

export async function runReminderJob() {
  try {
    const settings = await storage.getReminderSettings();

    const allBookings = await storage.getBookings();
    const allStaffs = await storage.getStaffs();
    const now = Date.now();

    // ── Pre-trip reminders ─────────────────────────────────────────────────────
    if (settings.emailEnabled || settings.waEnabled) {
      const offsets = ((settings.reminders as ReminderOffset[]) || []).filter(r => r.enabled);

      if (offsets.length > 0) {
        const confirmedBookings = allBookings.filter(b => b.status === "confirmed");

        for (const booking of confirmedBookings) {
          const bookingDt = getBookingDatetime(booking);
          if (!bookingDt || bookingDt.getTime() <= now) continue;

          const service = booking.serviceId ? await storage.getService(booking.serviceId) : undefined;
          const staff = booking.staffId ? allStaffs.find((s: any) => s.id === booking.staffId) : undefined;
          const serviceName = service?.name || "Kayaking";
          const staffName = (staff as any)?.fullName || "";
          const staffContact = (staff as any)?.contactNumber || "";

          for (const offset of offsets) {
            const offsetMs = offset.unit === "days"
              ? offset.value * 24 * 60 * 60 * 1000
              : offset.value * 60 * 60 * 1000;

            const targetTime = bookingDt.getTime() - offsetMs;

            if (now < targetTime) continue;
            if (bookingDt.getTime() <= now) continue;

            const alreadySent = await storage.hasReminderBeenSent(booking.id, offset.id);
            if (alreadySent) continue;

            const subject = renderTemplate(settings.emailSubject, booking, serviceName, staffName, staffContact);
            const body = renderTemplate(settings.emailBody, booking, serviceName, staffName, staffContact);
            const waMsg = renderTemplate(settings.waTemplate, booking, serviceName, staffName, staffContact);

            if (settings.emailEnabled) {
              await sendCustomEmail(booking, subject, body);
            }

            if (settings.waEnabled) {
              await storage.addToWhatsappQueue({
                bookingId: booking.id,
                customerPhone: booking.contactNumber,
                customerName: booking.fullName,
                templateKey: "booking_reminder",
                message: waMsg,
                isSent: false,
              });
            }

            await storage.markReminderSent(booking.id, offset.id);
            console.log(`[reminder] Sent pre-trip reminder "${offset.label}" for booking #${booking.id}`);
          }
        }
      }
    }

    // ── Post-trip review / rating reminders ────────────────────────────────────
    if ((settings as any).reviewEnabled && (settings.emailEnabled || settings.waEnabled)) {
      const rawTriggers: any[] = (settings as any).reviewTriggers;
      const reviewTriggers = Array.isArray(rawTriggers) && rawTriggers.length > 0
        ? rawTriggers
        : [{ id: "review-rating", value: (settings as any).reviewAfterValue ?? 24, unit: (settings as any).reviewAfterUnit ?? "hours", enabled: true }];

      const confirmedBookings = allBookings.filter(b => b.status === "confirmed");

      for (const booking of confirmedBookings) {
        const bookingDt = getBookingDatetime(booking);
        if (!bookingDt) continue;
        if (bookingDt.getTime() > now) continue;

        for (const trigger of reviewTriggers.filter((t: any) => t.enabled !== false)) {
          const offsetMs = trigger.unit === "days"
            ? trigger.value * 24 * 60 * 60 * 1000
            : trigger.value * 60 * 60 * 1000;
          const targetTime = bookingDt.getTime() + offsetMs;
          if (now < targetTime) continue;

          const reminderKey = `review-rating-${trigger.id}`;
          const alreadySent = await storage.hasReminderBeenSent(booking.id, reminderKey);
          if (alreadySent) continue;

          const service = booking.serviceId ? await storage.getService(booking.serviceId) : undefined;
          const staff = booking.staffId ? allStaffs.find((s: any) => s.id === booking.staffId) : undefined;
          const serviceName = service?.name || "Kayaking";
          const staffName = (staff as any)?.fullName || "";
          const staffContact = (staff as any)?.contactNumber || "";

          const reviewEmailSubject: string = (settings as any).reviewEmailSubject || "How was your experience?";
          const reviewEmailBody: string = (settings as any).reviewEmailBody || "";
          const reviewWaTemplate: string = (settings as any).reviewWaTemplate || "";

          const ps = await storage.getPaymentSettings();
          const subject = renderTemplate(reviewEmailSubject, booking, serviceName, staffName, staffContact, ps);
          const body = renderTemplate(reviewEmailBody, booking, serviceName, staffName, staffContact, ps);
          const waMsg = renderTemplate(reviewWaTemplate, booking, serviceName, staffName, staffContact, ps);

          if (settings.emailEnabled && body.trim()) {
            await sendCustomEmail(booking, subject, body);
          }

          if (settings.waEnabled && waMsg.trim()) {
            await storage.addToWhatsappQueue({
              bookingId: booking.id,
              customerPhone: booking.contactNumber,
              customerName: booking.fullName,
              templateKey: "review_reminder",
              message: waMsg,
              isSent: false,
            });
          }

          await storage.markReminderSent(booking.id, reminderKey);
          console.log(`[reminder] Sent review reminder (trigger: ${trigger.id}) for booking #${booking.id}`);
        }
      }
    }
  } catch (e) {
    console.error("[reminder] Job failed:", e);
  }
}

async function processManualReminders() {
  try {
    const due = await storage.getPendingManualReminders();
    if (due.length === 0) return;
    const waSettings = await storage.getWhatsappSettings();
    for (const reminder of due) {
      try {
        if (waSettings.metaPhoneNumberId && waSettings.metaAccessToken) {
          const phone = reminder.phone.replace(/[^\d]/g, "");
          const apiUrl = `https://graph.facebook.com/v19.0/${waSettings.metaPhoneNumberId}/messages`;
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Authorization": `Bearer ${waSettings.metaAccessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: reminder.message } }),
          });
          if (response.ok) {
            await storage.markManualReminderSent(reminder.id);
            console.log(`[reminder] Manual reminder sent for booking #${reminder.bookingId}`);
          } else {
            console.error(`[reminder] Failed to send manual reminder for booking #${reminder.bookingId}`);
          }
        } else {
          await storage.addToWhatsappQueue({
            bookingId: reminder.bookingId,
            customerPhone: reminder.phone,
            customerName: "",
            templateKey: "manual_reminder",
            message: reminder.message,
            isSent: false,
          });
          await storage.markManualReminderSent(reminder.id);
          console.log(`[reminder] Manual reminder queued for booking #${reminder.bookingId}`);
        }
      } catch (e) {
        console.error(`[reminder] Error processing manual reminder ${reminder.id}:`, e);
      }
    }
  } catch (e) {
    console.error("[reminder] processManualReminders failed:", e);
  }
}

export function startReminderScheduler() {
  const INTERVAL_MS = 15 * 60 * 1000;
  const MANUAL_INTERVAL_MS = 2 * 60 * 1000;
  console.log("[reminder] Scheduler started (runs every 15 min)");
  setTimeout(async () => {
    await runReminderJob();
    setInterval(runReminderJob, INTERVAL_MS);
  }, 30_000);
  setInterval(processManualReminders, MANUAL_INTERVAL_MS);
  setTimeout(processManualReminders, 10_000);
}
