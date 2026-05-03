# English Learning Platform - Setup Guide

Project status: functional MVP.

Implemented:

- Next.js 14 App Router setup
- JWT auth with register/login pages
- Dashboard with stats, recent attempts, skill chart, and error chart
- Practice mode with 20-question generated sessions
- Exam select with fixed and random exams
- Exam interface with timer, navigation, flags, submit, and results
- Supabase API routes for auth, questions, exams, attempts, stats, recommendation
- AVCN parser/seed script for `avcn.txt`

## 1. Install

Use `npm.cmd` on Windows PowerShell if `npm` is blocked by Execution Policy.

```powershell
npm.cmd install
```

## 2. Configure Supabase

Create `.env.local`:

```powershell
Copy-Item .env.local.example .env.local
```

Fill:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_random_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Open Supabase SQL Editor and run `database.sql`.

## 3. Seed Data

Preview parser output:

```powershell
npm.cmd run seed:dry
```

Seed questions and fixed exams:

```powershell
npm.cmd run seed
```

If you intentionally want to wipe app question/exam/attempt data and reseed:

```powershell
npm.cmd run seed -- --reset
```

The current `avcn.txt` parses to 240 questions: 120 vocab and 120 grammar.

## 4. Run Locally

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`.

Flow:

1. Register.
2. Go to Practice or Exam.
3. Submit answers.
4. Check Dashboard stats.

## 5. Verify

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd audit
```

`npm audit` currently reports vulnerabilities in the Next 14 dependency chain. `npm audit fix --force` jumps to Next 16 and should be treated as a separate upgrade.

## 6. Publish

Recommended path:

1. Push project to GitHub.
2. Import into Vercel.
3. Add production environment variables in Vercel.
4. Run `database.sql` in Supabase production project.
5. Run seed locally against production Supabase, or run it once from a trusted environment.
6. Deploy.

Vercel build command:

```bash
npm run build
```
