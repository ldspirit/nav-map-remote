#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:4000}

curl -sS -X POST "$BASE_URL/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","phone":"+234801234567","full_name":"Test User","device_region":"NG","coordinates":{"lat":6.5244,"lng":3.3792}}'
