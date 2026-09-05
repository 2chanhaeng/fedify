#!/usr/bin/env bash
# Starts RabbitMQ on port 5672 (amqp://localhost, default guest/guest user).
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

command -v rabbitmq-server >/dev/null 2>&1 \
  || die "RabbitMQ is not installed.  $(install_hint amqp)"
[ -x /etc/init.d/rabbitmq-server ] || die "No init script found in /etc/init.d/rabbitmq-server."
ensure_startable amqp
log "Starting RabbitMQ..."
sudo_run service rabbitmq-server start
wait_for_port amqp 120
log "RabbitMQ is running on port 5672 (amqp://localhost)."
