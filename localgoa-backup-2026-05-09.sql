--
-- PostgreSQL database dump
--

\restrict bRMfZipfYw8c7pAfifb4PnLKJfWnqldErVjqwHFF7zrtBlNLLf4CH4Ht7bBClXs

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_blackout_dates DROP CONSTRAINT IF EXISTS service_blackout_dates_service_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_to_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_from_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_account_head_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_staff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_service_id_services_id_fk;
DROP INDEX IF EXISTS public.idx_visitor_sessions_last_seen;
DROP INDEX IF EXISTS public.idx_manual_reminders_unsent;
DROP INDEX IF EXISTS public.idx_manual_reminders_booking;
DROP INDEX IF EXISTS public."IDX_session_expire";
ALTER TABLE IF EXISTS ONLY public.whatsapp_templates DROP CONSTRAINT IF EXISTS whatsapp_templates_status_key;
ALTER TABLE IF EXISTS ONLY public.whatsapp_templates DROP CONSTRAINT IF EXISTS whatsapp_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.whatsapp_settings DROP CONSTRAINT IF EXISTS whatsapp_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.whatsapp_queue DROP CONSTRAINT IF EXISTS whatsapp_queue_pkey;
ALTER TABLE IF EXISTS ONLY public.visitor_sessions DROP CONSTRAINT IF EXISTS visitor_sessions_session_id_date_key;
ALTER TABLE IF EXISTS ONLY public.visitor_sessions DROP CONSTRAINT IF EXISTS visitor_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_mobile_number_unique;
ALTER TABLE IF EXISTS ONLY public.upload_settings DROP CONSTRAINT IF EXISTS upload_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.tide_settings DROP CONSTRAINT IF EXISTS tide_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.staffs DROP CONSTRAINT IF EXISTS staffs_pkey;
ALTER TABLE IF EXISTS ONLY public.session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_pkey;
ALTER TABLE IF EXISTS ONLY public.service_blackout_dates DROP CONSTRAINT IF EXISTS service_blackout_dates_service_id_date_key;
ALTER TABLE IF EXISTS ONLY public.service_blackout_dates DROP CONSTRAINT IF EXISTS service_blackout_dates_pkey;
ALTER TABLE IF EXISTS ONLY public.sent_reminders DROP CONSTRAINT IF EXISTS sent_reminders_pkey;
ALTER TABLE IF EXISTS ONLY public.reminder_settings DROP CONSTRAINT IF EXISTS reminder_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.referrals DROP CONSTRAINT IF EXISTS referrals_pkey;
ALTER TABLE IF EXISTS ONLY public.referrals DROP CONSTRAINT IF EXISTS referrals_code_key;
ALTER TABLE IF EXISTS ONLY public.payment_settings DROP CONSTRAINT IF EXISTS payment_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.inclusions DROP CONSTRAINT IF EXISTS inclusions_pkey;
ALTER TABLE IF EXISTS ONLY public.faqs DROP CONSTRAINT IF EXISTS faqs_pkey;
ALTER TABLE IF EXISTS ONLY public.email_templates DROP CONSTRAINT IF EXISTS email_templates_status_key;
ALTER TABLE IF EXISTS ONLY public.email_templates DROP CONSTRAINT IF EXISTS email_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.email_settings DROP CONSTRAINT IF EXISTS email_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.coupons DROP CONSTRAINT IF EXISTS coupons_pkey;
ALTER TABLE IF EXISTS ONLY public.coupons DROP CONSTRAINT IF EXISTS coupons_code_key;
ALTER TABLE IF EXISTS ONLY public.coupon_settings DROP CONSTRAINT IF EXISTS coupon_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_widget_settings DROP CONSTRAINT IF EXISTS chat_widget_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_pkey;
ALTER TABLE IF EXISTS ONLY public.booking_manual_reminders DROP CONSTRAINT IF EXISTS booking_manual_reminders_pkey;
ALTER TABLE IF EXISTS ONLY public.banners DROP CONSTRAINT IF EXISTS banners_pkey;
ALTER TABLE IF EXISTS ONLY public.app_policies DROP CONSTRAINT IF EXISTS app_policies_policy_type_key;
ALTER TABLE IF EXISTS ONLY public.app_policies DROP CONSTRAINT IF EXISTS app_policies_pkey;
ALTER TABLE IF EXISTS ONLY public.account_heads DROP CONSTRAINT IF EXISTS account_heads_pkey;
ALTER TABLE IF EXISTS public.whatsapp_templates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.whatsapp_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.whatsapp_queue ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.visitor_sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.upload_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tide_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.staffs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.services ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.service_blackout_dates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sent_reminders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.reminder_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.referrals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payment_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ledger_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inclusions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.faqs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.email_templates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.email_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.coupons ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.coupon_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.chat_widget_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bookings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.booking_manual_reminders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.banners ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.app_policies ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.account_heads ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.whatsapp_templates_id_seq;
DROP TABLE IF EXISTS public.whatsapp_templates;
DROP SEQUENCE IF EXISTS public.whatsapp_settings_id_seq;
DROP TABLE IF EXISTS public.whatsapp_settings;
DROP SEQUENCE IF EXISTS public.whatsapp_queue_id_seq;
DROP TABLE IF EXISTS public.whatsapp_queue;
DROP SEQUENCE IF EXISTS public.visitor_sessions_id_seq;
DROP TABLE IF EXISTS public.visitor_sessions;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.upload_settings_id_seq;
DROP TABLE IF EXISTS public.upload_settings;
DROP SEQUENCE IF EXISTS public.tide_settings_id_seq;
DROP TABLE IF EXISTS public.tide_settings;
DROP SEQUENCE IF EXISTS public.staffs_id_seq;
DROP TABLE IF EXISTS public.staffs;
DROP TABLE IF EXISTS public.session;
DROP SEQUENCE IF EXISTS public.services_id_seq;
DROP TABLE IF EXISTS public.services;
DROP SEQUENCE IF EXISTS public.service_blackout_dates_id_seq;
DROP TABLE IF EXISTS public.service_blackout_dates;
DROP SEQUENCE IF EXISTS public.sent_reminders_id_seq;
DROP TABLE IF EXISTS public.sent_reminders;
DROP SEQUENCE IF EXISTS public.reminder_settings_id_seq;
DROP TABLE IF EXISTS public.reminder_settings;
DROP SEQUENCE IF EXISTS public.referrals_id_seq;
DROP TABLE IF EXISTS public.referrals;
DROP SEQUENCE IF EXISTS public.payment_settings_id_seq;
DROP TABLE IF EXISTS public.payment_settings;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.ledger_entries_id_seq;
DROP TABLE IF EXISTS public.ledger_entries;
DROP SEQUENCE IF EXISTS public.inclusions_id_seq;
DROP TABLE IF EXISTS public.inclusions;
DROP SEQUENCE IF EXISTS public.faqs_id_seq;
DROP TABLE IF EXISTS public.faqs;
DROP SEQUENCE IF EXISTS public.email_templates_id_seq;
DROP TABLE IF EXISTS public.email_templates;
DROP SEQUENCE IF EXISTS public.email_settings_id_seq;
DROP TABLE IF EXISTS public.email_settings;
DROP SEQUENCE IF EXISTS public.coupons_id_seq;
DROP TABLE IF EXISTS public.coupons;
DROP SEQUENCE IF EXISTS public.coupon_settings_id_seq;
DROP TABLE IF EXISTS public.coupon_settings;
DROP SEQUENCE IF EXISTS public.chat_widget_settings_id_seq;
DROP TABLE IF EXISTS public.chat_widget_settings;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP SEQUENCE IF EXISTS public.bookings_id_seq;
DROP TABLE IF EXISTS public.bookings;
DROP SEQUENCE IF EXISTS public.booking_manual_reminders_id_seq;
DROP TABLE IF EXISTS public.booking_manual_reminders;
DROP SEQUENCE IF EXISTS public.banners_id_seq;
DROP TABLE IF EXISTS public.banners;
DROP SEQUENCE IF EXISTS public.app_policies_id_seq;
DROP TABLE IF EXISTS public.app_policies;
DROP SEQUENCE IF EXISTS public.account_heads_id_seq;
DROP TABLE IF EXISTS public.account_heads;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_heads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_heads (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    address text DEFAULT ''::text,
    place text DEFAULT ''::text,
    opening_balance integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    booking_mapping text DEFAULT 'none'::text
);


--
-- Name: account_heads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_heads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_heads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_heads_id_seq OWNED BY public.account_heads.id;


--
-- Name: app_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_policies (
    id integer NOT NULL,
    policy_type text NOT NULL,
    header text DEFAULT ''::text NOT NULL,
    details text DEFAULT ''::text NOT NULL,
    redirect_url text DEFAULT ''::text NOT NULL
);


--
-- Name: app_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.app_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: app_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.app_policies_id_seq OWNED BY public.app_policies.id;


--
-- Name: banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banners (
    id integer NOT NULL,
    title text NOT NULL,
    image_url text NOT NULL,
    is_active boolean DEFAULT true,
    expires_at text
);


