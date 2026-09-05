#!/usr/bin/env bash
# Shared helpers for the test:init database scripts.
#
# Source this file from scripts/test-init-db/run.sh or
# scripts/test-init-db/<db>/<task>.sh; do not run it directly.
#
# These scripts target the repository's devcontainer
# (.devcontainer/devcontainer.json): Ubuntu with apt, passwordless sudo, and
# no systemd, so services are driven through `service`/init.d scripts.  They
# may not work in other environments.

set -euo pipefail

TEST_INIT_DB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_INIT_DB_ALL=(redis postgres mysql amqp)

log() { printf '[test-init-db] %s\n' "$*"; }
warn() { printf '[test-init-db] warning: %s\n' "$*" >&2; }
die() { printf '[test-init-db] error: %s\n' "$*" >&2; exit 1; }

# Human-readable name of a database identifier.
db_name() {
  case "$1" in
    redis) echo "Redis" ;;
    postgres) echo "PostgreSQL" ;;
    mysql) echo "MariaDB (MySQL)" ;;
    amqp) echo "RabbitMQ (AMQP)" ;;
    *) return 1 ;;
  esac
}

# Default port expected by the fedify init templates (see
# packages/init/src/json/db-to-check.json).
db_port() {
  case "$1" in
    redis) echo 6379 ;;
    postgres) echo 5432 ;;
    mysql) echo 3306 ;;
    amqp) echo 5672 ;;
    *) return 1 ;;
  esac
}

is_devcontainer() {
  [ "${REMOTE_CONTAINERS:-}" = true ] || [ "${CODESPACES:-}" = true ] \
    || [ -n "${DEVCONTAINER:-}" ] || [ -f /.dockerenv ]
}

# Prints the environment notice shared by every test:init:db:* task.
print_notice() {
  cat >&2 <<'NOTICE'
[test-init-db] These tasks target the repository devcontainer
[test-init-db] (.devcontainer/devcontainer.json) and may not work elsewhere.
[test-init-db] Databases and default ports: Redis 6379, PostgreSQL 5432,
[test-init-db] MariaDB (MySQL) 3306, RabbitMQ (AMQP) 5672.
NOTICE
  if ! is_devcontainer; then
    warn "No devcontainer environment detected; continuing anyway."
  fi
}

install_hint() { echo "Run: mise run test:init:db:install -- --$1"; }

sudo_run() {
  if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi
}

os_codename() { (. /etc/os-release && echo "$VERSION_CODENAME"); }

require_apt() {
  command -v apt-get >/dev/null 2>&1 || die "apt-get is required to install \
$(db_name "$1"); outside the devcontainer, install it manually."
}

# Adds an apt repository whose packages are signed by the key at <key-url>.
# usage: add_apt_repository <name> <key-url> <suite line without "deb ...">
add_apt_repository() {
  local name=$1 key_url=$2 line=$3
  local keyring=/etc/apt/keyrings/$name.gpg tmp
  tmp=$(mktemp)
  curl -fsSL "$key_url" -o "$tmp"
  sudo_run install -d -m 0755 /etc/apt/keyrings
  if grep -q "BEGIN PGP PUBLIC KEY" "$tmp"; then
    gpg --dearmor <"$tmp" | sudo_run tee "$keyring" >/dev/null
  else
    sudo_run install -m 0644 "$tmp" "$keyring"
  fi
  rm -f "$tmp"
  echo "deb [signed-by=$keyring arch=$(dpkg --print-architecture)] $line" \
    | sudo_run tee "/etc/apt/sources.list.d/$name.list" >/dev/null
}

apt_install() {
  sudo_run apt-get update -qq
  sudo_run env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "$@"
}

# True when something accepts TCP connections on the port at a loopback
# address.
is_port_open() {
  local port=$1 host
  for host in 127.0.0.1 ::1; do
    if timeout 3 bash -c "exec 3<>/dev/tcp/$host/$port" 2>/dev/null; then
      return 0
    fi
  done
  return 1
}

db_process_running() {
  case "$1" in
    redis) pgrep -x redis-server >/dev/null ;;
    postgres) pgrep -x postgres >/dev/null || pgrep -x postmaster >/dev/null ;;
    mysql) pgrep -x mariadbd >/dev/null || pgrep -x mysqld >/dev/null ;;
    amqp) pgrep -f 'beam(\.smp)? .*rabbit' >/dev/null ;;
    *) return 1 ;;
  esac
}

# Prints the state of a database:
#   running            the server process is up and its default port is open
#   running-elsewhere  the server process is up but the default port is closed
#   port-in-use        the default port is open but the server process is not
#   stopped            neither
db_state() {
  local db=$1 port
  port=$(db_port "$db")
  if db_process_running "$db"; then
    if is_port_open "$port"; then echo running; else echo running-elsewhere; fi
  elif is_port_open "$port"; then
    echo port-in-use
  else
    echo stopped
  fi
}

# Exits early from a start script when the database cannot or need not start.
ensure_startable() {
  local db=$1 name port
  name=$(db_name "$db")
  port=$(db_port "$db")
  case "$(db_state "$db")" in
    running) log "$name is already running on port $port; nothing to do."; exit 0 ;;
    running-elsewhere) die "$name is running but not on port $port; stop it first." ;;
    port-in-use) die "Port $port is in use by another program; cannot start $name." ;;
  esac
}

# Exits early from a stop script when there is nothing to stop.
ensure_stoppable() {
  local db=$1 name port
  name=$(db_name "$db")
  port=$(db_port "$db")
  case "$(db_state "$db")" in
    stopped) log "$name is not running; nothing to do."; exit 0 ;;
    port-in-use)
      warn "Port $port is in use by another program, not $name; nothing to do."
      exit 0
      ;;
  esac
}

# usage: wait_for_port <db> [timeout-seconds]
wait_for_port() {
  local db=$1 timeout=${2:-60} port elapsed=0
  port=$(db_port "$db")
  until is_port_open "$port"; do
    if [ "$elapsed" -ge "$timeout" ]; then
      die "$(db_name "$db") did not open port $port within ${timeout}s."
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
}

# usage: wait_for_port_closed <db> [timeout-seconds]
wait_for_port_closed() {
  local db=$1 timeout=${2:-60} port elapsed=0
  port=$(db_port "$db")
  while is_port_open "$port"; do
    if [ "$elapsed" -ge "$timeout" ]; then
      die "$(db_name "$db") is still listening on port $port after ${timeout}s."
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
}
