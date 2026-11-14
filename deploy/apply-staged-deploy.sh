#!/usr/bin/env sh
set -eu

app_dir=${APP_DIR:-/opt/apps/character-creation}
staging_dir="$app_dir/.deploy-staging"
database_password_file="$staging_dir/database-password"
admin_ids_file="$staging_dir/admin-account-ids"
previous_compose_file="$app_dir/.compose.yaml.previous"

exec 9>"$app_dir/.operation.lock"
flock -x 9

cleanup_staged_secrets() {
  rm -f "$database_password_file" "$admin_ids_file"
}
trap cleanup_staged_secrets EXIT

sh "$staging_dir/validate-admin-account-ids.sh" "$admin_ids_file"

if [ ! -s "$database_password_file" ] || [ "$(wc -l < "$database_password_file")" -ne 0 ]; then
  printf 'A non-empty, single-line database password is required.\n' >&2
  exit 1
fi

test -n "${IMAGE:?IMAGE is required}"
test -n "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"
for file in compose.yaml nginx.conf nginx-https.conf deploy.sh apply-staged-deploy.sh \
  issue-certificates.sh renew-certificates.sh \
  character-creation-certbot-renew.service character-creation-certbot-renew.timer; do
  if [ ! -s "$staging_dir/$file" ] || [ ! -r "$staging_dir/$file" ]; then
    printf 'Missing or unreadable staged deployment file: %s\n' "$file" >&2
    exit 1
  fi
done
for script in deploy.sh apply-staged-deploy.sh issue-certificates.sh renew-certificates.sh; do
  sh -n "$staging_dir/$script"
done

if [ -f "$app_dir/compose.yaml" ]; then
  install -m 0644 "$app_dir/compose.yaml" "$previous_compose_file"
else
  rm -f "$previous_compose_file"
fi

for file in .admin.runtime.env .runtime.env; do
  if [ -f "$app_dir/$file" ]; then
    install -m 0600 "$app_dir/$file" "$app_dir/$file.previous"
    rm -f "$app_dir/$file.previous.absent"
  else
    rm -f "$app_dir/$file.previous"
    (umask 077; : > "$app_dir/$file.previous.absent")
  fi
done

database_password=$(cat "$database_password_file")
umask 077
{
  printf 'POSTGRES_PASSWORD=%s\n' "$database_password"
  printf 'DATABASE_PASSWORD=%s\n' "$database_password"
} > "$app_dir/.runtime.env.next"
mv "$app_dir/.runtime.env.next" "$app_dir/.runtime.env"

{
  printf 'ADMIN_ACCOUNT_IDS='
  cat "$admin_ids_file"
  printf '\n'
} > "$app_dir/.admin.runtime.env.next"
chmod 600 "$app_dir/.admin.runtime.env.next"
mv "$app_dir/.admin.runtime.env.next" "$app_dir/.admin.runtime.env"

install -m 0644 "$staging_dir/compose.yaml" "$app_dir/.compose.yaml.next"
mv "$app_dir/.compose.yaml.next" "$app_dir/compose.yaml"
install -m 0644 "$staging_dir/nginx.conf" "$app_dir/.nginx.conf.next"
mv "$app_dir/.nginx.conf.next" "$app_dir/nginx.conf"
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

APP_DIR="$app_dir" IMAGE="$IMAGE" BACKEND_IMAGE="$BACKEND_IMAGE" LOCK_HELD=1 "$app_dir/deploy.sh"
