# SkillLoom Deployment Guide

This guide covers deploying SkillLoom (Frontend + Backend + MySQL Database).

---

## 1. Architecture Overview

- **Frontend (`client/`)**: React 19 + TypeScript + Vite + Tailwind CSS.
- **Backend (`server/`)**: Node.js (ESM) + Express + Prisma ORM + MariaDB adapter.
- **Database**: MySQL 8.0+ / MariaDB.
- **Email Service**: Resend (API key & verified sender).

---

## 2. Option A: Cloud Deployment (Recommended)

### A. Deploy Database (Railway / Aiven / TiDB / Clever Cloud)
1. Create a MySQL database instance on [Railway](https://railway.app), [Aiven](https://aiven.io), or [TiDB Cloud](https://tidbcloud.com).
2. Import the initial schema and data using `skillloom_db_backup.sql` or run Prisma migrations:
   ```bash
   npx prisma db push
   ```
3. Copy your production database connection URL:
   `mysql://user:password@host:port/skillloom_db`

---

### B. Deploy Backend (`server/`) to Render or Railway
1. **Create Web Service** pointing to the repository.
2. Set the **Root Directory** to `server`.
3. Set **Build Command**:
   ```bash
   npm install && npm run build
   ```
4. Set **Start Command**:
   ```bash
   npm start
   ```
5. Configure Environment Variables in the service settings:
   - `PORT`: `5550` (or leave default assigned by provider)
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `mysql://user:password@host:port/skillloom_db`
   - `JWT_SECRET`: `<your-random-64-character-secret>`
   - `JWT_EXPIRES_IN`: `7d`
   - `RESEND_API_KEY`: `re_...`
   - `MAIL_FROM`: `onboarding@resend.dev` (or your verified domain)
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app`
   - `FRONTEND_URL`: `https://your-frontend-app.vercel.app`
6. Deploy and copy your backend URL (e.g., `https://skillloom-api.onrender.com`).

---

### C. Deploy Frontend (`client/`) to Vercel or Netlify
1. **Create Project** in [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
2. Set **Root Directory** to `client`.
3. Set **Build Command**: `npm run build`
4. Set **Output Directory**: `dist`
5. Configure Environment Variables:
   - `VITE_API_URL`: `https://skillloom-api.onrender.com/api`
6. Deploy!
   - Single Page Application (SPA) routing is pre-configured via `vercel.json` and `public/_redirects` to handle routes like `/dashboard/*` and `/verify-email` on page refresh.

---

## 3. Local Verification & Running

### Running Backend Locally
```bash
cd server
npm install
npm run test:db    # Test database connectivity
npm test           # Run 34 integration tests
npm run dev        # Run server with hot reloading
```

### Running Frontend Locally
```bash
cd client
npm install
npm run lint       # Run ESLint (0 errors, 0 warnings)
npm run build      # Test production build
npm run dev        # Run Vite dev server
```