--
-- Name: banners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.banners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.banners_id_seq OWNED BY public.banners.id;


--
-- Name: booking_manual_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_manual_reminders (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    phone text NOT NULL,
    message text NOT NULL,
    scheduled_at timestamp without time zone NOT NULL,
    sent_at timestamp without time zone,
    is_sent boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: booking_manual_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.booking_manual_reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: booking_manual_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.booking_manual_reminders_id_seq OWNED BY public.booking_manual_reminders.id;


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    user_id integer,
    service_id integer,
    date text NOT NULL,
    time_slot text NOT NULL,
    full_name text NOT NULL,
    contact_number text NOT NULL,
    email text NOT NULL,
    pax integer NOT NULL,
    total_payable integer NOT NULL,
    amount_paid integer NOT NULL,
    balance integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    cancel_reason text,
    created_at timestamp without time zone DEFAULT now(),
    coupon_code text,
    coupon_discount integer DEFAULT 0,
    staff_id integer,
    whatsapp_consent boolean DEFAULT true NOT NULL,
    referral_code text,
    referral_commission integer DEFAULT 0,
    transaction_id text,
    gst_amount integer DEFAULT 0,
    cgst_amount integer DEFAULT 0,
    sgst_amount integer DEFAULT 0,
    settlement_amount integer,
    is_settled boolean DEFAULT false
);


--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: chat_widget_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_widget_settings (
    id integer NOT NULL,
    whatsapp_enabled boolean DEFAULT false NOT NULL,
    whatsapp_number text DEFAULT ''::text NOT NULL,
    whatsapp_corner text DEFAULT 'bottom-right'::text NOT NULL,
    whatsapp_message text DEFAULT ''::text NOT NULL,
    tawk_enabled boolean DEFAULT false NOT NULL,
    tawk_script text DEFAULT ''::text NOT NULL,
    show_on_mobile boolean DEFAULT true NOT NULL
);


--
-- Name: chat_widget_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_widget_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_widget_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_widget_settings_id_seq OWNED BY public.chat_widget_settings.id;


--
-- Name: coupon_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_settings (
    id integer NOT NULL,
    booking_coupon_enabled boolean DEFAULT false,
    booking_coupon_expiry_months integer DEFAULT 3,
    booking_coupon_discount_type text DEFAULT 'percentage'::text,
    booking_coupon_discount_value integer DEFAULT 10,
    booking_coupon_category_id integer,
    booking_coupon_service_id integer
);


--
-- Name: coupon_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupon_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupon_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupon_settings_id_seq OWNED BY public.coupon_settings.id;


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id integer NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    discount_type text DEFAULT 'percentage'::text NOT NULL,
    discount_value integer DEFAULT 10 NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true,
    is_used boolean DEFAULT false,
    used_by_user_id integer,
    created_for_user_id integer,
    created_at timestamp without time zone DEFAULT now(),
    min_pax integer DEFAULT 0 NOT NULL,
    category_id integer,
    service_id integer,
    earned_from_booking_id integer,
    max_uses integer DEFAULT 0 NOT NULL,
    used_count integer DEFAULT 0 NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL
);


--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;


--
-- Name: email_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_settings (
    id integer NOT NULL,
    from_name text DEFAULT 'Local Goa Kayaking'::text NOT NULL,
    from_email text DEFAULT ''::text NOT NULL,
    smtp_host text DEFAULT ''::text NOT NULL,
    smtp_port integer DEFAULT 587 NOT NULL,
    smtp_user text DEFAULT ''::text NOT NULL,
    smtp_password text DEFAULT ''::text NOT NULL,
    smtp_secure boolean DEFAULT false NOT NULL,
    enabled boolean DEFAULT false NOT NULL
);


--
-- Name: email_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_settings_id_seq OWNED BY public.email_settings.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    status text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL
);


