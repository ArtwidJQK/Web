# AVCN English Learning Platform

Next.js 14 learning platform for practicing the AVCN vocabulary and grammar question bank.

Current product-grade additions:

- Adaptive practice modes: normal, weakness, wrong-only
- Single-answer feedback loop: answer -> explanation -> next
- Exam submit with persisted attempt, answer rows, and full review
- Learning tables: `answers`, `user_skill_stats`, `wrong_questions`
- Restrained dark design system built for low cognitive load

## Local Setup

```powershell
npm.cmd install
Copy-Item .env.local.example .env.local
```

Fill `.env.local` with Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=change_me
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run `database.sql` in Supabase SQL Editor, then seed the questions. If you already ran an older MVP schema, run `database.sql` again; it includes additive migrations for the learning engine tables.

```powershell
npm.cmd run seed:dry
npm.cmd run seed
```

If you need to reseed:

```powershell
npm.cmd run seed -- --reset
```

## Development

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`.

Main flows:

- Register or login.
- Dashboard shows recent performance, weakest skill, wrong questions, and next action.
- Practice supports normal, weakness, and wrong-only sessions.
- Exam Select opens fixed exams from `avcn.txt` or generates a random exam.
- Exam results include full review, wrong-answer highlight, and explanation.

## Verification

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd audit
```

`npm audit` currently reports vulnerabilities from the Next 14 dependency chain. The non-breaking `npm audit fix` does not resolve them; `npm audit fix --force` upgrades to Next 16, which should be handled as a separate framework upgrade.

## Publish To Vercel

1. Push this folder to GitHub.
2. Import the repository in Vercel.
3. Set the same environment variables from `.env.local`.
4. Keep Supabase `database.sql` and `npm.cmd run seed` completed before testing production flows.
5. Deploy, then set `NEXT_PUBLIC_APP_URL` to the production URL.

Build command: `npm run build`

Output: Next.js default
