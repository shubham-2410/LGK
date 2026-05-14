import type { Express } from "express";
import type { Server } from "http";
import { spawn } from "child_process";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
const BCRYPT_ROUNDS = 10;
import { autoSendEmail, seedEmailTemplates, sendBoardingPassEmail, sendBoardingPassPDFEmail, sendOtpEmail } from "./email";
import { runReminderJob } from "./reminder";
import { registerPhonePeRoutes } from "./phonepe";
import { uploadToDrive } from "./drive";
import { uploadToFtp } from "./ftp";



import multer, { memoryStorage } from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs";


const uploadsDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const photoUpload = multer({
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname) || /^image\//.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Only image files are allowed"));
  },
});

function getSessionUserId(req: any): number | undefined {
  return req.session ? req.session.userId : undefined;
}

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const userId = getSessionUserId(req);
  if (!userId) { res.status(401).json({ message: "Not authenticated" }); return false; }
  const user = await storage.getUser(userId);
  if (!user?.isAdmin) { res.status(403).json({ message: "Admin access required" }); return false; }
  return true;
}

async function notifyAdmins(title: string, message: string, type: string, bookingId?: number) {
  try {
    const admins = await storage.getAdminUsers();
    for (const admin of admins) {
      await storage.createNotification({ userId: admin.id, title, message, type, bookingId: bookingId ?? null, isRead: false });
    }
  } catch (e) {
    console.error("Failed to notify admins:", e);
  }
}

function renderWaTemplate(template: string, booking: any, service: any, extras?: { couponCode?: string; couponExpiryDays?: number }): string {
  const gstAmount = booking.gstAmount ?? 0;
  const cgstAmount = booking.cgstAmount ?? 0;
  const sgstAmount = booking.sgstAmount ?? 0;
  const gstSummary = gstAmount > 0
    ? `\n💰 Tax Breakdown:\n  • CGST      : ₹${cgstAmount}\n  • SGST      : ₹${sgstAmount}\n  • Total GST : ₹${gstAmount}`
    : "";
  return template
    .replace(/\[Full Name\]/g, booking.fullName || "")
    .replace(/\[Phone\]/g, booking.contactNumber || "")
    .replace(/\[Service Name\]/g, service?.name || "")
    .replace(/\[Booking Date\]/g, booking.date || "")
    .replace(/\[Booking Time\]/g, booking.timeSlot || "")
    .replace(/\[Pax Number\]/g, String(booking.pax || ""))
    .replace(/\[Total Amount\]/g, String(booking.totalPayable || ""))
    .replace(/\[Status\]/g, booking.status || "")
    .replace(/\[Booking ID\]/g, booking.id?.toString().padStart(4, "0") || "")
    .replace(/\[Cancel Reason\]/g, booking.cancelReason || "")
    .replace(/\[Booking Coupon\]/g, extras?.couponCode || "")
    .replace(/\[Coupon Expiry Days\]/g, extras?.couponExpiryDays != null ? String(extras.couponExpiryDays) : "")
    .replace(/\[GST Amount\]/g, String(gstAmount))
    .replace(/\[CGST Amount\]/g, String(cgstAmount))
    .replace(/\[SGST Amount\]/g, String(sgstAmount))
    .replace(/\[GST Summary\]/g, gstSummary);
}

async function autoQueueWaMessage(booking: any, templateKey: string, service?: any, extras?: { couponCode?: string; couponExpiryDays?: number }) {
  try {
    if (!booking.whatsappConsent) return;
    const waSettings = await storage.getWhatsappSettings();
    if (!waSettings.enabled || !waSettings.adminNumber) return;
    const templates = await storage.getWhatsappTemplates();
    const tpl = templates.find(t => t.status === templateKey);
    if (!tpl) return;
    const svc = service ?? (booking.serviceId ? await storage.getService(booking.serviceId) : undefined);
    const message = renderWaTemplate(tpl.template, booking, svc, extras);
    await storage.addToWhatsappQueue({
      bookingId: booking.id,
      customerPhone: booking.contactNumber || "",
      customerName: booking.fullName || "",
      templateKey,
      message,
      isSent: false,
    });
  } catch (e) {
    console.error("Failed to queue WhatsApp message:", e);
  }
}

