# Render Deployment Guide

NightGuard is architected for continuous multi-service deployment on Render using the included `render.yaml` Blueprint.

---

## Architecture Services Deployed on Render

1. **`nightguard-api`** (Web Service):
   - REST API and persistent WebSocket server (`/ws/dashboard` and `/ws/router`).
   - Handles client authentication, router pairing, and event dispatch.
2. **`nightguard-web`** (Web Service):
   - Next.js 14 frontend dashboard with server-side and client-side rendering.
3. **`nightguard-worker`** (Background Worker):
   - Persistent policy reconciliation and scheduling worker.
4. **`nightguard-postgres`** (Managed PostgreSQL):
   - Production relational database managed by Prisma ORM.

---

## Step-by-Step Deployment Instructions

1. **Push to GitHub**:
   Ensure the latest code is pushed to your GitHub repository `nightguard`.

2. **Connect to Render**:
   - Log into [Render Dashboard](https://dashboard.render.com).
   - Click **New +** -> **Blueprint**.
   - Select your `nightguard` GitHub repository.

3. **Verify Blueprint Settings**:
   - Render will detect `render.yaml`.
   - Confirm the creation of `nightguard-postgres`, `nightguard-api`, `nightguard-web`, and `nightguard-worker`.

4. **Environment Variables**:
   - Render automatically provisions `DATABASE_URL`, `JWT_SECRET`, and `ENCRYPTION_KEY` based on the blueprint.
   - Set `NEXT_PUBLIC_API_URL` to your API service URL (e.g. `https://nightguard-api.onrender.com`).
   - Set `NEXT_PUBLIC_WS_URL` to your API WebSocket URL (e.g. `wss://nightguard-api.onrender.com`).

5. **Run Migrations & Seed**:
   Prisma migrations run automatically as part of the `startCommand`:
   ```sh
   npm run migrate --workspace=@nightguard/database
   ```
   To seed initial demo accounts:
   ```sh
   npm run seed --workspace=@nightguard/database
   ```

6. **Post-Deployment Verification**:
   - Check `https://nightguard-api.onrender.com/api/health` -> Status: `UP`.
   - Open `https://nightguard-web.onrender.com` -> View dashboard.
