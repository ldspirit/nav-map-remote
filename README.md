# nav-map-remote

Africa Digital Map Platform — planning + specs.

## Docs
- PRD.md
- TECH_SPEC.md
- ROADMAP.md

## Setup
```bash
# 1) Environment
cp .env.example .env
# set DATABASE_URL

# 2) Run migrations (psql)
psql "$DATABASE_URL" -f db/migrations/0001_init.sql
psql "$DATABASE_URL" -f db/migrations/0002_add_otp_codes.sql
```

## API (MVP)
```bash
# register
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","phone":"+234801234567","full_name":"Test User","device_region":"NG","coordinates":{"lat":6.5244,"lng":3.3792}}'

# verify OTP
curl -X POST http://localhost:4000/api/v1/auth/verify-phone \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"<uuid>","otp_code":"123456"}'

# create address
curl -X POST http://localhost:4000/api/v1/addresses/create \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"<uuid>","coordinates":{"lat":6.5244,"lng":3.3792}}'

# search
curl 'http://localhost:4000/api/v1/addresses/search?q=Hope'
```

## Notes
- Database uses PostgreSQL + PostGIS
- Migrations are plain SQL for portability
