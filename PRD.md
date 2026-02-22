# Product Requirements Document (PRD)
## Africa Digital Map Platform

**Version:** 1.1
**Last Updated:** 2026-02-22
**Owner:** Product

---

## 1) Vision & Problem
Millions across Africa lack reliable, verifiable digital addresses. This blocks deliveries, emergency services, and financial inclusion. Existing solutions rely on commercial APIs (Google/Mapbox) with volatile pricing and limited offline support—especially harmful in low-connectivity regions. We need an open-source, Africa-optimized platform with predictable costs, real street-style addresses, and privacy.

**Core Principles**
- Zero dependency on commercial APIs/services
- Self-hosted open-source mapping stack
- Africa-optimized (offline, rural coverage, regional pricing)
- Privacy and verification built-in

---

## 2) Platform Coverage
- Web App (desktop-first for admin + dashboards)
- Android App
- iOS App
- API Service (third-party integrations)

---

## 3) Target Users
**Primary**
- Individuals and families in African countries
- Small businesses and home-based entrepreneurs
- Anyone needing free navigation

**Secondary**
- Delivery services
- Emergency services
- Financial institutions (KYC)
- Developers via API

---

## 4) MVP Scope (Phase 1)
**Goal:** Digital address creation + free navigation + core pricing + privacy system

### MVP Features
1. **Digital Address Generation**
   - System-generated street names (not user-created)
   - Street type classification (Street, Road, Avenue, Close, Lane, Crescent)
   - Sequential numbering, no gaps, sub-numbering for later infill (1A/1B)
   - Permanent addresses: ACTIVE/INACTIVE lifecycle
   - Country format templates (Nigeria/Kenya/Ghana/South Africa)
   - 75-char total address limit, 50-char street name limit
   - Content filtering for prohibited terms

2. **Privacy P-System**
   - P1/P2/P3 suffixes for same GPS point
   - Individual vs family billing rules

3. **Family Accounts (Lite)**
   - Family admin + member invites
   - Shared billing
   - Individual privacy per member

4. **Regional Detection & Pricing**
   - Region detection order: Device → SIM → GPS → IP → Manual
   - Conflict resolution dialog
   - Billing country lock
   - Base currency × multiplier × exchange rate

5. **Universal Navigation (Free)**
   - Search + route for both digital and physical addresses
   - OSRM/GraphHopper routing
   - Voice navigation (open-source TTS)

6. **Temporary Location Sharing (Quick Share)**
   - Auto-generated temporary address
   - Expiration options

7. **Basic Verification**
   - ID/passport upload (blue check)

8. **Admin Lite**
   - Basic user management
   - Address moderation (disputes)

---

## 5) Full Product Scope (Post-MVP)
### Address & Location Systems
- Dual Location Sharing (Quick Share + Custom Share)
- Mixed Address Support (digital + government/OSM)
- Temporary address grid numbering
- Geo-restricted app distribution (Africa-only in Phase 1)

### Verification System
- Gold, Business, Premium verification tiers
- OCR + instant verification pipeline
- Document security + annual renewals

### Pricing & Growth Systems
- Promotions and coupon management
- Advanced trials (per-country, per-user-type)
- Student discounts
- Corporate/bulk pricing
- A/B testing for pricing

### Country Change & Migration
- Admin-approved billing country change
- Pro-rated adjustments
- Address migration rules

### Safety & Internal Communication
- In-app messaging with location sharing
- Driving mode safety controls
- Voice-only while driving

### Organizational Building Protection
- Multi-layer detection (official databases, OSM POIs, AI imagery)

### Offline Mode
- Cached tiles + offline navigation
- Offline address lookup

### Security & Compliance
- GDPR + African data protection compliance
- Data export / right-to-delete
- Encryption at rest and in transit
- Backup + disaster recovery

---

## 6) Functional Requirements (Selected Acceptance Criteria)
### Digital Address Creation
- GPS location captured and confirmed by user
- If no nearby street: generate new street name + type
- If street exists: assign sequential house number
- P-number assigned for same GPS point
- Addresses never deleted (INACTIVE instead)

### P-System
- Multiple users can register same coordinates
- P-numbers resolve to same GPS point
- P-number sequencing always incremental

### Regional Detection
- Conflict dialog appears on mismatch (SIM vs GPS)
- Manual override always available

### Temporary Location Sharing (Quick)
- 3-tap flow: share → duration → send
- Auto-expire link

### Verification (Basic)
- Upload ID/passport
- Manual review queue + approval

---

## 7) Non-Goals (MVP)
- Street-level imagery collection
- AR navigation
- Government partnerships
- Ride-hailing integrations
- IoT/smart home integrations

---

## 8) Success Metrics (MVP)
- 10K users in 3 months
- 70% address creation completion
- 10% trial → paid conversion
- 99.5% API uptime

---

## 9) Open Questions
- Optimal GPS match threshold for P-system
- User trust in generated street names
- Pricing sensitivity by country

---

## 10) Change Log
- **2026-02-22:** Expanded scope to include full requirements list + MVP separation
