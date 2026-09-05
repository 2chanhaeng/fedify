#!/usr/bin/env bash
# Stops MariaDB (or MySQL).
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

service=
for candidate in mariadb mysql; do
  if [ -x "/etc/init.d/$candidate" ]; then service=$candidate; break; fi
done
[ -n "$service" ] || { log "MariaDB/MySQL is not installed."; exit 0; }
ensure_stoppable mysql
log "Stopping $service..."
sudo_run service "$service" stop
wait_for_port_closed mysql
log "$service stopped."
