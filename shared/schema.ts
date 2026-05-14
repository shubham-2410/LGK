import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  mobileNumber: text("mobile_number").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  fullName: text("full_name"),
  phoneNumber: text("phone_number"),
  whatsappNumber: text("whatsapp_number"),
  email: text("email"),
  dateOfBirth: text("date_of_birth"),
  username: text("username"),
  loginPin: text("login_pin"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  mrpPrice: integer("mrp_price"),
  priceType: text("price_type").default("pax"),
  imageUrl: text("image_url"),
  duration: text("duration").default("2 Hours"),
  ageGroup: text("age_group").default("All Ages"),
  timeSlots: text("time_slots").array().default(["06:00 AM", "08:30 AM", "04:00 PM", "05:30 PM"]),
  isActive: boolean("is_active").default(true),
  photos: text("photos").array().default([]),
  inclusionIds: integer("inclusion_ids").array().default([]),
  minPax: integer("min_pax").notNull().default(0),
  categoryId: integer("category_id"),
  checkInTime: text("check_in_time"),
  checkOutTime: text("check_out_time"),
  bedrooms: integer("bedrooms").default(0),
  adultOccupancy: integer("adult_occupancy").default(0),
  kidsOccupancy: integer("kids_occupancy").default(0),
  bookingType: text("booking_type").default("online"),
  manualWaNumber: text("manual_wa_number"),
  manualEmail: text("manual_email"),
  videoUrl: text("video_url"),
  gstPercent: integer("gst_percent").default(0),
  gstMode: text("gst_mode").default("exclusive"),
  displaySequence: integer("display_sequence"),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").default(true),
  expiresAt: text("expires_at"),
});

