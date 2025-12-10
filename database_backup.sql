--
-- PostgreSQL database dump
--


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
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    email text,
    gst_number text,
    bank_details text
);


--
-- Name: customer_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying NOT NULL,
    invoice_id character varying,
    amount real NOT NULL,
    date text NOT NULL,
    payment_method text NOT NULL,
    notes text
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    address text,
    email text
);


--
-- Name: halal_cash_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.halal_cash_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    amount real NOT NULL,
    date text NOT NULL,
    payment_method text DEFAULT 'cash'::text NOT NULL,
    customer_id character varying,
    notes text,
    invoice_id character varying,
    invoice_number text,
    total_bill_amount real
);


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invoice_id character varying NOT NULL,
    product_id character varying NOT NULL,
    quantity real NOT NULL,
    unit_price real NOT NULL,
    total real NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    customer_id character varying NOT NULL,
    date text NOT NULL,
    subtotal real NOT NULL,
    include_halal_charge boolean DEFAULT false NOT NULL,
    halal_charge_percent real DEFAULT 2,
    halal_charge_amount real DEFAULT 0,
    grand_total real NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    vehicle_id character varying,
    hamali_rate_per_kg real DEFAULT 2,
    hamali_paid_by_cash boolean DEFAULT false,
    total_kg_weight real DEFAULT 0
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    unit text NOT NULL,
    purchase_price real NOT NULL,
    sale_price real NOT NULL,
    current_stock real DEFAULT 0 NOT NULL,
    reorder_level real DEFAULT 10
);


--
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    purchase_id character varying NOT NULL,
    product_id character varying NOT NULL,
    quantity real NOT NULL,
    unit_price real NOT NULL,
    total real NOT NULL
);


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchases (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vendor_id character varying NOT NULL,
    vehicle_id character varying,
    date text NOT NULL,
    total_amount real NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying(255) NOT NULL,
    sess json NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_movements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    type text NOT NULL,
    quantity real NOT NULL,
    reason text NOT NULL,
    date text NOT NULL,
    reference_id character varying
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text,
    first_name text,
    last_name text,
    profile_image_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: vehicle_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_inventory (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id character varying NOT NULL,
    product_id character varying NOT NULL,
    quantity real DEFAULT 0 NOT NULL
);


--
-- Name: vehicle_inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_inventory_movements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id character varying NOT NULL,
    product_id character varying NOT NULL,
    type text NOT NULL,
    quantity real NOT NULL,
    reference_id character varying,
    reference_type text,
    date text NOT NULL,
    notes text
);


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    number text NOT NULL,
    type text NOT NULL,
    capacity text,
    driver_name text,
    driver_phone text
);


--
-- Name: vendor_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vendor_id character varying NOT NULL,
    purchase_id character varying,
    amount real NOT NULL,
    date text NOT NULL,
    payment_method text NOT NULL,
    notes text
);


--
-- Name: vendor_return_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_return_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    return_id character varying NOT NULL,
    product_id character varying NOT NULL,
    quantity real NOT NULL,
    unit_price real NOT NULL,
    total real NOT NULL,
    reason text NOT NULL
);


--
-- Name: vendor_returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_returns (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vendor_id character varying NOT NULL,
    purchase_id character varying,
    vehicle_id character varying,
    date text NOT NULL,
    total_amount real NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    notes text
);


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    address text,
    email text
);


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_settings (id, name, address, phone, email, gst_number, bank_details) FROM stdin;
d307c148-a924-4e91-b330-7f3684b2b8af	PSK Vegetables	Shop No-45\nPSK Vegetables,\nDR B R Ambedkar Vegetables Market,\nBowenapalli,\nHyderabad 	9874563218	pskvegitables@gmail.com		
\.


--
-- Data for Name: customer_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_payments (id, customer_id, invoice_id, amount, date, payment_method, notes) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, phone, address, email) FROM stdin;
f8cbfb95-5966-47f0-ad5c-b85a4809c56d	Sharma Retail Store	8765432109	45 Market Street	sharma@retail.com
137c0a8b-89e1-4e24-9ec4-36f599075645	TestCustomerm_Qc1O	9876543210		
\.


