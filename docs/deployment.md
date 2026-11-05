# Production deployment

Last verified: 2026-11-04 (current HTTP-only VPS state, before the HTTPS
configuration changes below).

## Verified current state

The application is deployed and healthy.

| Item | Verified value |
|---|---|
| Public application URL | `http://13.140.206.57/` |
| Public health URL | `http://13.140.206.57/healthz` |
| Deployed image | `ghcr.io/hbah8/character-creation:f265214af67371330e06baf32f0d55b58f8d1f5c` |
| Container | `character-creation-web-1` |
| Container health | `healthy` |
| Compose project | `character-creation` |
| Docker network | `character-creation_default` (`bridge`, local) |
| Published ports | `0.0.0.0:80->8080/tcp`, `[::]:80->8080/tcp` |

The public root, `/healthz`, and a direct request to
`/creator/example` returned HTTP 200 on the verification date.

## Architecture

### VPS

| Item | Value |
|---|---|
| Provider | Contabo |
| OS | Ubuntu 24.04 LTS |
| Server address | `13.140.206.57` |
| SSH account | `deploy` via local alias `contabo-apps` |
| Application directory | `/opt/apps/character-creation` |
| Compose file on VPS | `/opt/apps/character-creation/compose.yaml` |
| Deploy script on VPS | `/opt/apps/character-creation/deploy.sh` |
| Runtime image selector | `/opt/apps/character-creation/.env` (`IMAGE=...`) |

The VPS currently runs one application container. The backend/PostgreSQL
configuration below is prepared in Git but is not deployed or verified on the
VPS until a successful Production workflow completes.

| Compose service | Purpose |
|---|---|
| `web` | Nginx serves the static Vite SPA, `/healthz`, immutable assets, and the SPA fallback for client routes. |

The container listens internally on port 8080. Docker publishes it directly
on host port 80. There is no separate reverse proxy, backend, database,
object storage, or GitHub Actions runner on the VPS.

The Compose project creates the local bridge network
`character-creation_default`. It currently contains only `web`. The deployed
HTTP-only Compose version has no named volumes or bind mounts. Browser data
is never mounted into the container.

The service uses `restart: unless-stopped`, a Docker healthcheck, a read-only
container filesystem with temporary Nginx paths, `no-new-privileges`, and the
Docker `local` logging driver with three 10 MB log files.

### Prepared backend and database services

The prepared production Compose configuration adds these internal services:

| Compose service | Purpose | Published ports |
|---|---|---|
| `backend` | Spring Boot API; runs Flyway before reporting readiness | None |
| `postgres` | PostgreSQL 17 for backend data | None |

`web` proxies `/api/` to `backend:8080` over the Compose network. It remains
the only service that publishes ports 80 and 443. `web` starts after the
backend becomes healthy; the backend waits for PostgreSQL health. PostgreSQL
data lives in the named volume `character-creation_postgres-data`; normal
`up`, image replacement, rollback, and `down` without `-v` preserve it.

The deployment workflow writes the database password only to
`/opt/apps/character-creation/.runtime.env` with mode 0600. That file supplies
the containers' PostgreSQL and backend password variables, is ignored by Git,
and must not be copied into images, logs, or diagnostics. `.env` continues to
contain only immutable web and backend image references.

The HTTPS configuration adds persistent host directories under
`/opt/apps/character-creation`:

| Host path | Use |
|---|---|
| `acme-webroot/` | HTTP-01 challenge files; shared with Nginx read-only |
| `letsencrypt/` | Production Certbot account, renewal config, live/archive certificate symlinks, and private keys |
| `letsencrypt-staging/` | Isolated staging account and test certificate state; never mounted into Nginx |
| `letsencrypt-work/`, `letsencrypt-log/` | Production Certbot work data and logs |
| `letsencrypt-staging-work/`, `letsencrypt-staging-log/` | Staging work data and logs |
| `nginx-https/` | Optional HTTPS server config; remains empty until production certificate issuance succeeds |

