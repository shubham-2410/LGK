--
-- PostgreSQL database dump
--

\restrict uxrlAtI551FDh3QL79syt3xj1S4ImsEtXel2dSKm8dcl77nM9c5NfvEueurgs7B

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: banners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banners (
    id integer NOT NULL,
    title text NOT NULL,
    image_url text NOT NULL,
    is_active boolean DEFAULT true,
    expires_at text
);


ALTER TABLE public.banners OWNER TO postgres;

--
-- Name: banners_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.banners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.banners_id_seq OWNER TO postgres;

--
-- Name: banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.banners_id_seq OWNED BY public.banners.id;


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
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
    whatsapp_consent boolean DEFAULT true NOT NULL
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookings_id_seq OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: coupon_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupon_settings (
    id integer NOT NULL,
    booking_coupon_enabled boolean DEFAULT false,
    booking_coupon_expiry_months integer DEFAULT 3,
    booking_coupon_discount_type text DEFAULT 'percentage'::text,
    booking_coupon_discount_value integer DEFAULT 10
);


ALTER TABLE public.coupon_settings OWNER TO postgres;

--
-- Name: coupon_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coupon_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coupon_settings_id_seq OWNER TO postgres;

--
-- Name: coupon_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coupon_settings_id_seq OWNED BY public.coupon_settings.id;


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: postgres
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
    min_pax integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.coupons OWNER TO postgres;

--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coupons_id_seq OWNER TO postgres;

--
-- Name: coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;


--
-- Name: email_settings; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.email_settings OWNER TO postgres;

--
-- Name: email_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_settings_id_seq OWNER TO postgres;

--
-- Name: email_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_settings_id_seq OWNED BY public.email_settings.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    status text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL
);


ALTER TABLE public.email_templates OWNER TO postgres;

--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_templates_id_seq OWNER TO postgres;

