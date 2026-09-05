#!/usr/bin/env bash
# Starts Redis on port 6379.
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

command -v redis-server >/dev/null 2>&1 \
  || die "Redis is not installed.  $(install_hint redis)"
ensure_startable redis
log "Starting Redis..."
if [ -x /etc/init.d/redis-server ]; then
  sudo_run service redis-server start
else
  # The packages.redis.io package only ships a systemd unit, which the
  # devcontainer cannot use, so daemonize the server with the packaged
  # configuration (pid file, log file, and data directory) as the redis user.
  conf=/etc/redis/redis.conf
  args=(--daemonize yes --port 6379 --supervised no)
  if id redis >/dev/null 2>&1; then
    sudo_run runuser -u redis -- redis-server "$conf" "${args[@]}"
  else
    sudo_run redis-server "$conf" "${args[@]}"
  fi
fi
wait_for_port redis
log "Redis is running on port 6379 (redis://localhost:6379)."
