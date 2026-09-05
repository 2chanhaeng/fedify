#!/usr/bin/env bash
# Starts the PostgreSQL cluster on port 5432 and allows passwordless TCP
# connections for the postgres user (postgres://postgres@localhost:5432).
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

if ! command -v pg_lsclusters >/dev/null 2>&1 || [ -z "$(pg_lsclusters -h 2>/dev/null)" ]; then
  die "PostgreSQL is not installed.  $(install_hint postgres)"
fi
ensure_startable postgres
read -r version cluster port _ <<<"$(pg_lsclusters -h | head -n 1)"
[ "$port" = 5432 ] \
  || die "The PostgreSQL cluster $version/$cluster is configured for port $port, not 5432."

hba=/etc/postgresql/$version/$cluster/pg_hba.conf
marker="# fedify test:init"
if ! sudo_run grep -q "$marker" "$hba"; then
  log "Allowing passwordless TCP connections for the postgres user in $hba..."
  sudo_run sed -i "1i $marker: passwordless local TCP connections for the postgres user\n\
host all postgres 127.0.0.1/32 trust\n\
host all postgres ::1/128 trust" "$hba"
fi

log "Starting PostgreSQL $version/$cluster..."
sudo_run pg_ctlcluster "$version" "$cluster" start
wait_for_port postgres
log "PostgreSQL is running on port 5432 (postgres://postgres@localhost:5432/postgres)."
