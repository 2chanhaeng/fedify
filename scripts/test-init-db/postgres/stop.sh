#!/usr/bin/env bash
# Stops the PostgreSQL cluster.
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

if ! command -v pg_lsclusters >/dev/null 2>&1 || [ -z "$(pg_lsclusters -h 2>/dev/null)" ]; then
  log "PostgreSQL is not installed."
  exit 0
fi
ensure_stoppable postgres
read -r version cluster _ <<<"$(pg_lsclusters -h | head -n 1)"
log "Stopping PostgreSQL $version/$cluster..."
sudo_run pg_ctlcluster "$version" "$cluster" stop
wait_for_port_closed postgres
log "PostgreSQL stopped."
