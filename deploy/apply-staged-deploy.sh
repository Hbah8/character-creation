#!/usr/bin/env sh
set -eu

app_dir=${APP_DIR:-/opt/apps/character-creation}
staging_dir="$app_dir/.deploy-staging"
database_password_file="$staging_dir/database-password"

exec 9>"$app_dir/.operation.lock"
flock -x 9

cleanup_database_password() {
  rm -f "$database_password_file"
}
trap cleanup_database_password EXIT

if [ ! -s "$database_password_file" ] || [ "$(wc -l < "$database_password_file")" -ne 0 ]; then
  printf 'A non-empty, single-line database password is required.\n' >&2
  exit 1
fi

database_password=$(cat "$database_password_file")
umask 077
{
  printf 'POSTGRES_PASSWORD=%s\n' "$database_password"
  printf 'DATABASE_PASSWORD=%s\n' "$database_password"
} > "$app_dir/.runtime.env.next"
mv "$app_dir/.runtime.env.next" "$app_dir/.runtime.env"

install -m 0644 "$staging_dir/compose.yaml" "$app_dir/.compose.yaml.next"
mv "$app_dir/.compose.yaml.next" "$app_dir/compose.yaml"
install -m 0750 "$staging_dir/deploy.sh" "$app_dir/.deploy.sh.next"
mv "$app_dir/.deploy.sh.next" "$app_dir/deploy.sh"
install -m 0644 "$staging_dir/nginx-https.conf" "$app_dir/.nginx-https.conf.next"
mv "$app_dir/.nginx-https.conf.next" "$app_dir/nginx-https.conf"
install -m 0750 "$staging_dir/issue-certificates.sh" "$app_dir/.issue-certificates.sh.next"
mv "$app_dir/.issue-certificates.sh.next" "$app_dir/issue-certificates.sh"
install -m 0750 "$staging_dir/renew-certificates.sh" "$app_dir/.renew-certificates.sh.next"
mv "$app_dir/.renew-certificates.sh.next" "$app_dir/renew-certificates.sh"
install -m 0644 "$staging_dir/character-creation-certbot-renew.service" \
  "$app_dir/.character-creation-certbot-renew.service.next"
mv "$app_dir/.character-creation-certbot-renew.service.next" \
  "$app_dir/character-creation-certbot-renew.service"
install -m 0644 "$staging_dir/character-creation-certbot-renew.timer" \
  "$app_dir/.character-creation-certbot-renew.timer.next"
mv "$app_dir/.character-creation-certbot-renew.timer.next" \
  "$app_dir/character-creation-certbot-renew.timer"

APP_DIR="$app_dir" IMAGE=${IMAGE:?IMAGE is required} BACKEND_IMAGE=${BACKEND_IMAGE:?BACKEND_IMAGE is required} LOCK_HELD=1 \
  "$app_dir/deploy.sh"
