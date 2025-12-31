--
-- PostgreSQL database dump
--

\restrict aUMy55Og7ZhCDKLhR5R3qhYjtTdVWXiM8YDuWLyD0pErm8qpNKfPaUqdkrLOPz1

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CorporateStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CorporateStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'TERMINATED'
);


ALTER TYPE public."CorporateStatus" OWNER TO postgres;

--
-- Name: SessionRevokedReason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SessionRevokedReason" AS ENUM (
    'LOGOUT',
    'OVERRIDDEN',
    'TIMEOUT'
);


ALTER TYPE public."SessionRevokedReason" OWNER TO postgres;

--
-- Name: StudyStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StudyStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'COMPLETED'
);


ALTER TYPE public."StudyStatus" OWNER TO postgres;

--
-- Name: UserPlan; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserPlan" AS ENUM (
    'FREE',
    'CORPORATE'
);


ALTER TYPE public."UserPlan" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'MEMBER'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'DELETED'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Company; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Company" (
    id text NOT NULL,
    name text NOT NULL,
    domain text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Company" OWNER TO postgres;

--
-- Name: CorporateAccount; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CorporateAccount" (
    id text NOT NULL,
    name text NOT NULL,
    "companyId" text NOT NULL,
    "billingEmail" text,
    status public."CorporateStatus" DEFAULT 'ACTIVE'::public."CorporateStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CorporateAccount" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "revokedReason" public."SessionRevokedReason",
    "userAgent" text,
    "ipAddress" text
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: Study; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Study" (
    id text NOT NULL,
    title text NOT NULL,
    status public."StudyStatus" DEFAULT 'DRAFT'::public."StudyStatus" NOT NULL,
    "companyId" text NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Study" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "auth0Sub" text NOT NULL,
    email text NOT NULL,
    "firstName" text,
    "lastName" text,
    role public."UserRole" DEFAULT 'MEMBER'::public."UserRole" NOT NULL,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "corporateAccountId" text,
    plan public."UserPlan" DEFAULT 'FREE'::public."UserPlan" NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Company" (id, name, domain, "createdAt", "updatedAt") FROM stdin;
68e4b78c-50f1-4cea-9d7c-e376f6693411	Zeotap	\N	2025-12-31 09:50:02.145	2025-12-31 09:50:02.145
b59f16cf-0165-457f-9902-6706ab34eff5	HCL	\N	2025-12-31 09:50:40.835	2025-12-31 09:50:40.835
a5964142-d4e6-4e70-b846-b3484dfa87d1	TestCorp	testcorp.com	2025-12-31 09:55:07.113	2025-12-31 09:55:07.113
\.


--
-- Data for Name: CorporateAccount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CorporateAccount" (id, name, "companyId", "billingEmail", status, "createdAt", "updatedAt") FROM stdin;
fa2d8696-c562-4f6b-a1e6-ea7f13f594c0	TestCorp	a5964142-d4e6-4e70-b846-b3484dfa87d1	billing@testcorp.com	ACTIVE	2025-12-31 09:55:11.578	2025-12-31 10:44:44.916
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "userId", "createdAt", "lastSeenAt", "expiresAt", "revokedAt", "revokedReason", "userAgent", "ipAddress") FROM stdin;
1a8ba6d5-663b-4f33-b1ee-267a9f933c78	339a97f1-26de-4ede-baa2-34041f0c4cbe	2025-12-31 09:49:42.599	2025-12-31 09:50:02.257	2025-12-31 10:20:02.257	2025-12-31 09:50:04.675	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
e6882f72-c609-436e-aa44-ef0227d43b5a	339a97f1-26de-4ede-baa2-34041f0c4cbe	2025-12-31 10:27:00.677	2025-12-31 10:27:07.193	2025-12-31 10:57:07.193	2025-12-31 10:27:10.152	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
dbc56999-54a0-4a7e-8e61-0bd325b72be0	25ac93e1-dca3-404b-b8dd-80995a6590c4	2025-12-31 10:32:56.875	2025-12-31 10:32:56.875	2025-12-31 11:02:56.875	2025-12-31 10:33:26.507	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
096fa54f-d28d-48f4-a567-1c47e28f9a87	10e92909-1495-4b8e-815d-948106d67f3c	2025-12-31 10:33:42.724	2025-12-31 10:33:42.724	2025-12-31 11:03:42.723	2025-12-31 10:34:03.235	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
c8c216f7-0d7a-4752-bd98-dbba05c7ec59	25ac93e1-dca3-404b-b8dd-80995a6590c4	2025-12-31 09:50:31.858	2025-12-31 09:50:40.943	2025-12-31 10:20:40.943	2025-12-31 09:50:43.035	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
1aec2a84-bdb8-44fe-978c-59592467dddb	339a97f1-26de-4ede-baa2-34041f0c4cbe	2025-12-31 10:34:16.055	2025-12-31 10:34:16.079	2025-12-31 11:04:16.079	2025-12-31 10:37:51.974	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
3d287a82-fb2a-411d-8e8d-e436728b323d	10e92909-1495-4b8e-815d-948106d67f3c	2025-12-31 09:50:55.903	2025-12-31 09:50:55.938	2025-12-31 10:20:55.938	2025-12-31 09:51:01.102	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
6a05078a-6163-4dd1-8957-27f07fcb8ec8	10e92909-1495-4b8e-815d-948106d67f3c	2025-12-31 10:45:12.827	2025-12-31 10:45:12.912	2025-12-31 11:15:12.912	2025-12-31 10:45:15.729	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
56bde7c1-1ab7-4546-ae61-c21687658fee	10e92909-1495-4b8e-815d-948106d67f3c	2025-12-31 09:56:49.836	2025-12-31 09:57:30.183	2025-12-31 10:27:30.183	2025-12-31 09:57:32.817	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
61cec4c1-6161-4f94-8d37-44aa131ff669	339a97f1-26de-4ede-baa2-34041f0c4cbe	2025-12-31 09:57:59.262	2025-12-31 10:01:29.611	2025-12-31 10:31:29.611	2025-12-31 10:01:32.217	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
3cd9271d-d5d4-4f95-8006-f53f240ce819	10e92909-1495-4b8e-815d-948106d67f3c	2025-12-31 10:01:45.67	2025-12-31 10:08:46.9	2025-12-31 10:38:46.9	2025-12-31 10:08:50.785	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
57362195-5178-4392-8360-e7881b2bb451	339a97f1-26de-4ede-baa2-34041f0c4cbe	2025-12-31 10:09:04.698	2025-12-31 10:09:11.448	2025-12-31 10:39:11.448	2025-12-31 10:09:16.731	LOGOUT	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1
\.