--
-- Data for Name: halal_cash_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.halal_cash_payments (id, amount, date, payment_method, customer_id, notes, invoice_id, invoice_number, total_bill_amount) FROM stdin;
43cfb221-3496-4483-a834-c9d833df89a4	10	2025-12-08	cash	137c0a8b-89e1-4e24-9ec4-36f599075645	Auto-recorded from Invoice INV-10064500	1f4f2149-fc99-44a3-8e98-4501237cc1b8	INV-10064500	75
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_items (id, invoice_id, product_id, quantity, unit_price, total) FROM stdin;
fab9f040-71c8-415d-9d44-5c673f6dcab1	9cbf16f1-e1da-4cc6-89cd-01751547248f	476365c5-c55c-4c91-94df-071b416c4fff	10	25	250
16a1ba34-b11e-446a-9e7f-d99785767ea9	9cbf16f1-e1da-4cc6-89cd-01751547248f	a95205b8-2e1f-4829-b078-ee54e14f6007	8	35	280
55a333c8-ac3c-4c5e-8645-8125dcebee5e	9cbf16f1-e1da-4cc6-89cd-01751547248f	803506b8-313b-4dfe-bd03-40c482a39e45	5	700	3500
1d889614-111c-4245-bcc5-2ecf8ce5e838	1f4f2149-fc99-44a3-8e98-4501237cc1b8	6567c775-de6f-48bf-ae19-455d3aaad640	5	15	75
52e13d72-1346-439a-981c-d70c1e91a998	b5f864c5-3cff-4092-a9e6-b19fd865eb05	c6ab86d2-ccea-4b70-9403-724f1cf404d7	25	40	1000
d8c98eb7-19cd-4ecd-896e-cb9de935d191	7ef00697-b1bd-4012-afc6-68637ef6738e	476365c5-c55c-4c91-94df-071b416c4fff	10	25	250
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, customer_id, date, subtotal, include_halal_charge, halal_charge_percent, halal_charge_amount, grand_total, status, vehicle_id, hamali_rate_per_kg, hamali_paid_by_cash, total_kg_weight) FROM stdin;
9cbf16f1-e1da-4cc6-89cd-01751547248f	INV-98821639	f8cbfb95-5966-47f0-ad5c-b85a4809c56d	2025-12-08	4030	t	5	201.5	4231.5	completed	5af06675-24e6-43ac-965e-353cee4722a7	2	f	0
1f4f2149-fc99-44a3-8e98-4501237cc1b8	INV-10064500	137c0a8b-89e1-4e24-9ec4-36f599075645	2025-12-08	75	t	2	10	75	completed	\N	2	t	5
b5f864c5-3cff-4092-a9e6-b19fd865eb05	INV-1765294863014	f8cbfb95-5966-47f0-ad5c-b85a4809c56d	2025-12-09	1000	t	2	60	1060	completed	5af06675-24e6-43ac-965e-353cee4722a7	12	f	25
7ef00697-b1bd-4012-afc6-68637ef6738e	INV-1765295789869	f8cbfb95-5966-47f0-ad5c-b85a4809c56d	2025-12-09	250	t	2	24	274	completed	5af06675-24e6-43ac-965e-353cee4722a7	12	f	10
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, unit, purchase_price, sale_price, current_stock, reorder_level) FROM stdin;
a95205b8-2e1f-4829-b078-ee54e14f6007	Onion	KG	20	35	72	40
803506b8-313b-4dfe-bd03-40c482a39e45	Apple Box	Box	500	700	15	10
6567c775-de6f-48bf-ae19-455d3aaad640	TestTomatoesyQV1Ir	KG	10	15	95	10
c6ab86d2-ccea-4b70-9403-724f1cf404d7	Tomato	KG	25	40	35	30
476365c5-c55c-4c91-94df-071b416c4fff	Potato	KG	15	25	80	50
\.


