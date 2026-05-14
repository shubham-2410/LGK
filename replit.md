# Local Goa Kayaking — replit.md

## Overview

Local Goa Kayaking is a full-stack web application for a kayaking booking business in Goa, India. It allows customers to browse kayaking services, create accounts, and make bookings with flexible payment options. Admins can manage service pricing and promotional banners.

The app is a mobile-first, responsive PWA-style application with a bottom navigation bar on mobile and a sidebar on desktop.

**Core features:**
- **Accounting module (admin only):** Account Heads (creditor/debtor/bank/cash) + Party Ledger with Payable, Receivable, and Adjustment entries; accessible at `/accounting` via sidebar
- Browse kayaking service packages (Sunset, Sunrise, Adventure Tour, Gold Package)
- Multi-step booking flow with date/time slot selection, guest details, coupon codes, and partial payment options
- User authentication (register/login with mobile number + password or 4-digit PIN)
- Guest checkout with post-booking profile completion modal
- View booking history (with pending/confirmed/cancelled status)
- **Pending → Admin Confirm payment flow:** Bookings are created with status "pending"; admin sees them in Manage Bookings with a "Confirm Payment" button; on confirm, status becomes "confirmed" and customer is notified
- Admin can optionally assign a contact staff member when confirming a booking; staff is shown on the booking card for both admin and customer
- Coupon codes shown on booking cards (with discount amount); booking coupons auto-generated on confirmation
- Admin: manage services (with inclusions), banners, bookings (confirm/cancel), UPI QR settings, FAQs, staffs
- Service pricing: admin sets a "Selling Price" with Per Pax / Per Group / Per Night dropdown; optional "MRP Price" for strikethrough display; Per Night shows check-in/check-out time fields and multiplies price by nights
- Service categories: admin creates/edits/deletes categories (Settings → Manage Categories); services can be assigned a category; home page shows scrollable category filter tabs and a search bar to filter services by name/description
- SEO keywords: admin configures meta keywords in Settings → SEO & Discoverability; injected into `<meta name="keywords">` via React `useEffect`
- WhatsApp message templates: admin configures per-status templates (Booking Created, Pending Payment, Confirmed, Cancelled, Rescheduled) with tap-to-insert dynamic field chips; each booking card has a "Send WhatsApp Update" button that auto-selects the correct template based on booking status; supports Meta WhatsApp Cloud API for direct sending (via `POST /api/whatsapp-send`) when Phone Number ID + Access Token are configured in WhatsApp settings — falls back to wa.me link otherwise
- Email Notifications: admin configures SMTP credentials + per-event email templates in Settings → Email Notifications; emails are sent automatically when a booking is created/confirmed/cancelled/rescheduled and the customer has an email address; includes a test-send button and subject/body template editor with field-chip insertion
- Service inclusions: icon + name chips shown on service detail page and home page cards
- Auto-rotating banner carousel on the home page
- Notification bell for real-time booking updates; coupon notifications are visually highlighted with the coupon code; clicking a booking notification navigates to that booking card (with highlight ring)

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend (React + Vite)

- **Framework:** React 18 with TypeScript, bundled by Vite
- **Routing:** `wouter` (lightweight client-side router)
- **State/data fetching:** TanStack React Query v5 — all API calls go through custom hooks (`use-auth`, `use-services`, `use-bookings`, `use-banners`)
- **UI components:** shadcn/ui (Radix UI primitives + Tailwind CSS), with a custom design theme (Water Blue primary, Kayak Yellow accent)
- **Forms:** Controlled React state (not react-hook-form) for most forms; `@hookform/resolvers` is available but not yet wired up everywhere
- **Carousel:** `embla-carousel-react` for the banner slider with 5-second auto-scroll
- **Date handling:** `date-fns` for formatting booking dates
- **Fonts:** DM Sans (body), Outfit (display/headings), loaded from Google Fonts
- **Theming:** CSS custom properties (HSL variables) defined in `index.css`, extended in `tailwind.config.ts`. Supports dark mode via `.dark` class.

**Page structure (`client/src/pages/`):**
| Page | Path | Auth required |
|---|---|---|
| Home | `/` | No |
| Service Detail + Booking | `/service/:id` | No (must be logged in to book) |
| Login | `/login` | No |
| Register | `/register` | No |
| Bookings | `/bookings` | Yes |
| Settings | `/settings` | Yes |

**Shared layout:** `AppLayout` wraps all main pages, providing the sticky top bar (mobile), sidebar (desktop), and bottom nav (mobile).

### Backend (Express + Node.js)

- **Runtime:** Node.js with `tsx` for TypeScript execution in dev; bundled with `esbuild` for production
- **Framework:** Express v5
- **Session management:** `express-session` with `memorystore` (in-memory session store — not suitable for multi-instance production deployments; should be replaced with `connect-pg-simple` if scaling)
- **API routes:** Defined in `server/routes.ts`, all under `/api/...`
- **Route contracts:** Shared between client and server via `shared/routes.ts` using Zod schemas — single source of truth for paths, HTTP methods, request inputs, and response shapes
- **Static serving:** In production, Express serves the Vite build from `dist/public/`. In development, Vite middleware is used via `server/vite.ts`.

**API endpoint groups:**
- `POST /api/auth/login` — login with mobile + password
- `POST /api/auth/register` — create account
- `GET /api/auth/me` — get current session user (returns 401 if not logged in)
- `POST /api/auth/logout`
- `GET /api/services` — list all services
- `PATCH /api/services/:id` — update a service (admin)
- `GET /api/banners` — list banners
- `POST /api/banners` — create banner (admin)
- `PATCH /api/banners/:id` — update banner
- `DELETE /api/banners/:id` — delete banner
- `GET /api/bookings` — get bookings for current user
- `POST /api/bookings` — create a booking