export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default("Local Goa Kayaking"),
  upiLink: text("upi_link").notNull().default(""),
  successMessage: text("success_message").notNull().default("Thank you! Your booking is confirmed. We'll see you on the water!"),
  failedMessage: text("failed_message").notNull().default("Payment could not be confirmed. Please contact us for assistance."),
  siteUrl: text("site_url").default(""),
  seoKeywords: text("seo_keywords").array().default([]),
  boardingLocation: text("boarding_location").default(""),
  boardingPassTerms: text("boarding_pass_terms").default(""),
  boardingPassDisclaimer: text("boarding_pass_disclaimer").default(""),
  googleReviewUrl: text("google_review_url").default(""),
  proprietorName: text("proprietor_name").default(""),
  proprietorNumber: text("proprietor_number").default(""),
  gstNumber: text("gst_number").notNull().default(""),
  registeredBusinessName: text("registered_business_name").notNull().default(""),
  businessAddress: text("business_address").notNull().default(""),
  contactPerson: text("contact_person").notNull().default(""),
  contactNumber: text("contact_number").notNull().default(""),
  boardingMessage: text("boarding_message").notNull().default(""),
  paymentMode: text("payment_mode").notNull().default("manual"),
  phonePeClientId: text("phonepe_client_id").notNull().default(""),
  phonePeClientSecret: text("phonepe_client_secret").notNull().default(""),
  phonePeClientVersion: integer("phonepe_client_version").notNull().default(1),
  phonePeEnv: text("phonepe_env").notNull().default("sandbox"),
  phonePeWebhookUsername: text("phonepe_webhook_username").notNull().default(""),
  phonePeWebhookPassword: text("phonepe_webhook_password").notNull().default(""),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  serviceId: integer("service_id").references(() => services.id),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  fullName: text("full_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
  pax: integer("pax").notNull(),
  totalPayable: integer("total_payable").notNull(),
  amountPaid: integer("amount_paid").notNull(),
  balance: integer("balance").notNull(),
  status: text("status").notNull().default("pending"),
  cancelReason: text("cancel_reason"),
  couponCode: text("coupon_code"),
  couponDiscount: integer("coupon_discount").default(0),
  staffId: integer("staff_id"),
  whatsappConsent: boolean("whatsapp_consent").notNull().default(true),
  referralCode: text("referral_code"),
  referralCommission: integer("referral_commission").default(0),
  transactionId: text("transaction_id"),
  gstAmount: integer("gst_amount").default(0),
  cgstAmount: integer("cgst_amount").default(0),
  sgstAmount: integer("sgst_amount").default(0),
  settlementAmount: integer("settlement_amount"),
  isSettled: boolean("is_settled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inclusions = pgTable("inclusions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("Star"),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  type: text("type").notNull(),
  bookingId: integer("booking_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const couponSettings = pgTable("coupon_settings", {
  id: serial("id").primaryKey(),
  bookingCouponEnabled: boolean("booking_coupon_enabled").default(false),
  bookingCouponExpiryMonths: integer("booking_coupon_expiry_months").default(3),
  bookingCouponDiscountType: text("booking_coupon_discount_type").default("percentage"),
  bookingCouponDiscountValue: integer("booking_coupon_discount_value").default(10),
  bookingCouponCategoryId: integer("booking_coupon_category_id"),
  bookingCouponServiceId: integer("booking_coupon_service_id"),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  discountType: text("discount_type").notNull().default("percentage"),
  discountValue: integer("discount_value").notNull().default(10),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  isUsed: boolean("is_used").default(false),
  usedByUserId: integer("used_by_user_id"),
  createdForUserId: integer("created_for_user_id"),
  minPax: integer("min_pax").notNull().default(0),
  categoryId: integer("category_id"),
  serviceId: integer("service_id"),
  earnedFromBookingId: integer("earned_from_booking_id"),
  maxUses: integer("max_uses").notNull().default(0),
  usedCount: integer("used_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const staffs = pgTable("staffs", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  address: text("address").notNull().default(""),
  shifts: text("shifts").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertBannerSchema = createInsertSchema(banners).omit({ id: true });
export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertInclusionSchema = createInsertSchema(inclusions).omit({ id: true });
export const insertCouponSettingsSchema = createInsertSchema(couponSettings).omit({ id: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;

export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Inclusion = typeof inclusions.$inferSelect;
export type InsertInclusion = z.infer<typeof insertInclusionSchema>;

export type CouponSettings = typeof couponSettings.$inferSelect;
export type InsertCouponSettings = z.infer<typeof insertCouponSettingsSchema>;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export const insertFaqSchema = createInsertSchema(faqs).omit({ id: true, createdAt: true });
export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;

export const insertStaffSchema = createInsertSchema(staffs).omit({ id: true, createdAt: true });
export type Staff = typeof staffs.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  phone: text("phone"),
  commissionType: text("commission_type").notNull().default("fixed"),
  commissionValue: integer("commission_value").notNull().default(0),
  totalPaidOut: integer("total_paid_out").notNull().default(0),
  linkedCouponCode: text("linked_coupon_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

export const whatsappSettings = pgTable("whatsapp_settings", {
  id: serial("id").primaryKey(),
  adminNumber: text("admin_number").notNull().default(""),
  enabled: boolean("enabled").notNull().default(true),
  metaPhoneNumberId: text("meta_phone_number_id").default(""),
  metaAccessToken: text("meta_access_token").default(""),
});

export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().unique(),
  template: text("template").notNull(),
});

export const whatsappQueue = pgTable("whatsapp_queue", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerName: text("customer_name").notNull().default(""),
  templateKey: text("template_key").notNull(),
  message: text("message").notNull(),
  isSent: boolean("is_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailSettings = pgTable("email_settings", {
  id: serial("id").primaryKey(),
  fromName: text("from_name").notNull().default("Local Goa Kayaking"),
  fromEmail: text("from_email").notNull().default(""),
  smtpHost: text("smtp_host").notNull().default(""),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpUser: text("smtp_user").notNull().default(""),
  smtpPassword: text("smtp_password").notNull().default(""),
  smtpSecure: boolean("smtp_secure").notNull().default(false),
  enabled: boolean("enabled").notNull().default(false),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().unique(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({ id: true });
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true });
export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export const insertWhatsappSettingsSchema = createInsertSchema(whatsappSettings).omit({ id: true });
export const insertWhatsappTemplateSchema = createInsertSchema(whatsappTemplates).omit({ id: true });
export const insertWhatsappQueueSchema = createInsertSchema(whatsappQueue).omit({ id: true, createdAt: true });

export type WhatsappSettings = typeof whatsappSettings.$inferSelect;
export type InsertWhatsappSettings = z.infer<typeof insertWhatsappSettingsSchema>;
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = z.infer<typeof insertWhatsappTemplateSchema>;
export type WhatsappQueueItem = typeof whatsappQueue.$inferSelect;
export type InsertWhatsappQueueItem = z.infer<typeof insertWhatsappQueueSchema>;

export const uploadSettings = pgTable("upload_settings", {
  id: serial("id").primaryKey(),
  googleDriveFolderId: text("google_drive_folder_id").default(""),
  storageMode: text("storage_mode").default("replit"),
  cpanelHost: text("cpanel_host").default(""),
  cpanelUsername: text("cpanel_username").default(""),
  cpanelPassword: text("cpanel_password").default(""),
  cpanelPort: integer("cpanel_port").default(21),
  cpanelRemotePath: text("cpanel_remote_path").default("/public_html/uploads/"),
  cpanelPublicUrl: text("cpanel_public_url").default(""),
});
export type UploadSettings = typeof uploadSettings.$inferSelect;

export type ReminderOffset = {
  id: string;
  label: string;
  value: number;
  unit: "days" | "hours";
  enabled: boolean;
};

export const reminderSettings = pgTable("reminder_settings", {
  id: serial("id").primaryKey(),
  reminders: jsonb("reminders").$type<ReminderOffset[]>().default([]),
  emailEnabled: boolean("email_enabled").notNull().default(false),
  waEnabled: boolean("wa_enabled").notNull().default(false),
  emailSubject: text("email_subject").notNull().default("Reminder: Your upcoming trip with Local Goa Kayaking"),
  emailBody: text("email_body").notNull().default(""),
  waTemplate: text("wa_template").notNull().default(""),
  reviewEnabled: boolean("review_enabled").notNull().default(false),
  reviewAfterValue: integer("review_after_value").notNull().default(24),
  reviewAfterUnit: text("review_after_unit").notNull().default("hours"),
  reviewTriggers: jsonb("review_triggers").$type<ReminderOffset[]>().default([]),
  reviewEmailSubject: text("review_email_subject").notNull().default("How was your experience? — Local Goa Kayaking"),
  reviewEmailBody: text("review_email_body").notNull().default(""),
  reviewWaTemplate: text("review_wa_template").notNull().default(""),
});

export const sentReminders = pgTable("sent_reminders", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  reminderKey: text("reminder_key").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const insertReminderSettingsSchema = createInsertSchema(reminderSettings).omit({ id: true });
export type ReminderSettings = typeof reminderSettings.$inferSelect;
export type InsertReminderSettings = z.infer<typeof insertReminderSettingsSchema>;

export const visitorSessions = pgTable("visitor_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatWidgetSettings = pgTable("chat_widget_settings", {
  id: serial("id").primaryKey(),
  whatsappEnabled: boolean("whatsapp_enabled").notNull().default(false),
  whatsappNumber: text("whatsapp_number").notNull().default(""),
  whatsappCorner: text("whatsapp_corner").notNull().default("bottom-right"),
  whatsappMessage: text("whatsapp_message").notNull().default(""),
  tawkEnabled: boolean("tawk_enabled").notNull().default(false),
  tawkScript: text("tawk_script").notNull().default(""),
  showOnMobile: boolean("show_on_mobile").notNull().default(true),
});

export const insertChatWidgetSettingsSchema = createInsertSchema(chatWidgetSettings).omit({ id: true });
export type ChatWidgetSettings = typeof chatWidgetSettings.$inferSelect;
export type InsertChatWidgetSettings = z.infer<typeof insertChatWidgetSettingsSchema>;

export const tideSettings = pgTable("tide_settings", {
  id: serial("id").primaryKey(),
  stormglassApiKey: text("stormglass_api_key").notNull().default(""),
  latitude: text("latitude").notNull().default("15.2736"),
  longitude: text("longitude").notNull().default("73.9296"),
  locationName: text("location_name").notNull().default("Colva, Goa"),
  showOnHome: boolean("show_on_home").notNull().default(true),
});

export const insertTideSettingsSchema = createInsertSchema(tideSettings).omit({ id: true });
export type TideSettings = typeof tideSettings.$inferSelect;
export type InsertTideSettings = z.infer<typeof insertTideSettingsSchema>;

// ─── App Policies ─────────────────────────────────────────────────────────────

export const appPolicies = pgTable("app_policies", {
  id: serial("id").primaryKey(),
  policyType: text("policy_type").notNull().unique(), // 'terms' | 'refund' | 'privacy' | 'return'
  header: text("header").notNull().default(""),
  details: text("details").notNull().default(""),
  redirectUrl: text("redirect_url").notNull().default(""),
});

export const insertAppPolicySchema = createInsertSchema(appPolicies).omit({ id: true });
export type AppPolicy = typeof appPolicies.$inferSelect;
export type InsertAppPolicy = z.infer<typeof insertAppPolicySchema>;

// ─── Accounting ───────────────────────────────────────────────────────────────

export const accountHeads = pgTable("account_heads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "creditor" | "debtor" | "bank" | "cash"
  address: text("address").default(""),
  place: text("place").default(""),
  openingBalance: integer("opening_balance").default(0),
  bookingMapping: text("booking_mapping").default("none"), // "none" | "token" | "balance" | "both"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccountHeadSchema = createInsertSchema(accountHeads).omit({ id: true, createdAt: true });
export type AccountHead = typeof accountHeads.$inferSelect;
export type InsertAccountHead = z.infer<typeof insertAccountHeadSchema>;

export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  accountHeadId: integer("account_head_id").notNull().references(() => accountHeads.id),
  type: text("type").notNull(), // "payable" | "receivable" | "adjustment"
  amount: integer("amount").notNull(),
  notes: text("notes").default(""),
  entryDate: text("entry_date").notNull(),
  fromAccountId: integer("from_account_id"), // payable: bank/cash paying; adjustment: from
  toAccountId: integer("to_account_id"),     // adjustment: to account
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({ id: true, createdAt: true });
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;

export const bookingManualReminders = pgTable("booking_manual_reminders", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  isSent: boolean("is_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
export type BookingManualReminder = typeof bookingManualReminders.$inferSelect;
