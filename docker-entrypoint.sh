#!/bin/sh
# Runs as root so it can fix ownership of the bind-mounted ./data volume (Docker creates
# host bind-mount directories as root, which a non-root container user can't write into),
# then drops to the unprivileged appuser for the actual application process.
set -e

mkdir -p /app/data
chown -R appuser:appuser /app/data

exec su -s /bin/sh appuser -c 'exec "$0" "$@"' -- "$@"
