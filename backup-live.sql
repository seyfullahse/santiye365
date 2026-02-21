--
-- PostgreSQL database dump
--

\restrict fXwpvImEbdsJblUcPjUJ4WOJN9rBSiXDb803NtljGDwkhNg0J5IxQBCexf1IZ7y

-- Dumped from database version 16.12
-- Dumped by pg_dump version 16.12

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

--
-- Data for Name: disciplines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.disciplines (id, name) FROM stdin;
a84a8499-0472-450a-90ec-bdef7f4fd384	Mimari
14271c5d-5c0e-44b1-ae15-f18bb419c50a	Statik
129629c8-93a0-48a8-b52b-c289db3776dd	Mekanik
937f00bf-ceda-4568-ad6f-e341e536a958	Elektrik
eaf46f7c-8786-4838-b7f2-456ce3200ea0	Altyapi
5f30b946-a25e-4b47-aa98-5cdb070d8001	Mobilya
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, name, client, start_date, end_date, status, created_at, updated_at) FROM stdin;
e6bdca55-adf5-418d-a943-df1b8c68430e	Garanti BBVA Renovasyon	GBBVA	2026-01-01 00:00:00	2026-12-31 00:00:00	ACTIVE	2026-02-19 19:21:19.023	2026-02-19 22:08:27.64
\.


--
-- Data for Name: zones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.zones (id, project_id, name, description, created_at) FROM stdin;
cmltv4myy000001ppgp5pr8g6	e6bdca55-adf5-418d-a943-df1b8c68430e	Genel M├╝d├╝rl├╝k Binas─▒	\N	2026-02-19 19:37:22.762
\.


