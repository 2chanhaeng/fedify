#!/usr/bin/env bash
# Stops Redis.
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

command -v redis-server >/dev/null 2>&1 || { log "Redis is not installed."; exit 0; }
ensure_stoppable redis
log "Stopping Redis..."
if [ -x /etc/init.d/redis-server ]; then
  sudo_run service redis-server stop
else
  redis-cli -p 6379 shutdown nosave >/dev/null 2>&1 || sudo_run pkill -x redis-server
fi
wait_for_port_closed redis
log "Redis stopped."
