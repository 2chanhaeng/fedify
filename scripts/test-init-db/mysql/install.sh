#!/usr/bin/env bash
# Installs the latest MariaDB from the official MariaDB apt repository
# (dlm.mariadb.com).  MariaDB is used because the MySQL apt repository does
# not publish arm64 packages, which the devcontainer needs on Apple silicon.
# An existing MySQL server installation is accepted as-is.
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

for server in mariadbd mysqld; do
  if command -v "$server" >/dev/null 2>&1; then
    log "MariaDB/MySQL is already installed; start with \`mise run test:init:db:start --mysql\`."
    exit 0
  fi
done
require_apt mysql
log "Installing MariaDB from dlm.mariadb.com..."
add_apt_repository mariadb https://supplychain.mariadb.com/mariadb-keyring-2019.gpg \
  "https://dlm.mariadb.com/repo/mariadb-server/latest/repo/ubuntu $(os_codename) main"
apt_install mariadb-server
log "Installed MariaDB; start with \`mise run test:init:db:start --mysql\`."
