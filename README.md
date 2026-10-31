# NightGuard — Wi-Fi-Based Digital Wellbeing & Device Access Management

[![Render Deployment Ready](https://img.shields.io/badge/Render-Blueprint%20Ready-46E3B7.svg)](https://render.com)
[![TypeScript 5.4](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![OpenWrt Compatible](https://img.shields.io/badge/OpenWrt-21.02%20%7C%2022.03%20%7C%2023.05+-00B0FF.svg)](https://openwrt.org/)

NightGuard is a hardware-free, router-native digital wellbeing and access scheduling platform. It allows administrators to automate internet access restrictions for specific devices connected to their Wi-Fi network according to sleep or focus schedules—without requiring an additional Raspberry Pi, mini-PC, physical gateway, or custom dongle.

---

## Key Features

- **Automated Bedtime & Sleep Scheduling**: Define schedules (e.g., 10:00 PM to 7:00 AM) that automatically restrict internet access at night and restore it in the morning.
- **Midnight-Crossing Support**: Seamlessly handles schedules that cross midnight, ensuring correct enforcement across multiple calendar days.
- **Individual Device Management**: Selectively toggle management ON/OFF per device. Unmanaged devices are strictly excluded from all restrictions.
- **Outbound-Only Router Architecture**: Compatible routers connect securely outbound to the cloud. No public IP address or insecure port forwarding required.
- **Kernel-Level Enforcement**: Utilizes OpenWrt `firewall4` and Linux kernel `nftables` sets for atomic, zero-overhead packet filtering.
- **Independent Backend Engine**: Policies and schedules run autonomously on the server using BullMQ/PostgreSQL, completely independent of whether a browser tab is open.
- **Real-Time Live Updates**: Dashboard streams live device discoveries, router status updates, and restriction states over WebSockets.
- **Safety Emergency Override**: Immediate one-click failsafe clears all router firewall rules instantly.
- **Dual Router Modes**: Supports both physical OpenWrt routers and an integrated virtual router simulator for testing without hardware.

---

## Project Structure

```
nightguard/
├── apps/
│   ├── web/                     # Next.js 14 App Router, Tailwind CSS, Dark Graphite UI
│   ├── api/                     # Node.js REST API + WebSocket Server
│   └── worker/                  # Dedicated background BullMQ policy worker
├── packages/
│   ├── database/                # Prisma ORM schema (PostgreSQL & SQLite), migrations, seed script
│   ├── shared/                  # Common TypeScript interfaces, DTOs, Zod validation schemas
│   ├── router-adapters/         # Modular adapter system (OpenWrt & Virtual Simulator)
│   ├── scheduler/               # Scheduling engine, midnight calculation math, policy evaluator
│   └── security/                # AES-256-GCM encryption, bcrypt hashing, JWT auth, HMAC signatures
├── router-software/
│   └── openwrt/                 # Lightweight outbound shell agent, procd service, installer
├── tests/
│   ├── unit/                    # Unit tests (Time calculations, policy engine, encryption, adapters)
│   └── integration/             # REST API integration tests (Auth, pairing, overrides)
├── docs/                        # Complete technical architecture, security, API & deployment guides
├── render.yaml                  # Render Blueprint definition (Web, API, Worker, Postgres, Redis)
└── .env.example                 # Environment variables template
```

---

## Quickstart & Local Development

### 1. Prerequisites
- **Node.js**: v20 or v22+
- **Git**

### 2. Installation
```sh
# Clone repository
git clone https://github.com/Panth-Patel/nightguard.git
cd nightguard

# Install dependencies across all workspaces
npm install
```

### 3. Initialize Database & Seed Demo Data
```sh
# Generate Prisma Client
npm run db:generate

# Push schema and seed demo admin, network, devices & schedules
npm run db:seed
```

### 4. Run Development Servers
```sh
# Starts API (port 4000) and Web Dashboard (port 3000)
npm run dev:all
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Demo Admin Email**: `admin@nightguard.local`
- **Demo Password**: `AdminSecurePassword123!`
*(Or click "One-Click Quick Sign In" on the login screen)*

---

## Automated Testing

Run the test suite covering time window calculations, midnight crossing, policy evaluation, encryption roundtrips, simulator adapters, and API endpoints:

```sh
npm test
```

---

## Deploying to Render

NightGuard includes a production-ready `render.yaml` Blueprint.

1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint**.
3. Select your `nightguard` repository.
4. Render will automatically provision:
   - `nightguard-postgres` (Managed PostgreSQL)
   - `nightguard-api` (REST + WebSockets API on Render Web Service)
   - `nightguard-web` (Next.js 14 frontend)
   - `nightguard-worker` (Background policy reconciliation worker)
5. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to your API service domain.

---

## Router Compatibility & Pairing

NightGuard prioritizes **OpenWrt-compatible routers** (versions 21.02, 22.03, 23.05+) running `firewall4` backed by `nftables`.

To pair an OpenWrt router:
1. Open the dashboard -> **Networks & Routers** -> **Pair Router**.
2. Run the generated command on your router via SSH:
   ```sh
   sh <(curl -sSL https://api.nightguard.render.com/agent/install.sh) --token ng_pair_xxxx
   ```
3. The router initiates an outbound TLS WebSocket session and appears as **Online** on your dashboard.

For testing without physical hardware, select **Virtual Simulator** during router pairing.

---

## Technical Scope & Future Native Companion Apps

- **First Release**: Enforces router-level internet access restrictions via Linux kernel firewall rules.
- **Future Integration Modules**:
  - **Android**: Kotlin-based companion application utilizing Android Enterprise / Device Owner APIs.
  - **iOS**: Swift-based companion application utilizing Apple's `FamilyControls` and `ManagedSettings` frameworks.

---

## Implementation Status Checklist

- [x] Full-stack monorepo architecture (Next.js 14, Node.js API, BullMQ worker, Prisma ORM)
- [x] Hardware-free router integration (OpenWrt outbound-only agent & nftables kernel sets)
- [x] Virtual Router Simulator with simulated failures and network topologies
- [x] Persistent scheduling engine with midnight-crossing calculations and restart recovery
- [x] Device discovery, friendly renaming, and individual management toggles
- [x] Role-based authentication, password hashing, and session management
- [x] Real-time live dashboard updates via WebSockets
- [x] Safety emergency override and manual control actions
- [x] Comprehensive automated unit and integration tests
- [x] Render Blueprint (`render.yaml`) deployment configuration
- [x] Complete technical documentation in `docs/`

---

## License

MIT License. Copyright © 2026 Panth Patel.
