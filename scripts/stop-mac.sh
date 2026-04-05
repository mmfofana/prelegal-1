#!/usr/bin/env bash
set -euo pipefail

echo "Stopping Prelegal..."
docker compose down
echo "Prelegal stopped."