--
-- Data for Name: floors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.floors (id, project_id, zone_id, name, order_no, created_at) FROM stdin;
cmltv4vqd000101ppcmhnz84e	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	1	1	2026-02-19 19:37:34.117
cmltv51y1000201ppof5rydsd	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	2	2	2026-02-19 19:37:42.169
\.


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activities (id, project_id, zone_id, floor_id, discipline_id, order_no, name, weight, progress_percent, planned_start, planned_finish, forecast_finish, actual_finish, is_critical, status, notes, created_at, updated_at) FROM stdin;
cmltwr5x4000001lbt66y2ena	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	129629c8-93a0-48a8-b52b-c289db3776dd	0	Mekanik Otomasyon ─░┼şler	2.5	20	2026-02-19 00:00:00	2026-02-19 00:00:00	2026-02-19 00:00:00	2026-02-19 00:00:00	t	IN_PROGRESS	\N	2026-02-19 20:22:53.367	2026-02-19 20:22:53.367
cmltwr633000101lbe93vktur	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	129629c8-93a0-48a8-b52b-c289db3776dd	0	Mekanik Test ve Devreye Alma	2.5	0	\N	\N	\N	\N	f	NOT_STARTED	\N	2026-02-19 20:22:53.583	2026-02-19 20:22:53.583
cmltwr65f000201lbq1ipmf64	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	129629c8-93a0-48a8-b52b-c289db3776dd	0	Menfez / Slot Dif├╝z├Âr montajlar─▒	2	15	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:53.667	2026-02-19 20:22:53.667
cmltwr67r000301lb144nxazd	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	129629c8-93a0-48a8-b52b-c289db3776dd	0	Mekanik Havaland─▒rma Altyap─▒ ─░┼şleri	3	80	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:53.751	2026-02-19 20:22:53.751
cmltwr6a9000401lb2c5c1ffp	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	129629c8-93a0-48a8-b52b-c289db3776dd	0	Mekanik Yang─▒n Altyap─▒ ─░┼şleri	4.5	70	\N	\N	\N	\N	t	IN_PROGRESS	\N	2026-02-19 20:22:53.841	2026-02-19 20:22:53.841
cmltwr6cs000501lbg3obg2z2	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	129629c8-93a0-48a8-b52b-c289db3776dd	0	Mekanik Is─▒tma Tesisat Altyap─▒ ─░┼şleri	8.5	80	2026-01-11 00:00:00	2026-02-12 00:00:00	2026-02-26 00:00:00	2026-02-26 00:00:00	t	IN_PROGRESS	\N	2026-02-19 20:22:53.932	2026-02-19 20:22:53.932
cmltwr6f6000601lbu46fvcj8	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	937f00bf-ceda-4568-ad6f-e341e536a958	0	Elektrik Test ve Devreye Alma	1.7	0	\N	\N	\N	\N	f	NOT_STARTED	\N	2026-02-19 20:22:54.018	2026-02-19 20:22:54.018
cmltwr6hf000701lbklx1928m	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	937f00bf-ceda-4568-ad6f-e341e536a958	0	Elektrik Pano ─░┼şleri	1	10	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:54.099	2026-02-19 20:22:54.099
cmltwr6jm000801lblt089bgk	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	937f00bf-ceda-4568-ad6f-e341e536a958	0	Elektrik Otomasyon	1.7	10	\N	\N	\N	\N	t	IN_PROGRESS	\N	2026-02-19 20:22:54.177	2026-02-19 20:22:54.177
cmltwr6lz000901lb0l0sywnp	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	937f00bf-ceda-4568-ad6f-e341e536a958	0	Elektrik Ayd─▒nlatma	3.6	25	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:54.263	2026-02-19 20:22:54.263
cmltwr6ny000a01lbcc9b1ayt	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	937f00bf-ceda-4568-ad6f-e341e536a958	0	Elektrik Altyap─▒ ─░┼şleri	11	90	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:54.334	2026-02-19 20:22:54.334
cmltwr6pz000b01lbriidz0pm	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	14271c5d-5c0e-44b1-ae15-f18bb419c50a	0	Akma Damperi Montajlar─▒	1.2	30	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:54.407	2026-02-19 20:22:54.407
cmltwr6s4000c01lbv5g0l293	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	14271c5d-5c0e-44b1-ae15-f18bb419c50a	0	Lifli Polimer Uygulamas─▒	2.5	20	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:54.484	2026-02-19 20:22:54.484
cmltwr6ua000d01lbhgbmfsno	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	14271c5d-5c0e-44b1-ae15-f18bb419c50a	0	BRB Montajlar─▒	1.6	30	\N	\N	\N	\N	t	IN_PROGRESS	\N	2026-02-19 20:22:54.562	2026-02-19 20:22:54.562
cmltwr6we000e01lbootygjgb	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	14271c5d-5c0e-44b1-ae15-f18bb419c50a	0	├çelik ─░malatlar	17.7	90	\N	\N	\N	\N	t	IN_PROGRESS	\N	2026-02-19 20:22:54.638	2026-02-19 20:22:54.638
cmltwr6ye000f01lbfmappt9m	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Y├╝kseltilmi┼ş D├Â┼şeme ─░┼şleri	0.1	30	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:54.71	2026-02-19 20:22:54.71
cmltwr70g000g01lb6sjq6nvo	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Koruma ├ûnlemleri Al─▒nmas─▒	0.1	100	\N	\N	\N	\N	f	COMPLETED	\N	2026-02-19 20:22:54.784	2026-02-19 20:22:54.784
cmltwr72n000h01lbneadx8af	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Mobilizasyon	0.25	100	\N	\N	\N	\N	f	COMPLETED	\N	2026-02-19 20:22:54.863	2026-02-19 20:22:54.863
cmltwr74o000i01lbjhya9fag	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Y─▒k─▒m S├Âk├╝m ve Moloz At─▒m─▒	0.75	100	\N	\N	\N	\N	f	COMPLETED	\N	2026-02-19 20:22:54.936	2026-02-19 20:22:54.936
cmltwr76o000j01lb8t4qbji8	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Duvar tavan fuga profilleri	0.1	30	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.008	2026-02-19 20:22:55.008
cmltwr78p000k01lbc6x2hmz2	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Zemin ge├ği┼ş profili	0.1	20	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.081	2026-02-19 20:22:55.081
cmltwr7ax000l01lb1in22idb	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Boya	0.8	20	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.161	2026-02-19 20:22:55.161
cmltwr7d4000m01lbrcmnxiiq	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Tavan Al├ğ─▒pan ─░┼şleri	3.5	40	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.24	2026-02-19 20:22:55.24
cmltwr7fd000n01lb8thonex9	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Duvar Al├ğ─▒pan ─░┼şleri	5.5	75	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.321	2026-02-19 20:22:55.321
cmltwr7hw000o01lbdmynxa1w	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Al├ğ─▒pan m├╝dahale kapa─ş─▒	0.1	30	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.412	2026-02-19 20:22:55.412
cmltwr7jz000p01lbq5hd84zs	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Seramik imalatlar─▒	0.1	15	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.487	2026-02-19 20:22:55.487
cmltwr7m3000q01lbo0musy6i	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Boyal─▒ Al├╝minyum s├╝p├╝rgelik	0.2	15	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.563	2026-02-19 20:22:55.563
cmltwr7o8000r01lb6rmoqarr	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Vitrifiye ├£r├╝nleri	0.2	15	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.64	2026-02-19 20:22:55.64
cmltwr7q9000s01lbgdy7ht91	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Mutfak Alan─▒	1.2	15	\N	\N	\N	\N	t	IN_PROGRESS	\N	2026-02-19 20:22:55.713	2026-02-19 20:22:55.713
cmltwr7t4000t01lbpetv5ael	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Boyal─▒ Cam i┼şleri	0.2	15	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.816	2026-02-19 20:22:55.816
cmltwr7ve000u01lbt2nxuw1s	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Akrilik tezgah	0.1	15	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.898	2026-02-19 20:22:55.898
cmltwr7xj000v01lbtq3ndlq5	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Vinil Kaplama	0.3	15	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:55.975	2026-02-19 20:22:55.975
cmltwr7zk000w01lb4i0fghd2	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Hal─▒	0.8	30	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:56.048	2026-02-19 20:22:56.048
cmltwr81j000x01lbxrpcc73x	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Ke├ğe Kaplama	0.2	15	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:56.119	2026-02-19 20:22:56.119
cmltwr83o000y01lbyflsxju3	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Radiuslu Mesh Tavan	1	15	\N	\N	\N	\N	t	IN_PROGRESS	\N	2026-02-19 20:22:56.196	2026-02-19 20:22:56.196
cmltwr85u000z01lbiyt2z8qk	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Do─şramalar	1.4	15	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:56.274	2026-02-19 20:22:56.274
cmltwr87u001001lb6ybyramg	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Radiuslu Cam B├Âl├╝c├╝ Duvar	1.6	20	\N	\N	\N	\N	f	IN_PROGRESS	\N	2026-02-19 20:22:56.346	2026-02-19 20:22:56.346
cmltwr8by001201lb6e79vnxj	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	5f30b946-a25e-4b47-aa98-5cdb070d8001	0	Hareketli Mobilya	2.5	15	\N	\N	\N	\N	t	IN_PROGRESS		2026-02-19 20:22:56.494	2026-02-19 20:23:07.723
cmltwr8e4001301lb77z9hiec	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	5f30b946-a25e-4b47-aa98-5cdb070d8001	0	Sabit Mobilya	12.5	20	\N	\N	2026-02-18 00:00:00	2026-02-19 00:00:00	t	IN_PROGRESS		2026-02-19 20:22:56.572	2026-02-20 07:27:13.411
cmltwr89w001101lbwy3thnwo	e6bdca55-adf5-418d-a943-df1b8c68430e	cmltv4myy000001ppgp5pr8g6	cmltv4vqd000101ppcmhnz84e	a84a8499-0472-450a-90ec-bdef7f4fd384	0	Akustik S─▒va	1.4	30	\N	\N	\N	\N	f	IN_PROGRESS		2026-02-19 20:22:56.42	2026-02-21 09:09:18.736
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, role, created_at, updated_at) FROM stdin;
cmlumvcjb000001ny6kmq3wm7	Tevfik Halito─şullar─▒	teyfik@santiye360.org	$2b$10$Us7miy5/YfSDjNWSkQh6b.zoEvT46T60EC52YzC1XLdAloR1oJwfe	ADMIN	2026-02-20 08:33:58.583	2026-02-20 08:33:58.583
cmlumvll6000101nyioaw90z4	Zafer ┼Şener	zafer@santiye360.org	$2b$10$vTzLriNAsw1i2lRNFW1oguP2pcMlWE5ikbH/eOs8XiNgrA1TIJZ.m	ADMIN	2026-02-20 08:34:10.314	2026-02-20 08:34:10.314
admin-001	Seyfullah SEPET	admin@santiye360.org	$2b$10$k3usjVbhUJwjBbl6HJ.RXuvDek7MKaiSC6DGy4JlPHmgRWpQa2nJq	ADMIN	2026-02-20 08:29:57.497	2026-02-21 09:58:00.4
\.


