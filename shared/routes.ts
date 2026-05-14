import { z } from 'zod';
import { insertUserSchema, insertServiceSchema, insertBannerSchema, insertBookingSchema, insertPaymentSettingsSchema, users, services, banners, bookings, paymentSettings } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: { method: 'POST' as const, path: '/api/auth/login' as const, input: z.object({ identifier: z.string(), password: z.string() }), responses: { 200: z.custom<typeof users.$inferSelect>(), 401: errorSchemas.unauthorized } },
    register: { method: 'POST' as const, path: '/api/auth/register' as const, input: z.object({ mobileNumber: z.string(), password: z.string() }), responses: { 201: z.custom<typeof users.$inferSelect>(), 400: errorSchemas.validation } },
    me: { method: 'GET' as const, path: '/api/auth/me' as const, responses: { 200: z.custom<typeof users.$inferSelect>(), 401: errorSchemas.unauthorized } },
    logout: { method: 'POST' as const, path: '/api/auth/logout' as const, responses: { 200: z.object({ message: z.string() }) } },
    updateProfile: {
      method: 'PATCH' as const,
      path: '/api/profile' as const,
      input: z.object({
        fullName: z.string().optional(),
        phoneNumber: z.string().optional(),
        whatsappNumber: z.string().optional(),
        email: z.string().optional(),
        dateOfBirth: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        loginPin: z.string().optional(),
      }),
      responses: { 200: z.custom<typeof users.$inferSelect>(), 400: errorSchemas.validation, 401: errorSchemas.unauthorized },
    },
  },
  services: {
    list: { method: 'GET' as const, path: '/api/services' as const, responses: { 200: z.array(z.custom<typeof services.$inferSelect>()) } },
    create: { method: 'POST' as const, path: '/api/services' as const, input: insertServiceSchema, responses: { 201: z.custom<typeof services.$inferSelect>(), 400: errorSchemas.validation } },
    update: { method: 'PUT' as const, path: '/api/services/:id' as const, input: insertServiceSchema.partial(), responses: { 200: z.custom<typeof services.$inferSelect>(), 400: errorSchemas.validation, 404: errorSchemas.notFound } },
    delete: { method: 'DELETE' as const, path: '/api/services/:id' as const, responses: { 204: z.void(), 404: errorSchemas.notFound } },
  },
  banners: {
    list: { method: 'GET' as const, path: '/api/banners' as const, responses: { 200: z.array(z.custom<typeof banners.$inferSelect>()) } },
    create: { method: 'POST' as const, path: '/api/banners' as const, input: insertBannerSchema, responses: { 201: z.custom<typeof banners.$inferSelect>(), 400: errorSchemas.validation } },
    update: { method: 'PUT' as const, path: '/api/banners/:id' as const, input: insertBannerSchema.partial(), responses: { 200: z.custom<typeof banners.$inferSelect>(), 400: errorSchemas.validation, 404: errorSchemas.notFound } },
    delete: { method: 'DELETE' as const, path: '/api/banners/:id' as const, responses: { 204: z.void(), 404: errorSchemas.notFound } },
  },
  paymentSettings: {
    get: { method: 'GET' as const, path: '/api/payment-settings' as const, responses: { 200: z.custom<typeof paymentSettings.$inferSelect>() } },
    update: { method: 'PUT' as const, path: '/api/payment-settings' as const, input: insertPaymentSettingsSchema.partial(), responses: { 200: z.custom<typeof paymentSettings.$inferSelect>(), 400: errorSchemas.validation, 401: errorSchemas.unauthorized } },
  },
  bookings: {
    list: { method: 'GET' as const, path: '/api/bookings' as const, responses: { 200: z.array(z.custom<typeof bookings.$inferSelect>()) } },
    create: { method: 'POST' as const, path: '/api/bookings' as const, input: insertBookingSchema, responses: { 201: z.custom<typeof bookings.$inferSelect>(), 400: errorSchemas.validation } },
    cancel: {
      method: 'PATCH' as const,
      path: '/api/bookings/:id/cancel' as const,
      input: z.object({ cancelReason: z.string().min(1) }),
      responses: { 200: z.custom<typeof bookings.$inferSelect>(), 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) Object.entries(params).forEach(([key, value]) => { if (url.includes(`:${key}`)) url = url.replace(`:${key}`, String(value)); });
  return url;
}
