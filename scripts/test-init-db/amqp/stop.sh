#!/usr/bin/env bash
# Stops RabbitMQ.
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

command -v rabbitmq-server >/dev/null 2>&1 || { log "RabbitMQ is not installed."; exit 0; }
ensure_stoppable amqp
log "Stopping RabbitMQ..."
sudo_run service rabbitmq-server stop
wait_for_port_closed amqp 120
log "RabbitMQ stopped."
