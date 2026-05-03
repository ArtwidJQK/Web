# 🎓 English Learning Platform - Setup & Build Guide

## ✅ COMPLETED FILES

I've generated the following files for your project:

### Core Configuration
- ✅ `package.json` - All dependencies
- ✅ `.env.local.example` - Environment template
- ✅ `tailwind.config.ts` - Tailwind CSS
- ✅ `next.config.js` - Next.js config
- ✅ `app/globals.css` - Global styles
- ✅ `app/layout.tsx` - Root layout

### Database
- ✅ `database.sql` - Complete schema (6 tables)
- ✅ `lib/types.ts` - TypeScript types

### Backend (API Routes)
- ✅ `app/api/auth/register/route.ts` - Register endpoint
- ✅ `app/api/auth/login/route.ts` - Login endpoint
- ✅ `app/api/questions/route.ts` - Fetch questions
- ✅ `app/api/exams/route.ts` - Get exams
- ✅ `app/api/exams/generate/route.ts` - Generate random exam
- ✅ `app/api/exams/[exam_id]/route.ts` - Get exam details
- ✅ `app/api/attempts/route.ts` - Submit exam + calculate results
- ✅ `app/api/stats/user/route.ts` - Get user stats

### Utilities
- ✅ `lib/supabase.ts` - Supabase client
- ✅ `lib/jwt.ts` - JWT auth utils
- ✅ `PROMPT.md` - Complete senior dev prompt

---

## 🚀 QUICK START (5 steps)

### Step 1: Local Setup
```bash
# Create Next.js project locally
npm create next-app@latest english-learn --typescript --tailwind --eslint -y

cd english-learn

# Install additional dependencies
npm install @supabase/supabase-js zod bcryptjs jsonwebtoken
```

### Step 2: Copy Generated Files
Copy all generated files from this directory into your local project:
```
english-learn/
├── package.json (REPLACE)
├── next.config.js (ADD)
├── tailwind.config.ts (REPLACE)
├── app/
│   ├── layout.tsx (REPLACE)
│   ├── globals.css (ADD)
│   └── api/
│       ├── auth/
│       ├── questions/
│       ├── exams/
│       ├── attempts/
│       └── stats/
└── lib/
    ├── types.ts (ADD)
    ├── supabase.ts (ADD)
    └── jwt.ts (ADD)
```

### Step 3: Setup Supabase
1. **Create account**: https://supabase.com
2. **Create new project**
3. **Run SQL schema**: In Supabase SQL editor, copy-paste contents of `database.sql`
4. **Get credentials**: 
   - `NEXT_PUBLIC_SUPABASE_URL` (Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API)

### Step 4: Setup Environment
Create `.env.local` in project root:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_random_secret_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Seed Database
Create `scripts/seed.ts` with question data from provided Excel file, then run:
```bash
npm run seed
```

---

## 📝 REMAINING COMPONENTS TO BUILD

Due to token limits, I've provided core API routes. You need to create:

### Pages (Frontend)
```
app/
├── page.tsx                 # Landing page
├── auth/
│   ├── login/page.tsx      # Login form
│   └── register/page.tsx   # Register form
├── dashboard/page.tsx      # Main dashboard + stats
├── practice/page.tsx       # Practice mode
├── exam-select/page.tsx    # Choose exam
└── exam/[exam_id]/page.tsx # Exam interface
```

### Components
```
components/
├── shared/
│   ├── Navbar.tsx          # Top navigation
│   ├── Button.tsx          # Reusable button
│   ├── Card.tsx            # Card wrapper
│   └── Input.tsx           # Form input
├── practice/
│   ├── QuestionCard.tsx    # Question display
│   ├── ErrorClassifier.tsx # Error type selector
│   └── PracticeResults.tsx # Results screen
├── exam/
│   ├── ExamInterface.tsx   # Exam UI
│   ├── Timer.tsx           # Countdown timer
│   └── ExamResults.tsx     # Detailed results
└── dashboard/
    ├── StatsOverview.tsx   # Overview cards
    ├── SkillChart.tsx      # Accuracy chart
    └── ErrorChart.tsx      # Error distribution
```

### Context
```
context/
├── AuthContext.tsx         # User auth state
├── ExamContext.tsx         # Exam session state
└── UserContext.tsx         # User profile/stats
```

---

## 🎯 BUILD ROADMAP (to complete)

