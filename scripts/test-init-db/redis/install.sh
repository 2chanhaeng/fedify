#!/usr/bin/env bash
# Installs the latest Redis from the official packages.redis.io apt repository.
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

if command -v redis-server >/dev/null 2>&1; then
  log "Redis is already installed; start with \`mise run test:init:db:start --redis\`."
  exit 0
fi
require_apt redis
log "Installing Redis from packages.redis.io..."
add_apt_repository redis https://packages.redis.io/gpg \
  "https://packages.redis.io/deb $(os_codename) main"
apt_install redis
log "Installed Redis; start with \`mise run test:init:db:start --redis\`."
