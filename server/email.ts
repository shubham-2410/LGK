import nodemailer from "nodemailer";
import { storage } from "./storage";

const DEFAULT_TEMPLATES: Array<{ status: string; subject: string; body: string }> = [
  {
    status: "booking_created",
    subject: "Booking Received — Local Goa Kayaking #[Booking ID]",
    body: `Hello [Full Name],

Thank you for booking with Local Goa Kayaking! 🎉

Your booking has been received and is currently pending confirmation. We will verify your payment and update you shortly.

📋 Booking Details:
  • Booking ID : #[Booking ID]
  • Service    : [Service Name]
  • Date       : [Booking Date]
  • Time       : [Booking Time]
  • Guests     : [Pax Number]
  • Total      : ₹[Total Amount][GST Summary]

If you have any questions, reply to this email or WhatsApp us anytime.

See you on the water! 🌊
Local Goa Kayaking`,
  },
  {
    status: "booking_confirmed",
    subject: "Booking Confirmed ✅ — Local Goa Kayaking #[Booking ID]",
    body: `Hello [Full Name],

Great news — your booking is CONFIRMED! 🎉

📋 Booking Details:
  • Booking ID : #[Booking ID]
  • Service    : [Service Name]
  • Date       : [Booking Date]
  • Time       : [Booking Time]
  • Guests     : [Pax Number]
  • Total      : ₹[Total Amount][GST Summary]

Please arrive 15 minutes before your scheduled time. We are excited to see you on the water!

🎟️ Your Reward Coupon: [Booking Coupon]
Use this code on your next booking for a special discount!

See you soon! 🚣
Local Goa Kayaking`,
  },
  {
    status: "booking_cancelled",
    subject: "Booking Cancelled — Local Goa Kayaking #[Booking ID]",
    body: `Hello [Full Name],

We are sorry to inform you that your booking has been cancelled.

📋 Booking Details:
  • Booking ID : #[Booking ID]
  • Service    : [Service Name]
  • Date       : [Booking Date]
  • Time       : [Booking Time]
  • Reason     : [Cancel Reason]

If you would like to rebook or have any questions, please visit our website or contact us directly.

Thank you for your understanding.
Local Goa Kayaking

⚠️ Note: Any earned coupon from this booking has been voided and is no longer valid.`,
  },
  {
    status: "booking_rescheduled",
    subject: "Booking Rescheduled 🔄 — Local Goa Kayaking #[Booking ID]",
    body: `Hello [Full Name],

Your booking has been rescheduled. Here are your updated details:

📋 Updated Booking Details:
  • Booking ID : #[Booking ID]
  • Service    : [Service Name]
  • New Date   : [Booking Date]
  • New Time   : [Booking Time]
  • Guests     : [Pax Number]

If you have any questions, please contact us.

See you on the water! 🌊
Local Goa Kayaking`,
  },
];

export function renderEmailBody(template: string, booking: any, serviceName?: string, extras?: { couponCode?: string; couponExpiryDays?: number }): string {
  const gstAmount = booking.gstAmount ?? 0;
  const cgstAmount = booking.cgstAmount ?? 0;
  const sgstAmount = booking.sgstAmount ?? 0;
  const gstSummary = gstAmount > 0
    ? `\n💰 Tax Breakdown:\n  • CGST      : ₹${cgstAmount}\n  • SGST      : ₹${sgstAmount}\n  • Total GST : ₹${gstAmount}`
    : "";
  return template
    .replace(/\[Full Name\]/g, booking.fullName || "Guest")
    .replace(/\[Service Name\]/g, serviceName || "Kayaking")
    .replace(/\[Booking Date\]/g, booking.date || "")
    .replace(/\[Booking Time\]/g, booking.timeSlot || "")
    .replace(/\[Pax Number\]/g, String(booking.pax || ""))
    .replace(/\[Total Amount\]/g, String(booking.totalPayable || ""))
    .replace(/\[Status\]/g, booking.status || "")
    .replace(/\[Booking ID\]/g, booking.id?.toString().padStart(4, "0") || "")
    .replace(/\[Cancel Reason\]/g, booking.cancelReason || "N/A")
    .replace(/\[Booking Coupon\]/g, extras?.couponCode || "")
    .replace(/\[Coupon Expiry Days\]/g, extras?.couponExpiryDays != null ? String(extras.couponExpiryDays) : "")
    .replace(/\[GST Amount\]/g, String(gstAmount))
    .replace(/\[CGST Amount\]/g, String(cgstAmount))
    .replace(/\[SGST Amount\]/g, String(sgstAmount))
    .replace(/\[GST Summary\]/g, gstSummary);
}

