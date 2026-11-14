#!/usr/bin/env sh
set -eu

app_dir=${APP_DIR:?APP_DIR is required}
image=${IMAGE:?IMAGE is required}
backend_image=${BACKEND_IMAGE:?BACKEND_IMAGE is required}
compose_project=character-creation
environment_file="$app_dir/.env"
next_environment_file="$app_dir/.env.next"
previous_compose_file="$app_dir/.compose.yaml.previous"
previous_environment_file="$app_dir/.env.previous"
action=${1:-deploy}

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

unset IMAGE BACKEND_IMAGE

pull_images() {
  pull_attempt=1
  until docker compose --project-name "$compose_project" pull; do
    if [ "$pull_attempt" -ge 3 ]; then return 1; fi
    pull_attempt=$((pull_attempt + 1))
    sleep 5
  done
}

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

rollback() {
  printf 'Deployment failed; restoring previous configuration and application images.\n' >&2
  for file in .admin.runtime.env .runtime.env; do
    if [ -f "$app_dir/$file.previous" ]; then
      install -m 0600 "$app_dir/$file.previous" "$app_dir/$file.rollback"
      mv "$app_dir/$file.rollback" "$app_dir/$file"
    elif [ -f "$app_dir/$file.previous.absent" ]; then
      rm -f "$app_dir/$file"
    fi
  done
  if [ -f "$previous_compose_file" ]; then
    install -m 0644 "$previous_compose_file" "$app_dir/.compose.yaml.rollback"
    mv "$app_dir/.compose.yaml.rollback" "$app_dir/compose.yaml"
  fi
  if [ ! -f "$previous_environment_file" ]; then
    printf 'No previous image manifest is available; services and volumes were not removed.\n' >&2
    return 1
  fi
  install -m 0600 "$previous_environment_file" "$next_environment_file"
  mv "$next_environment_file" "$environment_file"
  docker compose --project-name "$compose_project" config --quiet
  pull_images
  docker compose --project-name "$compose_project" up -d --remove-orphans
  if grep -q '^BACKEND_IMAGE=.' "$environment_file"; then
    wait_for_healthy_service backend
  fi
  wait_for_healthy_service web
}

case "$action" in
  rollback|finalize)
    if [ "$(sed -n 's/^IMAGE=//p' "$environment_file")" != "$image" ] ||
       [ "$(sed -n 's/^BACKEND_IMAGE=//p' "$environment_file")" != "$backend_image" ]; then
      printf 'Refusing to change a different release.\n' >&2
      exit 1
    fi
    if [ "$action" = rollback ]; then
      rollback
    else
      rm -f "$previous_environment_file" "$previous_compose_file" \
        "$app_dir/.admin.runtime.env.previous" "$app_dir/.admin.runtime.env.previous.absent" \
        "$app_dir/.runtime.env.previous" "$app_dir/.runtime.env.previous.absent"
      printf 'External verification completed; release finalized.\n'
    fi
    exit 0
    ;;
  deploy) ;;
  *) printf 'Unknown deployment action.\n' >&2; exit 1 ;;
esac

if [ -f "$environment_file" ]; then
  install -m 0600 "$environment_file" "$previous_environment_file"
else
  rm -f "$previous_environment_file"
fi
printf 'IMAGE=%s\nBACKEND_IMAGE=%s\n' "$image" "$backend_image" > "$next_environment_file"
mv "$next_environment_file" "$environment_file"

if ! docker compose --project-name "$compose_project" config --quiet ||
   ! pull_images ||
   ! docker compose --project-name "$compose_project" up -d --remove-orphans; then
  rollback
  exit 1
fi

if ! wait_for_healthy_service backend; then
  rollback
  exit 1
fi

if ! wait_for_healthy_service web; then
  rollback
  exit 1
fi

printf 'Application images are healthy; awaiting external verification: %s and %s\n' "$image" "$backend_image"
