<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo/CinePath_Bear_Full_Logo_II.png">
    <source media="(prefers-color-scheme: light)" srcset="public/logo/CinePath_Bear_Full_Logo.png">
    <img alt="CinePath Logo" src="public/logo/CinePath_Bear_Full_Logo.png" width="460">
  </picture>
</p>

<p align="center">
  <strong>Enterprise-Grade Cinema Multiplex Operations, Distributed Atomic Ticketing & Turnstile Access Engine</strong><br/>
  <sub>Architected & Developed by <a href="https://github.com/abdellah-agrm"><strong>Abdellah Agourram</strong></a></sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.1.7-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.0.0-149eca?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7_Alpine-dc382d?style=for-the-badge&logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/Prisma-6.3.1-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Stripe-17.6-635bff?style=for-the-badge&logo=stripe" alt="Stripe" />
  <img src="https://img.shields.io/badge/Security-RBAC_&_HMAC-success?style=for-the-badge" alt="Security" />
  <img src="https://img.shields.io/badge/License-MIT-amber?style=for-the-badge" alt="License" />
</p>

---

## 📑 Table of Contents

1. [System Architecture Overview](#-system-architecture-overview)
2. [Database Architecture & Entity-Relationship UML](#-database-architecture--entity-relationship-uml)
3. [Distributed Concurrency & Atomic Seat Locking UML](#-distributed-concurrency--atomic-seat-locking-uml)
4. [Turnstile QR Code Verification & Anomaly Sentinel UML](#-turnstile-qr-code-verification--anomaly-sentinel-uml)
5. [Role-Based Access Control (RBAC) Matrix](#-role-based-access-control-rbac-matrix)
6. [Platform Features & Operational Portals](#-platform-features--operational-portals)
   * [Customer Booking Studio & 90s Guest Checkout](#1-customer-booking-studio--90s-guest-checkout)
   * [Admin Management & Operations Portal](#2-admin-management--operations-portal)
   * [Staff Turnstile & Gatekeeper Hub](#3-staff-turnstile--gatekeeper-hub)
   * [Vector PDF Ticketing & Digital Wallets](#4-vector-pdf-ticketing--digital-wallets)
7. [REST API Reference](#-rest-api-reference)
8. [Project File Structure](#-project-file-structure)
9. [Environment Variables Reference](#-environment-variables-reference)
10. [Quick Start & Local Deployment](#-quick-start--local-deployment)
11. [Testing & Concurrency Verification](#-testing--concurrency-verification)
12. [Production Deployment & Security Hardening](#-production-deployment--security-hardening)

---

## 🏛️ System Architecture Overview

CinePath is engineered as a zero-downtime, distributed multiplex management platform. It decouples high-frequency, write-heavy locking operations from persistent relational transactions by combining **Next.js 15 App Router**, **Redis in-memory Lua primitives**, and **PostgreSQL with Prisma ORM**.

```mermaid
flowchart TD
    subgraph Clients["1. Client Layer (Multi-Persona Responsive Interfaces)"]
        direction LR
        UI_Guest["🎬 Customer Experience<br/>• Real-Time Seat Map<br/>• Dynamic Cart & Pricing<br/>• 90s Guest Checkout"]
        UI_Admin["👑 Admin Operations Portal<br/>• 2D Visual Hall Editor<br/>• Movie & Showtime Manager<br/>• User Roles & Audit Trail"]
        UI_Staff["🎟️ Staff Turnstile Portal<br/>• Camera QR / Barcode Scanner<br/>• Replay Attack Interception<br/>• Manual Override Console"]
    end

    subgraph Gateway["2. Edge & API Layer (Next.js 15 App Router & Middleware)"]
        direction TB
        MW["🛡️ Edge Middleware<br/>(JWT RBAC Guard: ADMIN / STAFF / CUSTOMER)"]
        API_Public["Public APIs<br/>(/api/movies, /api/showtimes/:id/seats)"]
        API_Lock["Distributed Lock API<br/>(/api/showtimes/:id/lock-seats)"]
        API_Checkout["Transaction API<br/>(/api/bookings, /api/webhooks/stripe)"]
        API_Staff["Turnstile Gatekeeper API<br/>(/api/tickets/validate, /api/staff/*)"]
        API_Admin["Executive Management API<br/>(/api/admin/*)"]
    end

    subgraph Engines["3. Core Business Logic & Concurrency Engines"]
        direction TB
        LUA_LOCK["⚡ Redis Lua Lock Engine<br/>Atomic Multi-Seat Lock Evaluation (10m TTL)"]
        CRYPTO["🔐 Cryptographic Sentinel<br/>HMAC-SHA256 Payload Signature & Verification"]
        AUDIT["📋 Audit & Anomaly Sentinel<br/>Non-blocking Async Security Violation Logging"]
        STRIPE["💳 Stripe Payment Orchestrator<br/>Webhook Event Idempotency & Reconciliation"]
    end

    subgraph Persistence["4. Persistence & Cache Infrastructure"]
        direction LR
        REDIS[("⚡ Redis 7 (In-Memory)<br/>• Atomic Seat Key Locks<br/>• Active Booking Tokens<br/>• Hot Showtimes Cache")]
        POSTGRES[("🐘 PostgreSQL 16 (Primary DB)<br/>• Relational Schema & Enums<br/>• Partial Unique Indexes<br/>• Immutable Audit Logs")]
    end

    UI_Guest --> MW
    UI_Admin --> MW
    UI_Staff --> MW

    MW --> API_Public
    MW --> API_Lock
    MW --> API_Checkout
    MW --> API_Staff
    MW --> API_Admin

    API_Lock --> LUA_LOCK
    LUA_LOCK <--> REDIS

    API_Checkout --> STRIPE
    API_Checkout --> POSTGRES
    API_Checkout --> LUA_LOCK

    API_Staff --> CRYPTO
    API_Staff --> AUDIT
    API_Staff --> POSTGRES

    API_Admin --> POSTGRES
    API_Admin --> AUDIT

    AUDIT --> POSTGRES
    API_Public --> POSTGRES
```

---

## 🗄️ Database Architecture & Entity-Relationship UML

The database is built on **PostgreSQL 16**, managed through **Prisma 6**. It enforces strong data integrity with foreign key cascades, unique compound indexes (`uq_hall_grid_position`, `uq_hall_seat_label`), and partial indexes for ticket deduplication.

```mermaid
erDiagram
    USER ||--o{ BOOKING : "places"
    USER ||--o{ REVIEW : "authors"
    MOVIE ||--|{ MOVIE_GENRE : "categorized_by"
    GENRE ||--|{ MOVIE_GENRE : "classifies"
    MOVIE ||--o{ SHOWTIME : "scheduled_in"
    MOVIE ||--o{ REVIEW : "receives"
    CINEMA ||--|{ HALL : "contains"
    HALL ||--|{ SEAT : "houses"
    HALL ||--o{ SHOWTIME : "hosts"
    SHOWTIME ||--o{ BOOKING : "generates"
    SHOWTIME ||--o{ TICKET : "issues"
    BOOKING ||--|{ TICKET : "contains"
    BOOKING ||--o| PAYMENT : "settled_by"
    BOOKING }o--o| PROMO_CODE : "redeems"
    SEAT ||--o{ TICKET : "allocated_to"

    USER {
        string id PK
        string full_name
        string email UK
        string password_hash
        string phone
        enum role "CUSTOMER | STAFF | ADMIN"
        boolean is_verified
        datetime created_at
    }

    MOVIE {
        string id PK
        string title
        string slug UK
        string synopsis
        int duration_min
        string original_language
        string age_rating
        datetime release_date
        string poster_url
        string trailer_url
        enum status "COMING_SOON | NOW_SHOWING | ARCHIVED"
    }

    GENRE {
        string id PK
        string name UK
    }

    MOVIE_GENRE {
        string movie_id PK,FK
        string genre_id PK,FK
    }

    CINEMA {
        string id PK
        string name
        string slug UK
        string city
        string address
        string phone
    }

    HALL {
        string id PK
        string cinema_id FK
        string name
        int total_rows
        int total_cols
        int capacity
        enum type "STANDARD | IMAX | VIP | THREE_D"
    }

    SEAT {
        string id PK
        string hall_id FK
        string row_label
        int seat_number
        int grid_row
        int grid_col
        enum type "STANDARD | VIP | COUPLE | WHEELCHAIR"
        enum status "ACTIVE | BROKEN | AISLE"
        decimal price_modifier
    }

    SHOWTIME {
        string id PK
        string movie_id FK
        string hall_id FK
        datetime start_time
        datetime end_time
        decimal base_price
        string audio_language
        string subtitle_language
        enum format "TWO_D | THREE_D | IMAX"
        enum status "SCHEDULED | CANCELLED | COMPLETED"
    }

    BOOKING {
        string id PK
        string user_id FK "nullable"
        string guest_email "nullable"
        string showtime_id FK
        string promo_code_id FK "nullable"
        string reference UK
        enum status "PENDING | CONFIRMED | CANCELLED | EXPIRED | USED | REFUNDED"
        decimal total_amount
        datetime expires_at
        datetime created_at
    }

    TICKET {
        string id PK
        string booking_id FK
        string seat_id FK
        string showtime_id FK
        string qr_payload UK
        decimal price
        enum status "ACTIVE | USED | CANCELLED | REFUNDED"
        datetime used_at
    }

    PAYMENT {
        string id PK
        string booking_id FK,UK
        string provider_ref UK
        decimal amount
        string currency
        enum status "PENDING | SUCCEEDED | FAILED | REFUNDED"
        datetime paid_at
    }

    PROMO_CODE {
        string id PK
        string code UK
        int discount_percent
        datetime expires_at
        int max_uses
        int current_uses
    }

    AUDIT_LOG {
        string id PK
        string actor_id
        string actor_email
        string actor_role
        string action
        enum severity "INFO | WARN | CRITICAL"
        string entity_type
        string entity_id
        string message
        json metadata
        datetime created_at
    }
```

---

## ⚡ Distributed Concurrency & Atomic Seat Locking UML

During blockbuster ticket sales (e.g., premier screenings), thousands of concurrent customers may attempt to select identical seats simultaneously. CinePath eliminates race conditions using a **distributed atomic Redis Lua lock script** with a dual-stage expiration window (10-minute client display, 12-minute backend buffer):

```mermaid
sequenceDiagram
    autonumber
    actor Alice as "Customer 1 (Alice)"
    actor Bob as "Customer 2 (Bob)"
    participant API as "Lock Route (/api/.../lock-seats)"
    participant Lua as "Redis Lua Engine"
    participant RedisKV as "Redis Key-Value Store"
    participant DB as "PostgreSQL DB"

    Note over Alice,Bob: Both attempt to reserve Seats [C-7, C-8] concurrently
    Alice->>API: POST /api/showtimes/SHOW_1/lock-seats { seats: ["C7", "C8"], token: "tok_alice" }
    Bob->>API: POST /api/showtimes/SHOW_1/lock-seats { seats: ["C8", "C9"], token: "tok_bob" }

    par Concurrent Execution
        API->>Lua: EVALSHA lock_seats.lua ("SHOW_1", ["C7","C8"], "tok_alice", TTL=720)
    and
        API->>Lua: EVALSHA lock_seats.lua ("SHOW_1", ["C8","C9"], "tok_bob", TTL=720)
    end

    Note over Lua: Redis processes Lua scripts single-threaded & atomically
    Lua->>RedisKV: Check keys `lock:SHOW_1:seat:C7` and `lock:SHOW_1:seat:C8`
    RedisKV-->>Lua: Both keys free
    Lua->>RedisKV: SET `lock:SHOW_1:seat:C7` = "tok_alice" (EX 720)
    Lua->>RedisKV: SET `lock:SHOW_1:seat:C8` = "tok_alice" (EX 720)
    Lua-->>API: 1 (SUCCESS)
    API-->>Alice: 200 OK { locked: ["C7", "C8"], countdown: 600s }

    Note over Lua: Next script evaluates key `lock:SHOW_1:seat:C8`
    Lua->>RedisKV: Check key `lock:SHOW_1:seat:C8`
    RedisKV-->>Lua: Already holds value "tok_alice"
    Lua-->>API: 0 (COLLISION DETECTED)
    API-->>Bob: 409 Conflict { error: "Seats [C8] are already locked by another customer" }

    Note over Alice,DB: Alice completes payment within 10 minutes
    Alice->>API: POST /api/bookings { lockToken: "tok_alice", stripePayment: "pi_..." }
    API->>DB: prisma.$transaction [Insert Booking, Insert Tickets, Record Payment]
    DB-->>API: Committed Successfully
    API->>RedisKV: DEL `lock:SHOW_1:seat:C7`, `lock:SHOW_1:seat:C8`
    API-->>Alice: 201 Created { reference: "CP-88392", tickets: [...] }
```

---

## 🛡️ Turnstile QR Code Verification & Anomaly Sentinel UML

Digital tickets embed an **HMAC-SHA256 signature** generated using a hardware-isolated server secret (`QR_SECRET`). When scanned at turnstiles or gate entrances:
1. The cryptographic signature is verified against the ticket ID and showtime ID.
2. The ticket status in PostgreSQL is atomically checked to prevent **duplicate entry (replay attacks)**.
3. Every invalid signature or replay attempt triggers a **`CRITICAL` or `WARN` security audit record**.

```mermaid
sequenceDiagram
    autonumber
    actor Attendee as "Ticket Holder"
    actor Staff as "Cinema Staff"
    participant Scanner as "Turnstile Scanner (jsQR WebCam)"
    participant API as "Validation API (/api/tickets/validate)"
    participant Crypto as "HMAC-SHA256 Engine"
    participant DB as "PostgreSQL & Audit Engine"

    Attendee->>Staff: Shows Digital Ticket QR Code on Mobile
    Staff->>Scanner: Points camera at QR code
    Scanner->>API: POST /api/tickets/validate { qrPayload: "ticketId.hmacSignature" }

    API->>Crypto: Compute HMAC-SHA256(ticketId, QR_SECRET)
    
    alt Tampered QR Code (Signature Mismatch)
        Crypto-->>API: Signature Invalid!
        API->>DB: createAuditLog("TAMPERED_QR_SCAN", severity: CRITICAL, ip, metadata)
        API-->>Scanner: 400 Bad Request { valid: false, code: "SIGNATURE_INVALID" }
        Scanner-->>Staff: 🚨 BUZZER + FLASH RED: "Counterfeit Ticket Attempt!"
    else Valid Cryptographic Signature
        Crypto-->>API: Signature Valid
        API->>DB: SELECT * FROM tickets WHERE id = ticketId FOR UPDATE
        
        alt Ticket Status is already "USED" (Duplicate Scan)
            DB-->>API: Status = USED (used_at: "2026-11-14T20:15:00Z")
            API->>DB: createAuditLog("DUPLICATE_ENTRY_ATTEMPT", severity: WARN, ticketId)
            API-->>Scanner: 409 Conflict { valid: false, code: "ALREADY_USED", usedAt: "..." }
            Scanner-->>Staff: ⚠️ WARNING CHIME + YELLOW: "Ticket Already Admitted Earlier"
        else Ticket Status is "ACTIVE"
            DB-->>API: Status = ACTIVE
            API->>DB: UPDATE tickets SET status = 'USED', used_at = NOW()
            API->>DB: createAuditLog("TICKET_ADMITTED", severity: INFO, ticketId)
            API-->>Scanner: 200 OK { valid: true, movie: "Dune 2", hall: "Hall 1", seat: "H12" }
            Scanner-->>Staff: 🟢 SUCCESS CHIME + GREEN: "Access Granted - Seat H-12"
        end
    end
```

---

## 🔐 Role-Based Access Control (RBAC) Matrix

CinePath features a hardened RBAC architecture validated at both the **Edge Middleware** layer and inside individual **API Route Handlers**.

| Resource / Capability | Guest (Anonymous) | Customer (`CUSTOMER`) | Cinema Staff (`STAFF`) | Executive Admin (`ADMIN`) |
| :--- | :---: | :---: | :---: | :---: |
| Browse Movies, Showtimes & Pricing | ✅ | ✅ | ✅ | ✅ |
| View Real-Time Seat Availability | ✅ | ✅ | ✅ | ✅ |
| Acquire Redis Atomic Seat Lock | ✅ | ✅ | ✅ | ✅ |
| 90-Second Guest Checkout | ✅ | ✅ | ✅ | ✅ |
| Customer Booking History & Profile | ❌ | ✅ | ✅ | ✅ |
| Cancel / Refund Own Unused Booking | ❌ | ✅ | ✅ | ✅ |
| Camera QR Scanner Turnstile Access | ❌ | ❌ | ✅ | ✅ |
| Manual Ticket ID Turnstile Override | ❌ | ❌ | ✅ | ✅ |
| Live Turnstile Scan Log & Stats | ❌ | ❌ | ✅ | ✅ |
| Create / Edit / Archive Movies | ❌ | ❌ | ❌ | ✅ |
| 2D Visual Seat & Hall Designer | ❌ | ❌ | ❌ | ✅ |
| Flag Broken / Damaged Seats | ❌ | ❌ | ❌ | ✅ |
| Showtime Scheduler & Hall Conflict Resolver | ❌ | ❌ | ❌ | ✅ |
| Revenue, Occupancy & Daily Metrics | ❌ | ❌ | ❌ | ✅ |
| User Role Elevation (`STAFF` / `ADMIN`) | ❌ | ❌ | ❌ | ✅ |
| Real-Time Security Audit & Anomaly Logs | ❌ | ❌ | ❌ | ✅ |

---

## 🌟 Platform Features & Operational Portals

### 1. Customer Booking Studio & 90s Guest Checkout
* **Dynamic Cinema Loader:** Custom-branded CinePath animated bear mascot loader with real-time feedback for seat generation.
* **Interactive 2D Seat Map:** High-precision SVG seat grid rendering VIP, Couple, Wheelchair, and Standard categories with price deltas.
* **Broken-Seat Real-Time Protection:** Physically damaged seats are styled with warning icons, non-clickable, and blocked from selection.
* **Floating Live Cart:** Multi-seat counter, category breakdown, promo code redemption, and real-time countdown timer.
* **Dual Checkout Pipelines:** Seamless Stripe checkout for registered members or zero-friction 90-second guest checkout.

### 2. Admin Management & Operations Portal
* Located at `/admin` (enforced by `ADMIN` role):
  * **Executive Metrics Dashboard:** Daily Gross Revenue, Active Bookings, Total Movies, and Multiplex Seat Count.
  * **Movie Manager:** Live TMDB API integration + manual form editor for posters, synopses, trailers, and release windows.
  * **2D Hall & Seat Layout Designer:** Interactive visual grid editor. Click any seat to cycle between `ACTIVE`, `BROKEN` (damaged physical seat), or `AISLE` (walkway gap). Live seat capacity auto-recalculation.
  * **Showtime Scheduler:** Hall-conflict detection algorithm prevents double-booking a physical hall across overlapping time windows.
  * **User & Role Directory:** Instant elevation/demotion of accounts across `CUSTOMER`, `STAFF`, and `ADMIN`.
  * **Security Audit Trail:** Real-time log inspector with search, pagination, and color-coded severity badges (`INFO`, `WARN`, `CRITICAL`).

### 3. Staff Turnstile & Gatekeeper Hub
* Located at `/staff/validate` (accessible by `STAFF` and `ADMIN`):
  * **High-Speed Camera Scanner:** Instant QR code and barcode recognition via `jsQR` with torch/flash toggle.
  * **Acoustic & Haptic Feedback:** High-frequency success chime on entrance, low-frequency buzz warning on duplicates or tampered codes.
  * **Manual Ticket Lookup:** Numeric ticket ID search and one-click manual admission override for damaged screens.
  * **Gate Activity Stream:** Real-time chronological audit of admitted guests, ticket references, and timestamps.

### 4. Vector PDF Ticketing & Digital Wallets
* **Instant Vector PDF Generation:** Client-side vector ticket download rendered using `jspdf` and `html2canvas` with print-ready cinema barcode styling.
* **Google Wallet Compatible:** Pre-structured pass payload for Apple Wallet and Google Wallet integration.

---

## 🔌 REST API Reference

### Public & Customer Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/movies` | Fetch all active movies with genres and ratings | None |
| `GET` | `/api/movies/:slug` | Fetch single movie details, trailers, and showtimes | None |
| `GET` | `/api/showtimes/:id/seats` | Real-time seat grid with pricing, broken flags, and locks | None |
| `POST` | `/api/showtimes/:id/lock-seats` | Atomically hold seats for 10 minutes via Redis Lua | None |
| `POST` | `/api/bookings` | Finalize booking, generate tickets, and record payment | Optional |
| `GET` | `/api/bookings/:id` | Fetch booking confirmation and signed digital tickets | Optional |
| `POST` | `/api/webhooks/stripe` | Stripe payment reconciliation webhook | Stripe Sig |

### Authentication & Identity Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user account with hashed password | None |
| `POST` | `/api/auth/login` | Authenticate user, issue HTTP-only JWT cookie | None |
| `GET` | `/api/auth/me` | Retrieve currently authenticated user and active role | Cookie |
| `POST` | `/api/auth/logout` | Revoke session cookie | Cookie |

### Staff Gatekeeper Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/tickets/validate` | Cryptographically verify QR ticket and admit guest | `STAFF` / `ADMIN` |
| `GET` | `/api/staff/tickets` | Query ticket details and turnstile history | `STAFF` / `ADMIN` |

### Admin Operations Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/admin/metrics` | Retrieve revenue, bookings count, and system totals | `ADMIN` |
| `POST` | `/api/admin/movies` | Create new movie entry | `ADMIN` |
| `PATCH` | `/api/admin/movies/:id` | Update movie details or status | `ADMIN` |
| `GET` | `/api/admin/halls` | List all cinema halls with capacity and dimensions | `ADMIN` |
| `PATCH` | `/api/admin/halls/:id/seats` | Batch update physical seat map (active, broken, aisle) | `ADMIN` |
| `POST` | `/api/admin/showtimes` | Schedule showtime with overlap conflict validation | `ADMIN` |
| `GET` | `/api/admin/users` | List users with role filter and search | `ADMIN` |
| `PATCH` | `/api/admin/users` | Elevate or modify user role (`CUSTOMER`, `STAFF`, `ADMIN`) | `ADMIN` |
| `GET` | `/api/admin/logs` | Query immutable security audit logs with severity filters | `ADMIN` |

---

## 📁 Project File Structure

```
cinepath/
├── .github/                       # CI/CD Workflows & Issue Templates
├── certificates/                  # SSL/TLS localhost development certs
├── logo/                          # Vector & PNG branding assets
│   ├── CinePath_Bear_Black_Icon.png
│   ├── CinePath_Bear_Full_Logo.png
│   ├── CinePath_Bear_Full_Logo_II.png
│   ├── CinePath_Bear_White_Full_Logo.png
│   └── CinePath_Bear_White_Icon.png
├── prisma/
│   ├── schema.prisma              # Comprehensive PostgreSQL relational schema
│   └── seed.js                    # Database seeder (cinemas, halls, movies, seats)
├── public/                        # Static web assets and PWA manifests
│   ├── logo/                      # Web-accessible brand assets
│   └── icons/                     # PWA home screen icons
├── scripts/
│   ├── generate-cert.js           # Self-signed local SSL certificate generator
│   └── test-rbac-system.ts        # End-to-end automated RBAC test suite
├── src/
│   ├── app/                       # Next.js 15 App Router directory
│   │   ├── admin/                 # Admin operations dashboard (6 live management tabs)
│   │   ├── api/                   # Serverless Route Handlers (Admin, Staff, Customer)
│   │   ├── auth/                  # Login, registration, and logout pages
│   │   ├── booking/               # 2D seat selector, timer, and checkout studio
│   │   ├── staff/validate/        # Staff QR turnstile scanner & manual lookup
│   │   ├── tickets/               # Post-booking confirmation & PDF downloader
│   │   ├── globals.css            # Tailwind directives & cinema design tokens
│   │   ├── layout.tsx             # Root layout with responsive navigation & toaster
│   │   └── page.tsx               # Homepage with dynamic hero billboard & filters
│   ├── components/                # Reusable UI component library
│   │   ├── admin/                 # Visual hall editor, metrics charts, audit viewer
│   │   ├── cinema/                # Seat map SVG, cinema loader, floating cart
│   │   ├── common/                # Modals, badges, navigation headers, footers
│   │   └── ticket/                # QR ticket card, barcode, printable ticket pass
│   ├── hooks/                     # Custom React hooks (useLockTimer, useAuth)
│   ├── lib/                       # Infrastructure singletons & services
│   │   ├── audit.ts               # Asynchronous audit log emitter
│   │   ├── auth.ts                # JWT token signing, verification & password hashing
│   │   ├── db-showtimes.ts        # Showtime & seat database helpers
│   │   ├── prisma.ts              # PrismaClient singleton with connection pooling
│   │   ├── redis.ts               # ioredis client with atomic Lua seat locking script
│   │   ├── utils.ts               # Tailwind class merging & formatting utilities
│   │   └── validations.ts         # Zod schemas for input validation
│   ├── middleware.ts              # Edge middleware for path protection & RBAC
│   └── types/                     # Shared TypeScript interfaces & enums
├── tests/
│   ├── api-test-suite.js          # REST API regression test suite
│   └── concurrency.test.js        # 10-user simultaneous seat lock stress test
├── docker-compose.yml             # PostgreSQL 16 + Redis 7 local stack
├── .env.example                   # Environment configuration template
├── package.json                   # Dependencies, build scripts & metadata
├── tailwind.config.ts             # Tailwind CSS tokens & dark theme palette
└── tsconfig.json                  # Strict TypeScript configuration
```

---

## ⚙️ Environment Variables Reference

Copy `.env.example` to `.env` in the project root:

```ini
# Application Environment
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# PostgreSQL Database (via Docker or Cloud Provider)
DATABASE_URL="postgresql://cinepath_user:cinepath_password@localhost:5432/cinepath_db?schema=public"

# Redis In-Memory Store (Atomic Locks & Caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cryptographic Authentication (Min 32 characters)
JWT_SECRET="super_secret_jwt_access_key_change_me_in_production_min32chars"
JWT_EXPIRES_IN="7d"

# QR Code Cryptographic Ticket Signature (HMAC-SHA256)
QR_SECRET="hmac_qr_signature_secret_key_change_me_min32chars"

# Stripe Payments (Test Mode API Keys)
STRIPE_SECRET_KEY="sk_test_placeholder"
STRIPE_WEBHOOK_SECRET="whsec_placeholder"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_placeholder"

# TMDB Movie Database API (Optional: free key from themoviedb.org)
TMDB_API_KEY=""
```

---

## 🚀 Quick Start & Local Deployment

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/abdellah-agrm/CinePath.git
cd CinePath
npm install
```

### Step 2: Spin Up Infrastructure Containers
Start local PostgreSQL 16 and Redis 7 with persistent volumes:
```bash
docker compose up -d
```

### Step 3: Initialize Database Schema & Seed Data
```bash
# Push Prisma schema to PostgreSQL & generate client
npm run db:push

# Seed sample cinemas, halls, seats, movies, and default admin/staff accounts
npm run db:seed
```

### Step 4: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!TIP]
> **Default Test Credentials (from `db:seed`):**
> * **Admin:** `admin@cinepath.com` | Password: `AdminPassword123!`
> * **Staff:** `staff@cinepath.com` | Password: `StaffPassword123!`
> * **Customer:** `customer@cinepath.com` | Password: `CustomerPassword123!`

---

## 🧪 Testing & Concurrency Verification

### 1. Automated RBAC Security & Broken Seat Test
Tests role elevation, unauthorized route rejection, broken seat protection, and audit logging:
```bash
npx tsx scripts/test-rbac-system.ts
```
Expected output:
```text
=== STEP 1: Setting up Test Showtimes & Broken Seats ===
[OK] Seat C1 status set to: BROKEN
=== STEP 2: Customer Broken Seat Protection ===
[OK] Customer blocked from locking broken seat: 400 Bad Request
=== STEP 3: Customer Valid Seat Lock ===
[OK] Customer successfully locked seat C2
=== STEP 4: Staff Turnstile Access ===
[OK] Staff turnstile endpoint verified
=== STEP 5: Admin Operations & Role Elevation ===
[OK] Admin successfully updated seat status to BROKEN
=== STEP 6: Security Audit Log Verification ===
[OK] Audit logs successfully recorded operations
=== ALL RBAC & ANOMALY TESTS PASSED (11/11) ===
```

### 2. High-Concurrency Race Condition Stress Test
Simulates 10 concurrent HTTP clients attempting to lock the exact same seats within the same millisecond:
```bash
npm run test:concurrency
```
Expected output:
```text
Simulating 10 concurrent customers locking seats [C9, C10]...
-> User 1: 200 OK (Seats locked, token generated)
-> User 2: 409 Conflict (Seats already reserved)
-> User 3: 409 Conflict (Seats already reserved)
...
-> User 10: 409 Conflict (Seats already reserved)
Result: Exactly 1 customer succeeded. 9 customers safely rejected. Zero double-bookings.
```

---

## 🚢 Production Deployment & Security Hardening

When deploying CinePath to production environments (Vercel, AWS ECS, Railway, or VPS):

1. **Strict HTTPS & Secure Cookies:** Set `NODE_ENV=production` and ensure the application runs behind TLS. Next.js automatically sets `SameSite=Lax` and `Secure=true` on authentication cookies.
2. **PostgreSQL Connection Pooling:** For serverless deployments, enable PgBouncer or connection pooling via Supabase / Prisma Accelerate.
3. **Redis High Availability:** Deploy managed Redis (AWS ElastiCache, Upstash, or Redis Cloud) with automatic failover.
4. **Secret Isolation:** Store `JWT_SECRET`, `QR_SECRET`, and `STRIPE_SECRET_KEY` in environment secret managers; never commit `.env` to source control.
5. **Turnstile Camera HTTPS:** Modern mobile browsers require a secure HTTPS context (`navigator.mediaDevices.getUserMedia`) to access the camera on staff devices. Run `npm run cert:generate` followed by `npm run dev:https` for local mobile testing.

---

## 📄 Author & License

Architected & developed with ❤️ by [**Abdellah Agourram**](https://github.com/abdellah-agrm).  
Licensed under the [MIT License](LICENSE).
