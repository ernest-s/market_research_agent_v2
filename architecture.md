# Qualitative Research Platform – Architecture

## Overview

This repository is a **monorepo** containing a production-grade, enterprise SaaS application for qualitative market research. The system combines:

* A **Next.js 16 frontend** (App Router)
* **Auth0-based authentication** with app-level session enforcement
* **PostgreSQL + Prisma** as the system of record
* **Agentic AI services** (LangGraph-based) in a separate services workspace
* Background jobs (cron) for maintenance tasks

The architecture is intentionally designed for:

* Security (single-session enforcement)
* Scalability (clear frontend / services separation)
* Maintainability (single Prisma schema and migration history)

---

## Repository Structure

```
root/
├── package.json            # Workspace root (Prisma + shared deps)
├── prisma/
│   ├── schema.prisma       # Single source of truth
│   └── migrations/
│
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/
│   │   └── lib/
│   │       ├── prisma.ts
│   │       ├── requireSession.ts
│   │       └── auth helpers
│   └── .env.local
│
└── services/
    ├── study_design_agent/ # LangGraph-based agents
    └── cron/
        └── cleanupSessions.ts
```

---

## Authentication & Session Model

### Identity vs Session

| Layer       | Responsibility                                      |
| ----------- | --------------------------------------------------- |
| Auth0       | Identity, login, email verification, password reset |
| App Session | Single-session enforcement, timeout, revocation     |

Auth0 is **not** used to manage active sessions. All runtime access is governed by the application session layer.

---

## App-Level Session System

### Session Storage

Sessions are stored in PostgreSQL via Prisma:

* One **active session per user**
* Previous sessions are revoked when overridden
* Session history retained (bounded)

Key fields:

* `id` (stored in `app_session_id` cookie)
* `userId`
* `expiresAt`
* `lastSeenAt`
* `revokedAt`
* `revokedReason`

### Session Lifecycle

1. User authenticates with Auth0
2. `/api/auth/bootstrap`

   * Provisions user
   * Enforces email verification
   * Creates or validates app session
3. Session ID stored as HttpOnly cookie
4. All authenticated APIs validate session via `requireSession`

### Sliding Inactivity Timeout

Sessions enforce a **strict sliding inactivity timeout** controlled by the
`SESSION_TIMEOUT_MINUTES` environment variable.

Behavior:

* `lastSeenAt` tracks the timestamp of the **last successful authenticated request**
* If **no backend activity** occurs within the configured timeout window:
  * The **first request after inactivity fails**
  * The session is immediately revoked with reason `TIMEOUT`
  * The user is redirected to `/login`
* Sessions are **only refreshed if already valid**
* No request can resurrect an expired session

This ensures true inactivity-based logout semantics consistent with
enterprise SaaS security expectations.


---

## Single-Session Enforcement

* A user may only have **one active session** at a time
* If another session exists:

  * Dashboard shows a **modal conflict dialog**
  * User may cancel or override
* Override revokes the old session immediately

This is enforced:

* At API level (`requireSession`)
* At UI level (dashboard bootstrap)

---

## Middleware Strategy

`middleware.ts` is intentionally minimal:

* Runs on protected **UI pages only**
* Performs **read-only session validation**
* Never decodes JWTs
* Never writes to the database

APIs enforce auth/session explicitly inside route handlers.

---

## Prisma Usage

* **Single Prisma schema** at `/prisma/schema.prisma`
* **Single migration history**
* Prisma Client imported from workspace root

All Prisma commands are run from the repository root:

```bash
npx prisma migrate dev --schema=prisma/schema.prisma
npx prisma generate --schema=prisma/schema.prisma
```

---

## Frontend (Next.js)

Key characteristics:

* App Router (Next.js 16)
* Client-side bootstrap + server-side enforcement
* No JWT decoding in UI
* No direct Auth0 SDK usage for session logic

---

## Services Workspace

The `services` workspace contains:

* LangGraph-based agent systems
* Cron jobs (e.g., session cleanup)

Services share the same database and Prisma client, but are **deployment-independent** from the frontend.

---

## Design Principles

* One source of truth per concern
* Explicit session enforcement
* No magic auth state
* Backend-first security
* Workspace isolation with shared contracts

---

## Summary

This architecture deliberately separates:

* Identity (Auth0)
* Authorization (app sessions)
* UI (Next.js)
* Intelligence (agents)

The result is a secure, scalable, enterprise-ready SaaS foundation.
