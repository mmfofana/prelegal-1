#!/usr/bin/env bash
set -euo pipefail

echo "Starting Prelegal..."
docker compose up -d --build
echo "Prelegal is running at http://localhost:8000"
