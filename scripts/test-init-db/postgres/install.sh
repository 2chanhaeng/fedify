#!/usr/bin/env bash
# Installs the latest PostgreSQL from the official PGDG apt repository
# (apt.postgresql.org) and makes sure a cluster exists.
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

has_cluster() {
  command -v pg_lsclusters >/dev/null 2>&1 && [ -n "$(pg_lsclusters -h 2>/dev/null)" ]
}

if has_cluster; then
  log "PostgreSQL is already installed; start with \`mise run test:init:db:start --postgres\`"
  exit 0
fi
require_apt postgres
log "Installing PostgreSQL from apt.postgresql.org..."
add_apt_repository pgdg https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  "https://apt.postgresql.org/pub/repos/apt $(os_codename)-pgdg main"
apt_install postgresql
if ! has_cluster; then
  version=$(ls /usr/lib/postgresql 2>/dev/null | sort -V | tail -n 1)
  [ -n "$version" ] || die "PostgreSQL was installed but no server version was found."
  log "Creating the PostgreSQL $version main cluster..."
  sudo_run pg_createcluster "$version" main
fi
log "Installed PostgreSQL; start with \`mise run test:init:db:start --postgres\`"
