#!/usr/bin/env bash
# Dispatcher behind the test:init:db:{install,start,stop} mise tasks.
#
# usage: run.sh <install|start|stop> [--redis] [--postgres] [--mysql] [--amqp]
#               [--background]
#
# Runs scripts/test-init-db/<db>/<task>.sh for each selected database, or for
# every database when no --<db> flag is given.  `start` blocks until Ctrl-C and
# then stops what it started, unless --background is given.  See common.sh for
# the environment notice.

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

usage() {
  cat <<USAGE
usage: $0 <install|start|stop> [--redis] [--postgres] [--mysql] [--amqp] [--background]

Databases and default ports: Redis 6379, PostgreSQL 5432, MariaDB (MySQL) 3306,
RabbitMQ (AMQP) 5672.  Without a --<db> flag every database is selected.
--background (start only) returns after the databases are up instead of
blocking until Ctrl-C.
USAGE
}

task=${1:-}
[ $# -gt 0 ] && shift
case "$task" in
  install | start | stop) ;;
  -h | --help) usage; exit 0 ;;
  *) usage >&2; die "expected a task: install, start, or stop" ;;
esac

selected=()
background=false
for arg in "$@"; do
  case "$arg" in
    --background) background=true ;;
    --redis | --postgres | --mysql | --amqp) selected+=("${arg#--}") ;;
    -h | --help) usage; exit 0 ;;
    *) usage >&2; die "unknown argument: $arg" ;;
  esac
done
if $background && [ "$task" != start ]; then
  die "--background is only valid for the start task"
fi
if [ ${#selected[@]} -eq 0 ]; then
  selected=("${TEST_INIT_DB_ALL[@]}")
fi

run_task() { bash "$TEST_INIT_DB_ROOT/$1/$2.sh"; }

started=()

stop_started() {
  local db
  for db in "${started[@]}"; do
    run_task "$db" stop || true
  done
}

on_interrupt() {
  trap - INT TERM
  echo
  log "Stopping the databases started by this task..."
  stop_started
  exit 0
}

start_databases() {
  local db to_start=() running=() blocked=()
  for db in "${selected[@]}"; do
    case "$(db_state "$db")" in
      stopped) to_start+=("$db") ;;
      running) running+=("$db") ;;
      running-elsewhere)
        warn "$(db_name "$db") is running but not on its default port $(db_port "$db")."
        blocked+=("$db")
        ;;
      port-in-use)
        warn "Port $(db_port "$db") is in use by another program, not $(db_name "$db")."
        blocked+=("$db")
        ;;
    esac
  done
  if [ ${#blocked[@]} -gt 0 ]; then
    die "Cannot start: ${blocked[*]}.  Stop whatever occupies the default port(s) first."
  fi
  if [ ${#running[@]} -gt 0 ]; then
    if $background; then
      for db in "${running[@]}"; do
        log "$(db_name "$db") is already running on port $(db_port "$db"); skipping."
      done
    else
      die "Already running: ${running[*]}.  Stop them with \
'mise run test:init:db:stop', or pass --background to keep them and start the rest."
    fi
  fi

  if ! $background; then trap on_interrupt INT TERM; fi
  for db in "${to_start[@]}"; do
    if run_task "$db" start; then
      started+=("$db")
    else
      if ! $background; then stop_started; fi
      die "Failed to start $(db_name "$db")."
    fi
  done

  if $background; then
    if [ ${#started[@]} -gt 0 ]; then
      log "Started in the background: ${started[*]}.  Stop with 'mise run test:init:db:stop'."
    fi
    return 0
  fi
  log "Running: ${started[*]}.  Press Ctrl-C to stop them."
  while sleep 1; do :; done
}

print_notice
case "$task" in
  start) start_databases ;;
  *) for db in "${selected[@]}"; do run_task "$db" "$task"; done ;;
esac
