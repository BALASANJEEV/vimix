#!/bin/sh
set -e

# Ensure required directories exist
mkdir -p /run/nginx /usr/src/app/uploads

# Start Node.js backend in background and restart if it crashes
while true; do
    node server.js || true
    echo "Node.js process exited, restarting in 2 seconds..."
    sleep 2
done &

# Start nginx in foreground (PID 1)
exec nginx -g 'daemon off;'
