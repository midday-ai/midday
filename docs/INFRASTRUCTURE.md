# Understanding Abacus Infrastructure

This document explains the relationship between all the deployment systems in your Abacus project.

---

## The Big Picture

Your Abacus project is a **monorepo** (multiple apps in one codebase) with a **hybrid cloud architecture**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR MONOREPO                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  dashboard  │  │   website   │  │     api     │  │   worker   │ │
│  │  (Next.js)  │  │  (Next.js)  │  │   (Hono)    │  │  (BullMQ)  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
└─────────┼────────────────┼────────────────┼───────────────┼────────┘
          │                │                │               │
          ▼                ▼                ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌────────────┐   ┌────────────┐
    │  VERCEL  │    │  VERCEL  │    │   FLY.IO   │   │   FLY.IO   │
    │(Frontend)│    │(Marketing)│   │  (Backend) │   │  (Jobs)    │
    └──────────┘    └──────────┘    └─────┬──────┘   └─────┬──────┘
                                          │                │
                                          ▼                ▼
                                    ┌─────────────────────────┐
                                    │    UPSTASH / REDIS      │
                                    │   (Caching & Queues)    │
                                    └─────────────────────────┘
```

---

## What Each System Does

### 1. **Vercel** — Frontend Hosting
**What it is:** A platform optimized for hosting Next.js applications (React frontends)

**Your Vercel projects:**
| Project | Purpose | Domain |
|---------|---------|--------|
| **Dashboard** (`apps/dashboard`) | Main app users interact with | `app.midday.ai` |
| **Website** (`apps/website`) | Marketing/landing page | `midday.ai` |

**Why Vercel for these?**
- Next.js is made by Vercel, so it's perfectly optimized
- Automatic edge caching (fast globally)
- Serverless functions for API routes within the frontend
- Easy preview deployments for PRs

---

### 2. **Fly.io** — Backend Hosting
**What it is:** A platform for running Docker containers close to users

**Your Fly.io apps:**
| App | Purpose | Region |
|-----|---------|--------|
| **abacus-api** (`apps/api`) | REST API backend | N. Virginia (iad) |
| **midday-worker** (`apps/worker`) | Background job processor | Frankfurt (fra) |

**Why Fly.io instead of Vercel for backend?**
- **Long-running processes**: Vercel functions timeout at 30s, Fly.io containers run forever
- **Persistent connections**: WebSockets, Redis connections stay open
- **More control**: You specify exact CPU, RAM, regions
- **Better for Bun**: Fly.io runs any Docker container, including Bun runtime

---

### 3. **Docker** — Packaging for Fly.io
**What it is:** A way to package your app with all its dependencies into a "container"

**How it relates:**
```
Your Code → Dockerfile → Docker Image → Fly.io runs the image
```

**You have Dockerfiles for:**
- `apps/api/Dockerfile` — Packages the API for Fly.io
- `apps/worker/Dockerfile` — Packages the worker for Fly.io

**You DON'T use Docker for:**
- Dashboard (Vercel handles builds natively)
- Website (Vercel handles builds natively)
- Local development (you run `bun dev` directly)

---

### 4. **Redis / Upstash** — Caching & Job Queues
**What they are:**
- **Redis**: In-memory database for fast data access
- **Upstash**: Managed Redis with a REST API (edge-friendly)

**How you use them:**

| Use Case | Technology | Why |
|----------|------------|-----|
| **Job Queues** (BullMQ) | Redis on Fly.io | Workers pick up jobs from Redis queues |
| **Backend Caching** | Redis on Fly.io | Cache API responses, user sessions |
| **Edge/Client Caching** | Upstash REST API | Works from Vercel Edge Functions (no TCP) |

**The relationship:**
```
Dashboard (Vercel) ──REST──► Upstash (Edge caching)
                                    │
API (Fly.io) ───TCP────► Redis ◄────┘
                            │
Worker (Fly.io) ───TCP──────┘
```

---

## How Deployments Work

### GitHub Actions orchestrates everything:

```
Push to main branch
        │
        ▼
┌───────────────────────────────────────────────────┐
│              GitHub Actions Workflows             │
├───────────────────────────────────────────────────┤
│ Changed apps/dashboard/** ?                       │
│   → Build & Deploy to Vercel                      │
│                                                   │
│ Changed apps/website/** ?                         │
│   → Build & Deploy to Vercel                      │
│                                                   │
│ Changed apps/api/** ?                             │
│   → Build Docker image → Deploy to Fly.io        │
│                                                   │
│ Changed apps/worker/** ?                          │
│   → Build Docker image → Deploy to Fly.io        │
└───────────────────────────────────────────────────┘
```

---

## The Config Files Explained

| File | Purpose |
|------|---------|
| `vercel.json` (root) | Shared Vercel settings |
| `apps/dashboard/vercel.json` | Dashboard-specific Vercel config (regions, headers) |
| `apps/website/vercel.json` | Website-specific Vercel config |
| `apps/api/fly.toml` | Fly.io config for API (machine size, health checks) |
| `apps/worker/fly.toml` | Fly.io config for worker |
| `apps/api/Dockerfile` | How to build API container |
| `apps/worker/Dockerfile` | How to build worker container |
| `.github/workflows/*.yml` | CI/CD automation |

---

## Why This Architecture?

| Concern | Solution |
|---------|----------|
| **Fast frontend globally** | Vercel Edge Network |
| **Long-running API processes** | Fly.io containers |
| **Background jobs** | Fly.io + BullMQ + Redis |
| **Low-latency caching** | Redis (backend) + Upstash (edge) |
| **Easy deploys** | GitHub Actions + platform CLIs |

---

## Common Confusion Points

### "Why is there a `vercel.json` in `apps/api`?"
That's **legacy/unused**. The API used to be serverless on Vercel but was moved to Fly.io for better performance. The file remains but isn't used.

### "Do I need Docker locally?"
**No.** Docker is only used for Fly.io deployments. Locally you run:
```bash
bun dev  # Starts everything locally without Docker
```

### "What's the difference between Redis and Upstash?"
- **Redis** = The database technology (runs on a server)
- **Upstash** = A company that hosts Redis and provides a REST API
- You use **both**: Direct Redis connection from Fly.io, REST API from Vercel Edge

### "Why two different Vercel projects?"
Dashboard and Website have different:
- Domains (`app.` vs root)
- Build settings
- Environment variables
- Deploy triggers

---

## Summary Cheat Sheet

```
FRONTEND (React/Next.js)
  └── Vercel
      ├── Dashboard → app.midday.ai
      └── Website → midday.ai

BACKEND (Bun/Hono)
  └── Fly.io (via Docker)
      ├── API → api.midday.ai
      └── Worker → (internal)

DATA
  ├── Supabase → PostgreSQL database
  └── Redis/Upstash → Caching & job queues
```
