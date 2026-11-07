# Backend transition progress

Updated: 2026-11-05

This file tracks implementation against [backend-architecture.md](backend-architecture.md).
The architecture document remains the plan and is not modified by this tracker.

## Current state

**Backend infrastructure is deployed; account foundations are implemented and
locally tested, but not pushed or deployed. Product data remains local.**
Production currently runs the frontend, Spring Boot backend, and PostgreSQL.
The containers have previously been reported healthy. The new working-tree
backend provides account and session endpoints; this is not evidence that
production serves them. Character, world, media, and transfer endpoints remain
unimplemented. No browser data has been migrated; existing frontend storage
is preserved, but the updated SPA requires a verified account session before
showing any application routes. Local data is not yet account-scoped.

## Planned milestones

Statuses: **Done** = verified complete; **Partial** = foundation exists but
acceptance is incomplete; **Not started** = implementation has not begun.

| Architecture stage | Status | Progress / remaining |
|---|---|---|
| 0. Prepare current data contracts | Partial | Current Character and World formats remain the intended contract. Representative import/export fixtures and round-trip verification for this transition are still needed. |
| 1. Backend foundation | Partial | Existing infrastructure remains. Identity now has parameterized JDBC repositories/API routes; new Flyway V2 adds account/token/rate-limit and Spring Session JDBC tables without modifying V1. Local migration from V1 and clean Testcontainers migration passed. Production HTTPS API verification remains Pending. |
| 2. Accounts | Partial | Locally verified: registration, single-use expiring email confirmation, resend, verified-only login, current user, logout, persistent JDBC sessions and owner-scoped list/revoke; Argon2id, token hashes, CSRF, session-ID rotation, production Secure/HttpOnly cookie settings, IP/email limits and neutral register/resend responses. Mandatory localized login screen, session-gated application routes, deep-link return and local proxy/Mailpit flow pass. Remaining: password reset/change and their all-session revocation, account-level authorization for future saved-data resources, real Gmail delivery verification, separate release and external HTTPS account/session/CSRF verification. |
| 3. First saved-data flow | Not started | After accounts: save and load a standalone character without portrait across devices; prove another account cannot read or change it. |
| 4. Worlds and handbooks | Not started | World settings/graph, races, system catalog resolution, custom entries and overrides, and world characters. |
| 5. Media | Not started | Private file metadata/storage, maps, music, portraits, quotas/disk guard, authorization, and audio range requests. |
| 6. Manual data transfer | Not started | Import current Character/World JSON and manually upload files; preserve local originals until the imported result is checked. No automatic browser-storage migration is planned. |

## Deployment and operations

| Item | Status | Notes |
|---|---|---|
| CI frontend, backend, and configuration checks | Done | Backend integration test uses PostgreSQL Testcontainers; YAML and production Compose validation are required before image publication. |
| GHCR frontend/backend images and production Compose | Done | Current composition includes `web`, `backend`, and `postgres`; DB and backend ports are not published to the host. |
| Persistent database volume | Done | PostgreSQL uses a named Compose volume; normal image rollback does not remove it. |
| Runtime DB password outside Git | Done | Workflow transfers the password to a mode-0600 VPS runtime env file. |
| Flyway migration at startup and backend readiness | Done | Foundation migration creates schema `app`. New V2 account/session schema is locally tested only; deployment was not performed. SMTP connectivity is not part of application health; send failures have sanitized server diagnostics. |
| Recovery across frontend-only/backend rollout | Done | Rollback preserves the previous Compose composition and image references; Nginx resolves backend dynamically for `/api/`, so the SPA can start without it. |
| Manual database backup/restore procedure | Documented, not rehearsed | Perform and verify a backup before relying on production data; rehearse restore against an isolated database. |
| External HTTPS API verification | Pending | Account routes now exist locally. Verify them, session cookies, CSRF and proxy/client-IP handling through public HTTPS after a separate deployment of the exact commit. No external account verification performed here. |

## Account and session foundations — local evidence

Verified locally on 2026-11-05; these are automated/local results, not
production deployment results or a claim of Owner acceptance:

