# English Learning Platform - Setup Guide

Project status: product-grade learning MVP.

Implemented:

- Next.js 14 App Router setup
- JWT auth with register/login pages
- Dashboard with stats, recent attempts, skill chart, and error chart
- Practice mode with normal, weakness, and wrong-only adaptive sessions
- Exam select with fixed and random exams
- Exam interface with timer, navigation, flags, submit, results, and full review
- Supabase API routes for auth, adaptive questions, single answers, exam submit, stats, history
- Learning engine tables: `answers`, `user_skill_stats`, `wrong_questions`
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

If you already ran the old MVP schema, run `database.sql` again. It is written to add the new learning-engine columns/tables without dropping existing data.

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
2. Go to Practice and choose Normal, Weakness, or Wrong-only.
3. Answer with mouse or keys `1`-`4`.
4. Read the explanation before moving to the next question.
5. Take an exam and review wrong answers after submit.
6. Check Dashboard for weakest skill and next action.

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