--
-- Data for Name: Study; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Study" (id, title, status, "companyId", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, "auth0Sub", email, "firstName", "lastName", role, "companyId", "createdAt", "updatedAt", "corporateAccountId", plan, status) FROM stdin;
339a97f1-26de-4ede-baa2-34041f0c4cbe	auth0|69498f32e93ba90cf7f94134	ernest.kirubakaran@gmail.com	Ernest	Selvaraj	MEMBER	68e4b78c-50f1-4cea-9d7c-e376f6693411	2025-12-31 09:49:42.585	2025-12-31 09:50:02.151	\N	FREE	ACTIVE
d41d7bcc-77c9-40ae-a048-43bc122b2633	auth0|69498fd8e93ba90cf7f941a4	nagaking@gmail.com	\N	\N	MEMBER	\N	2025-12-31 09:50:17.878	2025-12-31 09:50:17.878	\N	FREE	ACTIVE
25ac93e1-dca3-404b-b8dd-80995a6590c4	auth0|6952435e8bce44d8459f8b55	kirubarose811@gmail.com	Roselin	Priya	MEMBER	b59f16cf-0165-457f-9902-6706ab34eff5	2025-12-31 09:50:31.855	2025-12-31 10:43:46.397	\N	FREE	ACTIVE
10e92909-1495-4b8e-815d-948106d67f3c	auth0|69526e51e2c82a9458e70d47	isaac.joshua.k@gmail.com	Isaac	Joshua	ADMIN	a5964142-d4e6-4e70-b846-b3484dfa87d1	2025-12-31 09:50:55.898	2025-12-31 10:44:57.978	fa2d8696-c562-4f6b-a1e6-ea7f13f594c0	CORPORATE	ACTIVE
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ea910c36-2a76-47fa-a9ca-cae16fb59be8	e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855	2025-12-31 09:27:15.310485+00	20251230081420_init	\N	\N	2025-12-31 09:27:15.309012+00	1
c07196a4-cc1a-4308-922a-968001ef7e72	e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855	2025-12-31 09:27:15.312231+00	20251230112926_add_company_account_type	\N	\N	2025-12-31 09:27:15.310953+00	1
d2670e73-b016-4336-9340-f7fad1fa05c4	e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855	2025-12-31 09:27:15.313933+00	20251230115835_add_corporate_accounts	\N	\N	2025-12-31 09:27:15.312706+00	1
07f932fc-8c5f-4203-90f6-30de134e2468	e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855	2025-12-31 09:27:15.315863+00	20251230121554	\N	\N	2025-12-31 09:27:15.31454+00	1
83845553-1cf1-41ac-9ae1-4ae7e6e069c7	e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855	2025-12-31 09:27:15.317466+00	20251231080921_add_user_status_and_corporate	\N	\N	2025-12-31 09:27:15.316345+00	1
25974e8f-b8c2-4a91-bb75-97a36184cee2	ab64772b79e22d3ee1073c348fab0e6fcd30a6a1702e0cfe77b8db6b8af1bf5f	2025-12-31 09:27:15.388866+00	20251231092715_init	\N	\N	2025-12-31 09:27:15.374124+00	1
\.


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: CorporateAccount CorporateAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CorporateAccount"
    ADD CONSTRAINT "CorporateAccount_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Study Study_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Study"
    ADD CONSTRAINT "Study_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Company_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Company_name_key" ON public."Company" USING btree (name);


--
-- Name: CorporateAccount_companyId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CorporateAccount_companyId_key" ON public."CorporateAccount" USING btree ("companyId");


--
-- Name: Session_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_expiresAt_idx" ON public."Session" USING btree ("expiresAt");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: User_auth0Sub_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_auth0Sub_key" ON public."User" USING btree ("auth0Sub");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: CorporateAccount CorporateAccount_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CorporateAccount"
    ADD CONSTRAINT "CorporateAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Study Study_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Study"
    ADD CONSTRAINT "Study_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Study Study_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Study"
    ADD CONSTRAINT "Study_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_corporateAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_corporateAccountId_fkey" FOREIGN KEY ("corporateAccountId") REFERENCES public."CorporateAccount"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict aUMy55Og7ZhCDKLhR5R3qhYjtTdVWXiM8YDuWLyD0pErm8qpNKfPaUqdkrLOPz1