- Backend `mvn test`: **16 passed**, no skipped tests. Ten PostgreSQL
  Testcontainers integration scenarios cover registration, unchanged duplicate
  accounts/neutral responses, confirmation expiry/resend/reuse/concurrent
  consumption, verified-only login, session-ID rotation, current user,
  logout, session ownership/revocation, CSRF and email/IP request limits.
  Anonymous and expired sessions cannot read current-account/session metadata
  or revoke a session, independent of frontend navigation.
  Unknown email and wrong passwords (including short passwords) return the same
  neutral error; unverified email is disclosed only after correct credentials.
  Authentication service failures return 503 rather than invalid credentials.
  Registration/resend reject incomplete domains before database, rate-limit
  or mail side effects; valid full domains and subdomains remain accepted.
  One scenario closes the backend application context, starts a new backend
  against the same PostgreSQL, and reuses the authenticated browser cookie.
- Additional backend checks cover health, production HttpOnly/Secure/SameSite
  cookie and authenticated mandatory STARTTLS settings, isolated dev SMTP,
  configured sender address, and delivery-error logs without secrets.
- Frontend `npm run check`: lint, **451 tests**, TypeScript and production
  build passed. Account strings are available in EN/RU.
- Chromium `npm run test:accounts`: **8 passed**. Real UI registration,
  Mailpit SMTP capture/link, confirmation, login in two browser contexts,
  resend, session list/revocation and logout go through Vite's local `/api` proxy.
  Mandatory standalone login hides application navigation; deep-link return
  preserves path/query/fragment after login and login-page reload.
  Login and registration are separate steps without tabs or manual token input.
  Registration opens a check-email step; unverified login offers resend.
  Email links confirm automatically and show a result with a return to login.
  Invalid/expired-link recovery and window-focus revalidation without consuming
  the same confirmation token again are covered by controlled API responses.
  Login distinguishes invalid credentials, unverified email, network failure
  and non-JSON server errors; resend is offered only for unverified email.
  Password creation guidance appears only during registration.
  Invalid email domains show an inline accessible error and never submit
  registration/resend requests or advance to the next step.
  Authenticated refresh retains access; logout/back navigation and revoked
  sessions cannot reopen the application.
  Existing character/world browser-storage values remain unchanged.
  Controlled browser API responses additionally verify loading without
  application-content flash, fail-closed session-check errors, idle expiry
  on an already-open local page, and protected-API 401 closing the whole app.
  Mobile error-screen width is checked for horizontal overflow.
- YAML syntax: **9 files** validated; production and dev Compose config
  validation passed. Production proxy replaces untrusted forwarded client-IP
  input; backend enables native forwarding only in the prod profile.
- No production SMTP credentials used and no real recipients contacted.
  Real Gmail delivery remains **Pending**.
- No push or deployment performed. External HTTPS verification remains
  **Pending**. Existing operational results above were not reverified here.

## Deployment incidents recorded

- The workflow initially had invalid YAML indentation; fixed and guarded by
  mandatory YAML and Compose validation.
- GitHub's Docker API rejected the Docker client bundled in Testcontainers
  1.21.3. Updating to 1.21.4 restored the integration test.
- VPS pulls from GHCR twice failed with `connection reset by peer`.
- The first backend rollout rollback stopped the frontend because the previous
  release had no backend image. Rollback was corrected to restore the prior
  frontend-only Compose composition without deleting volumes.
- That frontend-only rollback then exposed eager Nginx DNS resolution of the
  absent backend. `/api/` now resolves the backend dynamically, and startup
  without a backend was tested locally.
- The frontend was restored on the VPS and later the user reported all three
  production containers healthy.

## Next milestone

Accounts remains **Partial**. Complete the remaining account work and verify
the account foundation after a separately authorized release before relying on
production accounts. Password reset/change, saved characters/worlds, and browser
data transfer were intentionally excluded from this milestone. Keep existing
frontend storage until each corresponding server flow and verified transfer
exist. The updated requirement mandates login now; it does not migrate or
account-scope that local storage.

## Update rule

Update this tracker only when a milestone or operational check is verified by Owner.
Record partial work as partial, and keep architecture decisions in
`backend-architecture.md`.