These are bind mounts outside the image and Git. Nginx mounts the production
certificate tree read-only, including `archive/` so `live/` symlinks resolve.
The Certbot container has no Docker socket. It is invoked on demand by host
scripts and runs only while Compose is explicitly asked to run `certbot`.
Nginx includes HTTPS configuration only when a file exists in
`nginx-https/`, so the initial HTTP-only startup does not reference missing
certificate files.

The HTTP server serves `/.well-known/acme-challenge/` from the webroot with
404 for absent challenge files; the path is excluded from SPA fallback. Both
HTTP and HTTPS serve the app, `/healthz`, and SPA routes. Port 443 is published
as container port 8443. HTTP-to-HTTPS redirection is intentionally not enabled
yet, pending confirmation that browser data has been exported or is not
needed.

### Data and updates

The application is a static client-side SPA:

- Characters, worlds, preferences, and similar records use browser
  `localStorage`.
- Maps and local audio bindings use browser IndexedDB.
- The VPS has no application data volume, database, or bind mount.

Consequently, a container recreation or image update preserves no
server-side user data because none exists. Browser data remains on the
specific browser and origin. It is not shared between GitHub Pages,
`http://13.140.206.57`, and `https://13.140.206.57`; HTTP and HTTPS are
different browser origins, including for `localStorage` and IndexedDB.

Before moving browser data from HTTP to HTTPS, export characters and worlds
from `http://13.140.206.57` and import them at `https://13.140.206.57`. Keep
HTTP serving the app until the owner confirms export is complete or that
transfer is not needed. Maps require re-import, and local audio file bindings
require re-selection. HTTPS setup and certificate renewal do not remove or
redirect the old HTTP origin.

After the prepared backend configuration is deployed, Flyway owns the
versioned database schema. An application image rollback restores both
application images but does **not** roll back the database schema. Correct a
failed migration with a forward migration, or restore a backup taken before
the migration after explicitly stopping the affected services.

## CI/CD

The authoritative pipeline is
[`.github/workflows/production.yml`](../.github/workflows/production.yml).
It runs only on GitHub-hosted runners.

### Triggers and sequence

| Trigger | Result |
|---|---|
| Pull request targeting `main` | Frontend `npm run check` and backend `mvn test`; no image publication or VPS access |
| Push to `main` | Checks, image build, GHCR publication, VPS deployment, healthcheck |
| Manual `workflow_dispatch` | Same as push for the selected revision |

For push and manual runs the sequence is:

1. `checks`: `actions/setup-node` installs Node 22; `npm ci` and
   `npm run check` run in `character-app`.
2. `backend-checks`: the GitHub-hosted runner runs `mvn test` under Java 21,
   including the PostgreSQL Testcontainers integration test.
3. `publish`: the GitHub-hosted runner builds the root
   [Dockerfile](../Dockerfile) and [backend Dockerfile](../backend/Dockerfile),
   then pushes `ghcr.io/hbah8/character-creation:<full-git-sha>` and
   `ghcr.io/hbah8/character-creation-backend:<full-git-sha>`.
4. `deploy`: the runner verifies the VPS host key, stages Compose and
   deployment/ACME files, authenticates the VPS Docker client to GHCR, and
   transfers the database password through SSH standard input before calling
   the staged deployment helper. That helper takes the shared
   `/opt/apps/character-creation/.operation.lock`, installs the staged files,
   pulls immutable web/backend images, starts Compose, and waits for backend
   and `web` healthchecks. Certificate renewal uses the same lock, so it
   cannot overlap container replacement or Nginx reload.

The `deploy` job has the `production-deploy` concurrency group with
`cancel-in-progress: false`; multiple production deploys queue instead of
running concurrently.

The deployed version is the full Git SHA in two places:

```shell
# Run on the VPS.
sed -n 's/^IMAGE=//p' /opt/apps/character-creation/.env
docker compose --project-name character-creation -f /opt/apps/character-creation/compose.yaml ps
```

### GitHub configuration

Repository variables are configured in GitHub Actions settings:

