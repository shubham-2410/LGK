import {
  users, services, banners, bookings, paymentSettings, notifications, inclusions, couponSettings, coupons, faqs, staffs,
  whatsappSettings, whatsappTemplates, whatsappQueue,
  emailSettings, emailTemplates, uploadSettings, categories,
  reminderSettings, sentReminders, referrals, visitorSessions, chatWidgetSettings, tideSettings,
  accountHeads, ledgerEntries, appPolicies, bookingManualReminders,
  type User, type InsertUser, type Service, type InsertService,
  type Banner, type InsertBanner, type Booking, type InsertBooking,
  type PaymentSettings, type InsertPaymentSettings,
  type Notification, type InsertNotification,
  type Inclusion, type InsertInclusion,
  type CouponSettings, type InsertCouponSettings,
  type Coupon, type InsertCoupon,
  type Faq, type InsertFaq,
  type Staff, type InsertStaff,
  type WhatsappSettings, type InsertWhatsappSettings,
  type WhatsappTemplate, type InsertWhatsappTemplate,
  type WhatsappQueueItem, type InsertWhatsappQueueItem,
  type EmailSettings, type InsertEmailSettings,
  type EmailTemplate, type UploadSettings,
  type Category, type InsertCategory,
  type ReminderSettings, type InsertReminderSettings,
  type Referral, type InsertReferral,
  type ChatWidgetSettings, type InsertChatWidgetSettings,
  type TideSettings, type InsertTideSettings,
  type AccountHead, type InsertAccountHead,
  type LedgerEntry, type InsertLedgerEntry,
  type AppPolicy, type InsertAppPolicy,
  type BookingManualReminder,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, lte, SQL, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByMobile(mobileNumber: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAdminUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, updates: Partial<User>): Promise<User>;

  // Services
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, updates: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Banners
  getBanners(): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, updates: Partial<InsertBanner>): Promise<Banner>;
  deleteBanner(id: number): Promise<void>;

  // Payment Settings
  getPaymentSettings(): Promise<PaymentSettings>;
  updatePaymentSettings(updates: Partial<InsertPaymentSettings>): Promise<PaymentSettings>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getUserBookings(userId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  cancelBooking(id: number, cancelReason: string): Promise<Booking | undefined>;
  confirmBooking(id: number, staffId?: number | null): Promise<Booking | undefined>;
  rescheduleBooking(id: number, date: string, timeSlot: string): Promise<Booking | undefined>;
  deleteBulkBookings(filters: { status?: string; beforeDate?: string; exactDate?: string; nameContains?: string }): Promise<number>;
  updateBookingStatus(id: number, newStatus: string): Promise<Booking | undefined>;
  updateBookingSettlement(id: number, settlementAmount: number | null, isSettled: boolean): Promise<Booking | undefined>;
  bulkUpdateBookingStatus(filters: { status?: string; beforeDate?: string; exactDate?: string; nameContains?: string }, newStatus: string): Promise<number>;
  autoCompleteBookings(): Promise<Booking[]>;
  updateServicePhotos(id: number, photos: string[]): Promise<Service>;

  // Inclusions
  getInclusions(): Promise<Inclusion[]>;
  createInclusion(data: InsertInclusion): Promise<Inclusion>;
  deleteInclusion(id: number): Promise<void>;

  // Notifications
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  deleteNotification(id: number, userId: number): Promise<void>;
  markNotificationRead(id: number, userId: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;
  getUnreadCount(userId: number): Promise<number>;

  // Coupon Settings
  getCouponSettings(): Promise<CouponSettings>;
  updateCouponSettings(updates: Partial<InsertCouponSettings>): Promise<CouponSettings>;

  // Coupons
  getCoupons(): Promise<Coupon[]>;
  getCouponsForUser(userId: number): Promise<Coupon[]>;
  getCoupon(id: number): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  markCouponUsed(id: number, usedByUserId: number): Promise<Coupon>;
  getCouponByBookingId(bookingId: number): Promise<Coupon | undefined>;
  hasActiveCouponBooking(contactNumber: string, couponCode: string): Promise<boolean>;
  voidCouponByBookingId(bookingId: number): Promise<void>;
  deleteCoupon(id: number): Promise<void>;

  // FAQs
  getFaqs(): Promise<Faq[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: number, updates: Partial<InsertFaq>): Promise<Faq>;
  deleteFaq(id: number): Promise<void>;

  // Staffs
  getStaffs(): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: number, updates: Partial<InsertStaff>): Promise<Staff>;
  deleteStaff(id: number): Promise<void>;

  // WhatsApp
  getWhatsappSettings(): Promise<WhatsappSettings>;
  updateWhatsappSettings(updates: Partial<InsertWhatsappSettings>): Promise<WhatsappSettings>;
  getWhatsappTemplates(): Promise<WhatsappTemplate[]>;
  upsertWhatsappTemplate(status: string, template: string): Promise<WhatsappTemplate>;

  // WhatsApp Queue
  getWhatsappQueue(onlyUnsent?: boolean): Promise<WhatsappQueueItem[]>;
  addToWhatsappQueue(item: InsertWhatsappQueueItem): Promise<WhatsappQueueItem>;
  markWhatsappQueueItemSent(id: number): Promise<WhatsappQueueItem>;

  // Email
  getEmailSettings(): Promise<EmailSettings>;
  updateEmailSettings(updates: Partial<InsertEmailSettings>): Promise<EmailSettings>;
  getEmailTemplates(): Promise<EmailTemplate[]>;
  upsertEmailTemplate(status: string, subject: string, body: string): Promise<EmailTemplate>;

  // Upload Settings
  getUploadSettings(): Promise<UploadSettings>;
  updateUploadSettings(updates: Partial<Omit<UploadSettings, "id">>): Promise<UploadSettings>;

  // Chat Widget Settings
  getChatWidgetSettings(): Promise<ChatWidgetSettings>;
  updateChatWidgetSettings(updates: Partial<InsertChatWidgetSettings>): Promise<ChatWidgetSettings>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Reminder Settings
  getReminderSettings(): Promise<ReminderSettings>;
  updateReminderSettings(updates: Partial<InsertReminderSettings>): Promise<ReminderSettings>;
  hasReminderBeenSent(bookingId: number, reminderKey: string): Promise<boolean>;
  markReminderSent(bookingId: number, reminderKey: string): Promise<void>;

  // Manual Reminders
  scheduleManualReminder(bookingId: number, phone: string, message: string, scheduledAt: Date): Promise<BookingManualReminder>;
  getManualReminders(): Promise<BookingManualReminder[]>;
  getManualReminderForBooking(bookingId: number): Promise<BookingManualReminder | undefined>;
  getPendingManualReminders(): Promise<BookingManualReminder[]>;
  markManualReminderSent(id: number): Promise<void>;

  // Referrals
  getReferrals(): Promise<(Referral & { confirmedCount: number; totalEarned: number; pendingAmount: number })[]>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  getReferralByPhone(phone: string): Promise<(Referral & { confirmedCount: number; totalEarned: number; pendingAmount: number }) | undefined>;
  createReferral(data: InsertReferral): Promise<Referral>;
  updateReferral(id: number, data: Partial<Pick<InsertReferral, "name" | "code" | "phone" | "commissionType" | "commissionValue" | "linkedCouponCode">>): Promise<Referral>;
  deleteReferral(id: number): Promise<void>;
  markReferralPaid(id: number, amount?: number): Promise<Referral>;

  // Visitor Sessions
  upsertVisitorSession(sessionId: string, date: string): Promise<void>;
  getTodayVisitorCount(date: string): Promise<{ total: number; active: number }>;

  // Tide Settings
  getTideSettings(): Promise<TideSettings>;
  updateTideSettings(updates: Partial<InsertTideSettings>): Promise<TideSettings>;

  // Accounting — Account Heads
  getAccountHeads(): Promise<AccountHead[]>;
  getAccountHead(id: number): Promise<AccountHead | undefined>;
  createAccountHead(data: InsertAccountHead): Promise<AccountHead>;
  updateAccountHead(id: number, data: Partial<InsertAccountHead>): Promise<AccountHead>;
  deleteAccountHead(id: number): Promise<void>;

  // Accounting — Ledger Entries
  getLedgerEntries(): Promise<LedgerEntry[]>;
  getLedgerEntriesByAccount(accountHeadId: number): Promise<LedgerEntry[]>;
  createLedgerEntry(data: InsertLedgerEntry): Promise<LedgerEntry>;
  deleteLedgerEntry(id: number): Promise<void>;

  // App Policies
  getAppPolicies(): Promise<AppPolicy[]>;
  upsertAppPolicy(policyType: string, data: Omit<InsertAppPolicy, "policyType">): Promise<AppPolicy>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByMobile(mobileNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.mobileNumber, mobileNumber));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isAdmin, true));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserProfile(id: number, updates: Partial<User>): Promise<User> {
    const { id: _id, isAdmin: _role, mobileNumber: _mobile, ...safeUpdates } = updates as any;
    const [updated] = await db.update(users).set(safeUpdates).where(eq(users.id, id)).returning();
    return updated;
  }

  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [created] = await db.insert(services).values(service).returning();
    return created;
  }

  async updateService(id: number, updates: Partial<InsertService>): Promise<Service> {
    const [updated] = await db.update(services).set(updates).where(eq(services.id, id)).returning();
    return updated;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getBanners(): Promise<Banner[]> {
    return await db.select().from(banners);
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const [created] = await db.insert(banners).values(banner).returning();
    return created;
  }

  async updateBanner(id: number, updates: Partial<InsertBanner>): Promise<Banner> {
    const [updated] = await db.update(banners).set(updates).where(eq(banners.id, id)).returning();
    return updated;
  }

  async deleteBanner(id: number): Promise<void> {
    await db.delete(banners).where(eq(banners.id, id));
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    const [settings] = await db.select().from(paymentSettings).where(eq(paymentSettings.id, 1));
    if (!settings) {
      const [created] = await db.insert(paymentSettings).values({
        companyName: "Local Goa Kayaking",
        upiLink: "",
        successMessage: "Thank you! Your booking is confirmed. We'll see you on the water!",
        failedMessage: "Payment could not be confirmed. Please contact us for assistance.",
      }).returning();
      return created;
    }
    return settings;
  }

  async updatePaymentSettings(updates: Partial<InsertPaymentSettings>): Promise<PaymentSettings> {
    const [updated] = await db
      .update(paymentSettings)
      .set(updates)
      .where(eq(paymentSettings.id, 1))
      .returning();
    if (!updated) {
      const [created] = await db.insert(paymentSettings).values({
        companyName: updates.companyName ?? "Local Goa Kayaking",
        upiLink: updates.upiLink ?? "",
        successMessage: updates.successMessage ?? "Thank you! Your booking is confirmed.",
        failedMessage: updates.failedMessage ?? "Payment failed. Please contact us.",
      }).returning();
      return created;
    }
    return updated;
  }

  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [created] = await db.insert(bookings).values(booking).returning();
    return created;
  }

  async cancelBooking(id: number, cancelReason: string): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set({ status: "cancelled", cancelReason })
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }

  async confirmBooking(id: number, staffId?: number | null): Promise<Booking | undefined> {
    const setData: any = { status: "confirmed" };
    if (staffId != null) setData.staffId = staffId;
    const [updated] = await db.update(bookings).set(setData).where(eq(bookings.id, id)).returning();
    return updated;
  }

  async rescheduleBooking(id: number, date: string, timeSlot: string): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set({ date, timeSlot })
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }

  async deleteBulkBookings(filters: { status?: string; beforeDate?: string; exactDate?: string; nameContains?: string }): Promise<number> {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(bookings.status, filters.status));
    if (filters.exactDate) conditions.push(eq(bookings.date, filters.exactDate));
    else if (filters.beforeDate) conditions.push(lte(bookings.date, filters.beforeDate));
    if (filters.nameContains) conditions.push(like(bookings.fullName, `%${filters.nameContains}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const deleted = where
      ? await db.delete(bookings).where(where).returning()
      : await db.delete(bookings).returning();
    return deleted.length;
  }

  async updateBookingStatus(id: number, newStatus: string): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings).set({ status: newStatus }).where(eq(bookings.id, id)).returning();
    return updated;
  }

  async updateBookingSettlement(id: number, settlementAmount: number | null, isSettled: boolean): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings).set({ settlementAmount, isSettled }).where(eq(bookings.id, id)).returning();
    return updated;
  }

  async bulkUpdateBookingStatus(filters: { status?: string; beforeDate?: string; exactDate?: string; nameContains?: string }, newStatus: string): Promise<number> {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(bookings.status, filters.status));
    if (filters.exactDate) conditions.push(eq(bookings.date, filters.exactDate));
    else if (filters.beforeDate) conditions.push(lte(bookings.date, filters.beforeDate));
    if (filters.nameContains) conditions.push(like(bookings.fullName, `%${filters.nameContains}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const updated = where
      ? await db.update(bookings).set({ status: newStatus }).where(where).returning()
      : await db.update(bookings).set({ status: newStatus }).returning();
    return updated.length;
  }

  async autoCompleteBookings(): Promise<Booking[]> {
    const todayISO = new Date().toISOString().slice(0, 10);
    const updated = await db
      .update(bookings)
      .set({ status: "completed" })
      .where(and(eq(bookings.status, "confirmed"), sql`${bookings.date} < ${todayISO}`))
      .returning();
    return updated;
  }

  async getCouponByBookingId(bookingId: number): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.earnedFromBookingId, bookingId));
    return coupon;
  }

  async hasActiveCouponBooking(contactNumber: string, couponCode: string): Promise<boolean> {
    const [row] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.contactNumber, contactNumber),
          eq(bookings.couponCode, couponCode),
          sql`${bookings.status} IN ('pending', 'confirmed')`
        )
      )
      .limit(1);
    return !!row;
  }

  async updateServicePhotos(id: number, photos: string[]): Promise<Service> {
    const [updated] = await db.update(services).set({ photos }).where(eq(services.id, id)).returning();
    return updated;
  }

  async getInclusions(): Promise<Inclusion[]> {
    return await db.select().from(inclusions);
  }

  async createInclusion(data: InsertInclusion): Promise<Inclusion> {
    const [created] = await db.insert(inclusions).values(data).returning();
    return created;
  }

  async deleteInclusion(id: number): Promise<void> {
    await db.delete(inclusions).where(eq(inclusions.id, id));
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async deleteNotification(id: number, userId: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async markNotificationRead(id: number, userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadCount(userId: number): Promise<number> {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    return rows.filter(n => !n.isRead).length;
  }

  async getCouponSettings(): Promise<CouponSettings> {
    const [settings] = await db.select().from(couponSettings).where(eq(couponSettings.id, 1));
    if (!settings) {
      const [created] = await db.insert(couponSettings).values({
        bookingCouponEnabled: false,
        bookingCouponExpiryMonths: 3,
        bookingCouponDiscountType: "percentage",
        bookingCouponDiscountValue: 10,
      }).returning();
      return created;
    }
    return settings;
  }

  async updateCouponSettings(updates: Partial<InsertCouponSettings>): Promise<CouponSettings> {
    const existing = await this.getCouponSettings();
    const [updated] = await db
      .update(couponSettings)
      .set(updates)
      .where(eq(couponSettings.id, existing.id))
      .returning();
    return updated;
  }

  async getCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).orderBy(coupons.createdAt);
  }

  async getCouponsForUser(userId: number): Promise<Coupon[]> {
    return await db.select().from(coupons)
      .where(eq(coupons.createdForUserId, userId))
      .orderBy(coupons.createdAt);
  }

  async getCoupon(id: number): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase()));
    return coupon;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [created] = await db.insert(coupons).values({
      ...coupon,
      code: coupon.code.toUpperCase(),
    }).returning();
    return created;
  }

  async markCouponUsed(id: number, usedByUserId: number): Promise<Coupon> {
    const [current] = await db.select().from(coupons).where(eq(coupons.id, id));
    if (!current) throw new Error("Coupon not found");
    const newUsedCount = (current.usedCount ?? 0) + 1;
    const shouldSetIsUsed =
      current.type === "booking" ||
      (current.maxUses > 0 && newUsedCount >= current.maxUses);
    const [updated] = await db
      .update(coupons)
      .set({ usedCount: newUsedCount, isUsed: shouldSetIsUsed || current.isUsed, usedByUserId })
      .where(eq(coupons.id, id))
      .returning();
    return updated;
  }

  async voidCouponByBookingId(bookingId: number): Promise<void> {
    await db.update(coupons).set({ isActive: false }).where(eq(coupons.earnedFromBookingId, bookingId));
  }

  async deleteCoupon(id: number): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async getFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs).orderBy(faqs.sortOrder, faqs.createdAt);
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const [created] = await db.insert(faqs).values(faq).returning();
    return created;
  }

  async updateFaq(id: number, updates: Partial<InsertFaq>): Promise<Faq> {
    const [updated] = await db.update(faqs).set(updates).where(eq(faqs.id, id)).returning();
    return updated;
  }

  async deleteFaq(id: number): Promise<void> {
    await db.delete(faqs).where(eq(faqs.id, id));
  }

  async getStaffs(): Promise<Staff[]> {
    return await db.select().from(staffs).where(eq(staffs.isActive, true)).orderBy(staffs.fullName);
  }

  async createStaff(staff: InsertStaff): Promise<Staff> {
    const [created] = await db.insert(staffs).values(staff).returning();
    return created;
  }

  async updateStaff(id: number, updates: Partial<InsertStaff>): Promise<Staff> {
    const [updated] = await db.update(staffs).set(updates).where(eq(staffs.id, id)).returning();
    return updated;
  }

  async deleteStaff(id: number): Promise<void> {
    await db.update(staffs).set({ isActive: false }).where(eq(staffs.id, id));
  }

  async getWhatsappSettings(): Promise<WhatsappSettings> {
    const [row] = await db.select().from(whatsappSettings).where(eq(whatsappSettings.id, 1));
    if (row) return row;
    const [created] = await db.insert(whatsappSettings).values({ adminNumber: "", enabled: true }).returning();
    return created;
  }

  async updateWhatsappSettings(updates: Partial<InsertWhatsappSettings>): Promise<WhatsappSettings> {
    const [updated] = await db.update(whatsappSettings).set(updates).where(eq(whatsappSettings.id, 1)).returning();
    return updated;
  }

  async getWhatsappTemplates(): Promise<WhatsappTemplate[]> {
    return await db.select().from(whatsappTemplates);
  }

  async upsertWhatsappTemplate(status: string, template: string): Promise<WhatsappTemplate> {
    const existing = await db.select().from(whatsappTemplates).where(eq(whatsappTemplates.status, status));
    if (existing.length > 0) {
      const [updated] = await db.update(whatsappTemplates).set({ template }).where(eq(whatsappTemplates.status, status)).returning();
      return updated;
    }
    const [created] = await db.insert(whatsappTemplates).values({ status, template }).returning();
    return created;
  }

  async getWhatsappQueue(onlyUnsent = true): Promise<WhatsappQueueItem[]> {
    if (onlyUnsent) {
      return await db.select().from(whatsappQueue).where(eq(whatsappQueue.isSent, false));
    }
    return await db.select().from(whatsappQueue);
  }

  async addToWhatsappQueue(item: InsertWhatsappQueueItem): Promise<WhatsappQueueItem> {
    const [created] = await db.insert(whatsappQueue).values(item).returning();
    return created;
  }

  async markWhatsappQueueItemSent(id: number): Promise<WhatsappQueueItem> {
    const [updated] = await db.update(whatsappQueue).set({ isSent: true }).where(eq(whatsappQueue.id, id)).returning();
    return updated;
  }

  async getEmailSettings(): Promise<EmailSettings> {
    const [row] = await db.select().from(emailSettings).where(eq(emailSettings.id, 1));
    if (row) return row;
    const [created] = await db.insert(emailSettings).values({ fromName: "Local Goa Kayaking", fromEmail: "", smtpHost: "", smtpPort: 587, smtpUser: "", smtpPassword: "", smtpSecure: false, enabled: false }).returning();
    return created;
  }

  async updateEmailSettings(updates: Partial<InsertEmailSettings>): Promise<EmailSettings> {
    const existing = await this.getEmailSettings();
    const [updated] = await db.update(emailSettings).set(updates).where(eq(emailSettings.id, existing.id)).returning();
    return updated;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return db.select().from(emailTemplates);
  }

  async upsertEmailTemplate(status: string, subject: string, body: string): Promise<EmailTemplate> {
    const existing = await db.select().from(emailTemplates).where(eq(emailTemplates.status, status));
    if (existing.length > 0) {
      const [updated] = await db.update(emailTemplates).set({ subject, body }).where(eq(emailTemplates.status, status)).returning();
      return updated;
    }
    const [created] = await db.insert(emailTemplates).values({ status, subject, body }).returning();
    return created;
  }

  async getUploadSettings(): Promise<UploadSettings> {
    const [row] = await db.select().from(uploadSettings).where(eq(uploadSettings.id, 1));
    if (row) return row;
    const [created] = await db.insert(uploadSettings).values({ id: 1, googleDriveFolderId: "", storageMode: "local" }).returning();
    return created;
  }

  async updateUploadSettings(updates: Partial<Omit<UploadSettings, "id">>): Promise<UploadSettings> {
    const [updated] = await db.update(uploadSettings).set(updates).where(eq(uploadSettings.id, 1)).returning();
    return updated;
  }

  async getChatWidgetSettings(): Promise<ChatWidgetSettings> {
    const [row] = await db.select().from(chatWidgetSettings).where(eq(chatWidgetSettings.id, 1));
    if (row) return row;
    const [created] = await db.insert(chatWidgetSettings).values({ id: 1 }).returning();
    return created;
  }

  async updateChatWidgetSettings(updates: Partial<InsertChatWidgetSettings>): Promise<ChatWidgetSettings> {
    await this.getChatWidgetSettings();
    const [updated] = await db.update(chatWidgetSettings).set(updates).where(eq(chatWidgetSettings.id, 1)).returning();
    return updated;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(data).returning();
    return created;
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.update(services).set({ categoryId: null }).where(eq(services.categoryId, id));
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getReminderSettings(): Promise<ReminderSettings> {
    const [row] = await db.select().from(reminderSettings);
    if (row) return row;
    const [created] = await db.insert(reminderSettings).values({
      reminders: [
        { id: "5d", label: "5 Days Before", value: 5, unit: "days", enabled: true },
        { id: "1d", label: "1 Day Before", value: 1, unit: "days", enabled: true },
        { id: "2h", label: "2 Hours Before", value: 2, unit: "hours", enabled: true },
      ],
      emailEnabled: false,
      waEnabled: false,
      emailSubject: "Reminder: Your upcoming trip with Local Goa Kayaking",
      emailBody: `Hello [Full Name],

This is a reminder — Auto-generated.
You have an upcoming trip with Local Goa Kayaking! 🚣

📋 Booking Details:
  • Booking ID  : #[Booking ID]
  • Service     : [Service Name]
  • Date        : [Booking Date]
  • Time        : [Booking Time]
  • Guests      : [Pax Number]
  • Total       : ₹[Total Amount]

If you have any questions, reply to this email or WhatsApp us anytime.
Your guide: [Staff Name] – [Staff Contact]

See you on the water! 🌊
Local Goa Kayaking`,
      waTemplate: `Hello [Full Name] ⏰

Reminder: You have an upcoming trip!

📋 Booking Details:
• Booking ID : #[Booking ID]
• Service    : [Service Name]
• Date       : [Booking Date]
• Time       : [Booking Time]
• Guests     : [Pax Number] pax

Your guide: [Staff Name] – [Staff Contact]

See you soon! 🌊
— Local Goa Kayaking`,
    }).returning();
    return created;
  }

  async updateReminderSettings(updates: Partial<InsertReminderSettings>): Promise<ReminderSettings> {
    const existing = await this.getReminderSettings();
    const [updated] = await db.update(reminderSettings).set(updates).where(eq(reminderSettings.id, existing.id)).returning();
    return updated;
  }

  async hasReminderBeenSent(bookingId: number, reminderKey: string): Promise<boolean> {
    const rows = await db.select().from(sentReminders).where(
      and(eq(sentReminders.bookingId, bookingId), eq(sentReminders.reminderKey, reminderKey))
    );
    return rows.length > 0;
  }

  async markReminderSent(bookingId: number, reminderKey: string): Promise<void> {
    await db.insert(sentReminders).values({ bookingId, reminderKey });
  }

  async getReferrals(): Promise<(Referral & { confirmedCount: number; totalEarned: number; pendingAmount: number })[]> {
    const allReferrals = await db.select().from(referrals).orderBy(referrals.createdAt);
    const allBookings = await db.select().from(bookings).where(eq(bookings.status, "confirmed"));
    return allReferrals.map(r => {
      const matched = allBookings.filter(b => b.referralCode?.toUpperCase() === r.code.toUpperCase());
      const totalEarned = matched.reduce((sum, b) => sum + (b.referralCommission ?? 0), 0);
      const pendingAmount = Math.max(0, totalEarned - r.totalPaidOut);
      return { ...r, confirmedCount: matched.length, totalEarned, pendingAmount };
    });
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [r] = await db.select().from(referrals).where(eq(referrals.code, code.toUpperCase()));
    return r;
  }

  async createReferral(data: InsertReferral): Promise<Referral> {
    const [r] = await db.insert(referrals).values({ ...data, code: data.code.toUpperCase() }).returning();
    return r;
  }

  async updateReferral(id: number, data: Partial<Pick<InsertReferral, "name" | "code" | "phone" | "commissionType" | "commissionValue" | "linkedCouponCode">>): Promise<Referral> {
    const update: any = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.code !== undefined) update.code = data.code.toUpperCase();
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.commissionType !== undefined) update.commissionType = data.commissionType;
    if (data.commissionValue !== undefined) update.commissionValue = data.commissionValue;
    if ("linkedCouponCode" in data) update.linkedCouponCode = data.linkedCouponCode ?? null;
    const [updated] = await db.update(referrals).set(update).where(eq(referrals.id, id)).returning();
    return updated;
  }

  async deleteReferral(id: number): Promise<void> {
    await db.delete(referrals).where(eq(referrals.id, id));
  }

  async getReferralByPhone(phone: string): Promise<(Referral & { confirmedCount: number; totalEarned: number; pendingAmount: number }) | undefined> {
    const normalized = phone.replace(/\D/g, "").slice(-10);
    const allReferrals = await db.select().from(referrals);
    const ref = allReferrals.find(r => r.phone && r.phone.replace(/\D/g, "").slice(-10) === normalized);
    if (!ref) return undefined;
    const allBookings = await db.select().from(bookings).where(eq(bookings.status, "confirmed"));
    const matched = allBookings.filter(b => b.referralCode?.toUpperCase() === ref.code.toUpperCase());
    const totalEarned = matched.reduce((sum, b) => sum + (b.referralCommission ?? 0), 0);
    const pendingAmount = Math.max(0, totalEarned - ref.totalPaidOut);
    return { ...ref, confirmedCount: matched.length, totalEarned, pendingAmount };
  }

  async markReferralPaid(id: number, amount?: number): Promise<Referral> {
    const [ref] = await db.select().from(referrals).where(eq(referrals.id, id));
    if (!ref) throw new Error("Referral not found");
    let newTotal: number;
    if (amount !== undefined) {
      newTotal = ref.totalPaidOut + amount;
    } else {
      const allBookings = await db.select().from(bookings).where(eq(bookings.status, "confirmed"));
      const matched = allBookings.filter(b => b.referralCode?.toUpperCase() === ref.code.toUpperCase());
      const totalEarned = matched.reduce((sum, b) => sum + (b.referralCommission ?? 0), 0);
      newTotal = totalEarned;
    }
    const [updated] = await db.update(referrals).set({ totalPaidOut: newTotal }).where(eq(referrals.id, id)).returning();
    return updated;
  }

  async upsertVisitorSession(sessionId: string, date: string): Promise<void> {
    await db.execute(
      sql`INSERT INTO visitor_sessions (session_id, date, last_seen) VALUES (${sessionId}, ${date}, NOW())
          ON CONFLICT (session_id, date) DO UPDATE SET last_seen = NOW()`
    );
  }

  async getTodayVisitorCount(date: string): Promise<{ total: number; active: number }> {
    const result = await db.execute(
      sql`SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE last_seen >= NOW() - INTERVAL '15 minutes')::int AS active
          FROM visitor_sessions WHERE date = ${date}`
    );
    const row = result.rows[0] as any;
    return { total: row?.total ?? 0, active: row?.active ?? 0 };
  }

  async getTideSettings(): Promise<TideSettings> {
    const [settings] = await db.select().from(tideSettings).where(eq(tideSettings.id, 1));
    if (!settings) {
      const [created] = await db.insert(tideSettings).values({
        stormglassApiKey: "",
        latitude: "15.2736",
        longitude: "73.9296",
        locationName: "Colva, Goa",
        showOnHome: true,
      }).returning();
      return created;
    }
    return settings;
  }

  async updateTideSettings(updates: Partial<InsertTideSettings>): Promise<TideSettings> {
    const existing = await this.getTideSettings();
    const [updated] = await db
      .update(tideSettings)
      .set(updates)
      .where(eq(tideSettings.id, existing.id))
      .returning();
    return updated;
  }

  // ─── Account Heads ────────────────────────────────────────────────────────
  async getAccountHeads(): Promise<AccountHead[]> {
    return db.select().from(accountHeads).orderBy(accountHeads.name);
  }

  async getAccountHead(id: number): Promise<AccountHead | undefined> {
    const [row] = await db.select().from(accountHeads).where(eq(accountHeads.id, id));
    return row;
  }

  async createAccountHead(data: InsertAccountHead): Promise<AccountHead> {
    const [row] = await db.insert(accountHeads).values(data).returning();
    return row;
  }

  async updateAccountHead(id: number, data: Partial<InsertAccountHead>): Promise<AccountHead> {
    const [row] = await db.update(accountHeads).set(data).where(eq(accountHeads.id, id)).returning();
    return row;
  }

  async deleteAccountHead(id: number): Promise<void> {
    await db.delete(accountHeads).where(eq(accountHeads.id, id));
  }

  // ─── Ledger Entries ───────────────────────────────────────────────────────
  async getLedgerEntries(): Promise<LedgerEntry[]> {
    return db.select().from(ledgerEntries).orderBy(ledgerEntries.entryDate);
  }

  async getLedgerEntriesByAccount(accountHeadId: number): Promise<LedgerEntry[]> {
    return db.select().from(ledgerEntries)
      .where(eq(ledgerEntries.accountHeadId, accountHeadId))
      .orderBy(ledgerEntries.entryDate);
  }

  async createLedgerEntry(data: InsertLedgerEntry): Promise<LedgerEntry> {
    const [row] = await db.insert(ledgerEntries).values(data).returning();
    return row;
  }

  async deleteLedgerEntry(id: number): Promise<void> {
    await db.delete(ledgerEntries).where(eq(ledgerEntries.id, id));
  }

  // ─── App Policies ─────────────────────────────────────────────────────────
  async getAppPolicies(): Promise<AppPolicy[]> {
    return db.select().from(appPolicies);
  }

  async upsertAppPolicy(policyType: string, data: Omit<InsertAppPolicy, "policyType">): Promise<AppPolicy> {
    const existing = await db.select().from(appPolicies).where(eq(appPolicies.policyType, policyType));
    if (existing.length > 0) {
      const [updated] = await db.update(appPolicies).set({ ...data, policyType }).where(eq(appPolicies.policyType, policyType)).returning();
      return updated;
    }
    const [created] = await db.insert(appPolicies).values({ policyType, ...data }).returning();
    return created;
  }

  async scheduleManualReminder(bookingId: number, phone: string, message: string, scheduledAt: Date): Promise<BookingManualReminder> {
    const [row] = await db.insert(bookingManualReminders).values({ bookingId, phone, message, scheduledAt, isSent: false }).returning();
    return row;
  }

  async getManualReminders(): Promise<BookingManualReminder[]> {
    return db.select().from(bookingManualReminders).orderBy(bookingManualReminders.createdAt);
  }

  async getManualReminderForBooking(bookingId: number): Promise<BookingManualReminder | undefined> {
    const rows = await db.select().from(bookingManualReminders)
      .where(eq(bookingManualReminders.bookingId, bookingId))
      .orderBy(bookingManualReminders.createdAt);
    return rows[rows.length - 1];
  }

  async getPendingManualReminders(): Promise<BookingManualReminder[]> {
    const now = new Date();
    return db.select().from(bookingManualReminders)
      .where(and(eq(bookingManualReminders.isSent, false), lte(bookingManualReminders.scheduledAt, now)));
  }

  async markManualReminderSent(id: number): Promise<void> {
    await db.update(bookingManualReminders)
      .set({ isSent: true, sentAt: new Date() })
      .where(eq(bookingManualReminders.id, id));
  }
}

export const storage = new DatabaseStorage();