--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faqs (
    id integer NOT NULL,
    summary text NOT NULL,
    description text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.faqs OWNER TO postgres;

--
-- Name: faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faqs_id_seq OWNER TO postgres;

--
-- Name: faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faqs_id_seq OWNED BY public.faqs.id;


--
-- Name: inclusions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inclusions (
    id integer NOT NULL,
    name text NOT NULL,
    icon text DEFAULT 'Star'::text NOT NULL
);


ALTER TABLE public.inclusions OWNER TO postgres;

--
-- Name: inclusions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inclusions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inclusions_id_seq OWNER TO postgres;

--
-- Name: inclusions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inclusions_id_seq OWNED BY public.inclusions.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: payment_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_settings (
    id integer NOT NULL,
    company_name text DEFAULT 'Local Goa Kayaking'::text NOT NULL,
    upi_link text DEFAULT ''::text NOT NULL,
    success_message text DEFAULT 'Thank you! Your booking is confirmed. We''ll see you on the water!'::text NOT NULL,
    failed_message text DEFAULT 'Payment could not be confirmed. Please contact us for assistance.'::text NOT NULL,
    site_url text DEFAULT ''::text
);


ALTER TABLE public.payment_settings OWNER TO postgres;

--
-- Name: payment_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_settings_id_seq OWNER TO postgres;

--
-- Name: payment_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_settings_id_seq OWNED BY public.payment_settings.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
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
    min_pax integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: staffs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.staffs OWNER TO postgres;

--
-- Name: staffs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.staffs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staffs_id_seq OWNER TO postgres;

--
-- Name: staffs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staffs_id_seq OWNED BY public.staffs.id;


--
-- Name: upload_settings; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.upload_settings OWNER TO postgres;

--
-- Name: upload_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.upload_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.upload_settings_id_seq OWNER TO postgres;

--
-- Name: upload_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.upload_settings_id_seq OWNED BY public.upload_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: whatsapp_queue; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.whatsapp_queue OWNER TO postgres;

--
-- Name: whatsapp_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.whatsapp_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.whatsapp_queue_id_seq OWNER TO postgres;

--
-- Name: whatsapp_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.whatsapp_queue_id_seq OWNED BY public.whatsapp_queue.id;


--
-- Name: whatsapp_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.whatsapp_settings (
    id integer NOT NULL,
    admin_number text DEFAULT ''::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    meta_phone_number_id text DEFAULT ''::text,
    meta_access_token text DEFAULT ''::text
);


ALTER TABLE public.whatsapp_settings OWNER TO postgres;

--
-- Name: whatsapp_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.whatsapp_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.whatsapp_settings_id_seq OWNER TO postgres;

--
-- Name: whatsapp_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.whatsapp_settings_id_seq OWNED BY public.whatsapp_settings.id;


--
-- Name: whatsapp_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.whatsapp_templates (
    id integer NOT NULL,
    status text NOT NULL,
    template text NOT NULL
);


ALTER TABLE public.whatsapp_templates OWNER TO postgres;

--
-- Name: whatsapp_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.whatsapp_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.whatsapp_templates_id_seq OWNER TO postgres;

--
-- Name: whatsapp_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.whatsapp_templates_id_seq OWNED BY public.whatsapp_templates.id;


--
-- Name: banners id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners ALTER COLUMN id SET DEFAULT nextval('public.banners_id_seq'::regclass);


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: coupon_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupon_settings ALTER COLUMN id SET DEFAULT nextval('public.coupon_settings_id_seq'::regclass);


--
-- Name: coupons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons ALTER COLUMN id SET DEFAULT nextval('public.coupons_id_seq'::regclass);


--
-- Name: email_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_settings ALTER COLUMN id SET DEFAULT nextval('public.email_settings_id_seq'::regclass);


--
-- Name: email_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: faqs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs ALTER COLUMN id SET DEFAULT nextval('public.faqs_id_seq'::regclass);


--
-- Name: inclusions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inclusions ALTER COLUMN id SET DEFAULT nextval('public.inclusions_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: payment_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_settings ALTER COLUMN id SET DEFAULT nextval('public.payment_settings_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: staffs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs ALTER COLUMN id SET DEFAULT nextval('public.staffs_id_seq'::regclass);


--
-- Name: upload_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upload_settings ALTER COLUMN id SET DEFAULT nextval('public.upload_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: whatsapp_queue id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_queue ALTER COLUMN id SET DEFAULT nextval('public.whatsapp_queue_id_seq'::regclass);


--
-- Name: whatsapp_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_settings ALTER COLUMN id SET DEFAULT nextval('public.whatsapp_settings_id_seq'::regclass);


--
-- Name: whatsapp_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_templates ALTER COLUMN id SET DEFAULT nextval('public.whatsapp_templates_id_seq'::regclass);


--
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banners (id, title, image_url, is_active, expires_at) FROM stdin;
1	Kayaking In Goa	/banner-kayaking.png	t	\N
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, user_id, service_id, date, time_slot, full_name, contact_number, email, pax, total_payable, amount_paid, balance, status, cancel_reason, created_at, coupon_code, coupon_discount, staff_id, whatsapp_consent) FROM stdin;
1	1	4	2026-03-18	09:00 AM	sss	+919999999999		4	14000	14000	0	confirmed	\N	2026-03-03 12:30:29.896312	\N	0	1	t
3	3	1	2026-03-14	04:00 PM	Sunil Yadav	+919673244860		2	3000	1500	1500	confirmed	\N	2026-03-05 09:31:28.379752	\N	0	1	t
4	3	1	2026-03-31	04:00 PM	Sunil Yadav	+919673244860	goayachtworld@gmail.com	2	3000	1500	1500	confirmed	\N	2026-03-05 09:34:49.268931	\N	0	1	t
2	2	2	2026-03-06	08:30 AM	abc	+91 7770044447		1	1200	1200	0	pending	\N	2026-03-04 09:55:24.928799	\N	0	\N	t
\.


--
-- Data for Name: coupon_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupon_settings (id, booking_coupon_enabled, booking_coupon_expiry_months, booking_coupon_discount_type, booking_coupon_discount_value) FROM stdin;
1	t	3	fixed	100
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupons (id, code, type, discount_type, discount_value, expires_at, is_active, is_used, used_by_user_id, created_for_user_id, created_at, min_pax) FROM stdin;
1	GOAINSIDER500	special	fixed	500	2026-03-31 00:00:00	t	f	\N	\N	2026-03-03 10:32:35.031224	0
2	LGKG5	special	percentage	10	2026-03-31 00:00:00	t	f	\N	\N	2026-03-03 10:39:18.68399	5
3	KAYAK-JC4HRA	booking	fixed	100	2026-06-03 12:31:43.203	t	f	\N	1	2026-03-03 12:31:43.204145	0
4	KAYAK-3ZU2X6	booking	fixed	100	2026-06-05 09:33:54.187	t	f	\N	3	2026-03-05 09:33:54.187851	0
5	KAYAK-4NUN7Z	booking	fixed	100	2026-06-05 09:35:44.79	t	f	\N	3	2026-03-05 09:35:44.791356	0
\.


--
-- Data for Name: email_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_settings (id, from_name, from_email, smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, enabled) FROM stdin;
1	Local Goa Kayaking			587			f	f
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_templates (id, status, subject, body) FROM stdin;
1	booking_created	Booking Received — Local Goa Kayaking #[Booking ID]	Hello [Full Name],\n\nThank you for booking with Local Goa Kayaking! 🎉\n\nYour booking has been received and is currently pending confirmation. We will verify your payment and update you shortly.\n\n📋 Booking Details:\n  • Booking ID : #[Booking ID]\n  • Service    : [Service Name]\n  • Date       : [Booking Date]\n  • Time       : [Booking Time]\n  • Guests     : [Pax Number]\n  • Total      : ₹[Total Amount]\n\nIf you have any questions, reply to this email or WhatsApp us anytime.\n\nSee you on the water! 🌊\nLocal Goa Kayaking
2	booking_confirmed	Booking Confirmed ✅ — Local Goa Kayaking #[Booking ID]	Hello [Full Name],\n\nGreat news — your booking is CONFIRMED! 🎉\n\n📋 Booking Details:\n  • Booking ID : #[Booking ID]\n  • Service    : [Service Name]\n  • Date       : [Booking Date]\n  • Time       : [Booking Time]\n  • Guests     : [Pax Number]\n\nPlease arrive 15 minutes before your scheduled time. We are excited to see you on the water!\n\nSee you soon! 🚣\nLocal Goa Kayaking
3	booking_cancelled	Booking Cancelled — Local Goa Kayaking #[Booking ID]	Hello [Full Name],\n\nWe are sorry to inform you that your booking has been cancelled.\n\n📋 Booking Details:\n  • Booking ID : #[Booking ID]\n  • Service    : [Service Name]\n  • Date       : [Booking Date]\n  • Time       : [Booking Time]\n  • Reason     : [Cancel Reason]\n\nIf you would like to rebook or have any questions, please visit our website or contact us directly.\n\nThank you for your understanding.\nLocal Goa Kayaking
4	booking_rescheduled	Booking Rescheduled 🔄 — Local Goa Kayaking #[Booking ID]	Hello [Full Name],\n\nYour booking has been rescheduled. Here are your updated details:\n\n📋 Updated Booking Details:\n  • Booking ID : #[Booking ID]\n  • Service    : [Service Name]\n  • New Date   : [Booking Date]\n  • New Time   : [Booking Time]\n  • Guests     : [Pax Number]\n\nIf you have any questions, please contact us.\n\nSee you on the water! 🌊\nLocal Goa Kayaking
\.


--
-- Data for Name: faqs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faqs (id, summary, description, sort_order, created_at) FROM stdin;
1	Do We Need Kayaking Experience?	No, our tours are suitable for all levels of experience, including first-timers. Our experienced guides will provide instruction and ensure that you have a safe and enjoyable experience.	0	2026-03-03 12:32:40.239315
2	What should be Minimum Age?	Our tours are suitable for all ages, but we recommend that children be at least 5 years old to participate. Children under 18 must be accompanied by an adult.	1	2026-03-03 12:33:14.348368
\.


--
-- Data for Name: inclusions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inclusions (id, name, icon) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, is_read, type, booking_id, created_at) FROM stdin;
3	1	You've earned a coupon! 🎟️	Thanks for booking with us! Use code KAYAK-JC4HRA for ₹100 off on your next booking. Valid until 3 Jun 2026. Share it with a friend too!	t	coupon_earned	1	2026-03-03 12:31:43.208335
2	1	Booking Confirmed!	Your booking #0001 for Kayaking + Gold Package on 2026-03-18 at 09:00 AM has been confirmed. See you on the water! 🎉	t	booking_confirmed	1	2026-03-03 12:31:43.199771
7	3	Booking Confirmed!	Your booking #0003 for Sunset Kayaking on 2026-03-14 at 04:00 PM has been confirmed. See you on the water! 🎉	f	booking_confirmed	3	2026-03-05 09:33:54.184133
8	3	You've earned a coupon! 🎟️	Thanks for booking with us! Use code KAYAK-3ZU2X6 for ₹100 off on your next booking. Valid until 5 Jun 2026. Share it with a friend too!	f	coupon_earned	3	2026-03-05 09:33:54.196163
10	3	Booking Confirmed!	Your booking #0004 for Sunset Kayaking on 2026-03-31 at 04:00 PM has been confirmed. See you on the water! 🎉	f	booking_confirmed	4	2026-03-05 09:35:44.786712
11	3	You've earned a coupon! 🎟️	Thanks for booking with us! Use code KAYAK-4NUN7Z for ₹100 off on your next booking. Valid until 5 Jun 2026. Share it with a friend too!	f	coupon_earned	4	2026-03-05 09:35:44.805323
13	2	Booking Rescheduled	Your booking #0002 for Sunrise Kayaking has been rescheduled to 2026-03-06 at 08:30 AM.	t	booking_confirmed	2	2026-03-05 10:57:36.2392
\.


--
-- Data for Name: payment_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_settings (id, company_name, upi_link, success_message, failed_message, site_url) FROM stdin;
1	Local Goa Kayaking		Thank you! Your booking is confirmed. We'll see you on the water!	Payment could not be confirmed. Please contact us for assistance.	
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, description, price, image_url, duration, age_group, time_slots, is_active, photos, inclusion_ids, min_pax) FROM stdin;
2	Sunrise Kayaking	Start your day with a calm sunrise paddle.	1200	https://images.unsplash.com/photo-1520208422220-d12a3c588e6c	2 Hours	All Ages	{"06:00 AM","08:30 AM"}	t	{}	{}	0
3	Kayaking + Adventure Tour	Kayaking combined with a thrilling adventure trail.	2500	https://images.unsplash.com/photo-1533086723868-6060511e4168	4 Hours	Only Adults	{"08:00 AM","02:00 PM"}	t	{}	{}	0
4	Kayaking + Gold Package	Premium kayaking experience with photos and meal.	3500	https://images.unsplash.com/photo-1560060935-779836362d29	5 Hours	All Ages	{"09:00 AM","03:00 PM"}	t	{}	{}	0
1	Sunset Kayaking	Experience a beautiful sunset on the water.	1500	https://images.unsplash.com/photo-1544551763-46a013bb70d5	2 Hours	All Ages	{"04:00 PM","05:30 PM"}	t	{}	{}	0
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (sid, sess, expire) FROM stdin;
ME5K3FFA1F-_dOKa8zFcFzlpiSlZDCYZ	{"cookie":{"originalMaxAge":86399999,"expires":"2026-03-06T09:32:13.474Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 09:32:14
3JRtyexfkccDinbfjMZeJY4LqhqjNbRI	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T09:34:12.044Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 09:34:13
1mo7ObgOsgHjcuoPgQt-AsIW-KtE2-JO	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T16:55:23.900Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 16:55:30
Gqtpyb4gFBgy-8BkdQA6eSIYnq8iHsSS	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T09:35:25.644Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":2}	2026-03-06 17:53:18
DimvHBTmlxVMpbfW68G5dySLImaqvJzq	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T10:58:38.562Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 11:01:10
Vc1lQ4V8mubWQ0F4ox7OQyGlMUsUIcPz	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T05:20:46.690Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 05:20:53
GJ5qByGurbIny6E6_D_ptxbfJpzWOIFK	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-05T09:53:43.102Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":2}	2026-03-06 06:34:06
Fg2mBSEsK2DXjiKJJeP7loRGODsKyx7D	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T15:58:50.188Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 15:58:57
p0RDhMLCMTEv0ktTQ2HaQvchnv8OW9R9	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T16:35:09.857Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 16:39:37
1DhfHMpjibMiInnCHaIs6PXU92s08l4E	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T09:45:32.311Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 09:45:33
a13HeIiGfVx95na3x5l9BS6Act-1QfXb	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T11:13:52.952Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 11:17:35
ufCkrNXmfKVNz9qSk8upwzabq3FzWVst	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T06:14:20.970Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 06:14:26
rRbBPJefHwSvr8cSF5qGc0oFyq72lNTv	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T09:54:29.998Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 09:54:42
35Ac2xSXeUfiISrz6hhROc6jsqPHePmf	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T11:00:46.992Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 11:00:47
tm1aF-nfj1ftZAt8YN8oqmRZ-pwMDpuO	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T08:55:50.690Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 08:55:51
hvI_Oaas57kiOOUEpkvUX6CZJ7Vr7cTS	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T15:52:37.751Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 15:52:44
hgVUURODwa4xiTQ6VGTTq1I_4YlOUFA9	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T17:30:05.200Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 17:30:12
MOUd1L-cHCQvH0A3MffL8yjf02lDLrTC	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T16:27:30.108Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 16:27:37
qmhc7L7SgM3hgsNylK4v9HegWsXqpYTZ	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T09:35:17.394Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 09:35:18
edJDGFWLice6x-Qp-zfdOYTIEb2BLmmP	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T10:25:34.152Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 10:28:50
hlSm11S6m8skYKF6HLWuc7mbsceUQh2o	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T17:50:53.319Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 17:50:55
rCCa5i6uvGSGsAdO9sdICLYReGQQQ_Yk	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-06T17:02:49.361Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-06 17:02:51
\.


--
-- Data for Name: staffs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staffs (id, full_name, contact_number, address, shifts, is_active, created_at) FROM stdin;
1	Sunil kumar	9673244860		{Afternoon}	t	2026-03-03 12:31:33.418848
\.


--
-- Data for Name: upload_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.upload_settings (id, google_drive_folder_id, storage_mode, cpanel_host, cpanel_username, cpanel_password, cpanel_port, cpanel_remote_path, cpanel_public_url) FROM stdin;
1		drive				21	/public_html/uploads/	
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, mobile_number, password, is_admin, full_name, phone_number, whatsapp_number, email, date_of_birth, username, login_pin) FROM stdin;
1	+919999999999	aaa@123	f	sss	\N	\N	\N	\N	\N	\N
3	+919673244860	sunil@123	f	\N	\N	\N	\N	\N	\N	\N
2	7770044447	admin	t	Siddhant Sap	\N	\N	\N	\N	\N	7777
\.


--
-- Data for Name: whatsapp_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.whatsapp_queue (id, booking_id, customer_phone, customer_name, template_key, message, is_sent, created_at) FROM stdin;
\.


--
-- Data for Name: whatsapp_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.whatsapp_settings (id, admin_number, enabled, meta_phone_number_id, meta_access_token) FROM stdin;
1	917770044447	f		
\.


--
-- Data for Name: whatsapp_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.whatsapp_templates (id, status, template) FROM stdin;
1	booking_created	Hello [Full Name] 🎉\n\nYour kayaking booking has been received!\n\n📋 Booking Details:\n• Service: [Service Name]\n• Date: [Booking Date]\n• Time: [Booking Time]\n• Pax: [Pax Number] pax\n• Total: ₹[Total Amount]\n\nPlease wait while we verify your payment and confirm your booking. We will update you shortly!\n\n— Local Goa Kayaking 🌊
2	pending_confirmation	Hello [Full Name] ⏳\n\nYour booking is pending payment confirmation.\n\n📋 Booking Details:\n• Service: [Service Name]\n• Date: [Booking Date]\n• Time: [Booking Time]\n• Pax: [Pax Number] pax\n• Total: ₹[Total Amount]\n\nPlease share your payment screenshot. We will confirm soon!\n\n— Local Goa Kayaking 🌊
3	booking_confirmed	Hello [Full Name] ✅\n\nYour booking is CONFIRMED! We are excited to see you on the water!\n\n📋 Booking Details:\n• Service: [Service Name]\n• Date: [Booking Date]\n• Time: [Booking Time]\n• Pax: [Pax Number] pax\n\nPlease arrive 15 minutes before your scheduled time. See you soon! 🚣\n\n— Local Goa Kayaking 🌊
5	booking_rescheduled	Hello [Full Name] 🔄\n\nYour booking has been rescheduled!\n\n📋 Updated Booking Details:\n• Service: [Service Name]\n• New Date: [Booking Date]\n• New Time: [Booking Time]\n• Pax: [Pax Number] pax\n\nSee you on the water! 🌊\n\n— Local Goa Kayaking
4	booking_cancelled	Hello [Full Name] ❌\n\nUnfortunately your booking has been cancelled.\n\n📋 Booking Details:\n• Service: [Service Name]\n• Date: [Booking Date]\n• Time: [Booking Time]\n• Reason: [Cancel Reason]\n\nIf you would like to rebook, please visit our website or contact us.\n\n— Local Goa Kayaking 🌊
\.


--
-- Name: banners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.banners_id_seq', 1, true);


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bookings_id_seq', 4, true);


--
-- Name: coupon_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coupon_settings_id_seq', 1, true);


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coupons_id_seq', 5, true);


--
-- Name: email_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_settings_id_seq', 1, true);


--
-- Name: email_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_templates_id_seq', 4, true);


--
-- Name: faqs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faqs_id_seq', 2, true);


--
-- Name: inclusions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inclusions_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 13, true);