| Variable | Purpose |
|---|---|
| `GHCR_IMAGE` | GHCR repository prefix. The verified runtime image is under `ghcr.io/hbah8/character-creation`. |
| `VPS_HOST` | VPS address used by the deploy job. |
| `VPS_USER` | SSH account used by the deploy job (`deploy`). |

Repository secrets are configured in GitHub Actions settings:

| Secret | Purpose |
|---|---|
| `VPS_DEPLOY_SSH_KEY` | Private half of the dedicated GitHub Actions deploy key. |
| `VPS_SSH_KNOWN_HOSTS` | Verified SSH host-key entry for the VPS. |
| `GHCR_PULL_TOKEN` | Classic GitHub PAT with `read:packages`, passed only to `docker login --password-stdin` on the VPS. |
| `PRODUCTION_DATABASE_PASSWORD` | Non-empty single-line password for the PostgreSQL backend account; transferred only through SSH standard input to the VPS runtime secret file. |

The publish job uses the GitHub Actions `GITHUB_TOKEN` as
`${{ github.actor }}` with `packages: write` permission. The VPS pulls using
the GitHub repository owner as its GHCR username and `GHCR_PULL_TOKEN`; that
token requires read access to both GHCR packages. Secret values, SSH key contents,
and registry credentials must never be added to Git, image layers, frontend
assets, logs, or this document.

Token expiration dates were not verified. Track expiry in GitHub's token
management UI. To rotate `GHCR_PULL_TOKEN`, create a replacement classic PAT
with `read:packages`, replace the repository secret, dispatch the Production
workflow, and revoke the old token only after the deployment succeeds. To
rotate the deploy key, add the new public key to `deploy`'s
`~/.ssh/authorized_keys`, replace `VPS_DEPLOY_SSH_KEY`, verify a deployment,
then remove the old public key.

### Deployment failure behavior

The deploy script records the previous `IMAGE` from `.env`, sets the new
image, pulls it, starts Compose, and waits up to about 60 seconds for
`healthy`. If pull, startup, or healthcheck fails, it attempts to restore the
previous image. On an initial deployment without a prior image, it stops the
failed Compose project.

This automatic rollback path is implemented but has **not** been
failure-tested in production. Treat it as best effort, not a guaranteed
recovery mechanism.

## Runbook

All commands below are read-only unless explicitly described as restart,
rollback, or deployment.

### HTTPS setup and data migration gate

The production workflow first deploys HTTP challenge support and port 443;
until a certificate is installed Nginx loads only the HTTP server. The
challenge location is reachable at
`http://13.140.206.57/.well-known/acme-challenge/<token>`.

