#!/usr/bin/env sh
set -eu

app_dir=${APP_DIR:-/opt/apps/character-creation}
compose_project=character-creation
marker="$app_dir/letsencrypt-work/reload-required"
test_mode=0

if [ "${1:-}" = "--test-renewal" ]; then
  test_mode=1
  shift
fi

if [ "$#" -ne 0 ]; then
  printf 'Usage: %s [--test-renewal]\n' "$0" >&2
  exit 2
fi

exec 9>"$app_dir/.operation.lock"
if ! flock -n 9; then
  printf '%s certificate renewal skipped: deployment or another renewal holds the lock\n' \
    "$(date --iso-8601=seconds)"
  exit 0
fi

cd "$app_dir"
printf '%s checking whether the production certificate needs renewal\n' \
  "$(date --iso-8601=seconds)"

set -- renew \
  --config-dir /etc/letsencrypt \
  --work-dir /var/lib/letsencrypt \
  --logs-dir /var/log/letsencrypt \
  --no-random-sleep-on-renew \
  --deploy-hook 'touch /var/lib/letsencrypt/reload-required'
if [ "$test_mode" -eq 1 ]; then
  set -- "$@" --force-renewal --dry-run --run-deploy-hooks
  printf '%s running forced dry-run against the ACME staging service; production files are not changed\n' \
    "$(date --iso-8601=seconds)"
fi

renewal_status=0
if docker compose --project-name "$compose_project" run --rm certbot "$@"; then
  printf '%s Certbot renewal check completed\n' "$(date --iso-8601=seconds)"
else
  renewal_status=$?
  printf '%s Certbot renewal check failed with exit code %s\n' \
    "$(date --iso-8601=seconds)" "$renewal_status" >&2
fi

if [ -f "$marker" ]; then
  printf '%s checking Nginx configuration before applying the certificate\n' \
    "$(date --iso-8601=seconds)"
  if ! docker compose --project-name "$compose_project" exec -T web nginx -t; then
    printf '%s Nginx config test failed; the running Nginx was not reloaded\n' \
      "$(date --iso-8601=seconds)" >&2
    exit 1
  fi

  printf '%s gracefully reloading Nginx\n' "$(date --iso-8601=seconds)"
  if ! docker compose --project-name "$compose_project" exec -T web nginx -s reload; then
    printf '%s Nginx reload failed; pending reload marker was retained\n' \
      "$(date --iso-8601=seconds)" >&2
    exit 1
  fi

  rm "$marker"
  printf '%s Nginx reload completed and pending marker was cleared\n' \
    "$(date --iso-8601=seconds)"
fi

exit "$renewal_status"
