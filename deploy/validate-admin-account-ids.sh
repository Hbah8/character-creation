#!/usr/bin/env sh
set -eu

file=${1:?A file containing ADMIN_ACCOUNT_IDS is required}
uuid='[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

if [ ! -s "$file" ] || [ "$(wc -l < "$file")" -ne 0 ] ||
  ! LC_ALL=C grep -aEq "^${uuid}(,${uuid})*$" "$file"; then
  printf 'ADMIN_ACCOUNT_IDS must contain UUIDs separated by commas, without whitespace or empty entries.\n' >&2
  exit 1
fi
