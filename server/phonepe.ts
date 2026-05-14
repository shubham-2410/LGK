import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { autoSendEmail } from "./email";

// ─── Singleton PhonePe client ─────────────────────────────────────────────────
let _phonePeClient: any = null;
let _cachedConfig = { clientId: "", env: "" };

function getPhonePeClient(ps: any) {
  const clientId: string = (ps.phonePeClientId || "").trim();
  const clientSecret: string = (ps.phonePeClientSecret || "").trim();
  const clientVersion: number = Number(ps.phonePeClientVersion) || 1;
  const envKey: string = ps.phonePeEnv || "sandbox";

  if (!clientId || !clientSecret) {
    throw new Error("PhonePe credentials not configured. Please set Client ID and Secret in Payment Settings.");
  }

  if (_phonePeClient && _cachedConfig.clientId === clientId && _cachedConfig.env === envKey) {
    return _phonePeClient;
  }

  const { StandardCheckoutClient, Env } = require("@phonepe-pg/pg-sdk-node");
  const sdkEnv = envKey === "production" ? Env.PRODUCTION : Env.SANDBOX;

  try {
    _phonePeClient = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, sdkEnv);
    _cachedConfig = { clientId, env: envKey };
  } catch (e: any) {
    if (_phonePeClient) return _phonePeClient;
    throw e;
  }
  return _phonePeClient;
}

// ─── Confirm booking (called after successful payment) ────────────────────────
async function confirmBookingAfterPayment(
  bookingId: number,
  transactionId: string,
  autoQueueWaMessage: (b: any, k: string) => void
) {
  const updated = await storage.confirmBooking(bookingId, null);
  if (!updated) throw new Error("Booking not found");

  if (updated.userId) {
    try {
      const svc = await storage.getService(updated.serviceId!);
      await storage.createNotification({
        userId: updated.userId,
        title: "Booking Confirmed!",
        message: `Your booking #${updated.id.toString().padStart(4, "0")} for ${svc?.name ?? "Kayaking"} on ${updated.date} at ${updated.timeSlot} has been confirmed. See you on the water! 🎉`,
        type: "booking_confirmed",
        bookingId: updated.id,
        isRead: false,
      });
    } catch {}
    try {
      const cs = await storage.getCouponSettings();
      if (cs.bookingCouponEnabled) {
        const dl = cs.bookingCouponDiscountType === "fixed"
          ? `₹${cs.bookingCouponDiscountValue} off`
          : `${cs.bookingCouponDiscountValue}% off`;
        await storage.createNotification({
          userId: updated.userId,
          title: "Coupon reward earned! 🎟️",
          message: `You've earned a coupon (${dl}) for your next booking! It will be available once your trip is complete.`,
          type: "coupon_earned",
          bookingId: updated.id,
          isRead: false,
        });
      }
    } catch {}
  }

  try { autoQueueWaMessage(updated, "booking_confirmed"); } catch {}
  try { autoSendEmail(updated, "booking_confirmed"); } catch {}
  return updated;
}

