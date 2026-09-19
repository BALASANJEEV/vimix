#!/bin/sh
set -eu

nginx -g 'daemon off;' &
nginx_pid=$!
node /app/backend/server.js &
backend_pid=$!

cleanup() {
  kill -TERM "$backend_pid" "$nginx_pid" 2>/dev/null || true
  wait "$backend_pid" 2>/dev/null || true
  wait "$nginx_pid" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$nginx_pid" 2>/dev/null; do
  sleep 1
done

if ! kill -0 "$backend_pid" 2>/dev/null; then
  wait "$backend_pid"
  exit $?
fi

wait "$nginx_pid"
exit $?
