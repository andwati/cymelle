#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ] && [ -n "${NEON_DATABASE_URL:-}" ]; then
  DATABASE_URL="$NEON_DATABASE_URL"
  export DATABASE_URL
fi

case "${DATABASE_URL:-}" in
  jdbc:postgresql://*)
    export SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL:-$DATABASE_URL}"
    ;;
  postgres://*|postgresql://*)
    raw_url="${DATABASE_URL#postgres://}"
    raw_url="${raw_url#postgresql://}"

    if [ "$raw_url" != "${raw_url#*@}" ]; then
      credentials="${raw_url%%@*}"
      host_and_database="${raw_url#*@}"

      if [ -z "${SPRING_DATASOURCE_USERNAME:-}" ]; then
        export SPRING_DATASOURCE_USERNAME="${credentials%%:*}"
      fi

      if [ -z "${SPRING_DATASOURCE_PASSWORD:-}" ] && [ "$credentials" != "${credentials#*:}" ]; then
        export SPRING_DATASOURCE_PASSWORD="${credentials#*:}"
      fi
    else
      host_and_database="$raw_url"
    fi

    export SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL:-jdbc:postgresql://$host_and_database}"
    ;;
esac

exec java ${JAVA_OPTS:-} -jar /app/app.jar
