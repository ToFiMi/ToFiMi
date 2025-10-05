#!/bin/sh
set -e

MONGO_HOST="${MONGODB_HOST:-mongodb}"
MONGO_PORT="${MONGODB_PORT:-27017}"
BOOTSTRAP_MARKER="/tmp/.bootstrap_done"

echo "Waiting for MongoDB at ${MONGO_HOST}:${MONGO_PORT} ..."
until nc -z "${MONGO_HOST}" "${MONGO_PORT}"; do
  sleep 1
done
echo "MongoDB is up."

if [ "${RUN_BOOTSTRAP:-true}" = "true" ]; then
  if [ ! -f "${BOOTSTRAP_MARKER}" ]; then
    echo "Running /app/scripts/script.js ..."
    node /app/scripts/script.js || echo "Bootstrap script failed (continuing)"
    touch "${BOOTSTRAP_MARKER}" || echo "Cannot write bootstrap marker (continuing)"
  else
    echo "Bootstrap already executed. Skipping."
  fi
fi

echo "Starting Next.js ..."
exec node server.js
