# Backend transition progress

Updated: 2026-11-08

This file tracks implementation against [backend-architecture.md](backend-architecture.md).
The architecture document remains the plan and is not modified by this tracker.

## Current state

**Backend infrastructure and account functions are deployed; the Owner has
verified the account workflows in production. Stage 3 is accepted locally;
its production verification remains Pending.**
Production currently runs the frontend, Spring Boot backend, and PostgreSQL.
The Owner reports successful deployment and verification of registration,
email confirmation, login/logout, session management, password reset/change
and all-session revocation. The deployed commit and workflow run have not
been independently verified here. Account-owned standalone character CRUD
is implemented and accepted by Owner locally on 2026-11-08, without portraits.
These changes have not been deployed. World, media, and transfer endpoints
remain unimplemented. No browser data has been migrated; existing frontend storage
is preserved, but the updated SPA requires a verified account session before
showing any application routes. Legacy local data is not account-scoped and
is not mixed with the server character library.

## Planned milestones

Statuses: **Done** = verified complete; **Partial** = foundation exists but
acceptance is incomplete; **Not started** = implementation has not begun.
**Done (local)** = accepted by Owner locally; does not imply deployment or
production verification.

| Architecture stage | Status | Progress / remaining |
|---|---|---|
| 0. Prepare current data contracts | Partial | Representative Character fixtures and round-trip checks were added for Stage 3. World data and linked Character/World contract verification remain part of Stage 4. |
| 1. Backend foundation | Partial | Identity uses parameterized JDBC repositories/API routes; Flyway V2 adds account/token/rate-limit and Spring Session JDBC tables, and V3 adds password reset tokens without modifying earlier migrations. Clean Testcontainers migrations passed. Production HTTPS API verification remains Pending. |
| 2. Accounts | Partial | The Owner reports production verification of registration and email confirmation, login/logout, session list/revocation, password reset/change, delivery of the reset email and all-session revocation after password updates. Local tests additionally cover Argon2id, token hashes, CSRF, session-ID rotation, IP/email limits and neutral mail-request responses. Remaining: independently identify the deployed commit/workflow and verify production security/configuration details including CSRF and proxy/client-IP handling. Authorization for saved-data resources belongs to stage 3. |
| 3. First saved-data flow | Done (local) | Owner accepted standalone character CRUD without portraits on 2026-11-08 in the agreed scope. Cross-browser persistence, ownership isolation and contract checks passed locally. No deployment; production verification Pending. |
| 4. Worlds, handbooks and linked characters in the account | Not started | Next agreed milestone: one connected flow for worlds, settings/graph, custom handbook entries and overrides, races/abilities/modifiers, and linked characters. All required rules and reference data must be available across devices. |
| 5. Media | Not started | Private file metadata/storage, maps, music, portraits, quotas/disk guard, authorization, and audio range requests. |
| 6. Manual data transfer | Not started | Import current Character/World JSON and manually upload files; preserve local originals until the imported result is checked. No automatic browser-storage migration is planned. |

## Deployment and operations

| Item | Status | Notes |
|---|---|---|
| CI frontend, backend, and configuration checks | Done | Backend integration test uses PostgreSQL Testcontainers; YAML and production Compose validation are required before image publication. |
| GHCR frontend/backend images and production Compose | Done | Current composition includes `web`, `backend`, and `postgres`; DB and backend ports are not published to the host. |
| Persistent database volume | Done | PostgreSQL uses a named Compose volume; normal image rollback does not remove it. |
| Runtime DB password outside Git | Done | Workflow transfers the password to a mode-0600 VPS runtime env file. |
| Flyway migration at startup and backend readiness | Done | Foundation migration creates schema `app`; V2 and V3 account/session schemas have been tested locally. Production application of these versions has not been independently verified here. SMTP connectivity is not part of application health; send failures have sanitized server diagnostics. |
| Recovery across frontend-only/backend rollout | Done | Rollback preserves the previous Compose composition and image references; Nginx resolves backend dynamically for `/api/`, so the SPA can start without it. |
| Manual database backup/restore procedure | Documented, not rehearsed | Perform and verify a backup before relying on production data; rehearse restore against an isolated database. |
| External HTTPS API verification | Partial | The Owner reports verifying account and password workflows in production. Independently identify the deployed commit and verify session-cookie settings, CSRF and proxy/client-IP handling through public HTTPS; these specific checks have not been confirmed. |

## Account workflows — Owner-reported production verification

On 2026-11-07 the Owner reported that the account changes were deployed
successfully and verified in production:

