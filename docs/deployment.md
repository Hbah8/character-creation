# Production deployment

Last verified: 2026-11-04.

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

The VPS runs one application container:

| Compose service | Purpose |
|---|---|
| `web` | Nginx serves the static Vite SPA, `/healthz`, immutable assets, and the SPA fallback for client routes. |

The container listens internally on port 8080. Docker publishes it directly
on host port 80. There is no separate reverse proxy, backend, database,
object storage, or GitHub Actions runner on the VPS.

The Compose project creates the local bridge network
`character-creation_default`. It currently contains only `web`. There are no
named volumes or bind mounts. Browser data is not mounted into the container.

The service uses `restart: unless-stopped`, a Docker healthcheck, a read-only
container filesystem with temporary Nginx paths, `no-new-privileges`, and the
Docker `local` logging driver with three 10 MB log files.

### Data and updates

The application is a static client-side SPA:

- Characters, worlds, preferences, and similar records use browser
  `localStorage`.
- Maps and local audio bindings use browser IndexedDB.
- The VPS has no application data volume, database, or bind mount.

Consequently, a container recreation or image update preserves no
server-side user data because none exists. Browser data remains on the
specific browser and origin. It is not shared between GitHub Pages and
`http://13.140.206.57`.

Before moving users from GitHub Pages, export characters and worlds in the UI
and import them at the VPS URL. Maps require re-import, and local audio file
bindings require re-selection. This limitation remains until a backend and
server-side storage are explicitly introduced.

## CI/CD

The authoritative pipeline is
[`.github/workflows/production.yml`](../.github/workflows/production.yml).
It runs only on GitHub-hosted runners.

### Triggers and sequence

| Trigger | Result |
|---|---|
| Pull request targeting `main` | `npm ci`, then `npm run check`; no image publication or VPS access |
| Push to `main` | Checks, image build, GHCR publication, VPS deployment, healthcheck |
| Manual `workflow_dispatch` | Same as push for the selected revision |

For push and manual runs the sequence is:

1. `checks`: `actions/setup-node` installs Node 22; `npm ci` and
   `npm run check` run in `character-app`.
2. `publish`: the GitHub-hosted runner builds the root
   [Dockerfile](../Dockerfile) and pushes
   `ghcr.io/hbah8/character-creation:<full-git-sha>`.
3. `deploy`: the runner verifies the VPS host key, uploads
   [compose.yaml](../compose.yaml) and [deploy.sh](../deploy/deploy.sh),
   authenticates the VPS Docker client to GHCR, pulls the immutable image,
   starts Compose, and waits for the `web` healthcheck.

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

The publish job uses the GitHub Actions `GITHUB_TOKEN` as
`${{ github.actor }}` with `packages: write` permission. The VPS pulls using
the GitHub repository owner as its GHCR username and `GHCR_PULL_TOKEN`; that
token requires read access to the package. Secret values, SSH key contents,
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
curl --fail --show-error --location http://13.140.206.57/healthz
curl --fail --show-error --location http://13.140.206.57/
curl --fail --show-error --location http://13.140.206.57/creator/example
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

### Roll back to a known SHA

Use the SHA from a previously successful Production run. Run on the **VPS**:

```shell
cd /opt/apps/character-creation
APP_DIR=/opt/apps/character-creation \
IMAGE=ghcr.io/hbah8/character-creation:<previous-full-git-sha> \
./deploy.sh
```

The script pulls that exact image and uses the same healthcheck. Afterwards,
check `.env`, `docker compose ps`, container logs, and the three public URLs.
This command does not remove volumes; none exist today.

### Diagnose common failures

| Symptom | Where | Checks |
|---|---|---|
| SSH authentication or host-key failure | GitHub Actions deploy log; local workstation | Confirm `VPS_USER`, `VPS_DEPLOY_SSH_KEY`, and `VPS_SSH_KNOWN_HOSTS`; locally run `ssh -o BatchMode=yes contabo-apps "whoami"`. Do not bypass host-key checking. |
| GHCR pull failure | GitHub Actions deploy log; VPS | Confirm `GHCR_PULL_TOKEN` has package-read access and has not expired; confirm `.env` contains the intended image reference and `docker compose config` resolves it. The failure occurs before `web` starts, so container logs may not exist. Do not print or paste the token. |
| Container never reaches `healthy` | VPS | Run `docker compose --project-name character-creation ps` and logs; check `http://127.0.0.1:8080/healthz` from inside the container only if needed. |
| Port 80 already in use | VPS | Run `ss -ltnp 'sport = :80'` before a manual start. Do not stop or reconfigure another application without explicit authorization. |
| Public route fails after refresh | Local workstation | Test `/creator/example`; inspect the active Nginx image and its logs. The configured fallback is `try_files $uri $uri/ /index.html`. |
| `npm ci` fails on a runner | Local workstation / GitHub | Regenerate `character-app/package-lock.json` with the npm version used by CI. The current lockfile was verified with npm 10.9.9 because the runner uses npm 10.x. |

## Security and operational limitations

- HTTP is public on port 80. HTTPS, a domain name, TLS certificates, and
  redirects to HTTPS are not configured.
- The firewall's historical configuration lists inbound 22, 80, and 443, but
  its current rules were not rechecked during the 2026-11-04 verification.
- No backup configuration has been verified. There is no server-side
  application data to back up today; future volumes or databases require a
  backup and restore plan before use.
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
