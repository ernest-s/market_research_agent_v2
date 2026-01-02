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
* Auditability (admin-only, append-only audit logs)

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
│   │   │   ├── api/        # Backend API routes
│   │   │   ├── admin/      # Corporate admin UI
│   │   │   └── auth/       # Auth bootstrap + password reset
│   │   ├── components/
│   │   └── lib/
│   │       ├── prisma.ts
│   │       ├── requireSession.ts
│   │       ├── requireCorporateAdmin.ts
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

   * Provisions or loads user
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
## Corporate Accounts & Roles

### Corporate Model

The sysetm supports **corporate accounts** layered on top of individual users:
* `Company` - represents a real-world organization
* `CorporateAccount` - billing + administrative boundary
* `User` - may optionally belong to a corporate account

A user may exist independently or as part of a corporate account.

### Roles

| Role        | Capabilities                                        |
| ----------- | ----------------------------------------------------|
| ADMIN       | Manages users, suspend/reactivate, reset passwords  |
| MEMBER.     | Normal product usage                                |

Admins are **not special users** - they are standard users with elevated privileges.

---
## Corporate Admin APIs

Corporate admin functionality is implemented via explicit API routes:
* `POST /api/admin/users` - Invite new users
* `POST /api/admin/users/:id/suspend`
* `POST /api/admin/users/:id/reactivate`
* `POST /api/admin/users/:id/reset-password`

Rules enforced server-side:
* Admins cannot suspend or reactivate themselves
* Admins can act only withiin their corporate account
* Only ACTIVE users can receive password reset emails
* DELETED users are immutable
---
## Admin Audit Logging

### Purpose

All **admin actions** are recorded in an **append-only audit log** for:
* Security reviews
* Incident investigation
* Compliance readiness

### Characteristics

* Append-only
* Never updated
* Never deleted (may be add cron job later to clear old logs)
* Written synchronously with admin actions
* No foreign key constraints (intentionally)

### Logged Actions (Current)

* User invited
* User suspended
* User reactivated
* Password reset triggered

---

## Middleware Strategy

`middleware.ts` is intentionally minimal:

* Runs on protected **UI pages only**
* Performs **read-only session validation**
* Never decodes JWTs
* Never writes to the database

All authorization decisions occur inside API handlers.

---

## Prisma Usage

* **Single Prisma schema** at `/prisma/schema.prisma`
* **Single migration history**
* Prisma Client generated once per workspace

All Prisma commands are run from the repository root:

```bash
npx prisma generate --schema=prisma/schema.prisma
npx prisma migrate dev --schema=prisma/schema.prisma
```

### Migration Philosophy

* Schema changes are incremental and explicit
* High-risk changes are avoided in favor of additive models
* Audit logs are designed as low-risk, append-only tables
* SQL backups are maintained as a fallback safety mechanism

---

## Frontend (Next.js)

Key characteristics:

* App Router (Next.js 16)
* Client-side bootstrap + server-side enforcement
* No JWT decoding in UI
* No direct Auth0 SDK usage for session logic
* Admin UI is role-gated via server APIs

---

## Services Workspace

The `services` workspace contains:

* LangGraph-based agent systems
* Cron jobs (e.g., session cleanup)

Services: 
* Share the same database
* Share Prisma Client
* Are deployment-independent from the frontend

---

## Design Principles

* One source of truth per concern
* Backend-first security
* Explicit session enforcement
* Append-only auditability
* No hidden auth state
* Clear separation of identity, access, and intelligence

---

## Summary

This architecture deliberately separates:

* Identity (Auth0)
* Authorization (app sessions)
* Administration – Corporate admin APIs + audit logs
* UI (Next.js)
* Intelligence (agents)

The result is a secure, scalable, enterprise-ready SaaS foundation designed
to support long-term evolution without architectural rewrites.