### Data Storage (PostgreSQL + Drizzle ORM)

- **Database:** PostgreSQL (via `DATABASE_URL` environment variable)
- **ORM:** Drizzle ORM with `drizzle-zod` for automatic Zod schema generation
- **Schema file:** `shared/schema.ts` — shared between server and client for type safety
- **Migrations:** `drizzle-kit push` for schema syncing (`npm run db:push`)

**Tables:**
| Table | Key fields |
|---|---|
| `users` | `id`, `mobile_number` (unique), `password`, `is_admin` |
| `categories` | `id`, `name` |
| `services` | `id`, `name`, `description`, `price`, `mrp_price`, `price_type` (pax/group/night), `category_id`, `image_url`, `time_slots`, `is_active`, `check_in_time`, `check_out_time` |
| `banners` | `id`, `title`, `image_url`, `is_active`, `expires_at` |
| `bookings` | `id`, `user_id`, `service_id`, `date`, `time_slot`, `full_name`, `contact_number`, `email`, `pax`, `total_payable`, `amount_paid`, `balance`, `status`, `coupon_code`, `coupon_discount`, `staff_id`, `cancel_reason`, `gst_amount`, `cgst_amount`, `sgst_amount`, `transaction_id`, `created_at` |
| `staffs` | `id`, `full_name`, `contact_number`, `address`, `shifts` (text[]), `is_active` |
| `coupons` | `id`, `code` (unique), `discount_type`, `discount_value`, `min_pax`, `is_active`, `expires_at`, `created_at` |
| `coupon_settings` | `id`, `booking_coupon_enabled`, `booking_coupon_expiry_months`, `booking_coupon_discount_type`, `booking_coupon_discount_value` |
| `notifications` | `id`, `user_id`, `type`, `title`, `message`, `is_read`, `booking_id`, `created_at` |
| `faqs` | `id`, `question`, `answer`, `sort_order`, `created_at` |
| `inclusions` | `id`, `name`, `icon` |
| `payment_settings` | `id`, `upi_id`, `qr_image_url`, `instructions` |

**Database seeding:** On server startup, `server/routes.ts` checks if services/banners exist and seeds initial data if the tables are empty.

### File Storage (Upload System)

Uploads are handled via `POST /api/upload/photo` (admin-only). The storage backend is configured in `upload_settings` table (id=1 singleton).

- **Default mode:** `replit` — Files go to Replit Object Storage (GCS-backed via sidecar), served at `/objects/uploads/<uuid>.<ext>`
- **Modes:** `replit` | `local` | `drive` | `cpanel`
  - `replit`: uses `objectStorageClient` from `server/replit_integrations/object_storage/`, sets ACL to public, returns `/objects/...` URL served by Express
  - `local`: writes to `public/uploads/`, served by Express static at `/uploads/`
  - `drive`: uploads to Google Drive folder, returns Drive uc-view URL
  - `cpanel`: FTP upload to cPanel hosting, returns custom public URL
- **Serving:** `/objects/*` route registered via `registerObjectStorageRoutes(app)` in `server/routes.ts`
- **Key environment vars:** `PRIVATE_OBJECT_DIR`, `DEFAULT_OBJECT_STORAGE_BUCKET_ID`

### Authentication & Authorization

- **Mechanism:** Server-side sessions via `express-session` with HTTP-only cookies (`sid` cookie name)
- **Password storage:** Stored as plain text currently — **needs to be hashed** (e.g., with bcrypt) before going to production
- **Admin check:** `is_admin` boolean on the user record; admin-only routes should check `req.session.user.isAdmin`
- **Client-side auth:** `use-auth` hook calls `/api/auth/me` on mount; returns `null` for unauthenticated users. Protected pages redirect to `/login` using `useEffect`.

### Build & Dev Tooling

- **Dev server:** `tsx server/index.ts` — Vite runs in middleware mode inside Express, enabling HMR
- **Production build:** `script/build.ts` runs `vite build` (client) then `esbuild` (server bundle), output to `dist/`
- **TypeScript:** Strict mode, path aliases `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`
- **Replit plugins:** `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` (dev only)

---

## External Dependencies

| Dependency | Purpose |
|---|---|
| PostgreSQL | Primary database (must be provisioned; `DATABASE_URL` env var required) |
| Google Fonts | DM Sans, Outfit, Fira Code, Geist Mono fonts (loaded in `client/index.html`) |
| Unsplash (image URLs) | Default service/banner images are Unsplash URLs seeded in the database |
| `express-session` + `memorystore` | Session management (in-memory; replace with `connect-pg-simple` for production persistence) |
| Radix UI | Accessible headless UI primitives (many components via shadcn/ui) |
| TanStack React Query | Server state management and caching on the client |
| Zod | Runtime validation; shared schemas between client and server |
| Drizzle ORM | Type-safe database queries and schema management |
| `embla-carousel-react` | Touch-friendly banner carousel |
| `date-fns` | Date formatting for booking calendar |
| `wouter` | Lightweight React router |
| `lucide-react` | Icon library |
| `vaul` | Drawer/bottom-sheet component |
| `recharts` | Chart library (available but not actively used yet) |
| `nanoid` | Random ID generation (used in Vite dev server template cache busting) |

**Environment variables required:**
- `DATABASE_URL` — PostgreSQL connection string (required; app throws on startup if missing)
- `SESSION_SECRET` — Express session secret (falls back to hardcoded string if not set — set this in production)
- `NODE_ENV` — `development` or `production`