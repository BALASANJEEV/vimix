#!/bin/sh
set -e

# Start the Express backend in background
node server.js &

# Forward any signals to both processes
trap 'kill %1' TERM INT

# Run Nginx in the foreground (this keeps the container alive)
exec nginx -g 'daemon off;'