// ─── In-memory OTP store (expires after 10 min) ─────────────────────────────
const otpStore = new Map<string, { otp: string; expires: number; purpose: 'reset' | 'register' }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  async function seedDatabase() {
    try {
      const existingServices = await storage.getServices();
      if (existingServices.length === 0) {
        await storage.createService({ name: "Sunset Kayaking", description: "Experience a beautiful sunset on the water.", price: 1500, imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5", duration: "2 Hours", ageGroup: "All Ages", timeSlots: ["04:00 PM", "05:30 PM"], isActive: true });
        await storage.createService({ name: "Sunrise Kayaking", description: "Start your day with a calm sunrise paddle.", price: 1200, imageUrl: "https://images.unsplash.com/photo-1520208422220-d12a3c588e6c", duration: "2 Hours", ageGroup: "All Ages", timeSlots: ["06:00 AM", "08:30 AM"], isActive: true });
        await storage.createService({ name: "Kayaking + Adventure Tour", description: "Kayaking combined with a thrilling adventure trail.", price: 2500, imageUrl: "https://images.unsplash.com/photo-1533086723868-6060511e4168", duration: "4 Hours", ageGroup: "Only Adults", timeSlots: ["08:00 AM", "02:00 PM"], isActive: true });
        await storage.createService({ name: "Kayaking + Gold Package", description: "Premium kayaking experience with photos and meal.", price: 3500, imageUrl: "https://images.unsplash.com/photo-1560060935-779836362d29", duration: "5 Hours", ageGroup: "All Ages", timeSlots: ["09:00 AM", "03:00 PM"], isActive: true });
        console.log("Seeded initial services");
      }
      const existingBanners = await storage.getBanners();
      if (existingBanners.length === 0) {
        await storage.createBanner({ title: "Kayaking In Goa", imageUrl: "/banner-kayaking.png", isActive: true, expiresAt: null });
        console.log("Seeded initial banners");
      }
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  }

  seedDatabase();
  seedEmailTemplates();

  // Helper: resolve user by mobile (handles E.164 ↔ plain 10-digit normalization)
  async function resolveUserByMobile(raw: string) {
    const mobile = raw.trim();
    let user = await storage.getUserByMobile(mobile);
    if (!user && /^\d{10}$/.test(mobile)) user = await storage.getUserByMobile("+91" + mobile);
    if (!user && mobile.startsWith("+91") && mobile.length === 13) user = await storage.getUserByMobile(mobile.slice(3));
    return user;
  }

  // Auth Routes
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const isEmail = input.identifier.includes('@');
      let user = isEmail
        ? await storage.getUserByEmail(input.identifier.toLowerCase().trim())
        : await resolveUserByMobile(input.identifier);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials. Please check your mobile number (or email) and password." });
      }
      // Support both bcrypt hashes and legacy plain-text passwords during migration
      const stored = user.password?.trim() || "";
      const isHashed = stored.startsWith("$2");
      const passwordMatch = isHashed
        ? await bcrypt.compare(input.password.trim(), stored)
        : stored === input.password.trim();
      if (!passwordMatch) {
        // Upgrade plain-text to hash on successful identification if we ever get here
        return res.status(401).json({ message: "Invalid credentials. Please check your mobile number (or email) and password." });
      }
      // Silently migrate legacy plain-text password to bcrypt hash on successful login
      if (!isHashed && stored) {
        const hashed = await bcrypt.hash(stored, BCRYPT_ROUNDS);
        await storage.updateUserProfile(user.id, { password: hashed } as any);
      }
      if (req.session) req.session.userId = user.id;
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid input data" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // PIN Login
  app.post("/api/auth/login-pin", async (req, res) => {
    try {
      const { mobileNumber, pin } = z.object({ mobileNumber: z.string(), pin: z.string() }).parse(req.body);
      const user = await resolveUserByMobile(mobileNumber);
      if (!user || !user.loginPin || user.loginPin.trim() !== pin.trim()) {
        return res.status(401).json({ message: "Invalid mobile number or PIN" });
      }
      if (req.session) req.session.userId = user.id;
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid input data" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check if mobile has a PIN set (returns boolean only — does NOT expose PIN)
  app.get("/api/auth/has-pin", async (req, res) => {
    try {
      const { mobile } = z.object({ mobile: z.string() }).parse(req.query);
      const user = await resolveUserByMobile(mobile);
      return res.status(200).json({ hasPin: !!(user?.loginPin) });
    } catch {
      return res.status(200).json({ hasPin: false });
    }
  });

  // Guest login — creates a password-less account or finds an existing guest
  app.post("/api/auth/guest-login", async (req: any, res) => {
    try {
      const { mobileNumber, fullName } = z.object({
        mobileNumber: z.string().min(8),
        fullName: z.string().optional(),
      }).parse(req.body);

      let user = await resolveUserByMobile(mobileNumber);

      if (user) {
        if (user.password) {
          return res.status(409).json({ message: "This number is already registered. Please log in with your password.", requiresLogin: true });
        }
        // Existing guest — update name if provided and not set yet
        if (fullName && !user.fullName) {
          user = await storage.updateUserProfile(user.id, { fullName });
        }
      } else {
        user = await storage.createUser({
          mobileNumber: mobileNumber.trim(),
          password: "",
          fullName: fullName?.trim() || null,
          isAdmin: false,
        } as any);
      }

      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => req.session.save((err: any) => err ? reject(err) : resolve()));
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const { mobileNumber, password, email, otp, fullName } = z.object({
        mobileNumber: z.string(),
        password: z.string(),
        email: z.string().email().optional(),
        otp: z.string().optional(),
        fullName: z.string().optional(),
      }).parse(req.body);

      // If email + OTP provided, verify OTP first
      if (email && otp) {
        const stored = otpStore.get(email.toLowerCase());
        if (!stored || stored.purpose !== 'register' || stored.otp !== otp || Date.now() > stored.expires) {
          return res.status(400).json({ message: "Invalid or expired OTP. Please request a new one." });
        }
        otpStore.delete(email.toLowerCase());
      }

      const existing = await storage.getUserByMobile(mobileNumber.trim());
      if (existing) return res.status(409).json({ message: "mobile_already_registered" });

      if (email) {
        const existingEmail = await storage.getUserByEmail(email.trim().toLowerCase());
        if (existingEmail) return res.status(409).json({ message: "email_already_registered" });
      }
      const hashedPassword = await bcrypt.hash(password.trim(), BCRYPT_ROUNDS);
      const user = await storage.createUser({
        mobileNumber: mobileNumber.trim(),
        password: hashedPassword,
        email: email?.trim() || null,
        fullName: fullName?.trim() || null,
        isAdmin: false,
      } as any);
      if (req.session) req.session.userId = user.id;
      res.setHeader('Cache-Control', 'no-store');
      notifyAdmins(
        "New User Registered",
        `A new user has registered with mobile number ${mobileNumber.trim()}.`,
        "user_registered"
      );
      return res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid input data" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send OTP (for password reset or email verification during registration)
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email, purpose } = z.object({
        email: z.string().email(),
        purpose: z.enum(['reset', 'register']),
      }).parse(req.body);

      const emailLower = email.toLowerCase();

      if (purpose === 'reset') {
        const user = await storage.getUserByEmail(emailLower);
        if (!user) return res.status(404).json({ message: "No account found with this email address." });
      }

      if (purpose === 'register') {
        const existing = await storage.getUserByEmail(emailLower);
        if (existing) return res.status(409).json({ message: "email_already_registered" });
      }

      const otp = generateOtp();
      otpStore.set(emailLower, { otp, expires: Date.now() + 10 * 60 * 1000, purpose });

      await sendOtpEmail(email, otp, purpose);
      return res.status(200).json({ message: "OTP sent to your email." });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid email address." });
      return res.status(500).json({ message: err.message || "Failed to send OTP. Please try again." });
    }
  });

  // Check registration OTP without consuming it (used during step 2 of registration)
  app.post("/api/auth/check-register-otp", async (req, res) => {
    try {
      const { email, otp } = z.object({
        email: z.string().email(),
        otp: z.string().length(6),
      }).parse(req.body);

      const stored = otpStore.get(email.toLowerCase());
      if (!stored || stored.purpose !== 'register' || stored.otp !== otp || Date.now() > stored.expires) {
        return res.status(400).json({ message: "Invalid or expired OTP. Please try again." });
      }

      return res.status(200).json({ message: "OTP verified." });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid input." });
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  // Verify email OTP (for profile email change)
  app.post("/api/auth/verify-email-otp", async (req, res) => {
    try {
      const { email, otp } = z.object({
        email: z.string().email(),
        otp: z.string().length(6),
      }).parse(req.body);

      const emailLower = email.toLowerCase();
      const stored = otpStore.get(emailLower);
      if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
        return res.status(400).json({ message: "Invalid or expired OTP. Please request a new one." });
      }

      otpStore.delete(emailLower);
      return res.status(200).json({ message: "Email verified." });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid input data." });
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  // Reset password using OTP
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, otp, newPassword } = z.object({
        email: z.string().email(),
        otp: z.string().length(6),
        newPassword: z.string().min(6),
      }).parse(req.body);

      const emailLower = email.toLowerCase();
      const stored = otpStore.get(emailLower);
      if (!stored || stored.purpose !== 'reset' || stored.otp !== otp || Date.now() > stored.expires) {
        return res.status(400).json({ message: "Invalid or expired OTP. Please request a new one." });
      }

      const user = await storage.getUserByEmail(emailLower);
      if (!user) return res.status(404).json({ message: "No account found with this email." });

      const hashedNew = await bcrypt.hash(newPassword.trim(), BCRYPT_ROUNDS);
      await storage.updateUserProfile(user.id, { password: hashedNew } as any);
      otpStore.delete(emailLower);
      return res.status(200).json({ message: "Password reset successfully. You can now log in." });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid input data." });
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    if (!req.session) return res.status(200).json({ message: "Logged out" });
    req.session.destroy(() => res.status(200).json({ message: "Logged out" }));
  });

  app.patch(api.auth.updateProfile.path, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const input = api.auth.updateProfile.input.parse(req.body);
      // Hash new password before storing
      if (input.password && input.password.trim()) {
        (input as any).password = await bcrypt.hash(input.password.trim(), BCRYPT_ROUNDS);
      }
      const updated = await storage.updateUserProfile(userId, input);
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Services
  app.get(api.services.list.path, async (req, res) => {
    try {
      res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      res.status(200).json(await storage.getServices());
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.services.create.path, async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const input = api.services.create.input.parse(req.body);
      // Swap display sequence if another service in the same category holds the chosen sequence
      if ((input as any).displaySequence != null && (input as any).categoryId != null) {
        const allSvcs = await storage.getServices();
        const catPeers = allSvcs.filter((s: any) => s.categoryId === (input as any).categoryId);
        const conflict = catPeers.find((s: any) => s.displaySequence === (input as any).displaySequence);
        if (conflict) {
          const takenAfterSwap = new Set(catPeers.filter((s: any) => s.id !== conflict.id).map((s: any) => s.displaySequence).filter(Boolean));
          takenAfterSwap.add((input as any).displaySequence);
          let next = 1;
          while (takenAfterSwap.has(next)) next++;
          await storage.updateService(conflict.id, { displaySequence: next } as any);
        }
      }
      res.status(201).json(await storage.createService(input));
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.services.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.services.update.input.parse(req.body);
      // Swap display sequence if another service in the same category holds the chosen sequence
      if (input.displaySequence != null && input.categoryId != null) {
        const allCatServices = await storage.getServices();
        const catPeers = allCatServices.filter((s: any) => s.categoryId === input.categoryId && s.id !== id);
        const conflict = catPeers.find((s: any) => s.displaySequence === input.displaySequence);
        if (conflict) {
          const takenAfterSwap = new Set(catPeers.filter((s: any) => s.id !== conflict.id).map((s: any) => s.displaySequence).filter(Boolean));
          takenAfterSwap.add(input.displaySequence);
          let next = 1;
          while (takenAfterSwap.has(next)) next++;
          await storage.updateService(conflict.id, { displaySequence: next } as any);
        }
      }
      const updated = await storage.updateService(id, input);
      if (!updated) return res.status(404).json({ message: "Service not found" });
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.services.delete.path, async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      await storage.deleteService(parseInt(req.params.id));
      res.status(204).end();
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Banners
  app.get(api.banners.list.path, async (req, res) => {
    try {
      res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
      res.status(200).json(await storage.getBanners());
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.banners.create.path, async (req, res) => {
    try {
      const input = api.banners.create.input.parse(req.body);
      res.status(201).json(await storage.createBanner(input));
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.banners.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.banners.update.input.parse(req.body);
      const updated = await storage.updateBanner(id, input);
      if (!updated) return res.status(404).json({ message: "Banner not found" });
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.banners.delete.path, async (req, res) => {
    try {
      await storage.deleteBanner(parseInt(req.params.id));
      res.status(204).end();
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment Settings
  app.get(api.paymentSettings.get.path, async (req, res) => {
    try {
      res.status(200).json(await storage.getPaymentSettings());
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.paymentSettings.update.path, async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const input = api.paymentSettings.update.input.parse(req.body);
      res.status(200).json(await storage.updatePaymentSettings(input));
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal server error" });
    }
  });

  // Bookings
  app.get(api.bookings.list.path, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (userId) {
        const user = await storage.getUser(userId);
        if (user?.isAdmin) {
          // Auto-mark past confirmed bookings as completed, then generate earned coupons
          try {
            const newlyCompleted = await storage.autoCompleteBookings();
            if (newlyCompleted.length > 0) {
              const couponSettingsData = await storage.getCouponSettings();
              if (couponSettingsData.bookingCouponEnabled) {
                const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                const discountLabel = couponSettingsData.bookingCouponDiscountType === "fixed"
                  ? `₹${couponSettingsData.bookingCouponDiscountValue} off`
                  : `${couponSettingsData.bookingCouponDiscountValue}% off`;
                for (const completed of newlyCompleted) {
                  if (!completed.userId) continue;
                  // Don't double-generate
                  const existing = await storage.getCouponByBookingId(completed.id);
                  if (existing) continue;
                  const randomPart = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
                  const code = `KAYAK-${randomPart}`;
                  const expiresAt = new Date();
                  expiresAt.setMonth(expiresAt.getMonth() + (couponSettingsData.bookingCouponExpiryMonths ?? 3));
                  const newCoupon = await storage.createCoupon({
                    code,
                    type: "booking",
                    discountType: couponSettingsData.bookingCouponDiscountType ?? "percentage",
                    discountValue: couponSettingsData.bookingCouponDiscountValue ?? 10,
                    expiresAt,
                    isActive: true,
                    isUsed: false,
                    usedByUserId: null,
                    createdForUserId: completed.userId,
                    earnedFromBookingId: completed.id,
                    categoryId: couponSettingsData.bookingCouponCategoryId ?? null,
                    serviceId: couponSettingsData.bookingCouponServiceId ?? null,
                  });
                  const expiryStr = expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                  await storage.createNotification({
                    userId: completed.userId,
                    title: "Your coupon is now active! 🎟️",
                    message: `Trip complete! Use code ${newCoupon.code} for ${discountLabel} on your next booking. Valid until ${expiryStr}.`,
                    type: "coupon_earned",
                    bookingId: completed.id,
                    isRead: false,
                  });
                  const couponExpiryDays = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  autoQueueWaMessage(completed, "booking_confirmed", undefined, { couponCode: newCoupon.code, couponExpiryDays });
                  autoSendEmail(completed, "booking_confirmed", undefined, { couponCode: newCoupon.code, couponExpiryDays });
                }
              }
            }
          } catch (e) {
            console.error("Failed to auto-complete coupons:", e);
          }
          return res.status(200).json(await storage.getBookings());
        }
        return res.status(200).json(await storage.getUserBookings(userId));
      }
      res.status(200).json([]);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: update a single booking's status
  app.patch("/api/bookings/:id/status", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const id = parseInt(req.params.id);
      const { status } = z.object({ status: z.string().min(1) }).parse(req.body);
      const updated = await storage.updateBookingStatus(id, status);
      if (!updated) return res.status(404).json({ message: "Booking not found" });
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: update booking settlement
  app.patch("/api/bookings/:id/settlement", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const id = parseInt(req.params.id);
      const { settlementAmount, isSettled } = z.object({
        settlementAmount: z.number().int().nullable(),
        isSettled: z.boolean(),
      }).parse(req.body);
      const updated = await storage.updateBookingSettlement(id, settlementAmount, isSettled);
      if (!updated) return res.status(404).json({ message: "Booking not found" });

      // When un-settling: remove ALL ledger entries for this booking across all accounts
      if (!isSettled) {
        try {
          const bookingTag = `(#${updated.id.toString().padStart(4, "0")})`;
          const allEntries = await storage.getLedgerEntries();
          for (const entry of allEntries) {
            if ((entry.notes ?? "").includes(bookingTag)) {
              await storage.deleteLedgerEntry(entry.id);
            }
          }
        } catch (e) {
          console.error("Failed to clean up ledger entries on unsettle:", e);
        }
      }

      // Auto-create ledger entries based on each account's bookingMapping config
      if (isSettled && settlementAmount && settlementAmount > 0) {
        try {
          const allHeads = await storage.getAccountHeads();
          const allEntries = await storage.getLedgerEntries();
          const today = new Date().toISOString().slice(0, 10);
          const bookingId = updated.id.toString().padStart(4, "0");
          const bookingTag = `(#${bookingId})`;

          // Helper: check if a note containing the booking tag already exists for a given account head
          const hasEntry = (headId: number, noteFragment: string) =>
            allEntries.some(e => e.accountHeadId === headId && (e.notes ?? "").includes(noteFragment) && (e.notes ?? "").includes(bookingTag));

          // GST is collected upfront with the token (online payment)
          // Balance is paid in cash at venue — non-taxable, stays as-is
          const gstAmount = updated.gstAmount ?? 0;
          const tokenWithGst = updated.amountPaid + gstAmount;
          const balancePaid = Math.max(0, settlementAmount - updated.amountPaid);

          // Identify which account received the token and which received the balance
          const bankCashMapped = allHeads.filter(h => {
            const t = (h as any).type;
            const m = (h as any).bookingMapping ?? "none";
            return (t === "bank" || t === "cash") && m !== "none";
          });
          const tokenAccountName = bankCashMapped.find(h => {
            const m = (h as any).bookingMapping;
            return m === "token" || m === "both";
          })?.name ?? "Bank";
          const balanceAccountName = bankCashMapped.find(h => {
            const m = (h as any).bookingMapping;
            return m === "balance" || m === "both";
          })?.name ?? "Cash";

          // 1. Bank/cash mapping entries
          for (const head of allHeads) {
            const mapping = (head as any).bookingMapping ?? "none";
            if (mapping === "none") continue;
            if ((head as any).type !== "bank" && (head as any).type !== "cash") continue;
            const wantsToken   = mapping === "token" || mapping === "both";
            const wantsBalance = mapping === "balance" || mapping === "both";
            // Token-mapped account (e.g. HDFC Bank): created at confirmation but restore if missing
            if (wantsToken && tokenWithGst > 0 && !hasEntry(head.id, "Token received")) {
              await storage.createLedgerEntry({
                accountHeadId: head.id,
                entryDate: today,
                type: "receivable",
                amount: tokenWithGst,
                notes: `Token received (incl. GST) - ${updated.fullName} (#${bookingId}) - ${today}`,
              });
            }
            // Balance-mapped account (e.g. Petty Cash): receives balance only
            if (wantsBalance && balancePaid > 0 && !hasEntry(head.id, "Balance received")) {
              await storage.createLedgerEntry({
                accountHeadId: head.id,
                entryDate: today,
                type: "receivable",
                amount: balancePaid,
                notes: `Balance received - ${updated.fullName} (#${bookingId}) - ${today}`,
              });
            }
          }

          // 2. Customer debtor (Account Receivable) entries
          //    No fromAccountId — avoids entries bleeding into bank/cash grouped sections.

          // Find or create debtor account head for customer
          let debtorHead = allHeads.find(h => h.name === updated.fullName && (h as any).type === "debtor");
          if (!debtorHead) {
            debtorHead = await storage.createAccountHead({
              name: updated.fullName,
              type: "debtor",
              openingBalance: 0,
              bookingMapping: "none",
            });
          }

          // Token entry on debtor (incl. GST — collected upfront online)
          if (tokenWithGst > 0 && !hasEntry(debtorHead.id, "Token received")) {
            await storage.createLedgerEntry({
              accountHeadId: debtorHead.id,
              entryDate: today,
              type: "receivable",
              amount: tokenWithGst,
              notes: `Token received (${tokenAccountName}, incl. GST) - ${updated.fullName} (#${bookingId}) - ${today}`,
            });
          }

          // Balance entry – only if not already present
          if (balancePaid > 0 && !hasEntry(debtorHead.id, "Balance received")) {
            await storage.createLedgerEntry({
              accountHeadId: debtorHead.id,
              entryDate: today,
              type: "receivable",
              amount: balancePaid,
              notes: `Balance received (${balanceAccountName}) - ${updated.fullName} (#${bookingId}) - ${today}`,
            });
          }
        } catch (e) {
          console.error("Failed to auto-create settlement ledger entries:", e);
        }
      }

      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Backfill ledger entries for already-settled bookings
  app.post("/api/accounting/sync-settlements", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;

      const allBookings  = await storage.getBookings();
      const allHeads     = await storage.getAccountHeads();
      const allEntries   = await storage.getLedgerEntries();
      const today        = new Date().toISOString().slice(0, 10);

      const bankCashHeads = allHeads.filter(h => {
        const t = (h as any).type;
        const m = (h as any).bookingMapping ?? "none";
        return (t === "bank" || t === "cash") && m !== "none";
      });

      // Note: don't return early even if bankCashHeads is empty — dedup still needs to run

      // Step 1: Remove auto-created entries for bookings that have been un-settled
      const bookingById = new Map(allBookings.map(b => [b.id.toString().padStart(4, "0"), b]));
      let removed = 0;

      // Debtor heads (auto-created customer accounts)
      const debtorHeads = allHeads.filter(h => (h as any).type === "debtor");

      // Clean up all booking-tagged entries for un-settled bookings (bank, cash, debtor)
      const debtorAndBankIds = new Set([
        ...bankCashHeads.map(h => h.id),
        ...debtorHeads.map(h => h.id),
      ]);
      for (const entry of allEntries) {
        if (!debtorAndBankIds.has(entry.accountHeadId)) continue;

        const match = (entry.notes ?? "").match(/#(\d{4})/);
        if (!match) continue;

        const refBooking = bookingById.get(match[1]);
        if (!refBooking) continue;

        if (!refBooking.isSettled) {
          await storage.deleteLedgerEntry(entry.id);
          removed++;
        }
      }

      // Step 1b: Remove ALL duplicate booking-tagged entries across every account
      //          (covers bank, cash, petty cash, debtor — any account with a #XXXX note)
      const postCleanupEntries = await storage.getLedgerEntries();
      const seenKey = new Set<string>();
      for (const entry of postCleanupEntries) {
        const match = (entry.notes ?? "").match(/#(\d{4})/);
        if (!match) continue;
        const bookingIdTag = match[1];
        const refBooking = bookingById.get(bookingIdTag);
        if (!refBooking?.isSettled) continue;  // only dedup entries that belong to settled bookings

        // Key: accountHeadId + bookingId + keyword (Token/Balance/Received)
        const note = entry.notes ?? "";
        const keyword = note.includes("Token") ? "Token" : note.includes("Balance") ? "Balance" : "Received";
        const key = `${entry.accountHeadId}:${bookingIdTag}:${keyword}`;
        if (seenKey.has(key)) {
          await storage.deleteLedgerEntry(entry.id);
          removed++;
        } else {
          seenKey.add(key);
        }
      }

      // Step 2: Backfill missing entries for settled bookings
      let created = 0;

      // Re-fetch entries after cleanup for accurate duplicate checks
      const freshEntries = await storage.getLedgerEntries();

      const tokenHead   = bankCashHeads.find(h => (h as any).bookingMapping === "token" || (h as any).bookingMapping === "both");
      const balanceHead = bankCashHeads.find(h => (h as any).bookingMapping === "balance" || (h as any).bookingMapping === "both");

      for (const booking of allBookings) {
        if (!booking.isSettled) continue;

        const bookingId = booking.id.toString().padStart(4, "0");

        const hasEntryInHead = (accountHeadId: number, keyword: string) =>
          freshEntries.some(e => e.accountHeadId === accountHeadId && (e.notes ?? "").includes(`#${bookingId}`) && (e.notes ?? "").includes(keyword));
        const hasAnyEntryInHead = (accountHeadId: number) =>
          freshEntries.some(e => e.accountHeadId === accountHeadId && (e.notes ?? "").includes(`#${bookingId}`));

        // Bank/cash mapping backfill
        for (const head of bankCashHeads) {
          const mapping = (head as any).bookingMapping ?? "none";
          const wantsToken   = mapping === "token" || mapping === "both";
          const wantsBalance = mapping === "balance" || mapping === "both";
          const wantsNet     = mapping === "net";

          const syncGst = (booking as any).gstAmount ?? 0;
          const syncTokenWithGst = booking.amountPaid + syncGst;
          if (wantsToken && syncTokenWithGst > 0 && !hasAnyEntryInHead(head.id)) {
            await storage.createLedgerEntry({
              accountHeadId: head.id,
              entryDate: today,
              type: "receivable",
              amount: syncTokenWithGst,
              notes: `Token received (incl. GST) - ${booking.fullName} (#${bookingId}) - ${today}`,
            });
            created++;
          }

          if (wantsBalance && booking.settlementAmount && booking.settlementAmount > 0 && !hasAnyEntryInHead(head.id)) {
            const syncBalancePaid = Math.max(0, booking.settlementAmount - booking.amountPaid);
            if (syncBalancePaid > 0) {
              await storage.createLedgerEntry({
                accountHeadId: head.id,
                entryDate: today,
                type: "receivable",
                amount: syncBalancePaid,
                notes: `Balance received - ${booking.fullName} (#${bookingId}) - ${today}`,
              });
              created++;
            }
          }

          if (wantsNet && booking.totalPayable > 0 && !hasAnyEntryInHead(head.id)) {
            await storage.createLedgerEntry({
              accountHeadId: head.id,
              entryDate: today,
              type: "receivable",
              amount: booking.totalPayable,
              notes: `Received against Booking - ${booking.fullName} (#${bookingId}) - ${today}`,
            });
            created++;
          }
        }

        // Debtor (customer Account Receivable) backfill
        // Find or create debtor account for this customer
        let debtorHead = allHeads.find(h => h.name === booking.fullName && (h as any).type === "debtor");
        if (!debtorHead) {
          debtorHead = await storage.createAccountHead({
            name: booking.fullName,
            type: "debtor",
            openingBalance: 0,
            bookingMapping: "none",
          });
          // Add to our local lists so duplicates within the loop are avoided
          allHeads.push(debtorHead);
          debtorHeads.push(debtorHead);
        }

        // Token entry on debtor (incl. GST — collected upfront online)
        const bookingGst = (booking as any).gstAmount ?? 0;
        const bookingTokenWithGst = booking.amountPaid + bookingGst;
        if (bookingTokenWithGst > 0 && !hasEntryInHead(debtorHead.id, "Token received")) {
          await storage.createLedgerEntry({
            accountHeadId: debtorHead.id,
            entryDate: today,
            type: "receivable",
            amount: bookingTokenWithGst,
            notes: `Token received (${tokenHead?.name ?? "Bank"}, incl. GST) - ${booking.fullName} (#${bookingId}) - ${today}`,
          });
          created++;
        }

        // Balance entry on debtor account (cash payment at venue, non-taxable)
        const balancePaid = Math.max(0, (booking.settlementAmount ?? 0) - booking.amountPaid);
        if (balancePaid > 0 && !hasEntryInHead(debtorHead.id, "Balance received")) {
          await storage.createLedgerEntry({
            accountHeadId: debtorHead.id,
            entryDate: today,
            type: "receivable",
            amount: balancePaid,
            notes: `Balance received (${balanceHead?.name ?? "Cash"}) - ${booking.fullName} (#${bookingId}) - ${today}`,
          });
          created++;
        }
      }

      res.json({ created, removed });
    } catch (e) {
      console.error("sync-settlements error:", e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: bulk update booking status
  app.patch("/api/bookings/bulk-status", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const { status, beforeDate, exactDate, nameContains, newStatus } = z.object({
        status: z.string().optional(),
        beforeDate: z.string().optional(),
        exactDate: z.string().optional(),
        nameContains: z.string().optional(),
        newStatus: z.string().min(1),
      }).parse(req.body);
      const count = await storage.bulkUpdateBookingStatus({ status, beforeDate, exactDate, nameContains }, newStatus);
      res.status(200).json({ updated: count });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/bookings/bulk", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const { status, beforeDate, exactDate, nameContains } = req.body as { status?: string; beforeDate?: string; exactDate?: string; nameContains?: string };
      const count = await storage.deleteBulkBookings({ status, beforeDate, exactDate, nameContains });
      res.status(200).json({ deleted: count });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.bookings.create.path, async (req, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const userId = getSessionUserId(req);

      // Validate referral code if provided
      let resolvedReferralCode: string | null = (req.body.referralCode as string | undefined)?.trim().toUpperCase() || null;
      let referralCommission = 0;
      let referralLinkedCoupon: string | null = null;
      if (resolvedReferralCode) {
        const referral = await storage.getReferralByCode(resolvedReferralCode);
        if (referral) {
          const totalPayable = input.totalPayable ?? 0;
          referralCommission = referral.commissionType === "percentage"
            ? Math.round(totalPayable * referral.commissionValue / 100)
            : referral.commissionValue;
          referralLinkedCoupon = referral.linkedCouponCode ?? null;
        } else {
          resolvedReferralCode = null;
        }
      }

      // Validate and consume coupon if provided (auto-apply referral linked coupon if no coupon given)
      let resolvedCouponCode: string | null = input.couponCode ?? null;
      if (!resolvedCouponCode && referralLinkedCoupon) resolvedCouponCode = referralLinkedCoupon;
      let couponDiscount: number = input.couponDiscount ?? 0;
      if (resolvedCouponCode) {
        const coupon = await storage.getCouponByCode(resolvedCouponCode);
        const couponExhausted = coupon
          ? coupon.isUsed || (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
          : false;
        if (!coupon || !coupon.isActive || couponExhausted || new Date(coupon.expiresAt) < new Date()) {
          resolvedCouponCode = null;
          couponDiscount = 0;
        } else {
          // Enforce service/category restriction
          let restrictionViolated = false;
          if (coupon.serviceId && coupon.serviceId !== input.serviceId) {
            restrictionViolated = true;
          }
          if (!restrictionViolated && coupon.categoryId && !coupon.serviceId) {
            const svc = await storage.getService(input.serviceId);
            if (svc && svc.categoryId !== coupon.categoryId) restrictionViolated = true;
          }
          if (restrictionViolated) {
            resolvedCouponCode = null;
            couponDiscount = 0;
          } else {
            // Block same mobile number from applying same coupon on multiple active bookings
            const alreadyActive = await storage.hasActiveCouponBooking(input.contactNumber, resolvedCouponCode);
            if (alreadyActive) {
              return res.status(400).json({ message: "COUPON_ALREADY_APPLIED" });
            }
            if (userId) {
              await storage.markCouponUsed(coupon.id, userId);
            }
          }
        }
      }

      // If no referral code was provided but the applied coupon is linked to a referral, auto-credit that referral's commission
      if (!resolvedReferralCode && resolvedCouponCode) {
        const allReferrals = await storage.getReferrals();
        const linkedReferral = allReferrals.find(r => r.linkedCouponCode?.toUpperCase() === resolvedCouponCode!.toUpperCase());
        if (linkedReferral) {
          resolvedReferralCode = linkedReferral.code;
          const totalPayable = input.totalPayable ?? 0;
          referralCommission = linkedReferral.commissionType === "percentage"
            ? Math.round(totalPayable * linkedReferral.commissionValue / 100)
            : linkedReferral.commissionValue;
        }
      }

      const bookingToCreate = userId
        ? { ...input, userId, couponCode: resolvedCouponCode, couponDiscount, referralCode: resolvedReferralCode, referralCommission }
        : { ...input, couponCode: resolvedCouponCode, couponDiscount, referralCode: resolvedReferralCode, referralCommission };
      const booking = await storage.createBooking(bookingToCreate);

      // Backfill user profile with booking details if fields are missing
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          const profileUpdates: Partial<{ fullName: string; email: string }> = {};
          if (!user.fullName && booking.fullName) profileUpdates.fullName = booking.fullName;
          if (!user.email && booking.email) profileUpdates.email = booking.email;
          if (Object.keys(profileUpdates).length > 0) {
            await storage.updateUserProfile(userId, profileUpdates);
          }
        }
      }

      notifyAdmins(
        "New Booking Received",
        `${booking.fullName} booked ${booking.pax} pax on ${booking.date} at ${booking.timeSlot}. Total: ₹${booking.totalPayable}${couponDiscount > 0 ? ` (Coupon: ${resolvedCouponCode}, saved ₹${couponDiscount})` : ""}.`,
        "booking_created",
        booking.id
      );
      autoQueueWaMessage(booking, "booking_created");
      autoSendEmail(booking, "booking_created");
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/bookings/:id/confirm", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const id = parseInt(req.params.id);
      const { staffId, bankAccountId } = z.object({
        staffId: z.number().int().nullable().optional(),
        bankAccountId: z.number().int().nullable().optional(),
      }).parse(req.body);
      const updated = await storage.confirmBooking(id, staffId ?? null);

      // Auto-create ledger entries based on each account's bookingMapping config
      try {
        const allHeads = await storage.getAccountHeads();
        const today = new Date().toISOString().slice(0, 10);
        const bookingId = updated.id.toString().padStart(4, "0");

        for (const head of allHeads) {
          const mapping = (head as any).bookingMapping ?? "none";
          if (mapping === "none") continue;
          if ((head as any).type !== "bank" && (head as any).type !== "cash") continue;

          const wantsToken   = mapping === "token" || mapping === "both";
          const wantsBalance = mapping === "balance" || mapping === "both";
          const wantsNet     = mapping === "net";

          if (wantsNet && updated.totalPayable > 0) {
            await storage.createLedgerEntry({
              accountHeadId: head.id,
              entryDate: today,
              type: "receivable",
              amount: updated.totalPayable,
              notes: `Received against Booking - ${updated.fullName} (#${bookingId}) - ${today}`,
            });
          }
          if (wantsToken && updated.amountPaid > 0) {
            const tokenWithGst = updated.amountPaid + (updated.gstAmount ?? 0);
            await storage.createLedgerEntry({
              accountHeadId: head.id,
              entryDate: today,
              type: "receivable",
              amount: tokenWithGst,
              notes: `Token received (incl. GST) - ${updated.fullName} (#${bookingId}) - ${today}`,
            });
          }
          if (wantsBalance && updated.balance > 0) {
            await storage.createLedgerEntry({
              accountHeadId: head.id,
              entryDate: today,
              type: "receivable",
              amount: updated.balance,
              notes: `Balance received - ${updated.fullName} (#${bookingId}) - ${today}`,
            });
          }
        }
      } catch (e) {
        console.error("Failed to auto-create ledger entries:", e);
      }
      if (!updated) return res.status(404).json({ message: "Booking not found" });
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
        } catch (e) {
          console.error("Failed to notify user:", e);
        }
        // Notify user that a coupon will be available after trip completion
        try {
          const couponSettingsData = await storage.getCouponSettings();
          if (couponSettingsData.bookingCouponEnabled) {
            const discountLabel = couponSettingsData.bookingCouponDiscountType === "fixed"
              ? `₹${couponSettingsData.bookingCouponDiscountValue} off`
              : `${couponSettingsData.bookingCouponDiscountValue}% off`;
            await storage.createNotification({
              userId: updated.userId,
              title: "Coupon reward earned! 🎟️",
              message: `You've earned a coupon (${discountLabel}) for your next booking! It will be available once your trip is complete.`,
              type: "coupon_earned",
              bookingId: updated.id,
              isRead: false,
            });
          }
        } catch (e) {
          console.error("Failed to send pending coupon notification:", e);
        }
      }
      autoQueueWaMessage(updated, "booking_confirmed");
      autoSendEmail(updated, "booking_confirmed");
      res.status(200).json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/bookings/:id/email-boarding-pass", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const id = parseInt(req.params.id);
      const body = z.object({
        pdfBase64: z.string().optional(),
        imageBase64: z.string().optional(),
      }).parse(req.body);
      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (!booking.email?.trim()) return res.status(200).json({ message: "No email on file, skipped." });
      if (body.pdfBase64) {
        const pdfBuffer = Buffer.from(body.pdfBase64, "base64");
        await sendBoardingPassPDFEmail(booking, pdfBuffer);
      } else if (body.imageBase64) {
        await sendBoardingPassEmail(booking, body.imageBase64);
      }
      res.status(200).json({ message: "Boarding pass emailed." });
    } catch (err) {
      console.error("email-boarding-pass error:", err);
      res.status(500).json({ message: "Failed to send boarding pass email" });
    }
  });

  app.patch(api.bookings.cancel.path, async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const id = parseInt(req.params.id);
      const { cancelReason } = api.bookings.cancel.input.parse(req.body);
      const updated = await storage.cancelBooking(id, cancelReason);
      if (!updated) return res.status(404).json({ message: "Booking not found" });
      // Notify the booking owner if they have a userId
      if (updated.userId) {
        try {
          await storage.createNotification({
            userId: updated.userId,
            title: "Booking Cancelled",
            message: `Your booking #${updated.id.toString().padStart(4, "0")} on ${updated.date} at ${updated.timeSlot} has been cancelled. Reason: ${cancelReason}`,
            type: "booking_cancelled",
            bookingId: updated.id,
            isRead: false,
          });
        } catch (e) {
          console.error("Failed to notify user:", e);
        }
      }
      // Void any booking coupon earned from this booking
      try {
        await storage.voidCouponByBookingId(id);
      } catch (e) {
        console.error("Failed to void booking coupon:", e);
      }
      autoQueueWaMessage(updated, "booking_cancelled");
      autoSendEmail(updated, "booking_cancelled");
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/bookings/:id/reschedule", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const id = parseInt(req.params.id);
      const { date, timeSlot } = z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        timeSlot: z.string().min(1),
      }).parse(req.body);
      const updated = await storage.rescheduleBooking(id, date, timeSlot);
      if (!updated) return res.status(404).json({ message: "Booking not found" });
      if (updated.userId) {
        try {
          const svc = await storage.getService(updated.serviceId!);
          await storage.createNotification({
            userId: updated.userId,
            title: "Booking Rescheduled",
            message: `Your booking #${updated.id.toString().padStart(4, "0")} for ${svc?.name ?? "Kayaking"} has been rescheduled to ${updated.date} at ${updated.timeSlot}.`,
            type: "booking_confirmed",
            bookingId: updated.id,
            isRead: false,
          });
        } catch (e) {
          console.error("Failed to notify user on reschedule:", e);
        }
      }
      autoQueueWaMessage(updated, "booking_rescheduled");
      autoSendEmail(updated, "booking_rescheduled");
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal server error" });
    }
  });

  // File Upload — single photo (Google Drive or local disk)
  app.post("/api/upload/photo", photoUpload.single("photo"), async (req: any, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const uploadConfig = await storage.getUploadSettings();
      const mode = uploadConfig?.storageMode || "local";

      if (mode === "drive" && uploadConfig?.googleDriveFolderId) {
        const url = await uploadToDrive(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          uploadConfig.googleDriveFolderId
        );
        return res.status(200).json({ url });
      }

      if (mode === "cpanel" && uploadConfig?.cpanelHost && uploadConfig?.cpanelUsername && uploadConfig?.cpanelPublicUrl) {
        const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
        const filename = `${randomUUID()}${ext}`;
        const url = await uploadToFtp(req.file.buffer, filename, {
          host: uploadConfig.cpanelHost!,
          username: uploadConfig.cpanelUsername!,
          password: uploadConfig.cpanelPassword!,
          port: uploadConfig.cpanelPort ?? 21,
          remotePath: uploadConfig.cpanelRemotePath || "/public_html/uploads/",
          publicUrl: uploadConfig.cpanelPublicUrl!,
        });
        return res.status(200).json({ url });
      }

      if (mode === "local") {
        const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
        const filename = `${randomUUID()}${ext}`;
        const dest = path.join(uploadsDir, filename);
        fs.writeFileSync(dest, req.file.buffer);
        return res.status(200).json({ url: `/uploads/${filename}` });
      }

      // Default: local storage
      const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
      const filename = `${randomUUID()}${ext}`;
      const dest = path.join(uploadsDir, filename);
      fs.writeFileSync(dest, req.file.buffer);
      return res.status(200).json({ url: `/uploads/${filename}` });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Upload failed" });
    }
  });

  // Update service photos array
  app.patch("/api/services/:id/photos", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const id = parseInt(req.params.id);
      const { photos } = z.object({ photos: z.array(z.string()).max(5) }).parse(req.body);
      const updated = await storage.updateServicePhotos(id, photos);
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Image proxy — fetches an external image and returns it with CORS headers
  // so the canvas in the crop modal can read pixel data without taint errors.
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || !/^https?:\/\//.test(url)) return res.status(400).json({ message: "Invalid URL" });
      const response = await fetch(url);
      if (!response.ok) return res.status(response.status).json({ message: "Upstream fetch failed" });
      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=86400");
      res.set("Access-Control-Allow-Origin", "*");
      const buf = await response.arrayBuffer();
      res.send(Buffer.from(buf));
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Proxy failed" });
    }
  });

  // Inclusions
  app.get("/api/inclusions", async (_req, res) => {
    try {
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=900");
      res.json(await storage.getInclusions());
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/inclusions", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const data = z.object({ name: z.string().min(1), icon: z.string().min(1) }).parse(req.body);
      res.status(201).json(await storage.createInclusion(data));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/inclusions/:id", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      await storage.deleteInclusion(Number(req.params.id));
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Categories
  app.get("/api/categories", async (_req, res) => {
    try {
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=900");
      res.json(await storage.getCategories());
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/categories", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const data = z.object({ name: z.string().min(1) }).parse(req.body);
      res.status(201).json(await storage.createCategory(data));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/categories/:id", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const data = z.object({ name: z.string().min(1) }).parse(req.body);
      res.json(await storage.updateCategory(Number(req.params.id), data));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/categories/:id", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      await storage.deleteCategory(Number(req.params.id));
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const notifs = await storage.getUserNotifications(userId);
      res.status(200).json(notifs.reverse());
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(200).json({ count: 0 });
      const count = await storage.getUnreadCount(userId);
      res.status(200).json({ count });
    } catch {
      res.status(200).json({ count: 0 });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      await storage.markNotificationRead(parseInt(req.params.id), userId);
      res.status(200).json({ ok: true });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteNotification(id, userId);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      await storage.markAllNotificationsRead(userId);
      res.status(200).json({ ok: true });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Coupon Settings ─────────────────────────────────────────────────────────
  app.get("/api/coupon-settings", async (_req, res) => {
    try {
      res.json(await storage.getCouponSettings());
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/coupon-settings", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const schema = z.object({
        bookingCouponEnabled: z.boolean().optional(),
        bookingCouponExpiryMonths: z.number().int().min(1).optional(),
        bookingCouponDiscountType: z.enum(["percentage", "fixed"]).optional(),
        bookingCouponDiscountValue: z.number().int().min(1).optional(),
        bookingCouponCategoryId: z.number().int().nullable().optional(),
        bookingCouponServiceId: z.number().int().nullable().optional(),
      });
      const data = schema.parse(req.body);
      res.json(await storage.updateCouponSettings(data));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Coupons ─────────────────────────────────────────────────────────────────
  app.get("/api/coupons/my", async (req: any, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const coupons = await storage.getCouponsForUser(req.session.userId);
      res.json(coupons);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/coupons", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      res.json(await storage.getCoupons());
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/coupons", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const schema = z.object({
        code: z.string().min(3).max(30).regex(/^[A-Z0-9_\-]+$/i, "Code can only contain letters, numbers, hyphens and underscores"),
        discountType: z.enum(["percentage", "fixed"]),
        discountValue: z.number().int().min(1),
        expiresAt: z.string(),
        minPax: z.number().int().min(0).default(0),
        maxUses: z.number().int().min(0).default(0),
        categoryId: z.number().int().nullable().optional(),
        serviceId: z.number().int().nullable().optional(),
      });
      const data = schema.parse(req.body);
      const existing = await storage.getCouponByCode(data.code);
      if (existing) return res.status(409).json({ message: "A coupon with this code already exists" });
      const coupon = await storage.createCoupon({
        code: data.code.toUpperCase(),
        type: "special",
        discountType: data.discountType,
        discountValue: data.discountValue,
        expiresAt: new Date(data.expiresAt),
        isActive: true,
        isUsed: false,
        usedByUserId: null,
        createdForUserId: null,
        minPax: data.minPax,
        maxUses: data.maxUses ?? 0,
        usedCount: 0,
        categoryId: data.categoryId ?? null,
        serviceId: data.serviceId ?? null,
      });
      res.status(201).json(coupon);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/coupons/:id", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      await storage.deleteCoupon(Number(req.params.id));
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Public: active special coupons shown on the booking form
  app.get("/api/coupons/public", async (req, res) => {
    try {
      const { serviceId } = z.object({ serviceId: z.string().optional() }).parse(req.query);
      const [all, referrals] = await Promise.all([storage.getCoupons(), storage.getReferrals()]);
      const referralLinkedCodes = new Set(referrals.map(r => r.linkedCouponCode).filter(Boolean) as string[]);
      const now = new Date();
      const active = all.filter(c =>
        c.type === "special" &&
        c.isActive &&
        !c.isUsed &&
        new Date(c.expiresAt) > now &&
        (c.maxUses === 0 || c.usedCount < c.maxUses) &&
        (c.serviceId == null || (serviceId && c.serviceId === parseInt(serviceId))) &&
        c.categoryId == null &&
        !referralLinkedCodes.has(c.code)
      );
      res.json(active.map(c => ({
        id: c.id,
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minPax: c.minPax,
        expiresAt: c.expiresAt,
      })));
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Validate a coupon code (used during booking on the frontend)
  app.get("/api/coupons/validate", async (req, res) => {
    try {
      const { code, serviceId } = z.object({
        code: z.string().min(1),
        serviceId: z.string().optional(),
      }).parse(req.query);
      const coupon = await storage.getCouponByCode(code);
      if (!coupon || !coupon.isActive) {
        return res.status(200).json({ valid: false, reason: "not_found", message: "Invalid coupon code" });
      }
      const isExhausted = coupon.isUsed || (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses);
      if (isExhausted) {
        const msg = coupon.maxUses > 0
          ? `This coupon has reached its limit of ${coupon.maxUses} use${coupon.maxUses === 1 ? "" : "s"}`
          : "This coupon has already been used";
        return res.status(200).json({ valid: false, reason: "used", message: msg });
      }
      const now = new Date();
      const expiresAt = new Date(coupon.expiresAt);
      if (expiresAt < now) {
        const diffMs = now.getTime() - expiresAt.getTime();
        const diffMonths = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
        const monthLabel = diffMonths === 1 ? "1 month" : `${diffMonths} months`;
        return res.status(200).json({
          valid: false,
          reason: "expired",
          message: `Coupon already expired ${monthLabel} ago`,
        });
      }
      // Check service/category restriction
      if (serviceId && coupon.serviceId) {
        if (coupon.serviceId !== Number(serviceId)) {
          return res.status(200).json({ valid: false, reason: "wrong_service", message: "This coupon is not valid for this service" });
        }
      }
      if (serviceId && coupon.categoryId && !coupon.serviceId) {
        const svc = await storage.getService(Number(serviceId));
        if (svc && svc.categoryId !== coupon.categoryId) {
          return res.status(200).json({ valid: false, reason: "wrong_category", message: "This coupon is not valid for this category of service" });
        }
      }
      return res.status(200).json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          expiresAt: coupon.expiresAt,
          type: coupon.type,
          minPax: coupon.minPax ?? 0,
          categoryId: coupon.categoryId ?? null,
          serviceId: coupon.serviceId ?? null,
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Code is required" });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Staffs ───────────────────────────────────────────────────────────────────
  app.get("/api/staffs", async (req: any, res) => {
    try {
      res.json(await storage.getStaffs());
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/staffs", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const schema = z.object({
        fullName: z.string().min(1),
        contactNumber: z.string().min(1),
        address: z.string().default(""),
        shifts: z.array(z.string()).default([]),
      });
      const data = schema.parse(req.body);
      res.status(201).json(await storage.createStaff({ ...data, isActive: true }));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/staffs/:id", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const schema = z.object({
        fullName: z.string().min(1).optional(),
        contactNumber: z.string().min(1).optional(),
        address: z.string().optional(),
        shifts: z.array(z.string()).optional(),
      });
      const data = schema.parse(req.body);
      res.json(await storage.updateStaff(Number(req.params.id), data));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/staffs/:id", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      await storage.deleteStaff(Number(req.params.id));
      res.status(204).send();
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ─── FAQs ─────────────────────────────────────────────────────────────────────
  app.get("/api/faqs", async (_req, res) => {
    try {
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=900");
      res.json(await storage.getFaqs());
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/faqs", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const schema = z.object({ summary: z.string().min(1), description: z.string().min(1), sortOrder: z.number().int().default(0) });
      const data = schema.parse(req.body);
      res.status(201).json(await storage.createFaq(data));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/faqs/:id", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const schema = z.object({ summary: z.string().min(1).optional(), description: z.string().min(1).optional(), sortOrder: z.number().int().optional() });
      const data = schema.parse(req.body);
      res.json(await storage.updateFaq(Number(req.params.id), data));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/faqs/:id", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      await storage.deleteFaq(Number(req.params.id));
      res.status(204).send();
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── WhatsApp Settings ────────────────────────────────────────────────────────
  app.get("/api/whatsapp-settings", async (req: any, res) => {
    try {
      res.json(await storage.getWhatsappSettings());
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/whatsapp-settings", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const schema = z.object({
        adminNumber: z.string().optional(),
        enabled: z.boolean().optional(),
        metaPhoneNumberId: z.string().optional(),
        metaAccessToken: z.string().optional(),
      });
      const data = schema.parse(req.body);
      res.json(await storage.updateWhatsappSettings(data));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/whatsapp-send", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const { to, message } = z.object({ to: z.string().min(5), message: z.string().min(1) }).parse(req.body);
      const settings = await storage.getWhatsappSettings();
      if (!settings.metaPhoneNumberId || !settings.metaAccessToken) {
        return res.status(400).json({ message: "Meta WhatsApp API credentials not configured. Please add Phone Number ID and Access Token in WhatsApp settings." });
      }
      const phone = to.replace(/[^\d]/g, "");
      const apiUrl = `https://graph.facebook.com/v19.0/${settings.metaPhoneNumberId}/messages`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.metaAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: message },
        }),
      });
      const data = await response.json() as any;
      if (!response.ok) {
        const errMsg = data?.error?.message || "Failed to send message via Meta API";
        return res.status(400).json({ message: errMsg });
      }
      res.json({ success: true, messageId: data.messages?.[0]?.id });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  });

  // ── WhatsApp Templates ───────────────────────────────────────────────────────
  app.get("/api/whatsapp-templates", async (req: any, res) => {
    try {
      res.json(await storage.getWhatsappTemplates());
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/whatsapp-templates/:status", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const { template } = z.object({ template: z.string().min(1) }).parse(req.body);
      res.json(await storage.upsertWhatsappTemplate(req.params.status, template));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── WhatsApp Queue ───────────────────────────────────────────────────────────
  app.get("/api/whatsapp-queue", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      res.json(await storage.getWhatsappQueue(true));
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/whatsapp-queue/:id/sent", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const id = parseInt(req.params.id);
      res.json(await storage.markWhatsappQueueItemSent(id));
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Email Settings ────────────────────────────────────────────────────────────
  app.get("/api/email-settings", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const settings = await storage.getEmailSettings();
      res.json({ ...settings, smtpPassword: settings.smtpPassword ? "••••••••" : "" });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/email-settings", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const schema = z.object({
        fromName: z.string().optional(),
        fromEmail: z.string().optional(),
        smtpHost: z.string().optional(),
        smtpPort: z.number().int().optional(),
        smtpUser: z.string().optional(),
        smtpPassword: z.string().optional(),
        smtpSecure: z.boolean().optional(),
        enabled: z.boolean().optional(),
      });
      const data = schema.parse(req.body);
      const existing = await storage.getEmailSettings();
      // Preserve existing password unless a real new one was typed
      const incoming = data.smtpPassword;
      if (!incoming || incoming === "••••••••") {
        data.smtpPassword = existing.smtpPassword; // keep unchanged
      } else {
        data.smtpPassword = incoming.replace(/\s+/g, ""); // strip spaces from App Password
      }
      const updated = await storage.updateEmailSettings(data);
      res.json({ ...updated, smtpPassword: updated.smtpPassword ? "••••••••" : "" });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/email-settings/test", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const { to } = z.object({ to: z.string().email() }).parse(req.body);
      const settings = await storage.getEmailSettings();
      if (!settings.smtpHost || !settings.fromEmail) {
        return res.status(400).json({ message: "SMTP not configured. Save settings first." });
      }
      const nodemailer = await import("nodemailer");
      const port = settings.smtpPort ?? 587;
      // Port 587 = STARTTLS (secure: false), Port 465 = SSL (secure: true)
      const secure = port === 465 ? true : false;
      const transporter = nodemailer.default.createTransport({
        host: settings.smtpHost,
        port,
        secure,
        auth: { user: settings.smtpUser, pass: (settings.smtpPassword || "").replace(/\s+/g, "") },
        tls: { rejectUnauthorized: false },
      });
      await transporter.verify();
      await transporter.sendMail({
        from: `"${settings.fromName}" <${settings.fromEmail}>`,
        to,
        subject: "Test Email — Local Goa Kayaking",
        text: "This is a test email from Local Goa Kayaking. Your email settings are working correctly!",
      });
      res.json({ success: true });
    } catch (err: any) {
      let message = err.message || "Failed to send test email";
      if (message.includes("Invalid login") || message.includes("Username and Password")) {
        message = "Authentication failed. For Gmail, use an App Password (not your regular password). Enable 2FA first, then create an App Password at myaccount.google.com/apppasswords.";
      } else if (message.includes("ECONNREFUSED") || message.includes("ECONNRESET")) {
        message = "Could not connect to SMTP server. Check the host and port settings.";
      } else if (message.includes("ETIMEDOUT")) {
        message = "Connection timed out. Verify the SMTP host and port are correct.";
      }
      res.status(400).json({ message });
    }
  });

  // ── Email Templates ───────────────────────────────────────────────────────────
  app.get("/api/email-templates", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      res.json(await storage.getEmailTemplates());
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/email-templates/:status", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const { subject, body } = z.object({ subject: z.string().min(1), body: z.string().min(1) }).parse(req.body);
      res.json(await storage.upsertEmailTemplate(req.params.status, subject, body));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Upload / Storage Settings ─────────────────────────────────────────────
  app.get("/api/upload-settings", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const settings = await storage.getUploadSettings();
      const hasCredentials = !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      res.json({ ...settings, hasCredentials });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/upload-settings", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const data = z.object({
        storageMode: z.enum(["local", "drive", "cpanel"]),
        googleDriveFolderId: z.string().optional(),
        cpanelHost: z.string().optional(),
        cpanelUsername: z.string().optional(),
        cpanelPassword: z.string().optional(),
        cpanelPort: z.number().int().min(1).max(65535).optional(),
        cpanelRemotePath: z.string().optional(),
        cpanelPublicUrl: z.string().optional(),
        adminPin: z.string().min(1),
      }).parse(req.body);

      const userId = getSessionUserId(req);
      const user = await storage.getUser(userId!);
      if (!user?.loginPin || user.loginPin.trim() !== data.adminPin.trim()) {
        return res.status(403).json({ message: "Incorrect PIN. Changes not saved." });
      }

      const { adminPin: _, ...settings } = data;
      const updated = await storage.updateUploadSettings(settings);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Chat Widget Settings ───────────────────────────────────────────────────
  app.get("/api/chat-widget-settings", async (_req, res) => {
    try {
      const settings = await storage.getChatWidgetSettings();
      res.json(settings);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/chat-widget-settings", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const data = z.object({
        whatsappEnabled: z.boolean().optional(),
        whatsappNumber: z.string().optional(),
        whatsappCorner: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]).optional(),
        whatsappMessage: z.string().optional(),
        tawkEnabled: z.boolean().optional(),
        tawkScript: z.string().optional(),
        showOnMobile: z.boolean().optional(),
      }).parse(req.body);
      const updated = await storage.updateChatWidgetSettings(data);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Database Backup ───────────────────────────────────────────────────────
  app.get("/api/admin/backup", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) return res.status(500).json({ message: "DATABASE_URL not set" });

      const date = new Date().toISOString().slice(0, 10);
      const filename = `localgoa-backup-${date}.sql`;

      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      const pg_dump = spawn("/nix/store/bgwr5i8jf8jpg75rr53rz3fqv5k8yrwp-postgresql-16.10/bin/pg_dump", [
        "--no-owner",
        "--no-acl",
        "--clean",
        "--if-exists",
        dbUrl,
      ]);

      pg_dump.stdout.pipe(res);

      pg_dump.stderr.on("data", (data: Buffer) => {
        console.error("[pg_dump stderr]", data.toString());
      });

      pg_dump.on("error", (err: Error) => {
        console.error("[pg_dump error]", err);
        if (!res.headersSent) res.status(500).json({ message: "pg_dump failed: " + err.message });
      });

      pg_dump.on("close", (code: number) => {
        if (code !== 0) console.error(`[pg_dump] exited with code ${code}`);
        if (!res.writableEnded) res.end();
      });
    } catch (err: any) {
      res.status(500).json({ message: "Backup failed: " + err.message });
    }
  });

  // ─── Reminder Settings ───────────────────────────────────────────────────────
  app.get("/api/reminder-settings", async (_req, res) => {
    try {
      res.json(await storage.getReminderSettings());
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/reminder-settings", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      res.json(await storage.updateReminderSettings(req.body));
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reminder-settings/run", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      runReminderJob();
      res.json({ message: "Reminder job triggered" });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Referrals ──────────────────────────────────────────────────────────────
  app.get("/api/referrals", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      res.json(await storage.getReferrals());
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/referrals/my-wallet", async (req: any, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const phone = user.phoneNumber || user.mobileNumber || "";
      if (!phone) return res.json(null);
      const wallet = await storage.getReferralByPhone(phone);
      res.json(wallet ?? null);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/referrals/validate", async (req, res) => {
    try {
      const code = (req.query.code as string || "").trim().toUpperCase();
      if (!code) return res.status(400).json({ valid: false, message: "No code provided" });
      const referral = await storage.getReferralByCode(code);
      if (!referral) return res.json({ valid: false, message: "Invalid referral code" });
      res.json({ valid: true, referral: { name: referral.name, code: referral.code, commissionType: referral.commissionType, commissionValue: referral.commissionValue, linkedCouponCode: referral.linkedCouponCode ?? null } });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/referrals", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const { name, code, phone, commissionType, commissionValue, linkedCouponCode } = z.object({
        name: z.string().min(1),
        code: z.string().min(2).max(30),
        phone: z.string().optional(),
        commissionType: z.enum(["fixed", "percentage"]),
        commissionValue: z.number().int().min(0),
        linkedCouponCode: z.string().optional().nullable(),
      }).parse(req.body);
      const referral = await storage.createReferral({ name, code, phone: phone ?? null, commissionType, commissionValue, linkedCouponCode: linkedCouponCode ?? null, totalPaidOut: 0 });
      res.status(201).json(referral);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/referrals/:id", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const { name, code, phone, commissionType, commissionValue, linkedCouponCode } = z.object({
        name: z.string().min(1).optional(),
        code: z.string().min(2).max(30).optional(),
        phone: z.string().optional().nullable(),
        commissionType: z.enum(["fixed", "percentage"]).optional(),
        commissionValue: z.number().int().min(0).optional(),
        linkedCouponCode: z.string().optional().nullable(),
      }).parse(req.body);
      const updated = await storage.updateReferral(parseInt(req.params.id), { name, code, phone: phone ?? undefined, commissionType, commissionValue, linkedCouponCode: linkedCouponCode ?? undefined });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/referrals/:id", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      await storage.deleteReferral(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/referrals/:id/mark-paid", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const amount = req.body?.amount !== undefined ? Number(req.body.amount) : undefined;
      const updated = await storage.markReferralPaid(parseInt(req.params.id), amount);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Visitor tracking
  app.post("/api/visitors/ping", async (req, res) => {
    try {
      const { sessionId } = z.object({ sessionId: z.string().min(1).max(64) }).parse(req.body);
      const today = new Date().toISOString().split("T")[0];
      await storage.upsertVisitorSession(sessionId, today);
      res.json({ ok: true });
    } catch {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get("/api/visitors/today", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const today = new Date().toISOString().split("T")[0];
      const { total, active } = await storage.getTodayVisitorCount(today);
      res.json({ total, active });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tide Settings
  app.get("/api/admin/tide-settings", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      res.json(await storage.getTideSettings());
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/tide-settings", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const schema = z.object({
        stormglassApiKey: z.string().optional(),
        latitude: z.string().refine(v => v === undefined || (!isNaN(parseFloat(v)) && parseFloat(v) >= -90 && parseFloat(v) <= 90), "Latitude must be a number between -90 and 90").optional(),
        longitude: z.string().refine(v => v === undefined || (!isNaN(parseFloat(v)) && parseFloat(v) >= -180 && parseFloat(v) <= 180), "Longitude must be a number between -180 and 180").optional(),
        locationName: z.string().optional(),
        showOnHome: z.boolean().optional(),
      });
      const updates = schema.parse(req.body);
      res.json(await storage.updateTideSettings(updates));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tide data proxy — fetches extremes from Stormglass for a given date
  app.get("/api/admin/tide", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const { date } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(req.query);
      const settings = await storage.getTideSettings();
      if (!settings.stormglassApiKey) {
        return res.status(400).json({ message: "Stormglass API key not configured." });
      }
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const [y, mo, d] = date.split("-").map(Number);
      const startUTC = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0) - IST_OFFSET_MS);
      const endUTC = new Date(Date.UTC(y, mo - 1, d, 23, 59, 59) - IST_OFFSET_MS);
      const start = startUTC.toISOString();
      const end = endUTC.toISOString();
      const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${settings.latitude}&lng=${settings.longitude}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
      const response = await fetch(url, {
        headers: { Authorization: settings.stormglassApiKey },
      });
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ message: `Stormglass API error: ${text}` });
      }
      type StormglassExtreme = { time: string; height: number; type: string };
      type StormglassResponse = { data: StormglassExtreme[] };
      const raw = await response.json() as StormglassResponse;
      const events = (raw?.data ?? []).map((e: StormglassExtreme) => ({
        time: e.time,
        height: typeof e.height === "number" ? e.height : parseFloat(String(e.height)),
        type: String(e.type ?? "").toUpperCase() === "HIGH" ? "HIGH" : "LOW",
      }));
      res.json({ data: events });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Accounting Routes ───────────────────────────────────────────────────

  // Account Heads
  app.get("/api/account-heads", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const heads = await storage.getAccountHeads();
    res.json(heads);
  });

  app.post("/api/account-heads", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const parsed = z.object({
      name: z.string().min(1),
      type: z.enum(["creditor", "debtor", "bank", "cash"]),
      address: z.string().optional().default(""),
      place: z.string().optional().default(""),
      openingBalance: z.number().int().optional().default(0),
      bookingMapping: z.enum(["none", "token", "balance", "both", "net"]).optional().default("none"),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    const head = await storage.createAccountHead(parsed.data);
    res.json(head);
  });

  app.patch("/api/account-heads/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const id = parseInt(req.params.id);
    const parsed = z.object({
      name: z.string().min(1).optional(),
      type: z.enum(["creditor", "debtor", "bank", "cash"]).optional(),
      address: z.string().optional(),
      place: z.string().optional(),
      openingBalance: z.number().int().optional(),
      bookingMapping: z.enum(["none", "token", "balance", "both", "net"]).optional(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const head = await storage.updateAccountHead(id, parsed.data);
    res.json(head);
  });

  app.delete("/api/account-heads/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    await storage.deleteAccountHead(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Ledger Entries
  app.get("/api/ledger-entries", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const entries = await storage.getLedgerEntries();
    res.json(entries);
  });

  app.post("/api/ledger-entries", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const parsed = z.object({
      accountHeadId: z.number().int(),
      type: z.enum(["payable", "receivable", "adjustment"]),
      amount: z.number().int().positive(),
      notes: z.string().optional().default(""),
      entryDate: z.string().min(1),
      fromAccountId: z.number().int().optional().nullable(),
      toAccountId: z.number().int().optional().nullable(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    const entry = await storage.createLedgerEntry(parsed.data);
    res.json(entry);
  });

  app.delete("/api/ledger-entries/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    await storage.deleteLedgerEntry(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // ─── App Policies ──────────────────────────────────────────────────────────

  // Public: anyone can read policies
  app.get("/api/app-policies", async (_req, res) => {
    const policies = await storage.getAppPolicies();
    res.json(policies);
  });

  // Admin: upsert a single policy
  app.put("/api/app-policies/:type", async (req, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const policyType = req.params.type;
      if (!["terms", "refund", "privacy", "return"].includes(policyType))
        return res.status(400).json({ message: "Invalid policy type" });
      const parsed = z.object({
        header: z.string().default(""),
        details: z.string().default(""),
        redirectUrl: z.string().default(""),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
      const policy = await storage.upsertAppPolicy(policyType, parsed.data);
      res.json(policy);
    } catch (e) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Manual Booking Reminders ─────────────────────────────────────────────────
  app.get("/api/manual-reminders", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      res.json(await storage.getManualReminders());
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/manual-reminders", async (req: any, res) => {
    try {
      if (!await requireAdmin(req, res)) return;
      const { bookingId } = z.object({ bookingId: z.number() }).parse(req.body);
      const booking = await storage.getBooking(bookingId);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const reminderSettings = await storage.getReminderSettings();
      const waTemplate = reminderSettings.waTemplate ||
        `Hello [Full Name]\nThis is to inform about your upcoming booking [Booking Date] - [Booking Time].\nPlease reach before booking time for smooth boarding at [Boarding Location].\n\nYour Booking assistance: [Contact Person].\n\nThank you.\nRegards`;

      const ps = await storage.getPaymentSettings();
      const service = booking.serviceId ? await storage.getService(booking.serviceId) : undefined;
      const staffs = await storage.getStaffs();
      const staff = booking.staffId ? staffs.find((s: any) => s.id === booking.staffId) : undefined;
      const serviceName = service?.name || "Kayaking";
      const staffName = (staff as any)?.fullName || "";
      const staffContact = (staff as any)?.contactNumber || "";

      const message = waTemplate
        .replace(/\[Full Name\]/g, booking.fullName || "Guest")
        .replace(/\[Service Name\]/g, serviceName)
        .replace(/\[Booking Date\]/g, booking.date || "")
        .replace(/\[Booking Time\]/g, booking.timeSlot || "")
        .replace(/\[Pax Number\]/g, String(booking.pax || ""))
        .replace(/\[Total Amount\]/g, String(booking.totalPayable || ""))
        .replace(/\[Booking ID\]/g, booking.id?.toString().padStart(4, "0") || "")
        .replace(/\[Staff Name\]/g, staffName || "—")
        .replace(/\[Staff Contact\]/g, staffContact || "—")
        .replace(/\[Boarding Location\]/g, (ps as any).boardingLocation || "")
        .replace(/\[Contact Person\]/g, (ps as any).contactPerson || (ps as any).proprietorName || "")
        .replace(/\[Google Review URL\]/g, (ps as any).googleReviewUrl || "")
        .replace(/\[Proprietor Name\]/g, (ps as any).proprietorName || "")
        .replace(/\[Proprietor Number\]/g, (ps as any).proprietorNumber || "");

      const scheduledAt = new Date(Date.now() + 60 * 60 * 1000);
      const reminder = await storage.scheduleManualReminder(bookingId, booking.contactNumber, message, scheduledAt);
      res.json(reminder);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PhonePe payment routes
  registerPhonePeRoutes(app, autoQueueWaMessage);

  return httpServer;
}