### Frontend Pages (Easy)
1. **`page.tsx`** - Landing page with Login/Register links
2. **`auth/login/page.tsx`** - Login form (call `/api/auth/login`)
3. **`auth/register/page.tsx`** - Register form (call `/api/auth/register`)
4. **`dashboard/page.tsx`** - Display stats from `/api/stats/user`

### Exam/Practice (Medium)
5. **`practice/page.tsx`** - Skill selector + fetch questions from `/api/questions`
6. **`exam-select/page.tsx`** - Show exams from `/api/exams`
7. **`exam/[exam_id]/page.tsx`** - 60-min timer + question carousel + submit to `/api/attempts`

### Components (Medium)
8. **Navbar** - User menu, logout button
9. **QuestionCard** - Display MCQ with options
10. **Timer** - Countdown timer with auto-submit
11. **Charts** - Accuracy & error distribution charts

### Data Seeding (Medium)
12. **Seed Script** - Parse Excel file → JSON → insert 210 questions into DB

---

## 📊 DATA SEEDING

Your question file has ~210 questions. Create `scripts/seed.ts`:

```typescript
import { supabaseServiceRole as supabase } from '@/lib/supabase';

const questions = [
  {
    question_text: "Choose the right word which matches...",
    answer: "D",
    options: {A: "trial version", B: "shareware", C: "professional version", D: "home-use version"},
    skill: "vocab",
    difficulty: "medium",
    explanation: "A home-use version is...",
    source: "file"
  },
  // ... 209 more from your Excel
];

// Insert questions
await supabase.from('questions').insert(questions);

// Create 4 fixed exams (50Q each)
for (let i = 0; i < 4; i++) {
  const examQuestions = questions.slice(i * 50, (i + 1) * 50).map(q => q.id);
  await supabase.from('exams').insert({
    name: `Exam ${i + 1}`,
    question_ids: examQuestions,
    source: 'file'
  });
}
```

---

## 🔑 KEY IMPLEMENTATION NOTES

### Auth Flow
```
1. User registers → /api/auth/register
   → Password hashed + saved
   → JWT token returned
   
2. Store token in localStorage
   
3. For protected routes:
   - Send token in Authorization header: "Bearer {token}"
   - Backend verifies with verifyToken()
```

### Practice Flow
```
1. GET /api/questions?skill=vocab&limit=20
2. Display questions one by one
3. User answers all 20
4. POST /api/attempts with answers
5. Show results screen
```

### Exam Flow
```
1. GET /api/exams (show list)
2. User selects exam
3. GET /api/exams/{exam_id} (get 50 questions)
4. Timer starts (60 min)
5. User answers all
6. POST /api/attempts (auto or manual submit)
7. Show detailed results
```

---

## 🎨 STYLING GUIDE

Use TailwindCSS with custom colors:
- **Navy**: `#0f172a` (dark background)
- **Navy Light**: `#1e293b` (cards)
- **Coral**: `#ff6b6b` (primary, buttons)
- **Lotus**: `#f5f5f5` (light text)

Example component:
```tsx
export default function Button({ children }) {
  return (
    <button className="bg-coral hover:bg-coral-light text-white font-semibold py-2 px-4 rounded transition-colors">
      {children}
    </button>
  );
}
```

---

## 🚢 DEPLOYMENT

### Vercel (Recommended)
```bash
# Push to GitHub
git push origin main

# Deploy to Vercel
# 1. Visit vercel.com → Import project from GitHub
# 2. Add env variables
# 3. Click Deploy
```

### Environment Variables on Vercel
In Vercel dashboard Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

---

## ✅ CHECKLIST TO SHIP

- [ ] All files copied locally
- [ ] Supabase project created + DB schema run
- [ ] Environment variables set
- [ ] `npm install` successful
- [ ] Questions seeded (210 total)
- [ ] Auth pages working (register/login)
- [ ] Dashboard page built
- [ ] Practice mode working
- [ ] Exam mode working with timer
- [ ] Results calculation working
- [ ] Deployed to Vercel
- [ ] Tested full flow end-to-end

---

## 🆘 TROUBLESHOOTING

**Questions table empty?**
→ Run seed script with your question data

**Login fails?**
→ Check JWT secret matches .env.local

**Supabase connection error?**
→ Verify NEXT_PUBLIC_SUPABASE_URL and ANON_KEY

**Timer not working?**
→ Use `useEffect` with `setInterval` for countdown

**Styling broken?**
→ Verify tailwind.config.ts has correct content paths

---

**Ready to build? Start with Step 1 above! 🚀**
Questions? Check `PROMPT.md` for full architecture reference.
