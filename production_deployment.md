# Production Deployment Guide

This document outlines the recommended steps and safeguards for deploying the Qualitative Research Platform to production.

---

## 1. Environment Separation

### Required Environments

* Development
* Staging (recommended)
* Production

Each environment must have:

* Separate database
* Separate Auth0 application
* Separate secrets

---

## 2. Environment Variables

### Frontend (.env.production)

Required:

```env
DATABASE_URL=
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_BASE_URL=
AUTH0_SECRET=
SESSION_TIMEOUT_MINUTES=60
NEXT_PUBLIC_ENFORCE_EMAIL_VERIFICATION=true
```

Never reuse dev credentials in production.

---

## 3. Auth0 Configuration

### Applications

* SPA / Web App (frontend)
* Machine-to-Machine (management API)

### Required Settings

* Enforce email verification
* Disable implicit flows
* Configure allowed callback URLs
* Configure allowed logout URLs

---

## 4. Database

### Prisma

Before deploy:

```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
npx prisma generate --schema=prisma/schema.prisma
```

Never run `migrate dev` in production.

---

## 5. Session Management

### Session Cleanup

A cron job must periodically clean expired and revoked sessions.

Recommended:

* Run every 15 minutes
* Delete:

  * expired sessions
  * revoked sessions older than retention window

Retention recommendation:

* Keep last 100 sessions per user

---

## 6. Cron Jobs

### cleanupSessions.ts

Deployment options:

* Dedicated Node worker
* Cloud scheduler (GCP / AWS)
* Serverless scheduled function

Ensure:

* Same DATABASE_URL
* Same Prisma client version

---

## 7. Frontend Build

```bash
cd frontend
npm run build
npm run start
```

Ensure:

* NODE_ENV=production
* No query logging

---

## 8. Security Checklist

* HttpOnly cookies only
* Secure cookies in HTTPS
* No JWT decoding outside bootstrap
* No Prisma writes in middleware
* Single active session enforced

---

## 9. Observability

Recommended:

* Structured logging
* Auth/session error tracking
* Database connection monitoring

---

## 10. Rollback Strategy

* Immutable deploys
* Database migrations reversible
* Feature flags for auth/session behavior

---

## 11. Pre-Go-Live Checklist

* [ ] Email verification enforced
* [ ] Single-session override tested
* [ ] Session timeout tested
* [ ] Password reset tested
* [ ] Cron job running
* [ ] Prisma schema locked
* [ ] Secrets rotated

---

## Summary

Production readiness hinges on:

* Strong session enforcement
* Clean separation of concerns
* Immutable infrastructure

With these steps, the platform is ready for enterprise-grade deployment.