--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faqs (
    id integer NOT NULL,
    summary text NOT NULL,
    description text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.faqs_id_seq OWNED BY public.faqs.id;


--
-- Name: inclusions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inclusions (
    id integer NOT NULL,
    name text NOT NULL,
    icon text DEFAULT 'Star'::text NOT NULL
);


--
-- Name: inclusions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inclusions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inclusions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inclusions_id_seq OWNED BY public.inclusions.id;


--
-- Name: ledger_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ledger_entries (
    id integer NOT NULL,
    account_head_id integer NOT NULL,
    type text NOT NULL,
    amount integer NOT NULL,
    notes text DEFAULT ''::text,
    entry_date text NOT NULL,
    from_account_id integer,
    to_account_id integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ledger_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ledger_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ledger_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ledger_entries_id_seq OWNED BY public.ledger_entries.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    type text NOT NULL,
    booking_id integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: payment_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_settings (
    id integer NOT NULL,
    company_name text DEFAULT 'Local Goa Kayaking'::text NOT NULL,
    upi_link text DEFAULT ''::text NOT NULL,
    success_message text DEFAULT 'Thank you! Your booking is confirmed. We''ll see you on the water!'::text NOT NULL,
    failed_message text DEFAULT 'Payment could not be confirmed. Please contact us for assistance.'::text NOT NULL,
    site_url text DEFAULT ''::text,
    seo_keywords text[] DEFAULT '{}'::text[],
    boarding_location text DEFAULT ''::text,
    boarding_pass_terms text DEFAULT ''::text,
    boarding_pass_disclaimer text DEFAULT ''::text,
    google_review_url text DEFAULT ''::text,
    proprietor_name text DEFAULT ''::text,
    proprietor_number text DEFAULT ''::text,
    gst_number text DEFAULT ''::text NOT NULL,
    registered_business_name text DEFAULT ''::text NOT NULL,
    business_address text DEFAULT ''::text NOT NULL,
    contact_person text DEFAULT ''::text NOT NULL,
    boarding_message text DEFAULT ''::text NOT NULL,
    contact_number text DEFAULT ''::text NOT NULL,
    payment_mode text DEFAULT 'manual'::text NOT NULL,
    phonepe_client_id text DEFAULT ''::text NOT NULL,
    phonepe_client_secret text DEFAULT ''::text NOT NULL,
    phonepe_client_version integer DEFAULT 1 NOT NULL,
    phonepe_env text DEFAULT 'sandbox'::text NOT NULL,
    phonepe_webhook_username text DEFAULT ''::text NOT NULL,
    phonepe_webhook_password text DEFAULT ''::text NOT NULL
);


--
-- Name: payment_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_settings_id_seq OWNED BY public.payment_settings.id;


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    commission_type text DEFAULT 'fixed'::text NOT NULL,
    commission_value integer DEFAULT 0 NOT NULL,
    total_paid_out integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    phone text,
    linked_coupon_code text
);


--
-- Name: referrals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: referrals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.referrals_id_seq OWNED BY public.referrals.id;


--
-- Name: reminder_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminder_settings (
    id integer NOT NULL,
    reminders jsonb DEFAULT '[]'::jsonb,
    email_enabled boolean DEFAULT false NOT NULL,
    wa_enabled boolean DEFAULT false NOT NULL,
    email_subject text DEFAULT 'Reminder: Your upcoming trip with Local Goa Kayaking'::text NOT NULL,
    email_body text DEFAULT ''::text NOT NULL,
    wa_template text DEFAULT ''::text NOT NULL,
    review_enabled boolean DEFAULT false NOT NULL,
    review_after_value integer DEFAULT 24 NOT NULL,
    review_after_unit text DEFAULT 'hours'::text NOT NULL,
    review_email_subject text DEFAULT 'How was your experience? — Local Goa Kayaking'::text NOT NULL,
    review_email_body text DEFAULT ''::text NOT NULL,
    review_wa_template text DEFAULT ''::text NOT NULL,
    review_triggers jsonb DEFAULT '[]'::jsonb
);


--
-- Name: reminder_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reminder_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reminder_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reminder_settings_id_seq OWNED BY public.reminder_settings.id;


--
-- Name: sent_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sent_reminders (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    reminder_key text NOT NULL,
    sent_at timestamp without time zone DEFAULT now()
);


--
-- Name: sent_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sent_reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sent_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sent_reminders_id_seq OWNED BY public.sent_reminders.id;


--
-- Name: service_blackout_dates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_blackout_dates (
    id integer NOT NULL,
    service_id integer NOT NULL,
    date text NOT NULL,
    reason text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: service_blackout_dates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_blackout_dates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_blackout_dates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_blackout_dates_id_seq OWNED BY public.service_blackout_dates.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    price integer NOT NULL,
    image_url text,
    duration text DEFAULT '2 Hours'::text,
    age_group text DEFAULT 'All Ages'::text,
    time_slots text[] DEFAULT '{"06:00 AM","08:30 AM","04:00 PM","05:30 PM"}'::text[],
    is_active boolean DEFAULT true,
    photos text[] DEFAULT '{}'::text[],
    inclusion_ids integer[] DEFAULT '{}'::integer[],
    min_pax integer DEFAULT 0 NOT NULL,
    mrp_price integer,
    price_type text DEFAULT 'pax'::text,
    category_id integer,
    check_in_time text,
    check_out_time text,
    bedrooms integer DEFAULT 0,
    adult_occupancy integer DEFAULT 0,
    kids_occupancy integer DEFAULT 0,
    booking_type text DEFAULT 'online'::text,
    manual_wa_number text,
    manual_email text,
    video_url text,
    gst_percent integer DEFAULT 0 NOT NULL,
    gst_mode text DEFAULT 'exclusive'::text NOT NULL,
    display_sequence integer,
    daily_online_limit integer DEFAULT 0 NOT NULL
);


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: staffs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staffs (
    id integer NOT NULL,
    full_name text NOT NULL,
    contact_number text NOT NULL,
    address text DEFAULT ''::text NOT NULL,
    shifts text[] DEFAULT '{}'::text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: staffs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.staffs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: staffs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.staffs_id_seq OWNED BY public.staffs.id;


--
-- Name: tide_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tide_settings (
    id integer NOT NULL,
    stormglass_api_key text DEFAULT ''::text NOT NULL,
    latitude text DEFAULT '15.2736'::text NOT NULL,
    longitude text DEFAULT '73.9296'::text NOT NULL,
    location_name text DEFAULT 'Colva, Goa'::text NOT NULL,
    show_on_home boolean DEFAULT true NOT NULL
);


--
-- Name: tide_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tide_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tide_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tide_settings_id_seq OWNED BY public.tide_settings.id;


--
-- Name: upload_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.upload_settings (
    id integer NOT NULL,
    google_drive_folder_id text DEFAULT ''::text,
    storage_mode text DEFAULT 'replit'::text,
    cpanel_host text DEFAULT ''::text,
    cpanel_username text DEFAULT ''::text,
    cpanel_password text DEFAULT ''::text,
    cpanel_port integer DEFAULT 21,
    cpanel_remote_path text DEFAULT '/public_html/uploads/'::text,
    cpanel_public_url text DEFAULT ''::text
);


--
-- Name: upload_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.upload_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: upload_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.upload_settings_id_seq OWNED BY public.upload_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    mobile_number text NOT NULL,
    password text NOT NULL,
    is_admin boolean DEFAULT false,
    full_name text,
    phone_number text,
    whatsapp_number text,
    email text,
    date_of_birth text,
    username text,
    login_pin text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: visitor_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitor_sessions (
    id integer NOT NULL,
    session_id text NOT NULL,
    date text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    last_seen timestamp without time zone DEFAULT now()
);


--
-- Name: visitor_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visitor_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visitor_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visitor_sessions_id_seq OWNED BY public.visitor_sessions.id;


--
-- Name: whatsapp_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_queue (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    customer_phone text NOT NULL,
    customer_name text DEFAULT ''::text NOT NULL,
    template_key text NOT NULL,
    message text NOT NULL,
    is_sent boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: whatsapp_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.whatsapp_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: whatsapp_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.whatsapp_queue_id_seq OWNED BY public.whatsapp_queue.id;


--
-- Name: whatsapp_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_settings (
    id integer NOT NULL,
    admin_number text DEFAULT ''::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    meta_phone_number_id text DEFAULT ''::text,
    meta_access_token text DEFAULT ''::text
);


--
-- Name: whatsapp_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.whatsapp_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: whatsapp_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.whatsapp_settings_id_seq OWNED BY public.whatsapp_settings.id;


--
-- Name: whatsapp_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_templates (
    id integer NOT NULL,
    status text NOT NULL,
    template text NOT NULL
);


--
-- Name: whatsapp_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.whatsapp_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: whatsapp_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.whatsapp_templates_id_seq OWNED BY public.whatsapp_templates.id;


--
-- Name: account_heads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_heads ALTER COLUMN id SET DEFAULT nextval('public.account_heads_id_seq'::regclass);


--
-- Name: app_policies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_policies ALTER COLUMN id SET DEFAULT nextval('public.app_policies_id_seq'::regclass);


--
-- Name: banners id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners ALTER COLUMN id SET DEFAULT nextval('public.banners_id_seq'::regclass);


--
-- Name: booking_manual_reminders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_manual_reminders ALTER COLUMN id SET DEFAULT nextval('public.booking_manual_reminders_id_seq'::regclass);


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: chat_widget_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_widget_settings ALTER COLUMN id SET DEFAULT nextval('public.chat_widget_settings_id_seq'::regclass);


--
-- Name: coupon_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_settings ALTER COLUMN id SET DEFAULT nextval('public.coupon_settings_id_seq'::regclass);


--
-- Name: coupons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons ALTER COLUMN id SET DEFAULT nextval('public.coupons_id_seq'::regclass);


--
-- Name: email_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_settings ALTER COLUMN id SET DEFAULT nextval('public.email_settings_id_seq'::regclass);


--
-- Name: email_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: faqs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faqs ALTER COLUMN id SET DEFAULT nextval('public.faqs_id_seq'::regclass);


--
-- Name: inclusions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inclusions ALTER COLUMN id SET DEFAULT nextval('public.inclusions_id_seq'::regclass);


--
-- Name: ledger_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries ALTER COLUMN id SET DEFAULT nextval('public.ledger_entries_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: payment_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_settings ALTER COLUMN id SET DEFAULT nextval('public.payment_settings_id_seq'::regclass);


--
-- Name: referrals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals ALTER COLUMN id SET DEFAULT nextval('public.referrals_id_seq'::regclass);


--
-- Name: reminder_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_settings ALTER COLUMN id SET DEFAULT nextval('public.reminder_settings_id_seq'::regclass);


--
-- Name: sent_reminders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_reminders ALTER COLUMN id SET DEFAULT nextval('public.sent_reminders_id_seq'::regclass);


--
-- Name: service_blackout_dates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_blackout_dates ALTER COLUMN id SET DEFAULT nextval('public.service_blackout_dates_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: staffs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staffs ALTER COLUMN id SET DEFAULT nextval('public.staffs_id_seq'::regclass);


--
-- Name: tide_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tide_settings ALTER COLUMN id SET DEFAULT nextval('public.tide_settings_id_seq'::regclass);


--
-- Name: upload_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_settings ALTER COLUMN id SET DEFAULT nextval('public.upload_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: visitor_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitor_sessions ALTER COLUMN id SET DEFAULT nextval('public.visitor_sessions_id_seq'::regclass);


--
-- Name: whatsapp_queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_queue ALTER COLUMN id SET DEFAULT nextval('public.whatsapp_queue_id_seq'::regclass);


--
-- Name: whatsapp_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_settings ALTER COLUMN id SET DEFAULT nextval('public.whatsapp_settings_id_seq'::regclass);


--
-- Name: whatsapp_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_templates ALTER COLUMN id SET DEFAULT nextval('public.whatsapp_templates_id_seq'::regclass);


--
-- Data for Name: account_heads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account_heads (id, name, type, address, place, opening_balance, created_at, booking_mapping) FROM stdin;
1	Petrol Expense	creditor			0	2026-04-24 20:17:45.256827	none
2	Salary to Vimal	creditor			0	2026-04-24 20:18:02.452436	none
3	Software Purchase	creditor			0	2026-04-24 20:18:13.443805	none
5	HDFC BANK	bank			10000	2026-04-24 20:18:50.324027	token
6	Petty Cash	cash			0	2026-04-24 20:18:59.394775	balance
7	Siddhant Sap	debtor			0	2026-04-26 07:22:04.346264	none
\.


--
-- Data for Name: app_policies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_policies (id, policy_type, header, details, redirect_url) FROM stdin;
1	terms	Terms & Conditions	Here’s your **SEO-optimized Terms of Use page** for **Local Goa Kayaking**, structured for better Google indexing and website readability:\n\n---\n\n# **Terms of Use | Local Goa Kayaking (Goa Adventure & Kayaking Tours)**\n\n## **Welcome to Local Goa Kayaking**\n\nWelcome to **Local Goa Kayaking**, your trusted provider for **kayaking tours in Goa, mangrove kayaking, backwater adventures, and eco-tourism experiences**.\n\nBy accessing or using our website **[www.localgoakayaking.com](http://www.localgoakayaking.com)**, you agree to comply with and be bound by the following Terms of Use.\n\n---\n\n## **1. Legal Information**\n\nThis document is an electronic record under the Information Technology Act, 2000 and applicable rules. It is generated electronically and does not require physical or digital signatures.\n\nThis page is published in compliance with the Information Technology (Intermediaries Guidelines) Rules, 2011.\n\n---\n\n## **2. About Local Goa Kayaking**\n\n* Business Name: Local Goa Kayaking\n* Location: Colvale, North Goa, India\n* Services: Kayaking in Goa, Mangrove kayaking tours, Backwater kayaking, Guided eco tours\n\nWe provide **safe, guided, and eco-friendly kayaking experiences in Goa**.\n\n---\n\n## **3. Acceptance of Terms**\n\nBy using our website or booking a kayaking experience in Goa, you:\n\n* Agree to these Terms of Use\n* Accept all policies related to bookings, cancellations, and services\n* Enter into a legally binding agreement with us\n\n---\n\n## **4. Services Offered**\n\nWe specialize in:\n\n* Kayaking tours in Goa\n* Mangrove kayaking experiences\n* River and backwater kayaking\n* Guided nature and eco tours\n\nAll services are subject to availability and weather conditions.\n\n---\n\n## **5. User Responsibilities**\n\nYou agree to:\n\n* Provide accurate booking and personal information\n* Use the website lawfully\n* Not misuse or attempt to hack the platform\n* Follow safety instructions during kayaking tours\n\nYou are responsible for all activity under your account.\n\n---\n\n## **6. Risk Disclaimer (Important for Adventure Activities)**\n\nKayaking is an outdoor adventure activity and involves certain risks.\n\nBy booking with us, you acknowledge:\n\n* Participation is at your own risk\n* You are physically fit for kayaking\n* You will follow all safety guidelines provided by instructors\n\nLocal Goa Kayaking is not liable for injuries caused due to negligence or failure to follow instructions.\n\n---\n\n## **7. Pricing and Payments**\n\n* All prices for kayaking tours in Goa are listed on the website\n* Payments must be made in full before confirming bookings\n* Prices may change without prior notice\n\n---\n\n## **8. No Warranty**\n\nWe do not guarantee:\n\n* Website accuracy or uninterrupted access\n* Error-free content\n\nAll information is provided “as is” and may contain minor inaccuracies.\n\n---\n\n## **9. Intellectual Property**\n\nAll website content including:\n\n* Images\n* Videos\n* Text\n* Branding\n\nBelongs to Local Goa Kayaking and cannot be reused without permission.\n\n---\n\n## **10. Third-Party Links**\n\nOur website may include links to third-party platforms.\n\nWe are not responsible for:\n\n* Their content\n* Their privacy policies\n* Their services\n\n---\n\n## **11. Booking Agreement**\n\nOnce you book a kayaking experience:\n\n* You enter a legally binding agreement\n* Cancellation and refund policies apply\n\n---\n\n## **12. Indemnity**\n\nYou agree to protect Local Goa Kayaking from:\n\n* Legal claims\n* Damages\n* Losses\n\nArising due to your misuse of services or violation of terms.\n\n---\n\n## **13. Force Majeure**\n\nWe are not responsible for cancellations or delays due to:\n\n* Weather conditions\n* Natural disasters\n* Government restrictions\n\n---\n\n## **14. Governing Law**\n\nThese Terms are governed by the laws of India.\n\n---\n\n## **15. Jurisdiction**\n\nAll disputes are subject to the courts in **Goa, India**.\n\n---\n\n## **16. Contact Us**\n\nFor any questions regarding these Terms:\n\n* Website: [www.localgoakayaking.com](http://www.localgoakayaking.com)\n* Location: Colvale, Goa\n* Contact details available on the website\n\n---\n\n## **SEO Keywords Included (for ranking)**\n\n* Kayaking in Goa\n* Mangrove kayaking Goa\n* Goa adventure activities\n* Backwater kayaking Goa\n* Eco tourism Goa\n* Things to do in North Goa\n* Kayaking tours near me\n\n---\n\n### If you want next-level SEO:\n\nI can also:\n\n* Add **schema markup (legal page structured data)**\n* Create **FAQ section for Google ranking**\n* Optimize for **"Kayaking in Goa near me" local SEO**\n* Write **Privacy Policy + Cancellation Policy (important for bookings)**\n\nJust tell me what you want next.\n	
\.


--
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.banners (id, title, image_url, is_active, expires_at) FROM stdin;
1	Kayaking In Goa	/banner-kayaking.png	t	\N
\.


--
-- Data for Name: booking_manual_reminders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_manual_reminders (id, booking_id, phone, message, scheduled_at, sent_at, is_sent, created_at) FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, user_id, service_id, date, time_slot, full_name, contact_number, email, pax, total_payable, amount_paid, balance, status, cancel_reason, created_at, coupon_code, coupon_discount, staff_id, whatsapp_consent, referral_code, referral_commission, transaction_id, gst_amount, cgst_amount, sgst_amount, settlement_amount, is_settled) FROM stdin;
23	2	1	2026-04-25	05:30 PM	Siddhant Sap	+91 7770044447	goayachtworld@gmail.com	4	6000	1500	4500	completed	\N	2026-04-26 07:19:12.914838	\N	0	1	t	\N	0	2345678	270	135	135	6000	t
24	2	2	2026-04-22	08:30 AM	Siddhant Sap	+91 7770044447	goayachtworld@gmail.com	7	8400	8400	0	completed	\N	2026-04-26 08:40:09.301243	\N	0	1	t	\N	0	2323232	1512	756	756	8400	t
26	2	4	2026-04-20	03:00 PM	Siddhant Sap	+91 7770044447	goayachtworld@gmail.com	5	17500	1750	15750	completed	\N	2026-04-26 08:53:01.527191	\N	0	1	t	\N	0	3442342	0	0	0	17500	t
25	2	3	2026-04-25	02:00 PM	Siddhant Sap	+91 7770044447	goayachtworld@gmail.com	5	2500	1250	1250	completed	\N	2026-04-26 08:52:29.962542	\N	0	1	t	\N	0	3232323	63	31	31	2500	t
27	2	1	2026-05-19	05:30 PM	Siddhant Sap	+91 7770044447	goayachtworld@gmail.com	2	3000	1500	1500	confirmed	\N	2026-05-02 12:20:36.914416	\N	0	1	t	\N	0	5656546	270	135	135	\N	f
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name) FROM stdin;
1	Hotel & Resorts
2	Kayaking Tours
\.


--
-- Data for Name: chat_widget_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_widget_settings (id, whatsapp_enabled, whatsapp_number, whatsapp_corner, whatsapp_message, tawk_enabled, tawk_script, show_on_mobile) FROM stdin;
1	t	7770044447	bottom-right	Hello, I am looking to book a service.	f		t
\.


--
-- Data for Name: coupon_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coupon_settings (id, booking_coupon_enabled, booking_coupon_expiry_months, booking_coupon_discount_type, booking_coupon_discount_value, booking_coupon_category_id, booking_coupon_service_id) FROM stdin;
1	t	3	fixed	100	\N	\N
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coupons (id, code, type, discount_type, discount_value, expires_at, is_active, is_used, used_by_user_id, created_for_user_id, created_at, min_pax, category_id, service_id, earned_from_booking_id, max_uses, used_count, title, description) FROM stdin;
2	LGKG5	special	percentage	10	2026-03-31 00:00:00	t	f	\N	\N	2026-03-03 10:39:18.68399	5	\N	\N	\N	0	0		
3	KAYAK-JC4HRA	booking	fixed	100	2026-06-03 12:31:43.203	t	f	\N	1	2026-03-03 12:31:43.204145	0	\N	\N	\N	0	0		
4	KAYAK-3ZU2X6	booking	fixed	100	2026-06-05 09:33:54.187	t	f	\N	3	2026-03-05 09:33:54.187851	0	\N	\N	\N	0	0		
5	KAYAK-4NUN7Z	booking	fixed	100	2026-06-05 09:35:44.79	t	f	\N	3	2026-03-05 09:35:44.791356	0	\N	\N	\N	0	0		
6	KAYAK-A9EB2H	booking	fixed	100	2026-06-07 11:12:06.309	t	f	\N	2	2026-03-07 11:12:06.31027	0	\N	\N	\N	0	0		
7	KAYAK-G6SJQ6	booking	fixed	100	2026-06-08 08:30:11.264	t	f	\N	2	2026-03-08 08:30:11.265082	0	\N	\N	\N	0	0		
8	KAYAK-PRR6RF	booking	fixed	100	2026-06-08 10:37:36.716	t	f	\N	2	2026-03-08 10:37:36.717209	0	\N	\N	14	0	0		
9	KAYAK-GXHBSM	booking	fixed	100	2026-06-23 11:16:18.199	t	f	\N	2	2026-03-23 11:16:18.200534	0	\N	\N	15	0	0		
10	KAYAK-4T5W5R	booking	fixed	100	2026-06-23 11:20:24.73	t	f	\N	2	2026-03-23 11:20:24.732603	0	\N	\N	13	0	0		
11	KAYAK-QD22H3	booking	fixed	100	2026-06-23 11:20:32.041	t	f	\N	2	2026-03-23 11:20:32.042054	0	\N	\N	9	0	0		
12	KAYAK-HGNDKG	booking	fixed	100	2026-06-23 11:23:14.288	t	f	\N	2	2026-03-23 11:23:14.289195	0	\N	\N	16	0	0		
13	KAYAK-W4BUQE	booking	fixed	100	2026-06-23 14:08:20.816	t	f	\N	2	2026-03-23 14:08:20.817444	0	\N	\N	17	0	0		
15	KAYAK-A2W56P	booking	fixed	100	2026-06-24 09:34:59.859	t	f	\N	2	2026-03-24 09:34:59.860501	0	\N	\N	19	0	0		
16	KAYAK-VLKQM5	booking	fixed	100	2026-06-24 10:22:41.034	t	f	\N	2	2026-03-24 10:22:41.034959	0	\N	\N	20	0	0		
1	GOAINSIDER500	special	fixed	500	2026-03-31 00:00:00	t	f	4	\N	2026-03-03 10:32:35.031224	0	\N	\N	\N	0	3		
17	KAYAK-D3TUXP	booking	fixed	100	2026-06-25 09:05:36.511	t	f	\N	4	2026-03-25 09:05:36.512353	0	\N	\N	21	0	0		
18	KAYAK-2R27JE	booking	fixed	100	2026-07-26 07:20:50.259	t	f	\N	2	2026-04-26 07:20:50.260678	0	\N	\N	23	0	0		
19	KAYAK-UAJ89T	booking	fixed	100	2026-07-26 08:45:21.194	t	f	\N	2	2026-04-26 08:45:21.195497	0	\N	\N	24	0	0		
20	KAYAK-LBL4PL	booking	fixed	100	2026-07-26 08:53:37.327	t	f	\N	2	2026-04-26 08:53:37.328054	0	\N	\N	26	0	0		
21	KAYAK-AQYCD4	booking	fixed	100	2026-07-26 08:53:37.337	t	f	\N	2	2026-04-26 08:53:37.337785	0	\N	\N	25	0	0		
\.


--
-- Data for Name: email_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_settings (id, from_name, from_email, smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, enabled) FROM stdin;
1	Local Goa Kayaking	goayachtworld@gmail.com	smtp.gmail.com	587	goayachtworld@gmail.com	icbomueicgjvvftl	t	t
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_templates (id, status, subject, body) FROM stdin;
3	booking_cancelled	Booking Cancelled — Local Goa Kayaking #[Booking ID]	Hello [Full Name],\n\nWe are sorry to inform you that your booking has been cancelled.\n\n📋 Booking Details:\n  • Booking ID : #[Booking ID]\n  • Service    : [Service Name]\n  • Date       : [Booking Date]\n  • Time       : [Booking Time]\n  • Reason     : [Cancel Reason]\n\nIf you would like to rebook or have any questions, please visit our website or contact us directly.\n\nThank you for your understanding.\nLocal Goa Kayaking
4	booking_rescheduled	Booking Rescheduled 🔄 — Local Goa Kayaking #[Booking ID]	Hello [Full Name],\n\nYour booking has been rescheduled. Here are your updated details:\n\n📋 Updated Booking Details:\n  • Booking ID : #[Booking ID]\n  • Service    : [Service Name]\n  • New Date   : [Booking Date]\n  • New Time   : [Booking Time]\n  • Guests     : [Pax Number]\n\nIf you have any questions, please contact us.\n\nSee you on the water! 🌊\nLocal Goa Kayaking
2	booking_confirmed	Booking Confirmed ✅ — Local Goa Kayaking #[Booking ID]	Hello [Full Name],\n\nGreat news — your booking is CONFIRMED! 🎉\n\n📋 Booking Details:\n  • Booking ID : #[Booking ID]\n  • Service    : [Service Name]\n  • Date       : [Booking Date]\n  • Time       : [Booking Time]\n  • Guests     : [Pax Number]\n\nPlease arrive 15 minutes before your scheduled time. We are excited to see you on the water!\n\nSee you soon! 🚣\nLocal Goa Kayaking\n\nYou earned a Booking coupon [Booking Coupon] expiring in [Coupon Expiry Days] days
1	booking_created	Booking Received — Local Goa Kayaking #[Booking ID]	Hello [Full Name],\n\nThank you for booking with Local Goa Kayaking! 🎉\n\nYour booking has been received and is currently pending confirmation. We will verify your payment and update you shortly.\n\n📋 Booking Details:\n  • Booking ID : #[Booking ID]\n  • Service    : [Service Name]\n  • Date       : [Booking Date]\n  • Time       : [Booking Time]\n  • Guests     : [Pax Number]\n  • Total      : ₹[Total Amount][GST Summary]\n\nIf you have any questions, reply to this email or WhatsApp us anytime.\n\nSee you on the water! 🌊\nLocal Goa Kayaking
\.


--
-- Data for Name: faqs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.faqs (id, summary, description, sort_order, created_at) FROM stdin;
1	Do We Need Kayaking Experience?	No, our tours are suitable for all levels of experience, including first-timers. Our experienced guides will provide instruction and ensure that you have a safe and enjoyable experience.	0	2026-03-03 12:32:40.239315
2	What should be Minimum Age?	Our tours are suitable for all ages, but we recommend that children be at least 5 years old to participate. Children under 18 must be accompanied by an adult.	1	2026-03-03 12:33:14.348368
\.


--
-- Data for Name: inclusions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inclusions (id, name, icon) FROM stdin;
1	Towel	GlassWater
\.


--
-- Data for Name: ledger_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ledger_entries (id, account_head_id, type, amount, notes, entry_date, from_account_id, to_account_id, created_at) FROM stdin;
72	5	receivable	1770	Token received (incl. GST) - Siddhant Sap (#0023) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:39:32.668944
73	6	receivable	4500	Balance received - Siddhant Sap (#0023) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:39:32.672523
74	7	receivable	1770	Token received (HDFC BANK, incl. GST) - Siddhant Sap (#0023) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:39:32.67548
75	7	receivable	4500	Balance received (Petty Cash) - Siddhant Sap (#0023) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:39:32.678564
76	5	receivable	9912	Token received (incl. GST) - Siddhant Sap (#0024) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:45:20.861078
77	7	receivable	9912	Token received (HDFC BANK, incl. GST) - Siddhant Sap (#0024) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:46:34.939539
78	5	receivable	1313	Token received (incl. GST) - Siddhant Sap (#0025) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:52:36.150191
79	6	receivable	1250	Balance received - Siddhant Sap (#0025) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:52:36.153056
80	5	receivable	1750	Token received (incl. GST) - Siddhant Sap (#0026) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:53:05.507742
81	6	receivable	15750	Balance received - Siddhant Sap (#0026) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:53:05.510724
82	7	receivable	1750	Token received (HDFC BANK, incl. GST) - Siddhant Sap (#0026) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:53:52.059478
83	7	receivable	15750	Balance received (Petty Cash) - Siddhant Sap (#0026) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:53:52.062043
84	7	receivable	1313	Token received (HDFC BANK, incl. GST) - Siddhant Sap (#0025) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:53:54.884155
85	7	receivable	1250	Balance received (Petty Cash) - Siddhant Sap (#0025) - 2026-04-26	2026-04-26	\N	\N	2026-04-26 08:53:54.886674
86	5	receivable	1770	Token received (incl. GST) - Siddhant Sap (#0027) - 2026-05-02	2026-05-02	\N	\N	2026-05-02 12:20:42.851151
87	6	receivable	1500	Balance received - Siddhant Sap (#0027) - 2026-05-02	2026-05-02	\N	\N	2026-05-02 12:20:42.941044
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, is_read, type, booking_id, created_at) FROM stdin;
60	4	Booking Confirmed!	Your booking #0021 for Kayaking + Gold Package on 2026-03-25 at 09:00 AM has been confirmed. See you on the water! 🎉	f	booking_confirmed	21	2026-03-25 09:05:36.508663
61	4	You've earned a coupon! 🎟️	Thanks for booking with us! Use code KAYAK-D3TUXP for ₹100 off on your next booking. Valid until 25 Jun 2026. Share it with a friend too!	t	coupon_earned	21	2026-03-25 09:05:36.522233
\.


--
-- Data for Name: payment_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_settings (id, company_name, upi_link, success_message, failed_message, site_url, seo_keywords, boarding_location, boarding_pass_terms, boarding_pass_disclaimer, google_review_url, proprietor_name, proprietor_number, gst_number, registered_business_name, business_address, contact_person, boarding_message, contact_number, payment_mode, phonepe_client_id, phonepe_client_secret, phonepe_client_version, phonepe_env, phonepe_webhook_username, phonepe_webhook_password) FROM stdin;
1	Local Goa Kayaking		Thank you! Your booking is confirmed. We'll see you on the water!	Payment could not be confirmed. Please contact us for assistance.		{}	https://maps.app.goo.gl/DZ8TxN5WZwzZ6M1p6	Payment is due within 7, 10, or 30 days of the invoice date. The client receives a 2% discount if payment is made within 10 days of the invoice date; otherwise, the full payment is due in 30 days. The full payment must be made before the work or delivery of goods begins.	Group sea kayaking in Goa safety is a complicated issue. This model is a good place to start for paddlers looking for group management advice, but it runs the risk of isolating mutually-dependent factors. The precepts overlap and influence one another; ideally, we should keep all four elements in mind during a sea kayaking in Goa trip. It can gradually become part of the routine to consider all factors at all times with training and experience; as we gain experience, it’s also helpful to focus on each element to better understand its application in an overall approach to safer sea kayaking in Goa.\n\nFinally, I hope that the ideas in this article will reinforce existing good practices and serve as a starting point for further discussion among sea kayak groups.	https://maps.app.goo.gl/DZ8TxN5WZwzZ6M1p6	Mr. Siddhant Saptoji	+91-7770044447							manual			1	sandbox		
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referrals (id, name, code, commission_type, commission_value, total_paid_out, created_at, phone, linked_coupon_code) FROM stdin;
2	Goainsider	GOANS	fixed	100	0	2026-03-24 11:52:41.338539	9673244860	GOAINSIDER500
\.


--
-- Data for Name: reminder_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reminder_settings (id, reminders, email_enabled, wa_enabled, email_subject, email_body, wa_template, review_enabled, review_after_value, review_after_unit, review_email_subject, review_email_body, review_wa_template, review_triggers) FROM stdin;
1	[{"id": "5d", "unit": "days", "label": "5 Days Before", "value": 5, "enabled": true}, {"id": "1d", "unit": "days", "label": "1 Day Before", "value": 1, "enabled": true}, {"id": "2h", "unit": "hours", "label": "2 Hours Before", "value": 2, "enabled": true}]	t	f	Reminder: Your upcoming trip with Local Goa Kayaking	Hello [Full Name],\n\nThis is a reminder — Auto-generated.\nYou have an upcoming trip with Local Goa Kayaking! 🚣\n\n📋 Booking Details:\n  • Booking ID  : #[Booking ID]\n  • Service     : [Service Name]\n  • Date        : [Booking Date]\n  • Time        : [Booking Time]\n  • Guests      : [Pax Number]\n  • Total       : ₹[Total Amount]\n\nIf you have any questions, reply to this email or WhatsApp us anytime.\nYour guide: [Staff Name] – [Staff Contact]\n\nSee you on the water! 🌊\nLocal Goa Kayaking	Hello [Full Name] ⏰\n\nReminder: You have an upcoming trip!\n\n📋 Booking Details:\n• Booking ID : #[Booking ID]\n• Service    : [Service Name]\n• Date       : [Booking Date]\n• Time       : [Booking Time]\n• Guests     : [Pax Number] pax\n\nYour guide: [Staff Name] – [Staff Contact]\n\nSee you soon! 🌊\n— Local Goa Kayaking	t	2	hours	How was your experience? — Local Goa Kayaking	Hello [Full Name] sir/madam,\n\nHope you had a lovely experience with us. We can't wait to see you again!\n\nPlease help us by rating our business on Google: [Google Review URL]\n\nThank you so much for your support! 🙏\n\nWarm regards,\nLocal Goa Kayaking\n[Proprietor Name]\n[Proprietor Number]	Hello [Full Name] sir/madam,\n\nHope you had a lovely experience with us. We can't wait to see you again! 🚣\n\nPlease help us to rate our business on Google:\n\nThank you! 🙏	[]
\.


--
-- Data for Name: sent_reminders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sent_reminders (id, booking_id, reminder_key, sent_at) FROM stdin;
1	17	5d	2026-03-25 10:19:26.620483
2	20	5d	2026-03-25 10:19:31.159359
3	21	review-rating-review-rating	2026-03-25 11:03:32.058284
4	20	1d	2026-03-25 15:09:11.808407
5	17	1d	2026-03-26 03:48:19.013354
6	17	2h	2026-03-26 16:24:07.733116
39	20	review-rating-review-rating	2026-03-26 17:44:00.127777
40	17	review-rating-review-rating	2026-04-03 07:30:55.935508
41	19	review-rating-review-rating	2026-04-03 07:30:57.72352
42	22	5d	2026-04-26 06:35:07.155308
\.


--
-- Data for Name: service_blackout_dates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_blackout_dates (id, service_id, date, reason, created_at) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, name, description, price, image_url, duration, age_group, time_slots, is_active, photos, inclusion_ids, min_pax, mrp_price, price_type, category_id, check_in_time, check_out_time, bedrooms, adult_occupancy, kids_occupancy, booking_type, manual_wa_number, manual_email, video_url, gst_percent, gst_mode, display_sequence, daily_online_limit) FROM stdin;
5	Lavander Villa		10000	/objects/uploads/3657271c-30db-4e6b-8bb7-bcde2e129c37.jpg	2 Hours	\N	{}	t	{}	{1}	0	12000	night	1	12:00 PM	11:00 AM	2	4	2	online	\N	\N	\N	0	exclusive	\N	0
2	Sunrise Kayaking	Start your day with a calm sunrise paddle.	1200	/objects/uploads/f8bbf943-198e-43bf-a83c-aec2740b2903.jpg	2 Hours	All Ages	{"06:00 AM","08:30 AM"}	t	{}	{}	0	\N	pax	\N	\N	\N	0	0	0	online	\N	\N	\N	18	exclusive	\N	0
1	Sunset Kayaking	Experience a beautiful sunset on the water.	1500	https://images.unsplash.com/photo-1544551763-46a013bb70d5	2 Hours	All Ages	{"04:00 PM","05:30 PM"}	t	{/objects/uploads/c5fbea11-5ca2-40ab-94ee-bbc7ecfee11b.jpg}	{}	2	\N	pax	2	\N	\N	0	0	0	online	\N	\N	https://www.instagram.com/p/C1mWrorJhrY/	18	exclusive	\N	0
3	Kayaking + Adventure Tour	Kayaking combined with a thrilling adventure trail.	2500	https://images.unsplash.com/photo-1533086723868-6060511e4168	4 Hours	Only Adults	{"08:00 AM","02:00 PM"}	t	{}	{}	5	3000	group	\N	\N	\N	0	0	0	online	\N	\N	\N	5	exclusive	\N	0
4	Kayaking + Gold Package	Premium kayaking experience with photos and meal.	3500	https://images.unsplash.com/photo-1560060935-779836362d29	5 Hours	All Ages	{"09:00 AM","03:00 PM"}	t	{}	{}	0	\N	pax	\N	\N	\N	0	0	0	online	\N	\N	\N	18	inclusive	\N	0
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
5TXlmJtyqSF9P22vZ9NU6VlIGp0A4kpq	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T11:56:41.980Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-09 11:56:42
oiGYF8WWoTnny-I7ZgLoJzhbplQYK-VB	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T11:56:41.986Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-09 11:56:42
aILKorPrQz097irq_wLzQIG2H6L6x3C7	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T11:56:41.990Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-09 11:56:42
iFUXQtbBk9LD9VbroeshKCiTkDnlJWFN	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T11:56:41.992Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-09 11:56:42
0L27P6XTQIRN4Edi_q2k2dgy9GUwOSWm	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T12:51:10.039Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-09 12:51:41
rEuvStcSqLQZ61v4rSB6DqdCY4qYx2a_	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T11:57:35.537Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":2}	2026-05-16 10:16:56
y5U-H8AJmgpeOwoV2ntI-LwpyoMB-_kJ	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T11:31:29.321Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-09 11:31:42
nFchbLw5wOIYcRswu18qydQhRSAKul72	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-16T10:15:21.028Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-16 10:15:22
ogFL82IhJt5WjVQK4M_CguX3Jy4exhL4	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T11:47:25.028Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-09 11:47:36
2hgXOalQs6fsK7mwpywzdyEiiVw-_src	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-16T09:56:35.850Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-16 09:56:46
GZyFgFZidbS1ysuBJXcTddRwWsWKUgQM	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T12:03:21.561Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-09 12:22:45
gx7PgteH3bG20xcdHZwCxCiVKBWfHxYx	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-16T10:14:15.092Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-16 10:15:20
15hLlJy8-EW8G8BYgMnGHDmPuhc7f8l1	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-16T10:15:21.092Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-16 10:15:22
FW4igwfvvoTYH3F1T0iwRhTXDQTcywVa	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T11:56:41.981Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-09 11:56:42
8H7k1nGfzjLSUCGY4EEsNyoIq94ks-Ul	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T11:56:41.989Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-05-09 11:56:42
\.


--
-- Data for Name: staffs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staffs (id, full_name, contact_number, address, shifts, is_active, created_at) FROM stdin;
1	Sunil kumar	9673244860		{Afternoon}	t	2026-03-03 12:31:33.418848
\.


--
-- Data for Name: tide_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tide_settings (id, stormglass_api_key, latitude, longitude, location_name, show_on_home) FROM stdin;
1	cc18ca1e-28ee-11f1-af8e-0242ac120004-cc18ca82-28ee-11f1-af8e-0242ac120004	15.6445	73.8368	Colvale,  Revora	t
\.


--
-- Data for Name: upload_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.upload_settings (id, google_drive_folder_id, storage_mode, cpanel_host, cpanel_username, cpanel_password, cpanel_port, cpanel_remote_path, cpanel_public_url) FROM stdin;
1		drive				21	/public_html/uploads/	
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, mobile_number, password, is_admin, full_name, phone_number, whatsapp_number, email, date_of_birth, username, login_pin) FROM stdin;
2	7770044447	admin	t	Siddhant Sap	\N	\N	goayachtworld@gmail.com	\N	\N	7777
4	+919673244860	$2b$10$AbLdnvhdUYXVzweoWKrKauuZNs9iMCSair/INpnfJb/3hE.YwZH12	f	Sunil Yadav	+919673244860	\N	sunil09623@gmail.com	\N	\N	\N
\.


--
-- Data for Name: visitor_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.visitor_sessions (id, session_id, date, created_at, last_seen) FROM stdin;
1	di33n38ngywmn4lhv3v	2026-03-24	2026-03-24 12:32:53.96285	2026-03-24 14:32:06.288163
4	4l50bb6yn59mn4pscss	2026-03-24	2026-03-24 14:33:01.923603	2026-03-24 14:33:01.923603
1296	pauw7jh0qomoocbnhl	2026-05-02	2026-05-02 12:51:13.479451	2026-05-02 12:51:40.10134
7	jvkwft51z2mn4r7a36	2026-03-24	2026-03-24 15:12:37.869686	2026-03-24 15:12:43.430323
1299	rcoig53tw0pmn4lh0b9	2026-05-03	2026-05-03 04:55:33.961252	2026-05-03 05:54:24.35418
11	afxmjfjt4xemn4rhvhd	2026-03-24	2026-03-24 15:20:52.152672	2026-03-24 15:20:52.152672
325	uxjre12oesmn5rkxjw	2026-03-25	2026-03-25 08:11:00.974635	2026-03-25 08:11:00.974635
585	iczifneonumn77ulxa	2026-03-26	2026-03-26 08:34:12.485359	2026-03-26 08:43:42.22403
444	h7wnlypx1fmn5wa92h	2026-03-25	2026-03-25 10:22:40.764654	2026-03-25 10:22:40.764654
902	wuchraqnammoddj7xf	2026-04-24	2026-04-24 20:39:38.238481	2026-04-24 20:39:38.238481
1334	rcoig53tw0pmn4lh0b9	2026-05-04	2026-05-04 10:51:21.445815	2026-05-04 11:16:57.925205
1337	rcoig53tw0pmn4lh0b9	2026-05-05	2026-05-05 17:22:11.633551	2026-05-05 17:35:42.334892
966	2iaz2cewkzimodem04u	2026-04-24	2026-04-24 21:09:47.700706	2026-04-24 21:09:47.700706
451	tlva0ctyqtimn5xq7um	2026-03-25	2026-03-25 11:03:05.29705	2026-03-25 11:03:05.29705
23	j9dy2go8mpmn4xms5a	2026-03-24	2026-03-24 18:12:38.81443	2026-03-24 18:12:38.81443
1029	2c70f7c4gcmodgxmeq	2026-04-24	2026-04-24 22:14:49.0175	2026-04-24 22:14:49.0175
335	w5k704tucemmn5s5usv	2026-03-25	2026-03-25 08:27:17.189548	2026-03-25 08:30:16.648617
712	79tjrcf2k65mob0xwbj	2026-04-24	2026-04-24 17:48:10.458455	2026-04-24 22:20:32.473681
462	gsg15b2mnytmn658ld2	2026-03-25	2026-03-25 14:33:19.93279	2026-03-25 14:33:19.93279
597	c4lbid6medrmn78dmey	2026-03-26	2026-03-26 08:48:59.586315	2026-03-26 08:58:32.334039
612	cdz37xx24tdmn7bgz2y	2026-03-26	2026-03-26 10:15:34.820272	2026-03-26 10:15:34.820272
734	lg8yfhcjd78mod8l97z	2026-04-24	2026-04-24 18:21:15.318232	2026-04-24 22:21:14.757074
2	rcoig53tw0pmn4lh0b9	2026-03-24	2026-03-24 12:32:58.334687	2026-03-24 23:15:06.51081
350	ryy842khi4omn5spl0s	2026-03-25	2026-03-25 08:42:37.62788	2026-03-25 08:42:53.523963
614	mau7gclaqjmn7bpoge	2026-03-26	2026-03-26 10:22:20.954204	2026-03-26 10:23:30.440079
921	kna5sf2zhelmode1ewg	2026-04-24	2026-04-24 20:53:47.06143	2026-04-24 20:53:47.06143
1040	rcoig53tw0pmn4lh0b9	2026-04-26	2026-04-26 06:34:44.380319	2026-04-26 08:56:42.852744
1043	vpyfw72dqvmofeavej	2026-04-26	2026-04-26 06:36:40.710427	2026-04-26 06:36:40.710427
1054	k02zditgk3hmofews4e	2026-04-26	2026-04-26 06:53:43.03726	2026-04-26 08:57:54.233438
1350	gaxndlcdo58moy668i9	2026-05-09	2026-05-09 09:56:44.82921	2026-05-09 09:56:44.82921
362	7ws79qhdox2mn5t2as4	2026-03-25	2026-03-25 08:52:30.885505	2026-03-25 08:52:30.938745
310	m5rkbplnblsmn5pnd7b	2026-03-25	2026-03-25 07:16:55.341185	2026-03-25 07:16:55.341185
478	jd92igem8ujmn66y509	2026-03-25	2026-03-25 15:21:11.394563	2026-03-25 15:21:11.394563
1116	fisqlqta4zqmofglk5v	2026-04-26	2026-04-26 07:40:58.585025	2026-04-26 07:40:58.585025
627	4xa9bhbmlrmn7d0e42	2026-03-26	2026-03-26 10:58:40.377176	2026-03-26 10:58:40.377176
1243	0sv5aodm5r3imoo9h4kt	2026-05-02	2026-05-02 11:31:30.048636	2026-05-02 11:31:41.682333
797	5qbqrgd2ghdmoda45az	2026-04-24	2026-04-24 19:03:56.127866	2026-04-24 19:07:27.263368
169	rcoig53tw0pmn4lh0b9	2026-03-25	2026-03-25 00:00:39.320905	2026-03-25 15:33:54.505397
433	8r2xkodw6knmn5v6ufg	2026-03-25	2026-03-25 09:52:02.207474	2026-03-25 09:52:02.207474
696	qnbmfsk4h0kmn7rly64	2026-03-26	2026-03-26 17:47:20.784427	2026-03-26 17:47:20.784427
994	pvw7c0k6grpmodfrrh5	2026-04-24	2026-04-24 21:42:16.035817	2026-04-24 21:42:16.035817
861	omn80m3w6ihmodcc6t7	2026-04-24	2026-04-24 20:06:10.587893	2026-04-24 20:13:12.605612
518	rcoig53tw0pmn4lh0b9	2026-03-26	2026-03-26 03:47:56.031616	2026-03-26 17:49:10.309105
522	evo7utumu4mn6xz1al	2026-03-26	2026-03-26 03:57:42.866335	2026-03-26 03:57:52.851198
701	nr6ldruwdnmnilbdad	2026-04-03	2026-04-03 07:36:37.400021	2026-04-03 07:36:37.400021
700	rcoig53tw0pmn4lh0b9	2026-04-03	2026-04-03 07:30:34.514315	2026-04-03 07:36:40.298873
527	05vr7ahfur23mn6ya2dj	2026-03-26	2026-03-26 04:06:17.486965	2026-03-26 04:06:17.486965
703	mhby6eaq0lfmnwut16d	2026-04-13	2026-04-13 07:11:04.657742	2026-04-13 07:11:51.813674
1187	asil9a7x1yumofirvbp	2026-04-26	2026-04-26 08:41:52.23636	2026-04-26 08:41:52.23636
529	8rh2h8hldx4mn6ygjpl	2026-03-26	2026-03-26 04:11:19.887066	2026-03-26 04:11:19.945149
705	rcoig53tw0pmn4lh0b9	2026-04-13	2026-04-13 17:38:34.777808	2026-04-13 17:53:56.133312
709	79tjrcf2k65mob0xwbj	2026-04-23	2026-04-23 05:11:35.794896	2026-04-23 05:12:36.409185
1362	8l178zv0noxmoy6sstu	2026-05-09	2026-05-09 10:14:17.610156	2026-05-09 10:15:19.025741
1339	rcoig53tw0pmn4lh0b9	2026-05-09	2026-05-09 09:45:17.180415	2026-05-09 10:16:30.726168
1066	uxld56bwkdmoffdmqa	2026-04-26	2026-04-26 07:06:49.057669	2026-04-26 07:10:00.057031
543	fncbjw95bxamn75qe4w	2026-03-26	2026-03-26 07:34:56.604755	2026-03-26 07:35:38.635853
720	07artm0ed7wcmod7xt64	2026-04-24	2026-04-24 18:03:01.232554	2026-04-24 18:03:08.44786
730	495ywzz8eysmod8azyu	2026-04-24	2026-04-24 18:13:16.57307	2026-04-24 18:17:09.062102
1145	03rq3qpm2s0ymofhoza7	2026-04-26	2026-04-26 08:11:37.764687	2026-04-26 08:11:37.764687
1258	yol5cucaa3mooam5jk	2026-05-02	2026-05-02 12:03:24.199725	2026-05-02 12:22:43.921903
567	6vvbbu5efn7mn776n97	2026-03-26	2026-03-26 08:15:34.466312	2026-03-26 08:15:43.733809
1240	rcoig53tw0pmn4lh0b9	2026-05-02	2026-05-02 11:19:02.195896	2026-05-02 12:46:41.986084
747	bu60w8cw8hrmod91ixz	2026-04-24	2026-04-24 18:33:54.225807	2026-04-24 18:43:50.125698
\.


--
-- Data for Name: whatsapp_queue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.whatsapp_queue (id, booking_id, customer_phone, customer_name, template_key, message, is_sent, created_at) FROM stdin;
\.


--
-- Data for Name: whatsapp_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.whatsapp_settings (id, admin_number, enabled, meta_phone_number_id, meta_access_token) FROM stdin;
1	917770044447	f		
\.


--
-- Data for Name: whatsapp_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.whatsapp_templates (id, status, template) FROM stdin;
1	booking_created	Hello [Full Name] 🎉\n\nYour kayaking booking has been received!\n\n📋 Booking Details:\n• Service: [Service Name]\n• Date: [Booking Date]\n• Time: [Booking Time]\n• Pax: [Pax Number] pax\n• Total: ₹[Total Amount]\n\nPlease wait while we verify your payment and confirm your booking. We will update you shortly!\n\n— Local Goa Kayaking 🌊
2	pending_confirmation	Hello [Full Name] ⏳\n\nYour booking is pending payment confirmation.\n\n📋 Booking Details:\n• Service: [Service Name]\n• Date: [Booking Date]\n• Time: [Booking Time]\n• Pax: [Pax Number] pax\n• Total: ₹[Total Amount]\n\nPlease share your payment screenshot. We will confirm soon!\n\n— Local Goa Kayaking 🌊
3	booking_confirmed	Hello [Full Name] ✅\n\nYour booking is CONFIRMED! We are excited to see you on the water!\n\n📋 Booking Details:\n• Service: [Service Name]\n• Date: [Booking Date]\n• Time: [Booking Time]\n• Pax: [Pax Number] pax\n\nPlease arrive 15 minutes before your scheduled time. See you soon! 🚣\n\n— Local Goa Kayaking 🌊
5	booking_rescheduled	Hello [Full Name] 🔄\n\nYour booking has been rescheduled!\n\n📋 Updated Booking Details:\n• Service: [Service Name]\n• New Date: [Booking Date]\n• New Time: [Booking Time]\n• Pax: [Pax Number] pax\n\nSee you on the water! 🌊\n\n— Local Goa Kayaking
4	booking_cancelled	Hello [Full Name] ❌\n\nUnfortunately your booking has been cancelled.\n\n📋 Booking Details:\n• Service: [Service Name]\n• Date: [Booking Date]\n• Time: [Booking Time]\n• Reason: [Cancel Reason]\n\nIf you would like to rebook, please visit our website or contact us.\n\n— Local Goa Kayaking 🌊
\.


--
-- Name: account_heads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.account_heads_id_seq', 7, true);


--
-- Name: app_policies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.app_policies_id_seq', 1, true);


--
-- Name: banners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.banners_id_seq', 1, true);


--
-- Name: booking_manual_reminders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.booking_manual_reminders_id_seq', 1, false);


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bookings_id_seq', 27, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 2, true);


--
-- Name: chat_widget_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_widget_settings_id_seq', 1, false);


--
-- Name: coupon_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupon_settings_id_seq', 1, true);


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupons_id_seq', 21, true);


--
-- Name: email_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_settings_id_seq', 1, true);


--
-- Name: email_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_templates_id_seq', 4, true);


--
-- Name: faqs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.faqs_id_seq', 2, true);


--
-- Name: inclusions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inclusions_id_seq', 1, true);


--
-- Name: ledger_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ledger_entries_id_seq', 87, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 83, true);


--
-- Name: payment_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_settings_id_seq', 1, true);


--
-- Name: referrals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.referrals_id_seq', 2, true);


--
-- Name: reminder_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reminder_settings_id_seq', 1, true);


--
-- Name: sent_reminders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sent_reminders_id_seq', 42, true);


--
-- Name: service_blackout_dates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.service_blackout_dates_id_seq', 1, false);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.services_id_seq', 5, true);


--
-- Name: staffs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.staffs_id_seq', 1, true);


--
-- Name: tide_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tide_settings_id_seq', 1, true);


--
-- Name: upload_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.upload_settings_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: visitor_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.visitor_sessions_id_seq', 1367, true);


--
-- Name: whatsapp_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.whatsapp_queue_id_seq', 1, false);


--
-- Name: whatsapp_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.whatsapp_settings_id_seq', 1, false);


--
-- Name: whatsapp_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.whatsapp_templates_id_seq', 5, true);


--
-- Name: account_heads account_heads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_heads
    ADD CONSTRAINT account_heads_pkey PRIMARY KEY (id);


--
-- Name: app_policies app_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_policies
    ADD CONSTRAINT app_policies_pkey PRIMARY KEY (id);


--
-- Name: app_policies app_policies_policy_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_policies
    ADD CONSTRAINT app_policies_policy_type_key UNIQUE (policy_type);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: booking_manual_reminders booking_manual_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_manual_reminders
    ADD CONSTRAINT booking_manual_reminders_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: chat_widget_settings chat_widget_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_widget_settings
    ADD CONSTRAINT chat_widget_settings_pkey PRIMARY KEY (id);


--
-- Name: coupon_settings coupon_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_settings
    ADD CONSTRAINT coupon_settings_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: email_settings email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_status_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_status_key UNIQUE (status);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: inclusions inclusions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inclusions
    ADD CONSTRAINT inclusions_pkey PRIMARY KEY (id);


--
-- Name: ledger_entries ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payment_settings payment_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT payment_settings_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_code_key UNIQUE (code);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: reminder_settings reminder_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_settings
    ADD CONSTRAINT reminder_settings_pkey PRIMARY KEY (id);


--
-- Name: sent_reminders sent_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_reminders
    ADD CONSTRAINT sent_reminders_pkey PRIMARY KEY (id);


--
-- Name: service_blackout_dates service_blackout_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_blackout_dates
    ADD CONSTRAINT service_blackout_dates_pkey PRIMARY KEY (id);


--
-- Name: service_blackout_dates service_blackout_dates_service_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_blackout_dates
    ADD CONSTRAINT service_blackout_dates_service_id_date_key UNIQUE (service_id, date);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: staffs staffs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT staffs_pkey PRIMARY KEY (id);


--
-- Name: tide_settings tide_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tide_settings
    ADD CONSTRAINT tide_settings_pkey PRIMARY KEY (id);


--
-- Name: upload_settings upload_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_settings
    ADD CONSTRAINT upload_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_mobile_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_mobile_number_unique UNIQUE (mobile_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: visitor_sessions visitor_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitor_sessions
    ADD CONSTRAINT visitor_sessions_pkey PRIMARY KEY (id);


--
-- Name: visitor_sessions visitor_sessions_session_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitor_sessions
    ADD CONSTRAINT visitor_sessions_session_id_date_key UNIQUE (session_id, date);


--
-- Name: whatsapp_queue whatsapp_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_queue
    ADD CONSTRAINT whatsapp_queue_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_settings whatsapp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_settings
    ADD CONSTRAINT whatsapp_settings_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_templates whatsapp_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_templates whatsapp_templates_status_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_status_key UNIQUE (status);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_manual_reminders_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manual_reminders_booking ON public.booking_manual_reminders USING btree (booking_id);


--
-- Name: idx_manual_reminders_unsent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manual_reminders_unsent ON public.booking_manual_reminders USING btree (is_sent, scheduled_at);


--
-- Name: idx_visitor_sessions_last_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitor_sessions_last_seen ON public.visitor_sessions USING btree (last_seen);


--
-- Name: bookings bookings_service_id_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: bookings bookings_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id);


--
-- Name: bookings bookings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ledger_entries ledger_entries_account_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_account_head_id_fkey FOREIGN KEY (account_head_id) REFERENCES public.account_heads(id);


--
-- Name: ledger_entries ledger_entries_from_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_from_account_id_fkey FOREIGN KEY (from_account_id) REFERENCES public.account_heads(id);


--
-- Name: ledger_entries ledger_entries_to_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_to_account_id_fkey FOREIGN KEY (to_account_id) REFERENCES public.account_heads(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: service_blackout_dates service_blackout_dates_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_blackout_dates
    ADD CONSTRAINT service_blackout_dates_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: services services_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- PostgreSQL database dump complete
--

\unrestrict bRMfZipfYw8c7pAfifb4PnLKJfWnqldErVjqwHFF7zrtBlNLLf4CH4Ht7bBClXs