--
-- Data for Name: activity_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_comments (id, activity_id, text, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: approvals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approvals (id, activity_id, title, waiting_on, waiting_days, impact_type, note, status, created_at) FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, name, type) FROM stdin;
cmltwsev6001401lbzax5ni7y	Bar─▒┼ş ─░n┼şaat	MAIN
cmlw02ulh000101mp7ljke01z	Pasifik	SUBCONTRACTOR
cmlw03oag000401mpuzxezx13	Reska	SUBCONTRACTOR
cmlw3xppq000801mp4j5hfcsy	ARTYOL M├╝hendislik	SUBCONTRACTOR
cmlw3y6vp000901mpg35nu4pt	Faal Al├╝minyum	SUBCONTRACTOR
cmlw3yj42000a01mp1f87nms3	Demsan Havaland─▒rma	SUBCONTRACTOR
cmlw3yxnq000b01mpbnqiwj38	Sapa ─░n┼şaat	SUBCONTRACTOR
\.


--
-- Data for Name: risks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.risks (id, project_id, activity_id, title, impact, probability, score, action, responsible, status, created_at) FROM stdin;
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, company_id, name, discipline_id) FROM stdin;
cmltwt8bq001501lb5rdza7dc	cmltwsev6001401lbzax5ni7y	Bar─▒┼ş ─░n┼şaat Y├Ânetim	a84a8499-0472-450a-90ec-bdef7f4fd384
cmlw0366x000201mpkebwoac0	cmlw02ulh000101mp7ljke01z	Pasifik Mekanik	129629c8-93a0-48a8-b52b-c289db3776dd
cmlw040pd000501mpxeym735y	cmlw03oag000401mpuzxezx13	Reska Elektrik	937f00bf-ceda-4568-ad6f-e341e536a958
cmlw3zyi3000c01mpd8iz1wbl	cmlw3xppq000801mp4j5hfcsy	ARTYOL M├╝hendislik	14271c5d-5c0e-44b1-ae15-f18bb419c50a
cmlw40aew000d01mphzpbz473	cmlw3yj42000a01mp1f87nms3	Demsan Havaland─▒rma	129629c8-93a0-48a8-b52b-c289db3776dd
cmlw40r7o000e01mp0ld1uw0r	cmlw3y6vp000901mpg35nu4pt	Faal Al├╝minyum	a84a8499-0472-450a-90ec-bdef7f4fd384
cmlw418ga000f01mpi0en2eag	cmlw3yxnq000b01mpbnqiwj38	Sapa ─░n┼şaat	a84a8499-0472-450a-90ec-bdef7f4fd384
\.