export async function seedEmailTemplates() {
  try {
    const existing = await storage.getEmailTemplates();
    for (const tpl of DEFAULT_TEMPLATES) {
      const found = existing.find(e => e.status === tpl.status);
      if (!found) {
        await storage.upsertEmailTemplate(tpl.status, tpl.subject, tpl.body);
      } else if (!found.body.includes("[GST Summary]") && !found.body.includes("[GST Amount]")) {
        const patchedBody = found.body
          .replace(/(• Total\s*:.*)([\n\r])/, "$1[GST Summary]$2")
          .replace(/(₹\[Total Amount\])([\n\r])/, "$1[GST Summary]$2");
        if (patchedBody !== found.body) {
          await storage.upsertEmailTemplate(found.status, found.subject, patchedBody);
        }
      }
    }
  } catch (e) {
    console.error("Failed to seed email templates:", e);
  }
}

export async function sendCustomEmail(booking: any, subject: string, body: string) {
  try {
    const settings = await storage.getEmailSettings();
    if (!settings.enabled || !settings.smtpHost || !settings.fromEmail) return;
    const customerEmail = booking.email?.trim();
    const recipients: string[] = [];
    if (customerEmail) recipients.push(customerEmail);
    if (settings.fromEmail && settings.fromEmail !== customerEmail) recipients.push(settings.fromEmail);
    if (recipients.length === 0) return;
    const port = settings.smtpPort ?? 587;
    const secure = port === 465;
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost, port, secure,
      auth: { user: settings.smtpUser, pass: (settings.smtpPassword || "").replace(/\s+/g, "") },
      tls: { rejectUnauthorized: false },
    });
    if (customerEmail) {
      await transporter.sendMail({ from: `"${settings.fromName}" <${settings.fromEmail}>`, to: customerEmail, subject, text: body });
    }
    if (settings.fromEmail && settings.fromEmail !== customerEmail) {
      await transporter.sendMail({ from: `"${settings.fromName}" <${settings.fromEmail}>`, to: settings.fromEmail, subject: `[Admin Copy] ${subject}`, text: body });
    }
    console.log(`Reminder email sent for booking #${booking.id}`);
  } catch (e) {
    console.error("Failed to send reminder email:", e);
  }
}

export async function sendBoardingPassPDFEmail(booking: any, pdfBuffer: Buffer) {
  try {
    const settings = await storage.getEmailSettings();
    if (!settings.enabled || !settings.smtpHost || !settings.fromEmail) return;
    const customerEmail = booking.email?.trim();
    if (!customerEmail) return;
    const port = settings.smtpPort ?? 587;
    const secure = port === 465;
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost, port, secure,
      auth: { user: settings.smtpUser, pass: (settings.smtpPassword || "").replace(/\s+/g, "") },
      tls: { rejectUnauthorized: false },
    });
    const ticketId = (booking.id + 1000).toString(36).toUpperCase().padStart(5, "0").slice(-5);
    const boardingId = booking.id.toString().padStart(4, "0");
    const subject = `🎟️ Your Boarding Pass — Local Goa Kayaking #${boardingId}`;
    const text = `Hi ${booking.fullName || "Guest"},\n\nYour booking is confirmed! Please find your boarding pass attached as a PDF.\n\nPlease arrive 15 minutes before your scheduled time and carry a valid photo ID.\n\nSee you on the water! 🚣\nLocal Goa Kayaking`;
    const html = `<p>Hi <strong>${booking.fullName || "Guest"}</strong>,</p><p>Your booking is confirmed! 🎉 Please find your <strong>boarding pass</strong> attached as a PDF.</p><p>Please arrive <strong>15 minutes before</strong> your scheduled time and carry a valid photo ID.</p><p>See you on the water! 🚣<br/><strong>Local Goa Kayaking</strong></p>`;
    const mailOptions: any = {
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: customerEmail,
      subject,
      text,
      html,
      attachments: [{
        filename: `Boarding_Pass_${ticketId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    };
    await transporter.sendMail(mailOptions);
    if (settings.fromEmail && settings.fromEmail !== customerEmail) {
      await transporter.sendMail({ ...mailOptions, to: settings.fromEmail, subject: `[Admin Copy] ${subject}` });
    }
    console.log(`Boarding pass PDF email sent for booking #${booking.id}`);
  } catch (e) {
    console.error("Failed to send boarding pass PDF email:", e);
  }
}

export async function sendBoardingPassEmail(booking: any, imageBase64: string) {
  try {
    const settings = await storage.getEmailSettings();
    if (!settings.enabled || !settings.smtpHost || !settings.fromEmail) return;
    const customerEmail = booking.email?.trim();
    if (!customerEmail) return;
    const port = settings.smtpPort ?? 587;
    const secure = port === 465;
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost, port, secure,
      auth: { user: settings.smtpUser, pass: (settings.smtpPassword || "").replace(/\s+/g, "") },
      tls: { rejectUnauthorized: false },
    });
    const ticketId = booking.id.toString().padStart(4, "0").padStart(5, "0");
    const subject = `🎟️ Your Boarding Pass — Local Goa Kayaking #${ticketId}`;
    const text = `Hi ${booking.fullName || "Guest"},\n\nYour booking is confirmed! Please find your boarding pass attached below.\n\nPlease arrive 15 minutes before your scheduled time and carry a valid photo ID.\n\nSee you on the water! 🚣\nLocal Goa Kayaking`;
    const html = `<p>Hi ${booking.fullName || "Guest"},</p><p>Your booking is confirmed! 🎉 Please find your boarding pass attached below.</p><p>Please arrive <strong>15 minutes before</strong> your scheduled time and carry a valid photo ID.</p><p>See you on the water! 🚣<br/><strong>Local Goa Kayaking</strong></p>`;
    const mailOptions = {
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: customerEmail,
      subject,
      text,
      html,
      attachments: [{
        filename: `Boarding_Pass_${ticketId}.png`,
        content: imageBase64,
        encoding: "base64",
        contentType: "image/png",
      }],
    };
    await transporter.sendMail(mailOptions);
    if (settings.fromEmail && settings.fromEmail !== customerEmail) {
      await transporter.sendMail({ ...mailOptions, to: settings.fromEmail, subject: `[Admin Copy] ${subject}` });
    }
    console.log(`Boarding pass email sent for booking #${booking.id}`);
  } catch (e) {
    console.error("Failed to send boarding pass email:", e);
  }
}