--
-- Name: payment_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_settings_id_seq', 1, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 4, true);


--
-- Name: staffs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staffs_id_seq', 1, true);


--
-- Name: upload_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.upload_settings_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: whatsapp_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.whatsapp_queue_id_seq', 1, false);


--
-- Name: whatsapp_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.whatsapp_settings_id_seq', 1, false);


--
-- Name: whatsapp_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.whatsapp_templates_id_seq', 5, true);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: coupon_settings coupon_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupon_settings
    ADD CONSTRAINT coupon_settings_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: email_settings email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_status_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_status_key UNIQUE (status);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: inclusions inclusions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inclusions
    ADD CONSTRAINT inclusions_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payment_settings payment_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT payment_settings_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: staffs staffs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT staffs_pkey PRIMARY KEY (id);


--
-- Name: upload_settings upload_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upload_settings
    ADD CONSTRAINT upload_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_mobile_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_mobile_number_unique UNIQUE (mobile_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_queue whatsapp_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_queue
    ADD CONSTRAINT whatsapp_queue_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_settings whatsapp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_settings
    ADD CONSTRAINT whatsapp_settings_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_templates whatsapp_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_templates whatsapp_templates_status_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_status_key UNIQUE (status);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: bookings bookings_service_id_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: bookings bookings_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id);


--
-- Name: bookings bookings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict uxrlAtI551FDh3QL79syt3xj1S4ImsEtXel2dSKm8dcl77nM9c5NfvEueurgs7B