--
-- Data for Name: workforce_daily; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workforce_daily (id, project_id, date, team_id, worker_count) FROM stdin;
cmltwtgvz001601lb9vhxiz33	e6bdca55-adf5-418d-a943-df1b8c68430e	2026-02-19	cmltwt8bq001501lb5rdza7dc	10
cmltwtpqs001701lbaqvn83gi	e6bdca55-adf5-418d-a943-df1b8c68430e	2026-02-18	cmltwt8bq001501lb5rdza7dc	25
cmltwtyqk001801lbsyeav5l8	e6bdca55-adf5-418d-a943-df1b8c68430e	2026-02-17	cmltwt8bq001501lb5rdza7dc	12
cmluk4x82000101qh2f3ctx62	e6bdca55-adf5-418d-a943-df1b8c68430e	2026-02-20	cmltwt8bq001501lb5rdza7dc	10
cmlw02f38000001mppisyvbqw	e6bdca55-adf5-418d-a943-df1b8c68430e	2026-02-21	cmltwt8bq001501lb5rdza7dc	30
cmlw03fms000301mpwyr2scog	e6bdca55-adf5-418d-a943-df1b8c68430e	2026-02-21	cmlw0366x000201mpkebwoac0	6
cmlw04fyx000601mpuzhn74wy	e6bdca55-adf5-418d-a943-df1b8c68430e	2026-02-21	cmlw040pd000501mpxeym735y	2
\.


--
-- PostgreSQL database dump complete
--

\unrestrict fXwpvImEbdsJblUcPjUJ4WOJN9rBSiXDb803NtljGDwkhNg0J5IxQBCexf1IZ7y

