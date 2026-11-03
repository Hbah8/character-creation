#!/usr/bin/env sh
set -eu

app_dir=${APP_DIR:-/opt/apps/character-creation}
compose_project=character-creation
ip_address=13.140.206.57

exec 9>"$app_dir/.operation.lock"
flock -x 9
cd "$app_dir"

docker compose --project-name "$compose_project" run --rm certbot certonly \
  --staging \
  --config-dir /etc/letsencrypt-staging \
  --work-dir /var/lib/letsencrypt-staging \
  --logs-dir /var/log/letsencrypt-staging \
  --preferred-profile shortlived \
  --webroot \
  --webroot-path /var/www/certbot \
  --ip-address "$ip_address" \
  --cert-name "$ip_address" \
  --agree-tos \
  --register-unsafely-without-email \
  --non-interactive

docker compose --project-name "$compose_project" run --rm certbot renew \
  --config-dir /etc/letsencrypt-staging \
  --work-dir /var/lib/letsencrypt-staging \
  --logs-dir /var/log/letsencrypt-staging \
  --no-random-sleep-on-renew \
  --force-renewal \
  --dry-run

docker compose --project-name "$compose_project" run --rm certbot certonly \
  --config-dir /etc/letsencrypt \
  --work-dir /var/lib/letsencrypt \
  --logs-dir /var/log/letsencrypt \
  --preferred-profile shortlived \
  --webroot \
  --webroot-path /var/www/certbot \
  --ip-address "$ip_address" \
  --cert-name "$ip_address" \
  --agree-tos \
  --register-unsafely-without-email \
  --non-interactive

test -s "$app_dir/letsencrypt/live/$ip_address/fullchain.pem"
test -s "$app_dir/letsencrypt/live/$ip_address/privkey.pem"

install -m 0644 "$app_dir/nginx-https.conf" "$app_dir/nginx-https/https.conf.new"
mv "$app_dir/nginx-https/https.conf.new" "$app_dir/nginx-https/https.conf"

docker compose --project-name "$compose_project" exec -T web nginx -t
docker compose --project-name "$compose_project" exec -T web nginx -s reload