--
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_items (id, purchase_id, product_id, quantity, unit_price, total) FROM stdin;
817ea92b-7390-4a65-977b-8487794fe263	0a9db942-586e-4daf-9b40-d280a4d52368	476365c5-c55c-4c91-94df-071b416c4fff	100	15	1500
e8c8b68a-5f5c-4350-b2ce-eb6a2bc57e2b	0a9db942-586e-4daf-9b40-d280a4d52368	a95205b8-2e1f-4829-b078-ee54e14f6007	80	20	1600
811baf26-5c6c-432d-b9d8-b2559b2a8f32	0a9db942-586e-4daf-9b40-d280a4d52368	c6ab86d2-ccea-4b70-9403-724f1cf404d7	60	25	1500
d603eab4-a01d-4f57-a45e-3f9c0b72da8c	0a9db942-586e-4daf-9b40-d280a4d52368	803506b8-313b-4dfe-bd03-40c482a39e45	20	500	10000
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchases (id, vendor_id, vehicle_id, date, total_amount, status) FROM stdin;
0a9db942-586e-4daf-9b40-d280a4d52368	1cc18d7a-2898-46ce-b110-ee6699f1a8b6	5af06675-24e6-43ac-965e-353cee4722a7	2025-12-08	14600	completed
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
zUFNZF738KQBps_0kTSQOO2DPB3U5chR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-12-15T12:43:19.083Z","secure":true,"httpOnly":true,"path":"/"},"replit.com":{"code_verifier":"P8Dd0c-fkeT0ABUc0v7t0aA7p8kXbafq046YtjDXnNw"}}	2025-12-15 12:43:20
7gDd53-Jr1cSYwISgM5QmpquD6kGpmuX	{"cookie":{"originalMaxAge":604800000,"expires":"2025-12-15T12:43:49.336Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"replit.com":{"code_verifier":"toJWnc5OpCaA7ZVsnwdjPLyyHi9d4mSccH1eF-XNuDw"}}	2025-12-15 12:43:50
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_movements (id, product_id, type, quantity, reason, date, reference_id) FROM stdin;
0c0af88b-aeb9-4acf-96b7-468d984b1e93	476365c5-c55c-4c91-94df-071b416c4fff	in	100	Purchase order 0a9db942	2025-12-08	0a9db942-586e-4daf-9b40-d280a4d52368
3eb5ba9b-8b5e-4346-9630-30404f854a5a	a95205b8-2e1f-4829-b078-ee54e14f6007	in	80	Purchase order 0a9db942	2025-12-08	0a9db942-586e-4daf-9b40-d280a4d52368
82239372-905c-4c97-ae82-7725849d102a	c6ab86d2-ccea-4b70-9403-724f1cf404d7	in	60	Purchase order 0a9db942	2025-12-08	0a9db942-586e-4daf-9b40-d280a4d52368
3cd7d44a-cc38-495f-9fb3-2dff9df8eaf7	803506b8-313b-4dfe-bd03-40c482a39e45	in	20	Purchase order 0a9db942	2025-12-08	0a9db942-586e-4daf-9b40-d280a4d52368
afa0418d-fc88-45b1-89bd-2acc71fbed66	476365c5-c55c-4c91-94df-071b416c4fff	out	10	Invoice INV-98821639	2025-12-08	9cbf16f1-e1da-4cc6-89cd-01751547248f
ec3db3ce-7138-48e6-9f20-402adfc67bd9	a95205b8-2e1f-4829-b078-ee54e14f6007	out	8	Invoice INV-98821639	2025-12-08	9cbf16f1-e1da-4cc6-89cd-01751547248f
7be10ed6-ca94-41f6-884a-80db01ce8833	803506b8-313b-4dfe-bd03-40c482a39e45	out	5	Invoice INV-98821639	2025-12-08	9cbf16f1-e1da-4cc6-89cd-01751547248f
2a3e77a4-9196-4af4-967b-c198d1f7c7e7	6567c775-de6f-48bf-ae19-455d3aaad640	out	5	Invoice INV-10064500	2025-12-08	1f4f2149-fc99-44a3-8e98-4501237cc1b8
154fb549-18c4-4765-80ba-c9606cb7287e	c6ab86d2-ccea-4b70-9403-724f1cf404d7	out	25	Invoice INV-1765294863014	2025-12-09	b5f864c5-3cff-4092-a9e6-b19fd865eb05
fece5717-74a9-47c6-a152-462c796600a1	476365c5-c55c-4c91-94df-071b416c4fff	out	10	Invoice INV-1765295789869	2025-12-09	7ef00697-b1bd-4012-afc6-68637ef6738e
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, email, first_name, last_name, profile_image_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: vehicle_inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicle_inventory (id, vehicle_id, product_id, quantity) FROM stdin;
299544ad-37ad-4810-8ef3-795f119830e0	5af06675-24e6-43ac-965e-353cee4722a7	a95205b8-2e1f-4829-b078-ee54e14f6007	72
08ecec2c-f2db-4d89-bc01-e59848a6df1f	5af06675-24e6-43ac-965e-353cee4722a7	803506b8-313b-4dfe-bd03-40c482a39e45	15
943cc815-cda4-4f09-bd66-f49bfb70001c	5af06675-24e6-43ac-965e-353cee4722a7	c6ab86d2-ccea-4b70-9403-724f1cf404d7	35
e5498bf9-9888-4cc2-bbb4-54f05dc8ea95	5af06675-24e6-43ac-965e-353cee4722a7	476365c5-c55c-4c91-94df-071b416c4fff	80
\.


--
-- Data for Name: vehicle_inventory_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicle_inventory_movements (id, vehicle_id, product_id, type, quantity, reference_id, reference_type, date, notes) FROM stdin;
79bcf33a-ee0d-4377-a505-738768e42601	5af06675-24e6-43ac-965e-353cee4722a7	476365c5-c55c-4c91-94df-071b416c4fff	load	100	0a9db942-586e-4daf-9b40-d280a4d52368	purchase	2025-12-08	\N
809635e9-e05c-4c60-bef2-c0c8e9261594	5af06675-24e6-43ac-965e-353cee4722a7	a95205b8-2e1f-4829-b078-ee54e14f6007	load	80	0a9db942-586e-4daf-9b40-d280a4d52368	purchase	2025-12-08	\N
6a39a06e-8423-40fd-9eeb-95b0e119a897	5af06675-24e6-43ac-965e-353cee4722a7	c6ab86d2-ccea-4b70-9403-724f1cf404d7	load	60	0a9db942-586e-4daf-9b40-d280a4d52368	purchase	2025-12-08	\N
3381fd77-94cf-4bde-b4ab-21d30cd2e225	5af06675-24e6-43ac-965e-353cee4722a7	803506b8-313b-4dfe-bd03-40c482a39e45	load	20	0a9db942-586e-4daf-9b40-d280a4d52368	purchase	2025-12-08	\N
6295dc3c-025a-4822-ba47-ee440983c656	5af06675-24e6-43ac-965e-353cee4722a7	476365c5-c55c-4c91-94df-071b416c4fff	sale	10	9cbf16f1-e1da-4cc6-89cd-01751547248f	invoice	2025-12-08	\N
85694a84-f60b-4d31-9528-3989095df077	5af06675-24e6-43ac-965e-353cee4722a7	a95205b8-2e1f-4829-b078-ee54e14f6007	sale	8	9cbf16f1-e1da-4cc6-89cd-01751547248f	invoice	2025-12-08	\N
11cbbd5f-503f-419a-bd6b-927f9e262dcb	5af06675-24e6-43ac-965e-353cee4722a7	803506b8-313b-4dfe-bd03-40c482a39e45	sale	5	9cbf16f1-e1da-4cc6-89cd-01751547248f	invoice	2025-12-08	\N
3460ecd6-0520-4bb7-bdc4-7fda6143ea57	5af06675-24e6-43ac-965e-353cee4722a7	c6ab86d2-ccea-4b70-9403-724f1cf404d7	sale	25	b5f864c5-3cff-4092-a9e6-b19fd865eb05	invoice	2025-12-09	\N
7d2844ea-2e74-4053-a9ba-0ae01fb55641	5af06675-24e6-43ac-965e-353cee4722a7	476365c5-c55c-4c91-94df-071b416c4fff	sale	10	7ef00697-b1bd-4012-afc6-68637ef6738e	invoice	2025-12-09	\N
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, number, type, capacity, driver_name, driver_phone) FROM stdin;
5af06675-24e6-43ac-965e-353cee4722a7	MH-12-AB-1234	Truck	5 Tons	Ramesh Kumar	7654321098
86f8de49-d067-4fcb-b196-5eef7e4788aa	TEST-SELL-001	Truck	10	Test Driver	9876543210
2f107e80-301c-423a-9ae8-66a56a3691cb	TEST-ENHANCED-001	Truck	8	John Doe	9876543210
161f76e4-9513-40b5-b53c-db96364f8961	TEST-AUTO-CALC-001	Truck	0.10	\N	\N
1fa7d57a-ccc8-4a45-8bd7-48e43878ce84	TEST-BAGS-001	Truck	0.15	\N	\N
\.


--
-- Data for Name: vendor_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_payments (id, vendor_id, purchase_id, amount, date, payment_method, notes) FROM stdin;
\.


--
-- Data for Name: vendor_return_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_return_items (id, return_id, product_id, quantity, unit_price, total, reason) FROM stdin;
\.


--
-- Data for Name: vendor_returns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_returns (id, vendor_id, purchase_id, vehicle_id, date, total_amount, status, notes) FROM stdin;
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendors (id, name, phone, address, email) FROM stdin;
1cc18d7a-2898-46ce-b110-ee6699f1a8b6	Farm Fresh Vegetables	9876543210	123 Farm Road	farm@fresh.com
\.


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: customer_payments customer_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_payments
    ADD CONSTRAINT customer_payments_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: halal_cash_payments halal_cash_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.halal_cash_payments
    ADD CONSTRAINT halal_cash_payments_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: vehicle_inventory_movements vehicle_inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_inventory_movements
    ADD CONSTRAINT vehicle_inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: vehicle_inventory vehicle_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_inventory
    ADD CONSTRAINT vehicle_inventory_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vendor_payments vendor_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_payments
    ADD CONSTRAINT vendor_payments_pkey PRIMARY KEY (id);


--
-- Name: vendor_return_items vendor_return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_return_items
    ADD CONSTRAINT vendor_return_items_pkey PRIMARY KEY (id);


--
-- Name: vendor_returns vendor_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_returns
    ADD CONSTRAINT vendor_returns_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: idx_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_expire ON public.sessions USING btree (expire);


--
-- PostgreSQL database dump complete
--

\unrestrict SzGEOYC1oasAv2WQkD6zAjIhtcmDd2fYkNIrovTnpSJQ4KX83pZ1gyUxnIKBOFV

