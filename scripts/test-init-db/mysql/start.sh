#!/usr/bin/env bash
# Starts MariaDB (or MySQL) on port 3306, creates the `fedify` database, and
# lets root connect over TCP without a password (mysql://root@localhost/fedify).
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

if command -v mariadbd >/dev/null 2>&1; then
  flavor=mariadb
elif command -v mysqld >/dev/null 2>&1; then
  flavor=mysql
else
  die "MariaDB/MySQL is not installed.  $(install_hint mysql)"
fi
service=
for candidate in mariadb mysql; do
  if [ -x "/etc/init.d/$candidate" ]; then service=$candidate; break; fi
done
[ -n "$service" ] || die "No init script found for $flavor in /etc/init.d."
ensure_startable mysql

log "Starting $flavor..."
sudo_run service "$service" start
wait_for_port mysql

# `sudo mysql` authenticates as root through the Unix socket, so it works
# before the password-less TCP access below is configured.
log "Preparing the fedify database and passwordless root access..."
sudo_run mysql -e "CREATE DATABASE IF NOT EXISTS fedify;"
if [ "$flavor" = mariadb ]; then
  sudo_run mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED VIA unix_socket OR mysql_native_password USING PASSWORD('');"
else
  sudo_run mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '';"
fi
log "$flavor is running on port 3306 (mysql://root@localhost:3306/fedify)."
