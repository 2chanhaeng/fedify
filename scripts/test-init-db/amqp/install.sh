#!/usr/bin/env bash
# Installs the latest RabbitMQ: Erlang from the Team RabbitMQ Launchpad PPA
# (amd64 and arm64) and the rabbitmq-server .deb from the latest GitHub
# release, as described in <https://www.rabbitmq.com/docs/install-debian>.
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

if command -v rabbitmq-server >/dev/null 2>&1; then
  log "RabbitMQ is already installed; start with \`mise run test:init:db:start --amqp\`"
  exit 0
fi
require_apt amqp
log "Adding the Team RabbitMQ Erlang PPA..."
add_apt_repository rabbitmq-erlang \
  "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xF77F1EDA57EBB1CC" \
  "https://ppa.launchpadcontent.net/rabbitmq/rabbitmq-erlang/ubuntu $(os_codename) main"

log "Resolving the latest RabbitMQ release..."
release_url=$(curl -fsSLI -o /dev/null -w '%{url_effective}' \
  https://github.com/rabbitmq/rabbitmq-server/releases/latest)
version=${release_url##*/tag/v}
[ -n "$version" ] && [ "$version" != "$release_url" ] \
  || die "Could not determine the latest RabbitMQ version from $release_url."

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
deb="$tmp/rabbitmq-server_${version}-1_all.deb"
log "Downloading RabbitMQ $version..."
curl -fsSL -o "$deb" \
  "https://github.com/rabbitmq/rabbitmq-server/releases/download/v$version/rabbitmq-server_${version}-1_all.deb"
apt_install "$deb"
log "Installed RabbitMQ; start with \`mise run test:init:db:start --amqp\`"
