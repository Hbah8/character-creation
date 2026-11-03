#!/usr/bin/env sh
set -eu

app_dir=${APP_DIR:?APP_DIR is required}
image=${IMAGE:?IMAGE is required}
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
if [ -f "$environment_file" ]; then
  previous_image=$(sed -n 's/^IMAGE=//p' "$environment_file" | head -n 1)
fi

printf 'IMAGE=%s\n' "$image" > "$next_environment_file"
mv "$next_environment_file" "$environment_file"

rollback() {
  if [ -n "$previous_image" ]; then
    printf 'Deployment failed; restoring previous image %s\n' "$previous_image" >&2
    printf 'IMAGE=%s\n' "$previous_image" > "$next_environment_file"
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

container_id=$(docker compose --project-name "$compose_project" ps -q web)
attempt=0
while [ "$attempt" -lt 12 ]; do
  status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id")
  if [ "$status" = healthy ]; then
    printf 'Deployment completed with image %s\n' "$image"
    exit 0
  fi
  if [ "$status" = unhealthy ]; then
    break
  fi
  attempt=$((attempt + 1))
  sleep 5
done

rollback
exit 1
