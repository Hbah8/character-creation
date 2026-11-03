# Production deployment

Last verified: 2026-11-03.

Deployment status: the VPS directory, Docker access, Compose configuration, and
deployment script are prepared. The first container is pending GitHub Actions
secret/variable configuration and a push to `main`, which publishes the first
immutable image.

## Server

| Parameter | Value |
|---|---|
| Provider | Contabo |
| OS | Ubuntu 24.04 LTS |
| Public URL | `http://13.140.206.57` |
| CPU / RAM / storage | 4 vCPU / 8 GB / 100 GB SSD |
| SSH user | `deploy` through `contabo-apps` |
| Application directory | `/opt/apps/character-creation` |
| Compose project | `character-creation` |

`deploy` belongs to the `docker` group. Docker Engine 29.9.2 and Docker
Compose plugin v5.7.0 are available without `sudo`. The application uses
Docker Compose only; no development server, hot reload, source tree, or
GitHub Actions runner is installed on the VPS.

Inbound firewall rules allow only SSH (22), HTTP (80), and HTTPS (443).
The application publishes HTTP on port 80. Port 443 is not configured.
Do not modify SSH or firewall settings as part of normal deployments.

## Runtime

- Image: `ghcr.io/hbah8/character-creation:<commit-sha>`.
- The VPS pulls immutable images from GHCR; it never builds an image.
- `compose.yaml` publishes host port `80` to the container's port `8080`.
- Nginx serves the static Vite build, `/healthz`, immutable asset caching,
  and SPA fallback for direct navigations such as `/creator/<id>`.
- The `web` service uses `restart: unless-stopped`, a Docker healthcheck,
  read-only filesystem, `no-new-privileges`, and local log rotation
  (`10m`, three files).
- No named volumes are currently used. Future persistent services must define
  explicit volumes and must not be removed during application deployments.

## GitHub Actions

[`.github/workflows/production.yml`](../.github/workflows/production.yml)
uses GitHub-hosted runners:

- Pull requests to `main` run `npm ci` and `npm run check`; they cannot
  publish or deploy.
- A push to `main`, or a manual `workflow_dispatch`, runs the checks, builds
  the image, pushes `ghcr.io/hbah8/character-creation:<commit-sha>`, then
  deploys it to the VPS.
- Production runs are serialized by the `production-deploy` concurrency group.
- The deploy script waits for the Compose healthcheck. On failure it restores
  the prior `IMAGE` from `/opt/apps/character-creation/.env`; on the first
  deployment it stops the failed container instead.

The existing GitHub Pages workflow remains enabled. It builds with
`VITE_BASE_PATH=/character-creation/`; the VPS image builds with the default
root base path. This preserves both hosting targets.

### Required GitHub Actions configuration

Create these repository **Variables**:

| Name | Value |
|---|---|
| `GHCR_IMAGE` | `ghcr.io/hbah8/character-creation` |
| `VPS_HOST` | `13.140.206.57` |
| `VPS_USER` | `deploy` |

Create these repository **Secrets**:

| Name | Value |
|---|---|
| `VPS_DEPLOY_SSH_KEY` | Private half of the dedicated deploy key described below |
| `VPS_SSH_KNOWN_HOSTS` | Verified `known_hosts` entry for `13.140.206.57` |
| `GHCR_PULL_TOKEN` | Fine-grained GitHub PAT for the package owner with read-only `Packages` permission |

`GHCR_PULL_TOKEN` is supplied only to `docker login --password-stdin` during
deployment. Docker stores the resulting registry credential in the deploy
user's protected Docker configuration; neither the token nor application
secrets belong in this repository, an image, frontend bundle, or logs.

### One-time VPS and GitHub setup

On a trusted administrator workstation, create a dedicated key that is used
only by GitHub Actions:

```shell
ssh-keygen -t ed25519 -f ~/.ssh/character-creation-github-actions -C "character-creation GitHub Actions deploy"
```

Add the **public** key to the VPS. Run this command as `deploy` (or have the
owner run it with the public key substituted):

```shell
install -d -m 700 ~/.ssh
printf '%s\n' 'ssh-ed25519 AAAA... character-creation GitHub Actions deploy' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Copy the contents of `~/.ssh/character-creation-github-actions` into
`VPS_DEPLOY_SSH_KEY`. Do not add that private key to the repository.

Obtain and independently verify the host fingerprint, then save the complete
output as `VPS_SSH_KNOWN_HOSTS`:

```shell
ssh-keyscan -H 13.140.206.57
```

Create `GHCR_PULL_TOKEN` as a fine-grained personal access token limited to
the package owner and `Packages: Read`. If the package is made public after
the first publication, the token can be removed only after removing its use
from the workflow.

Before the first workflow deployment, initialize the VPS directory:

```shell
ssh -o BatchMode=yes contabo-apps "touch /opt/apps/character-creation/.env && chmod 600 /opt/apps/character-creation/.env"
```

## Operations

GitHub Actions is the normal update procedure:

1. Merge an approved pull request to `main`, or manually dispatch
   **Production** from the Actions tab.
2. The workflow validates, builds, publishes the SHA-tagged image, uploads
   `compose.yaml` and `deploy.sh`, pulls the image, starts Compose, and waits
   for health.
3. Verify `http://13.140.206.57/` and refresh
   `http://13.140.206.57/creator/example` to confirm SPA fallback.

Inspect the running deployment:

```shell
ssh -o BatchMode=yes contabo-apps "cd /opt/apps/character-creation && docker compose --project-name character-creation ps"
ssh -o BatchMode=yes contabo-apps "cd /opt/apps/character-creation && docker compose --project-name character-creation logs --tail=200 web"
```

To roll back manually, substitute a previously published commit SHA:

```shell
ssh -o BatchMode=yes contabo-apps "cd /opt/apps/character-creation && APP_DIR=/opt/apps/character-creation IMAGE=ghcr.io/hbah8/character-creation:<previous-commit-sha> ./deploy.sh"
```

The rollback reuses the same healthcheck and does not remove volumes or
persistent data.

## Data and current limitations

This is a static client-side SPA. It has no backend, authentication, server
database, object storage, embedding model, HTTPS, or domain name. A future
reverse proxy and TLS configuration should be introduced before using
credentials or exposing authenticated functionality.

User data is bound to the browser origin: characters and worlds use
`localStorage`; maps and local audio bindings use IndexedDB. Data at GitHub
Pages does not appear automatically at `http://13.140.206.57`. Before moving,
export characters and worlds using the application UI and import them at the
new URL. Maps and local file bindings require manual re-import/rebinding.