- Registration and email confirmation; login and logout.
- Viewing and revoking active sessions.
- Forgotten-password reset and password change with the current password;
  the reset email arrived and the password was updated.
- Revocation of all sessions after a reset or password change.

These are Owner-reported checks, not independent observations of the release.
The exact commit and Production workflow run, provider-specific SMTP behavior,
production CSRF, session-cookie settings and proxy/client-IP handling have not
been independently verified here.

## Stage 3 — Owner acceptance and local evidence

On 2026-11-08 the Owner confirmed that standalone character CRUD works
locally and accepted Stage 3 in the agreed scope, without portraits or world
links. These changes have not been deployed; production verification is
**Pending**.

Previously completed local checks:
- Backend `mvn test`: **26 passed**, no skipped tests, including PostgreSQL
  Testcontainers migrations, validation, CRUD, version conflicts, session/CSRF
  protection, account isolation and owner spoofing checks.
- Frontend `npm run check`: lint, **457 tests**, TypeScript and production
  build passed, including Character JSON compatibility fixtures.
- Chromium `npm run test:accounts`: **12 passed** with the local API proxy,
  Mailpit and isolated PostgreSQL. The saved-character flow covers two browser
  contexts, failed-save draft preservation, version conflicts, direct foreign
  GET/PUT/DELETE requests and deletion by the owner.
- Saved database records and versions survived a backend restart; browser
  local-data sentinels remained unchanged.

This update records Owner acceptance and existing local evidence; no new
implementation, push or deployment was performed for this documentation update.

## Password reset and change — local evidence

Locally verified on 2026-11-07 and confirmed by Owner. These are local results,
not independent evidence of a production release:

- Backend `mvn clean test`: **24 passed**, no skipped tests. PostgreSQL
  Testcontainers tests cover neutral reset responses, token expiration,
  purpose separation, concurrent and repeated consumption, invalidation of
  outstanding links, unverified-account login, CSRF, rate limits, password
  changes, all-session revocation and transaction rollback.
- Frontend `npm run check`: lint, **452 tests**, TypeScript and production
  build passed. Password flows use EN/RU strings.
- Chromium `npm run test:accounts`: **11 passed** against Mailpit and an
  isolated PostgreSQL database. The password flow covers the email link,
  password changes, incorrect current password, old/new password login and
  session revocation across browser contexts. A repeat on the shared local
  database encountered its existing IP rate limit; the successful full run
  used an isolated database without clearing shared counters.
- YAML syntax: **13 files** validated; development and production Compose
  configurations validated. No production SMTP credentials or real recipients
  were used.
- The Owner subsequently reported production reset-email delivery and account
  workflow verification, as recorded above. The exact deployed commit and
  security/configuration checks were not independently verified here.

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
- No production SMTP credentials were used and no real recipients contacted
  in this local test run.
- No push or deployment was performed as part of this local test run.
  Subsequent Owner-reported production verification is recorded above.

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

**Stage 4 — Миры, справочники и связанные персонажи в аккаунте** is next,
agreed by Owner on 2026-11-08. Implementation is **Not started**. The full
scope and acceptance criteria are recorded in the
[architecture plan](backend-architecture.md#ближайший-milestone-миры-справочники-и-связанные-персонажи-в-аккаунте).

Goal: work with an account-owned world and its characters across devices,
preserving rules, handbooks, relationships and computed results.

Scope: world data, setting rules, graph entities/relationships, custom handbook
entries and system overrides, races, racial abilities/modifiers, world-linked
characters and reference resolution, account isolation, and existing
JSON/editor behavior. These are one connected flow, not independent demos:
a character is fully saved only when all required rules and reference data
are available.

Acceptance:
1. Save a world with modified rules, custom handbook entries and a race.
2. Save a character using those data with correct references.
3. In another browser under the same account, load the world, handbooks and
   character with matching values, descriptions and computed results.
4. Preserve changes after reopening and restarting the backend.
5. Changing/deleting linked entries causes neither silent data loss nor
   unnoticed substitution of rules.
6. Another account cannot read, update or delete any of these resources,
   including direct API requests.
7. Import/export checks preserve data and relationships within existing contracts.

Excluded: portraits and other media, sharing, and legacy browser-data transfer.
Existing local data stays intact without automatic account assignment.

Accounts remains **Partial** for the production evidence and
security/configuration checks listed above. Stage 3 local acceptance does not
complete its Pending production verification.

## Update rule

Update this tracker only when a milestone or operational check is verified by Owner.
Record partial work as partial, and keep architecture decisions in
`backend-architecture.md`.