// ─── Register routes ──────────────────────────────────────────────────────────
export function registerPhonePeRoutes(
  app: Express,
  autoQueueWaMessage: (b: any, k: string) => void
) {
  // POST /api/phonepe/initiate
  app.post("/api/phonepe/initiate", async (req: any, res) => {
    try {
      const userId: number | undefined = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const ps = await storage.getPaymentSettings();
      if ((ps as any).paymentMode !== "phonepe") {
        return res.status(400).json({ message: "Online payment not enabled" });
      }

      const schema = z.object({
        serviceId: z.number().int(),
        date: z.string(),
        timeSlot: z.string(),
        fullName: z.string().min(1),
        contactNumber: z.string().min(1),
        email: z.string().default(""),
        pax: z.number().int().min(1),
        totalPayable: z.number().int(),
        amountPaid: z.number().int(),
        balance: z.number().int(),
        couponCode: z.string().nullable().optional(),
        couponDiscount: z.number().int().optional(),
        whatsappConsent: z.boolean().optional(),
        referralCode: z.string().nullable().optional(),
        gstAmount: z.number().int().optional(),
        cgstAmount: z.number().int().optional(),
        sgstAmount: z.number().int().optional(),
      });
      const input = schema.parse(req.body);
      const amountInPaisa = Math.round((input.amountPaid || input.totalPayable) * 100);

      const booking = await storage.createBooking({
        ...input,
        userId,
        status: "pending",
        transactionId: null,
        couponCode: input.couponCode ?? null,
        couponDiscount: input.couponDiscount ?? 0,
        whatsappConsent: input.whatsappConsent ?? false,
        referralCode: input.referralCode ?? null,
        gstAmount: input.gstAmount ?? 0,
        cgstAmount: input.cgstAmount ?? 0,
        sgstAmount: input.sgstAmount ?? 0,
      } as any);

      const merchantOrderId = `PP-${booking.id}`;
      const siteUrl = ((ps as any).siteUrl || "").trim();
      const origin = siteUrl || `${req.protocol}://${req.get("host")}`;
      const redirectUrl = `${origin}/payment/return?orderId=${merchantOrderId}`;

      const client = getPhonePeClient(ps);
      const { StandardCheckoutPayRequest } = require("@phonepe-pg/pg-sdk-node");

      const payRequest = StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(amountInPaisa)
        .redirectUrl(redirectUrl)
        .build();

      const response = await client.pay(payRequest);
      res.json({ bookingId: booking.id, redirectUrl: response.redirectUrl });
    } catch (err: any) {
      console.error("[PhonePe] initiate error:", err?.message || err);
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: err.message || "Failed to initiate payment" });
    }
  });

  // GET /api/phonepe/status/:merchantOrderId — called from return page (no auth)
  app.get("/api/phonepe/status/:merchantOrderId", async (req, res) => {
    try {
      const { merchantOrderId } = req.params;
      const match = merchantOrderId.match(/^PP-(\d+)$/);
      if (!match) return res.status(400).json({ message: "Invalid order ID" });
      const bookingId = parseInt(match[1]);

      const ps = await storage.getPaymentSettings();
      const client = getPhonePeClient(ps);

      const statusResponse = await client.getOrderStatus(merchantOrderId);
      const state: string = statusResponse.state; // PENDING | COMPLETED | FAILED

      if (state === "COMPLETED") {
        const booking = await storage.getBooking(bookingId);
        if (booking && booking.status === "pending") {
          const txnId = statusResponse.paymentDetails?.[0]?.transactionId?.toString() || merchantOrderId;
          await confirmBookingAfterPayment(bookingId, txnId, autoQueueWaMessage);
        }
      }

      res.json({ state, bookingId, orderId: merchantOrderId });
    } catch (err: any) {
      console.error("[PhonePe] status error:", err?.message || err);
      res.status(500).json({ message: err.message || "Failed to check order status" });
    }
  });

  // POST /api/phonepe/callback — server-to-server webhook
  app.post("/api/phonepe/callback", async (req: any, res) => {
    try {
      const ps = await storage.getPaymentSettings();
      const client = getPhonePeClient(ps);
      const authorization = (req.headers["authorization"] as string) || "";
      const responseBodyString = JSON.stringify(req.body);

      const callbackResponse = client.validateCallback(
        (ps as any).phonePeWebhookUsername || "",
        (ps as any).phonePeWebhookPassword || "",
        authorization,
        responseBodyString
      );

      const { type, payload } = callbackResponse;
      const originalMerchantOrderId: string = payload?.originalMerchantOrderId || "";

      if (type === "CHECKOUT_ORDER_COMPLETED") {
        const match = originalMerchantOrderId.match(/^PP-(\d+)$/);
        if (match) {
          const bookingId = parseInt(match[1]);
          const booking = await storage.getBooking(bookingId);
          if (booking && booking.status === "pending") {
            const txnId = payload?.transactionId?.toString() || originalMerchantOrderId;
            await confirmBookingAfterPayment(bookingId, txnId, autoQueueWaMessage);
          }
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("[PhonePe] callback error:", err?.message || err);
      res.status(200).json({ success: false });
    }
  });
}