The staged
[issue-certificates.sh](../deploy/issue-certificates.sh) command first obtains
a staging IP certificate using the pinned `certbot/certbot:v5.4.0` image,
profile `shortlived`, and webroot validation, following the [Let's Encrypt
IP-certificate Certbot instructions](https://letsencrypt.org/2026/03/11/shorter-certs-certbot/).
It then forces a **dry-run** renewal against the staging environment, using
staging-only config/work/log directories. Only if both staging operations
succeed does it request the production certificate.
The production certificate is installed under
`letsencrypt/live/13.140.206.57/`; only then is the HTTPS Nginx config added
and tested before a graceful reload. The staging certificate is never mounted
into Nginx. The ACME account is registered without a notification email, so
the systemd timer and its logs are the renewal monitoring mechanism.

After a successful deployment, run on the VPS:

```shell
cd /opt/apps/character-creation
./issue-certificates.sh
```

Verify from a workstation before migrating data:

```shell
curl --fail --show-error https://13.140.206.57/healthz
curl --fail --show-error https://13.140.206.57/creator/example
curl --fail --show-error http://13.140.206.57/healthz
```

The HTTPS curl must use normal certificate validation (do not use `-k`).
After exporting/importing browser data or confirming it is not needed, the
owner must explicitly approve enabling the HTTP-to-HTTPS redirect. Until
then, HTTP continues to serve the application so data can still be exported.

### Install the automatic renewal timer

The renewal script runs Certbot's normal `renew` logic; it does not force
production issuance. The systemd timer checks at 00:00 and 12:00 server-local time, with a
randomized delay up to 15 minutes, plus five minutes after boot. Certbot
decides whether renewal is due. Certbot's own random pre-renewal sleep is
disabled because the timer provides jitter; the service allows up to 45
minutes. A nonblocking `flock` prevents overlapping renewals and shares the
deployment lock.

Run these exact commands on the VPS after the certificate setup and external
HTTPS check succeed (administrative installation requires `sudo`):

```shell
cd /opt/apps/character-creation
sudo install -m 0644 character-creation-certbot-renew.service /etc/systemd/system/
sudo install -m 0644 character-creation-certbot-renew.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now character-creation-certbot-renew.timer
systemctl list-timers character-creation-certbot-renew.timer
```

The exact next scheduled activation is shown by the final command. Confirm
that the timer is enabled after reboot with:

```shell
systemctl is-enabled character-creation-certbot-renew.timer
systemctl status character-creation-certbot-renew.timer --no-pager
```

To run a renewal check immediately, without forcing a production renewal:

```shell
sudo systemctl start character-creation-certbot-renew.service
sudo journalctl -u character-creation-certbot-renew.service --since today --no-pager
```

After initial setup, test the production renewal configuration through the
ACME staging service and exercise the same deploy-hook, Nginx config test, and
graceful-reload path without changing production certificate files:

```shell
cd /opt/apps/character-creation
./renew-certificates.sh --test-renewal
curl --fail --show-error https://13.140.206.57/healthz
```

The test uses `--dry-run --force-renewal --run-deploy-hooks`; it does not
replace the production certificate. The final external HTTPS request checks
the certificate currently served by Nginx, not only the certificate file on
disk.

Certbot writes production and staging logs under their respective persistent
`*-log/` paths. The systemd journal records the renewal decision, Nginx
configuration test, and reload. Check certificate dates and SAN:

```shell
openssl x509 -in /opt/apps/character-creation/letsencrypt/live/13.140.206.57/fullchain.pem \
  -noout -subject -ext subjectAltName -dates
```

When a production certificate is renewed, Certbot creates
`letsencrypt-work/reload-required`. The host renewal script then runs
`nginx -t` inside the web container and gracefully signals that Nginx process
with `nginx -s reload`; the marker is removed only after both operations
succeed. This avoids Docker-socket access from Certbot. If validation or
reload fails, the already-running Nginx keeps its loaded certificate, the
marker is retained for retry, and the systemd service exits unsuccessfully.
Diagnose with:

```shell
sudo journalctl -u character-creation-certbot-renew.service -n 200 --no-pager
cd /opt/apps/character-creation
docker compose --project-name character-creation logs --tail=200 web
docker compose --project-name character-creation exec -T web nginx -t
```

After correcting the cause, rerun the systemd service. Do not copy a staging
certificate into the production tree.

If the HTTPS-only Nginx config prevents the web container from starting,
temporarily return to the HTTP-only config without touching either
certificate tree:

```shell
cd /opt/apps/character-creation
mv nginx-https/https.conf nginx-https/https.conf.disabled
docker compose --project-name character-creation up -d web
docker compose --project-name character-creation exec -T web nginx -t
docker compose --project-name character-creation exec -T web nginx -s reload
```

Keep the `.disabled` file until the TLS config problem is corrected. Restore
it to `nginx-https/https.conf` and run the same config-test/reload commands to
re-enable HTTPS.

### Inspect status and deployed version

Run on the **VPS**:

```shell
cd /opt/apps/character-creation
docker compose --project-name character-creation ps
sed -n 's/^IMAGE=//p' .env
docker inspect --format '{{.Config.Image}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' \
  "$(docker compose --project-name character-creation ps -q web)"
```

Run on a **local workstation**:

```shell
curl --fail --show-error https://13.140.206.57/healthz
curl --fail --show-error https://13.140.206.57/
curl --fail --show-error https://13.140.206.57/creator/example
curl --fail --show-error http://13.140.206.57/healthz
```

### View logs

Run on the **VPS**:

```shell
cd /opt/apps/character-creation
docker compose --project-name character-creation logs --tail=200 web
docker compose --project-name character-creation logs --follow web
```

### Normal or manual deployment

Normal updates are deployed by merging or pushing an approved commit to
`main`. To manually start the same workflow, use **GitHub → Actions →
Production → Run workflow**, select the intended branch or commit, and run it.
Monitor the `checks`, `publish`, and `deploy` jobs. Do not build an image on
the VPS.

To re-run the currently deployed image only, use **GitHub → Actions** to
re-run the successful Production workflow, or use the manual rollback command
below with the current SHA. Do not hand-edit `compose.yaml` or `.env` during
a normal workflow deployment.

### Restart

Run on the **VPS**:

```shell
cd /opt/apps/character-creation
docker compose --project-name character-creation restart web
docker compose --project-name character-creation ps
```

Then run the three local `curl` commands from **Inspect status and deployed
version**.

### Manual PostgreSQL backup and restore

Automatic offsite backup is not configured. After the backend rollout is
verified, take a manual backup before every schema-affecting release and at a
regular operator-chosen interval. Run on the **VPS**:

```shell
cd /opt/apps/character-creation
mkdir -p backups
docker compose --project-name character-creation exec -T postgres \
  pg_dump -U character_creation -d character_creation --format=custom \
  > "backups/character-creation-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Verify a new dump before relying on it:

```shell
docker run --rm -i postgres:17-alpine pg_restore --list \
  < backups/character-creation-<timestamp>.dump >/dev/null
```

To restore a chosen dump, first stop writes by stopping `web` and `backend`.
This overwrites database contents; retain the current dump until the restored
application has been verified.

```shell
cd /opt/apps/character-creation
docker compose --project-name character-creation stop web backend
docker compose --project-name character-creation exec -T postgres \
  pg_restore -U character_creation -d character_creation \
  --clean --if-exists --no-owner < backups/character-creation-<timestamp>.dump
docker compose --project-name character-creation up -d backend web
docker compose --project-name character-creation ps
```

The named PostgreSQL volume is not a backup. Test restore periodically on an
isolated PostgreSQL instance; do not restore into production merely to test a
dump.

### Roll back to a known SHA

Use the SHA from a previously successful Production run. Run on the **VPS**:

```shell
cd /opt/apps/character-creation
APP_DIR=/opt/apps/character-creation \
IMAGE=ghcr.io/hbah8/character-creation:<previous-full-git-sha> \
BACKEND_IMAGE=ghcr.io/hbah8/character-creation-backend:<previous-full-git-sha> \
./deploy.sh
```

The script pulls that exact image and uses the same healthcheck. Afterwards,
check `.env`, `docker compose ps`, container logs, and the three public URLs.
This command does not remove volumes. It does not roll back Flyway migrations;
use a forward migration or the backup/restore procedure when schema recovery
is required.

### Diagnose common failures

| Symptom | Where | Checks |
|---|---|---|
| SSH authentication or host-key failure | GitHub Actions deploy log; local workstation | Confirm `VPS_USER`, `VPS_DEPLOY_SSH_KEY`, and `VPS_SSH_KNOWN_HOSTS`; locally run `ssh -o BatchMode=yes contabo-apps "whoami"`. Do not bypass host-key checking. |
| GHCR pull failure | GitHub Actions deploy log; VPS | Confirm `GHCR_PULL_TOKEN` has package-read access and has not expired; confirm `.env` contains the intended image reference and `docker compose config` resolves it. The failure occurs before `web` starts, so container logs may not exist. Do not print or paste the token. |
| Backend or web never reaches `healthy` | VPS | Run `docker compose --project-name character-creation ps` and logs for `postgres`, `backend`, and `web`; check backend Flyway output before retrying. |
| Port 80 already in use | VPS | Run `ss -ltnp 'sport = :80'` before a manual start. Do not stop or reconfigure another application without explicit authorization. |
| Public route fails after refresh | Local workstation | Test `/creator/example`; inspect the active Nginx image and its logs. The configured fallback is `try_files $uri $uri/ /index.html`. |
| `npm ci` fails on a runner | Local workstation / GitHub | Regenerate `character-app/package-lock.json` with the npm version used by CI. The current lockfile was verified with npm 10.9.9 because the runner uses npm 10.x. |

## Security and operational limitations

- HTTP remains public and continues to serve the app until the owner confirms
  the browser-data migration gate. Redirect behavior is therefore not yet
  verified or enabled.
- Timer installation and successful staging/production certificate issuance
  must be recorded here after they are actually performed. A committed timer
  file alone does not mean systemd is active.
- The firewall's historical configuration lists inbound 22, 80, and 443, but
  its current rules were not rechecked during the 2026-11-04 verification.
- The backend/PostgreSQL Compose configuration, runtime secret transfer,
  backup procedure, and restore procedure are prepared but unverified on the
  VPS until the first successful backend deployment and restore rehearsal.
- `deploy` can use Docker without `sudo`. Docker group membership effectively
  grants administrative control of the VPS; keep the account and CI deploy key
  tightly restricted.
- Docker's stored GHCR credential resides outside this repository in the
  deploy user's Docker configuration. Docker config storage is not guaranteed
  to be encrypted without a credential helper; no credential helper or its
  filesystem permissions were verified.
- The existing GitHub Pages workflow
  ([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)) remains
  enabled and builds under `/character-creation/`. Its public availability was
  not rechecked on 2026-11-04.

## HTTPS rollout verification status

The live VPS was inspected over SSH on 2026-11-04 before these changes:
`deploy` access succeeded, the running `web` container was healthy, Nginx
loaded the expected HTTP-only config, and only this app was listening on
host port 80 (nothing was listening on 443). No VPS files, certificates,
systemd units, or firewall settings have yet been changed by this patch.
From this workstation, HTTP `/healthz` and `/creator/example` both returned
200 on 2026-11-04; HTTP remains available for exporting browser data.

Locally verified: application `npm run check` (lint, 77 test files / 442
tests, TypeScript, and production build), shell syntax for all four deploy
scripts, YAML syntax for Compose and the Production workflow, and
`git diff --check`. This workstation has no Docker CLI, so Compose
interpolation and Nginx config were not tested locally.

Still requires deployment through the Production GitHub Actions workflow:
public HTTP challenge retrieval, staging issuance and dry-run renewal,
production issuance, Nginx config test/reload, browser-trusted HTTPS for the
IP SAN, health and nested SPA routes over HTTPS, and external confirmation
that Nginx serves the issued certificate. The systemd timer also remains
inactive until its documented `sudo` installation commands are run. HTTP
redirect is intentionally pending browser-data migration confirmation.

On 2026-11-04 at approximately 21:05 UTC, the staging issuance was attempted
from the VPS and stopped before production issuance because the TLS handshake
to `acme-staging-v02.api.letsencrypt.org` reset/timed out. The same staging
endpoint was unavailable from the workstation and the external fetcher, while
production ACME was reachable from the VPS. The [Let's Encrypt status
page](https://letsencrypt.status.io/) reported scheduled maintenance with
staging ACME offline through 2026-11-04 21:00 UTC. No production certificate,
HTTPS Nginx config, or redirect was installed. Retry
`./issue-certificates.sh` after the maintenance window and retain the required
staging-first sequence.

## Instructions for future agents

1. Read this document before any infrastructure work.
2. Use `ssh -o BatchMode=yes contabo-apps`; report authentication failures
   instead of changing SSH configuration.
3. Treat the VPS as multi-tenant: inspect before changing anything and do not
   affect other applications.
4. Do not build images, run development servers, install a GitHub runner, or
   make firewall/SSH changes on the VPS without explicit authorization.
5. Use the existing Production workflow for releases. Do not place secrets in
   the repository or container image.
6. Update this document after a verified infrastructure change. State whether
   operational claims are verified or unverified.
