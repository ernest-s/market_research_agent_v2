# Qualitative Research Platform – Architecture

## Overview

This repository is a **monorepo** containing a production-grade, enterprise SaaS application for qualitative market research. The system combines:

* A **Next.js 16 frontend** (App Router)
* **Auth0-based authentication** with app-level session enforcement
* **Application-level session enforcement**
* **PostgreSQL + Prisma** as the system of record
* **Agentic AI services** (LangGraph-based) in a separate services workspace
* Background jobs (cron) for maintenance tasks

The architecture is intentionally designed for:

* Strong security (strict inactivity timeout, single-session enforcement)
* Clear separation of identity vs access
* Centralized authorization logic
* Scalability (clear frontend / services separation)
* Maintainability (single Prisma schema and migration history)
* Auditability (admin-only, append-only audit logs) and future compliance

---

## Repository Structure

```
root/
├── package.json
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/
│       │   │   ├── auth/
│       │   │   ├── session-conflict/
│       │   │   └── (app)/
│       │   ├── components/
│       │   └── lib/
│       │       ├── prisma.ts
│       │       ├── requireSession.ts
│       │       └── requireAppSession.ts
│       └── .env.local
│
└── services/
    ├── study_design_agent/
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

Auth0 is **not** used to manage active sessions. All runtime access is governed by **application-managed sessions** stored in Postgres.

---

## Application Session Model

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
2. Auth0 redirects to `/api/auth/callback`
3. Callback:
   * Resolves user (auth0Sub <-> email)
   * **Always creates a new app session**
   * Sets `app_session_id` cookie
4. User is redirected to `/dashboard`

### Session Validation
All protected access flows through `requireSession()`
`requireSession()` enforces:
* Session existence
* Revocation status
* Strict inactivity timeout
* User + Corporate Account ACTIVE status

### Sliding Inactivity Timeout

Sessions enforce a **strict sliding inactivity timeout** controlled by the
`SESSION_TIMEOUT_MINUTES` environment variable.

Behavior:

* `lastSeenAt` is updated **only on successful authenticated requests**
* If inactivity exceeds the timeout:
  * The **first request after inactivity fails**
  * The session is immediately revoked with reason `TIMEOUT`
  * User is forced through logout
* Expired sessions **cannot be resurrected**

This ensures true inactivity-based logout semantics consistent with enterprise SaaS security expectations.


---

## Single-Session Enforcement

### Policy
* A user may only have **one active session** at a time
* Logging in from another browser creates a new session
* Older sessions are **not automatically revoked**
* Instead, conflicts are **explicitly resolved by the user**

### Conflict Detection
Conflicts are detected when:
* A valid session exists for the same user
* A different `app_session_id` is presented
When detected:
* User is redirected to `/session-conflict`

### Conflict Resolution
On `/session-conflict`:
* **Proceed here**
  * Calls `/api/auth/session/override`
  * Revokes all other sessions (`OVERRIDDEN`)
  * Keeps the current session active
* Cancel
  * Logs out the current browser via `/auth/logout`
This ensures explicit user intent and avoids silent takeovers. 

---
## Centralized Access Control
### Three Security Rings
```
┌───────────────────────────┐
│ Browser / Navigation      │  ← Providers.tsx
├───────────────────────────┤
│ Server Layout Boundary    │  ← requireAppSession()
├───────────────────────────┤
│ Database Truth            │  ← requireSession()
└───────────────────────────┘
```
### Server-Side Entry (Hard Gate)
```
/(app)/layout.tsx
        │
        ▼
requireAppSession()
        │
        ▼
requireSession()
        │
        ├── INVALID
        │       → redirect /auth/logout
        │
        ├── SUSPENDED
        │       → redirect /account-suspended
        │
        └── VALID
                ↓
        AppShell renders
```
### Client-Side Navigation
```
User clicks link
        │
        ▼
Providers.tsx
        │
        ├─ Public route → allow
        │
        └─ Protected route
               │
               ▼
        POST /api/auth/revalidate
               │
               ├── 401 → /auth/logout
               ├── 403 → /account-suspended
               └── 200 → allow navigation
```
### Bootstrap API
`/api/auth/bootstrap` is **read-only**.
Responsibilities:
* Decode Auth0 identity
* Resolve user record
* Return enriched user + account context
It **does not**:
* Create sessions
* Validate sessions
* Handle conflicts
Bootstrap is safe to call repeatedly. 
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
## Design Principles
* Backend-first security
* Explicit session semantics
* No hidden auth state
* Clear identity vs authorization boundary
* Auditability by design
* No UI-only enforcement
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
* Access control (App sessions)
* Administration – Corporate admin APIs + audit logs
* UI (Next.js)
* Conflict resolution (explicit user action)
* Intelligence (agents)

The result is a predictable, secure, enterprise-grade SaaS foundation
that avoids implicit auth state and supports long-term evolution.

---
