#!/bin/bash
set -e

# Get the process name from the first argument
PROCESS="${1:-worker}"

case "$PROCESS" in
  worker)
    echo "Starting worker process..."
    export PORT="${PORT:-8080}"
    cd /app/apps/worker
    exec bun run src/index.ts
    ;;
  *)
    echo "Unknown process: $PROCESS"
    echo "Usage: $0 [worker]"
    exit 1
    ;;
esac

