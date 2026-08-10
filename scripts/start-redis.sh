#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../infra/redis"
docker compose up -d
docker compose ps
