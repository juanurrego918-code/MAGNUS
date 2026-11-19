#!/usr/bin/env bash
# Corre migraciones + seed + pruebas contra un Postgres temporal (no toca ninguna base real).
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
DIR=$(mktemp -d); chmod 777 "$DIR"; PORT=${PGPORT:-55432}
as_pg() { if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$@"; else "$@"; fi; }
as_pg "$PGBIN/initdb" -D "$DIR/data" -A trust >/dev/null
as_pg "$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR" -l "$DIR/log" -w start >/dev/null
trap 'as_pg "$PGBIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null; rm -rf "$DIR"' EXIT
PSQL="psql -h $DIR -p $PORT -U postgres -d postgres -v ON_ERROR_STOP=1 -q"
$PSQL -f tests/00_auth_stub.sql
for f in migrations/*.sql; do $PSQL -f "$f"; done
$PSQL -f seed.sql
for f in tests/[0-9][0-9]_*.sql; do [ "$f" = tests/00_auth_stub.sql ] || $PSQL -f "$f" 2>&1; done
