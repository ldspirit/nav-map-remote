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
```

## Notes
- Database uses PostgreSQL + PostGIS
- Migrations are plain SQL for portability