export async function sendOtpEmail(toEmail: string, otp: string, purpose: 'reset' | 'register'): Promise<void> {
  const settings = await storage.getEmailSettings();
  if (!settings.enabled || !settings.smtpHost || !settings.fromEmail) {
    throw new Error("Email service is not configured. Please contact admin.");
  }
  const port = settings.smtpPort ?? 587;
  const secure = port === 465;
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost, port, secure,
    auth: { user: settings.smtpUser, pass: (settings.smtpPassword || "").replace(/\s+/g, "") },
    tls: { rejectUnauthorized: false },
  });
  const isReset = purpose === 'reset';
  const subject = isReset
    ? "Password Reset OTP — Local Goa Kayaking"
    : "Verify Your Email — Local Goa Kayaking";
  const text = isReset
    ? `Your OTP to reset your password is: ${otp}\n\nThis OTP expires in 10 minutes. If you did not request this, please ignore.\n\nLocal Goa Kayaking`
    : `Your OTP to verify your email is: ${otp}\n\nThis OTP expires in 10 minutes.\n\nLocal Goa Kayaking`;
  await transporter.sendMail({
    from: `"${settings.fromName || "Local Goa Kayaking"}" <${settings.fromEmail}>`,
    to: toEmail,
    subject,
    text,
  });
}

export async function autoSendEmail(booking: any, templateKey: string, service?: any, extras?: { couponCode?: string; couponExpiryDays?: number }) {
  try {
    const settings = await storage.getEmailSettings();
    if (!settings.enabled || !settings.smtpHost || !settings.fromEmail) return;

    // Send to customer if they provided an email, otherwise fall back to admin's fromEmail
    const customerEmail = booking.email?.trim();
    const recipients: string[] = [];
    if (customerEmail) recipients.push(customerEmail);
    // Always send admin copy to fromEmail (skip duplicate if customer email matches)
    if (settings.fromEmail && settings.fromEmail !== customerEmail) recipients.push(settings.fromEmail);
    if (recipients.length === 0) return;

    const templates = await storage.getEmailTemplates();
    const tpl = templates.find(t => t.status === templateKey);
    if (!tpl) return;
    const svc = service ?? (booking.serviceId ? await storage.getService(booking.serviceId) : undefined);
    const subject = renderEmailBody(tpl.subject, booking, svc?.name, extras);
    const text = renderEmailBody(tpl.body, booking, svc?.name, extras);
    const port = settings.smtpPort ?? 587;
    const secure = port === 465 ? true : false;
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port,
      secure,
      auth: { user: settings.smtpUser, pass: (settings.smtpPassword || "").replace(/\s+/g, "") },
      tls: { rejectUnauthorized: false },
    });

    // Send to customer
    if (customerEmail) {
      await transporter.sendMail({
        from: `"${settings.fromName}" <${settings.fromEmail}>`,
        to: customerEmail,
        subject,
        text,
      });
      console.log(`Email sent to customer ${customerEmail} for booking #${booking.id} (${templateKey})`);
    }

    // Always send admin copy
    if (settings.fromEmail && settings.fromEmail !== customerEmail) {
      const adminSubject = `[Admin Copy] ${subject}`;
      await transporter.sendMail({
        from: `"${settings.fromName}" <${settings.fromEmail}>`,
        to: settings.fromEmail,
        subject: adminSubject,
        text,
      });
      console.log(`Admin copy sent to ${settings.fromEmail} for booking #${booking.id} (${templateKey})`);
    }
  } catch (e) {
    console.error("Failed to send email:", e);
  }
}
