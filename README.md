# 🎬 CinePath - Cinema Booking Web Platform

A modern, high-performance cinema booking platform with real-time seat locking, atomic transactions, digital QR tickets, and guest checkout.

---

## 🚀 Quick Start (Just 3 Simple Commands)

### 1. Install dependencies
```bash
npm install
```

### 2. (Optional) Start Database & Redis via Docker
```bash
docker compose up -d
```

### 3. Initialize Database & Run Development Server
```bash
# Push schema to PostgreSQL & generate Prisma Client
npm run db:push

# (Optional) Seed demo movies, halls, seats, and showtimes
npm run db:seed

# Launch Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
cinepath/
├── prisma/
│   ├── schema.prisma         # PostgreSQL schema (Movies, Showtimes, Seats, Bookings, Tickets)
│   └── seed.js               # Sample data seeder
├── src/
│   ├── app/
│   │   ├── api/              # Route Handlers (/api/movies, /api/showtimes/.../seats, /api/.../lock-seats)
│   │   ├── booking/          # Interactive seat map & single-page checkout
│   │   ├── tickets/          # Digital ticket confirmation with HMAC-signed QR
│   │   ├── globals.css       # Tailwind & cinema dark theme tokens
│   │   ├── layout.tsx        # Navigation & shell
│   │   └── page.tsx          # Home page (Hero, filters, movie catalog)
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── redis.ts          # Redis client with atomic Lua seat locking script
│   │   ├── validations.ts    # Zod schemas for input validation
│   │   └── utils.ts          # Formatting & class merging
│   └── types/                # TypeScript shared interfaces & enums
├── docker-compose.yml        # PostgreSQL 16 + Redis 7 containers
├── .env.example              # Config template
└── package.json
```

---

## 🌟 Key Features Built-in

1. **Atomic Multi-Seat Locking (Redis Lua):**
   * Seats are atomically locked with a 10-minute visible countdown and a 12-minute backend buffer to prevent double-booking.
2. **PostgreSQL Relational Safety:**
   * Prevents double-booking via constraints while allowing cancelled or refunded seats to be re-booked.
3. **90-Second Guest Checkout:**
   * No mandatory account creation; customers can enter an email, pay, and receive instant digital tickets.
4. **HMAC-Signed QR Code E-Tickets:**
   * Tamper-proof digital tickets with instant display and PDF download.

