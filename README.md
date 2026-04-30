# VetFlow — Surgical Day Tracker

Mobile-first web app for veterinary mobile surgery practices. Tracks the full surgical day: HQ departure → clinic visits → surgery cases → HQ return, with auto-calculated metrics.

## Stack

- **Next.js 15** (App Router, Server Actions)
- **TypeScript**
- **Tailwind CSS**
- **Prisma ORM** + **PostgreSQL** (Supabase)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Go to **Settings → Database → Connection string → URI**.
3. Copy the connection string.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and paste your Supabase connection string:

```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 4. Push the database schema

```bash
npm run db:push
```

### 5. Seed with example data (optional)

```bash
npm run db:seed
```

This creates 3 surgeons, 2 surgical days, 2 clinics, and 4 surgery cases.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Key Concepts

### Turnaround Time
Defined as **end-of-suture → ready-for-next-surgery** on the same case.  
This represents cleanup/patient recovery time between the end of one surgery and the team being ready to proceed.

### Setup Time (between cases)
**Previous case's ready time → next case's incision start.**  
Displayed between surgeries on the timeline as "Setup: Xm".

### Clinic Departure (auto-sync)
When you save a surgery case with a **Ready Time**, the app automatically syncs the clinic visit's **Ready to Leave** time if that case is the last one at the clinic. You can override it manually in the clinic edit form.

### Drive Legs
Calculated automatically:
- **HQ → Clinic 1**: HQ departure → clinic 1 arrival
- **Clinic N → Clinic N+1**: clinic N ready-to-leave → clinic N+1 arrival
- **Last Clinic → HQ**: last clinic ready-to-leave → HQ return arrival

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — all surgical days |
| `/days/new` | Create new surgical day |
| `/days/[id]` | Day detail with summary + timeline |
| `/days/[id]/edit` | Edit day info |
| `/days/[id]/clinics/new` | Add clinic visit |
| `/days/[id]/clinics/[id]/edit` | Edit clinic visit |
| `/days/[id]/clinics/[id]/surgeries/new` | Add surgery case |
| `/days/[id]/clinics/[id]/surgeries/[id]/edit` | Edit surgery case |
| `/settings/surgeons` | Add / edit / remove surgeons |

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run db:push      # Sync schema to database
npm run db:seed      # Load example data
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:generate  # Regenerate Prisma client
```

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import it into [vercel.com](https://vercel.com).
3. Add the `DATABASE_URL` environment variable in Vercel project settings.
4. Deploy.

> **Note:** For production, use Supabase's **connection pooling URL** (port 6543) for `DATABASE_URL` and add `?pgbouncer=true` to the end.
