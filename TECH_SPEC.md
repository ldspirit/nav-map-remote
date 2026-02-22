# Technical Specification
## Africa Digital Map Platform

**Version:** 1.1
**Last Updated:** 2026-02-22
**Owner:** Engineering

---

## 1) Open-Source Stack (Zero Commercial API Dependency)
### Mapping & Visualization
- OpenStreetMap (data source)
- OpenMapTiles + TileServer GL (self-hosted tiles)
- Leaflet (web mapping)

### Routing & Navigation
- OSRM (primary)
- GraphHopper (secondary)

### Backend & Data
- PostgreSQL + PostGIS (spatial database)
- Redis (caching, sessions, rate limits)
- Node.js or Python (API services)

### Street-Level Imagery (Phase 2)
- OpenStreetCam/KartaView
- Custom imagery pipeline (cameras/drones)

### Voice & Audio
- eSpeak NG
- Mozilla TTS
- Festival

---

## 2) Platform Architecture
### Services
- **API Core**: Auth, address generation, user management
- **Routing Service**: OSRM/GraphHopper
- **Tile Service**: TileServer GL
- **Search Service**: Postgres + full-text + optional self-hosted search
- **Verification Service**: OCR + document pipeline
- **Admin Service**: RBAC, approvals, moderation

### Data Model (Core)
**tables**: users, addresses, streets, families, subscriptions, promos, verification_docs, temp_locations, audit_logs

**Key rules**
- Addresses never deleted (ACTIVE/INACTIVE)
- Uniqueness: (street_id, house_number, p_number)
- Spatial uniqueness checks via PostGIS ST_DWithin

---

## 3) Critical Algorithms (MVP)
### GPS Match + P-System
- ST_DWithin threshold (initial 12m)
- If match exists → assign next P-number
- If no match → generate new address with P1

### Street Name Generation
- Country-specific name banks
- Content filter (blocklist + sentiment)
- 5km uniqueness radius
- Street type classification rules

### Sequential Numbering
- Compute street direction
- Assign numbers along centerline
- Sub-numbering for infill (1A/1B)

---

## 4) Core APIs (MVP)
- POST /auth/register
- POST /auth/verify-phone
- POST /addresses/create
- GET /addresses/:id
- GET /addresses/search
- POST /navigation/route
- POST /families/create
- POST /families/:id/members
- POST /verification/upload
- POST /temporary/share

---

## 5) Security & Compliance
- TLS everywhere
- AES-256 at rest
- GDPR + NDPR/POPIA compliance
- Audit logs for all admin actions
- Data export + right-to-delete

---

## 6) Deployment (Self-Hosted, Cost-Controlled)
- Containerized services (Docker)
- OSRM + TileServer GL on dedicated nodes
- Postgres with PostGIS + spatial indexes
- Redis for cache/session
- Monitoring: Prometheus + Grafana + Sentry

---

## 7) Phase 2+ Technical Additions
- AI imagery analysis for institutional detection
- In-app messaging + driving safety mode
- Advanced pricing experiments
- Street-level imagery pipeline
- Offline sync engine
