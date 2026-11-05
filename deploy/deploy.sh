#!/usr/bin/env sh
set -eu

app_dir=${APP_DIR:?APP_DIR is required}
image=${IMAGE:?IMAGE is required}
backend_image=${BACKEND_IMAGE:?BACKEND_IMAGE is required}
compose_project=character-creation
environment_file="$app_dir/.env"
next_environment_file="$app_dir/.env.next"

if [ "${LOCK_HELD:-0}" != 1 ]; then
  exec 9>"$app_dir/.operation.lock"
  flock -x 9
fi

mkdir -p \
  "$app_dir/acme-webroot/.well-known/acme-challenge" \
  "$app_dir/letsencrypt" \
  "$app_dir/letsencrypt-staging" \
  "$app_dir/letsencrypt-work" \
  "$app_dir/letsencrypt-staging-work" \
  "$app_dir/letsencrypt-log" \
  "$app_dir/letsencrypt-staging-log" \
  "$app_dir/nginx-https"

cd "$app_dir"

previous_image=''
previous_backend_image=''
if [ -f "$environment_file" ]; then
  previous_image=$(sed -n 's/^IMAGE=//p' "$environment_file" | head -n 1)
  previous_backend_image=$(sed -n 's/^BACKEND_IMAGE=//p' "$environment_file" | head -n 1)
fi

printf 'IMAGE=%s\nBACKEND_IMAGE=%s\n' "$image" "$backend_image" > "$next_environment_file"
mv "$next_environment_file" "$environment_file"

rollback() {
  if [ -n "$previous_image" ] && [ -n "$previous_backend_image" ]; then
    printf 'Deployment failed; restoring previous application images.\n' >&2
    printf 'IMAGE=%s\nBACKEND_IMAGE=%s\n' \
      "$previous_image" "$previous_backend_image" > "$next_environment_file"
    mv "$next_environment_file" "$environment_file"
    docker compose --project-name "$compose_project" pull
    docker compose --project-name "$compose_project" up -d --remove-orphans
  else
    printf 'Deployment failed and no previous image is available for rollback.\n' >&2
    docker compose --project-name "$compose_project" down
  fi
}

if ! docker compose --project-name "$compose_project" pull; then
  rollback
  exit 1
fi

if ! docker compose --project-name "$compose_project" up -d --remove-orphans; then
  rollback
  exit 1
fi

wait_for_healthy_service() {
  service=$1
  container_id=$(docker compose --project-name "$compose_project" ps -q "$service")
  attempt=0

  while [ "$attempt" -lt 12 ]; do
    status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id")
    if [ "$status" = healthy ]; then
      return 0
    fi
    if [ "$status" = unhealthy ]; then
      return 1
    fi
    attempt=$((attempt + 1))
    sleep 5
  done

  return 1
}

if ! wait_for_healthy_service backend; then
  rollback
  exit 1
fi

if ! wait_for_healthy_service web; then
  rollback
  exit 1
fi

printf 'Deployment completed with application images %s and %s\n' "$image" "$backend_image"
