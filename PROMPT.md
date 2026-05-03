# 🎓 English Learning Platform - Senior Developer Prompt

**Project Status:** MVP (Production-Ready)  
**Last Updated:** 2026-05-03  
**Scope:** English exam practice platform with adaptive learning

---

## 📋 TABLE OF CONTENTS
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [System Architecture](#system-architecture)
5. [Core Algorithms](#core-algorithms)
6. [API Endpoints](#api-endpoints)
7. [User Flows](#user-flows)
8. [Implementation Steps](#implementation-steps)
9. [File Structure](#file-structure)
10. [Key Features & Logic](#key-features--logic)

---

## 🎯 PROJECT OVERVIEW

### Vision
Build a production-ready English exam practice web app with:
- 210 curated questions (120 vocab, 90 grammar) from provided data
- Adaptive learning system that adjusts difficulty based on user performance
- Real-time progress dashboard with error analysis
- Multiple exam formats (fixed papers + random generation)

### MVP Features
- **Practice Mode**: Filter by skill (vocab/grammar), get adaptive question sets
- **Exam Mode**: 50Q/60min exams (fixed from file or randomly generated)
- **Error Classification**: Auto-classify why user missed (vocab/logic/hasty_read/misunderstood)
- **Dashboard**: Real-time accuracy tracking, skill breakdown, error distribution
- **Adaptive Recommendations**: After 3 consecutive fails on a skill, recommend focused practice

### Success Metrics
- Accuracy improvement (Δ score)
- Error repetition rate ↓
- Time per question optimization

---

## 🛠 TECH STACK

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui (for components)
- **State Management**: React Context API
- **Build/Deploy**: Vercel
- **Real-time**: React hooks for dashboard updates

### Backend
- **Framework**: Next.js API Routes (full-stack)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Simple JWT + session storage
- **ORM**: Supabase client (pg-js)
- **Validation**: Zod for API schemas

### Database
- **Provider**: Supabase (PostgreSQL)
- **Free Tier**: Sufficient for MVP
- **Real-time Subscriptions**: Use Supabase realtime for dashboard updates

### Hosting
- **FE + BE**: Vercel (automatic deployment on git push)
- **DB**: Supabase cloud

---

## 🗄 DATABASE SCHEMA

### Tables

#### 1. `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `questions`
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  answer VARCHAR(1) NOT NULL,  -- A, B, C, D
  options JSONB NOT NULL,  -- {A: "...", B: "...", C: "...", D: "..."}
  skill VARCHAR(50) NOT NULL,  -- 'vocab', 'grammar'
  difficulty VARCHAR(20) NOT NULL,  -- 'easy', 'medium', 'hard'
  topic VARCHAR(100),  -- 'IT Security', 'Software', etc
  explanation TEXT,
  source VARCHAR(20) NOT NULL,  -- 'file', 'generated'
  exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,  -- if part of fixed exam
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_skill ON questions(skill);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
```

#### 3. `exams`
```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,  -- "Exam 1", "Exam 2", etc
  question_ids UUID[] NOT NULL,  -- array of question IDs
  total_questions INT DEFAULT 50,
  time_limit INT DEFAULT 60,  -- minutes
  source VARCHAR(20) NOT NULL,  -- 'file', 'random'
  difficulty_distribution JSONB,  -- {vocab_easy: 0.2, vocab_medium: 0.3, ...}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. `attempts` (user's test sessions)
```sql
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id),
  question_attempts JSONB NOT NULL,  -- array of answers
  total_time INT NOT NULL,  -- seconds
  total_accuracy FLOAT NOT NULL,  -- 0-100 %
  skill_breakdown JSONB NOT NULL,  -- {vocab: 85, grammar: 75}
  error_distribution JSONB NOT NULL,  -- {vocab_missing: 30, logic: 40, ...}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Structure of question_attempts:
-- [
--   {
--     question_id: UUID,
--     user_answer: "A",
--     correct_answer: "B",
--     is_correct: false,
--     time_spent: 45,  -- seconds
--     error_type: "vocab_missing",
--     skipped: false
--   }
-- ]

CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_exam_id ON attempts(exam_id);
```

#### 5. `user_stats` (denormalized for dashboard)
```sql
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_accuracy JSONB NOT NULL,  -- {vocab: 85, grammar: 75}
  weak_skills JSONB,  -- ["grammar_tense"]
  total_questions_done INT DEFAULT 0,
  last_exam_date TIMESTAMP,
  accuracy_trend JSONB,  -- [70, 72, 75, 80] -- last 4 attempts
  error_distribution JSONB,  -- {vocab_missing: 30, logic: 40, ...}
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
```

#### 6. `practice_recommendations`
```sql
CREATE TABLE practice_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommended_skill VARCHAR(50) NOT NULL,  -- 'grammar', 'vocab'
  recommended_count INT DEFAULT 20,
  reason TEXT,  -- "accuracy < 80% on past 3 attempts"
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'completed', 'skipped'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);
```

---

## 🏗 SYSTEM ARCHITECTURE

### High-Level Flow
```
┌─────────────────────────────────────────────────────┐
│              Next.js Full-Stack App                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Frontend (React)                                   │
│  ├─ Pages: /auth/login, /dashboard, /practice, /exam
│  ├─ Components: QuestionCard, Dashboard, Timer      │
│  └─ Context: UserContext, ExamContext              │
│         ▲                                            │
│         │ (API calls)                               │
│         ▼                                            │
│  Backend (Next.js API Routes)                       │
│  ├─ /api/auth/* (login, register)                  │
│  ├─ /api/exams/* (get exams, generate)             │
│  ├─ /api/questions/* (get questions)               │
│  ├─ /api/attempts/* (submit attempt)               │
│  └─ /api/stats/* (get user stats)                  │
│         ▲                                            │
│         │                                            │
│         ▼                                            │
│  Supabase PostgreSQL                                │
│  └─ All tables & real-time subscriptions           │
└─────────────────────────────────────────────────────┘
```

### Request Flow Example (Exam Submission)
```
1. User clicks "Submit Exam"
   ↓
2. Frontend collects all answers → /api/attempts (POST)
   ↓
3. Backend:
   a. Validates submission
   b. Calculates accuracy per question
   c. Classifies errors (error_type)
   d. Aggregates skill breakdown
   e. Updates user_stats
   f. Generates adaptive recommendation (if needed)
   ↓
4. Backend returns result JSON
   ↓
5. Frontend displays Results screen
```

---

## 🧠 CORE ALGORITHMS

### 1. Error Classification Engine

```typescript
type ErrorType = 
  | 'vocab_missing' 
  | 'logic_error' 
  | 'hasty_read' 
  | 'misunderstood' 
  | 'unknown';

function classifyError(
  question: Question,
  userAnswer: string,
  correctAnswer: string
): ErrorType {
  
  // Rule 1: If vocab question → likely vocab_missing
  if (question.skill === 'vocab') {
    return 'vocab_missing';
  }
  
  // Rule 2: If grammar question with wrong tense/form → logic_error
  if (question.skill === 'grammar') {
    if (userAnswer !== correctAnswer && userAnswer in question.options) {
      return 'logic_error';
    }
  }
  
  // Rule 3: Pattern detection (optional for MVP)
  // - If user answered too quickly (<5s) → hasty_read
  // - If option is structurally similar → misunderstood
  
  return 'unknown';
}
```

### 2. Adaptive Question Generation

```typescript
async function generateAdaptivePracticeSet(
  userId: UUID,
  setSize: number = 20
): Promise<Question[]> {
  
  // Step 1: Get user stats
  const userStats = await db.table('user_stats').where({user_id: userId}).single();
  
  // Step 2: Identify weakest skill
  const skillAccuracy = userStats.skill_accuracy;  // {vocab: 85, grammar: 73}
  const weakestSkill = Object.entries(skillAccuracy)
    .sort(([, a], [, b]) => a - b)[0][0];  // 'grammar'
  
  // Step 3: Build adaptive set
  const adaptiveQuestions: Question[] = [];
  
  // 70% weak skill (mostly medium/hard)
  const weakSkillQuestions = await db.table('questions')
    .where({
      skill: weakestSkill,
      difficulty: {in: ['medium', 'hard']},
      source: 'generated'  // avoid repeated file questions
    })
    .order('RANDOM()')
    .limit(Math.ceil(setSize * 0.7));
  
  adaptiveQuestions.push(...weakSkillQuestions);
  
  // 30% other skills (to maintain balance)
  const otherSkillQuestions = await db.table('questions')
    .where({
      skill: {neq: weakestSkill},
      difficulty: {in: ['easy', 'medium']},
      source: 'generated'
    })
    .order('RANDOM()')
    .limit(Math.floor(setSize * 0.3));
  
  adaptiveQuestions.push(...otherSkillQuestions);
  
  // Step 4: Shuffle and return
  return adaptiveQuestions.sort(() => Math.random() - 0.5);
}
```

### 3. Exam Generation (Fixed vs Random)

```typescript
async function generateExam(
  examType: 'fixed' | 'random',
  userId?: UUID
): Promise<Exam> {
  
  if (examType === 'fixed') {
    // Return pre-created exam from file (4 total)
    const fixedExams = await db.table('exams')
      .where({source: 'file'})
      .select('*');
    
    return fixedExams[Math.floor(Math.random() * fixedExams.length)];
  }
  
  if (examType === 'random') {
    // Generate 50Q with balanced distribution
    const vocabQuestions = await db.table('questions')
      .where({
        skill: 'vocab',
        source: 'generated'
      })
      .order('RANDOM()')
      .limit(20);
    
    const grammarQuestions = await db.table('questions')
      .where({
        skill: 'grammar',
        source: 'generated'
      })
      .order('RANDOM()')
      .limit(30);
    
    const allQuestions = [...vocabQuestions, ...grammarQuestions]
      .sort(() => Math.random() - 0.5);
    
    // Create exam record
    const exam = await db.table('exams').insert({
      name: `Random Exam - ${new Date().toISOString()}`,
      question_ids: allQuestions.map(q => q.id),
      source: 'random',
      total_questions: 50,
      time_limit: 60
    });
    
    return exam;
  }
}
```

### 4. Result Calculation & Stats Update

```typescript
async function submitExamAttempt(
  userId: UUID,
  examId: UUID,
  answers: {question_id: UUID, answer: string, time_spent: number}[]
): Promise<{accuracy: number, breakdown: any}> {
  
  // Step 1: Get exam & questions
  const exam = await db.table('exams').where({id: examId}).single();
  const questions = await db.table('questions')
    .where({id: {in: exam.question_ids}});
  
  // Step 2: Grade each answer
  let correctCount = 0;
  const questionAttempts = answers.map(answer => {
    const question = questions.find(q => q.id === answer.question_id);
    const isCorrect = answer.answer === question.answer;
    
    if (isCorrect) correctCount++;
    
    return {
      question_id: answer.question_id,
      user_answer: answer.answer,
      correct_answer: question.answer,
      is_correct: isCorrect,
      time_spent: answer.time_spent,
      error_type: isCorrect ? null : classifyError(question, answer.answer, question.answer),
      skipped: !answer.answer
    };
  });
  
  // Step 3: Calculate accuracy
  const totalAccuracy = (correctCount / answers.length) * 100;
  
  // Step 4: Breakdown by skill
  const skillBreakdown = {};
  const errorDist = {vocab_missing: 0, logic_error: 0, hasty_read: 0, misunderstood: 0, unknown: 0};
  
  for (const attempt of questionAttempts) {
    const q = questions.find(x => x.id === attempt.question_id);
    
    // Accumulate skill accuracy
    if (!skillBreakdown[q.skill]) {
      skillBreakdown[q.skill] = {correct: 0, total: 0};
    }
    skillBreakdown[q.skill].total++;
    if (attempt.is_correct) skillBreakdown[q.skill].correct++;
    
    // Accumulate error distribution
    if (attempt.error_type) {
      errorDist[attempt.error_type]++;
    }
  }
  
  // Convert to percentages
  const skillAccuracy = {};
  for (const [skill, data] of Object.entries(skillBreakdown)) {
    skillAccuracy[skill] = (data.correct / data.total) * 100;
  }
  
  // Step 5: Save attempt record
  const attempt = await db.table('attempts').insert({
    user_id: userId,
    exam_id: examId,
    question_attempts: questionAttempts,
    total_time: answers.reduce((sum, a) => sum + a.time_spent, 0),
    total_accuracy: totalAccuracy,
    skill_breakdown: skillAccuracy,
    error_distribution: errorDist
  });
  
  // Step 6: Update user_stats
  await updateUserStats(userId, attempt);
  
  // Step 7: Check for adaptive recommendation trigger
  if (totalAccuracy < 80) {
    await generateAdaptiveRecommendation(userId, skillAccuracy);
  }
  
  return {accuracy: totalAccuracy, breakdown: skillAccuracy};
}

async function updateUserStats(userId: UUID, latestAttempt: Attempt) {
  const stats = await db.table('user_stats')
    .where({user_id: userId})
    .single();
  
  // Update trend (keep last 4)
  const trend = [...(stats.accuracy_trend || []), latestAttempt.total_accuracy];
  if (trend.length > 4) trend.shift();
  
  // Recalculate skill accuracy (weighted average)
  const newSkillAccuracy = {...stats.skill_accuracy};
  for (const [skill, accuracy] of Object.entries(latestAttempt.skill_breakdown)) {
    newSkillAccuracy[skill] = (newSkillAccuracy[skill] + accuracy) / 2;  // Simple average
  }
  
  // Update error distribution
  const errorDist = stats.error_distribution || {};
  for (const [error, count] of Object.entries(latestAttempt.error_distribution)) {
    errorDist[error] = (errorDist[error] || 0) + count;
  }
  
  await db.table('user_stats').where({user_id: userId}).update({
    skill_accuracy: newSkillAccuracy,
    accuracy_trend: trend,
    error_distribution: errorDist,
    total_questions_done: (stats.total_questions_done || 0) + latestAttempt.question_attempts.length,
    last_exam_date: new Date()
  });
}

async function generateAdaptiveRecommendation(userId: UUID, skillAccuracy: any) {
  // Find weakest skill
  const weakestSkill = Object.entries(skillAccuracy)
    .sort(([, a], [, b]) => a - b)[0][0];
  
  // Create recommendation
  await db.table('practice_recommendations').insert({
    user_id: userId,
    recommended_skill: weakestSkill,
    recommended_count: 20,
    reason: `Accuracy ${skillAccuracy[weakestSkill].toFixed(1)}% on ${weakestSkill} - below 80% threshold`
  });
}
```

---

## 📡 API ENDPOINTS

### Authentication

#### POST `/api/auth/register`
```typescript
// Request
{
  username: string
  password: string
  email?: string
}

// Response
{
  success: boolean
  user_id: UUID
  message: string
}
```

#### POST `/api/auth/login`
```typescript
// Request
{
  username: string
  password: string
}

// Response
{
  success: boolean
  token: string
  user: {id: UUID, username: string}
}
```

### Questions

#### GET `/api/questions`
```typescript
// Query params
?skill=vocab&difficulty=medium&limit=20

// Response
{
  questions: Question[]
  total: number
}
```

### Exams

#### GET `/api/exams`
```typescript
// Response
{
  fixed_exams: Exam[]
  user_exams: Exam[]  // random exams user created
}
```

#### GET `/api/exams/:exam_id`
```typescript
// Response
{
  exam: Exam (with full question objects)
}
```

#### POST `/api/exams/generate`
```typescript
// Request
{
  type: 'random'  // or 'fixed'
}

// Response
{
  exam: Exam
}
```

### Attempts (Submissions)

#### POST `/api/attempts`
```typescript
// Request
{
  exam_id: UUID
  answers: [
    {question_id: UUID, answer: string, time_spent: number}
  ]
}

// Response
{
  attempt_id: UUID
  accuracy: number
  skill_breakdown: {skill: percentage}
  error_distribution: {error_type: count}
  recommendation?: {skill: string, reason: string}
}
```

#### GET `/api/attempts/:attempt_id`
```typescript
// Response
{
  attempt: Attempt (full details with explanations)
}
```

#### GET `/api/attempts/user/:user_id`
```typescript
// Response
{
  attempts: Attempt[]
}
```

### Stats

#### GET `/api/stats/user`
```typescript
// Response
{
  stats: UserStats
}
```

#### GET `/api/stats/recommendation`
```typescript
// Response
{
  recommendation?: PracticeRecommendation
}
```

---

## 👥 USER FLOWS

### Flow 1: First-Time User Registration & Dashboard
```
1. User lands on /
   → See landing page with "Login" / "Register" buttons
   
2. Click "Register"
   → Redirect to /auth/register
   
3. Fill form:
   - Username
   - Password
   - (Optional) Email
   
4. Click "Register"
   → API: POST /api/auth/register
   → Validate input
   → Hash password
   → Create user in DB
   → Return JWT token
   
5. Auto-redirect to /dashboard
   → Display welcome message
   → Show 0 stats initially
   → Offer "Start Practice" or "Start Exam"
```

### Flow 2: Practice Mode
```
1. User on /dashboard → Click "Practice"
   → Redirect to /practice
   
2. Show skill selector:
   - [Vocabulary] [Grammar]
   
3. User selects "Vocabulary"
   → Show difficulty options (optional):
     - Easy | Medium | Hard
   
4. Click "Start"
   → API: POST /api/questions?skill=vocab&limit=20
   → Generate adaptive set or random based on user_stats
   → Start timer
   
5. Question display loop:
   ┌─────────────────────────┐
   │ Q1/20    ⏱️ 18:45        │
   ├─────────────────────────┤
   │ [Question text]         │
   │ A. [ ] option1          │
   │ B. [ ] option2          │
   │ C. [ ] option3          │
   │ D. [ ] option4          │
   │                         │
   │ [Skip] [Flag] [Submit]  │
   └─────────────────────────┘
   
6. User selects answer → Click "Submit"
   → Check if correct
   → Show: "Correct! ✓" or "Wrong ✗"
   → Show explanation
   
7. If wrong, show error classification prompt:
   "Why did you miss this?"
   □ Didn't know vocab
   □ Logic/reasoning error
   □ Rushed/didn't read
   □ Misunderstood question
   
   → User selects (saves to local state)
   
8. Click "Next"
   → Load next question
   
9. Repeat 6-8 until 20 questions done
   
10. Results screen:
    ┌──────────────────────────────┐
    │ PRACTICE COMPLETE            │
    ├──────────────────────────────┤
    │ Accuracy: 85%                │
    │ Time: 12:34                  │
    │                              │
    │ Skill breakdown:             │
    │ - Vocabulary: 85%            │
    │                              │
    │ Top errors:                  │
    │ - Logic error: 40%           │
    │ - Vocab missing: 60%         │
    │                              │
    │ Recommendation:              │
    │ "Continue with Grammar (20Q)"│
    │                              │
    │ [Practice More] [Dashboard]  │
    └──────────────────────────────┘
    
11. Click "Dashboard"
    → Return to /dashboard
    → Stats updated
```

### Flow 3: Exam Mode
```
1. User on /dashboard → Click "Exam"
   → Redirect to /exam-select
   
2. Show exam options:
   - [Exam 1 - Fixed from File] [Exam 2 - Fixed] [Exam 3] [Exam 4]
   - Or [Random Exam]
   
3. User selects "Exam 1"
   → API: GET /api/exams/exam1 (or POST /api/exams/generate?type=random)
   → Load 50 questions
   → Start 60-minute timer
   
4. Exam interface:
   ┌──────────────────────────────┐
   │ EXAM MODE     ⏱️ 47:32        │
   ├──────────────────────────────┤
   │ Q5/50    Progress: ████░░    │
   │                              │
   │ [Question]                   │
   │ A. [ ] B. [ ] C. [ ] D. [ ]  │
   │                              │
   │ [Flag] [Previous] [Next]     │
   │ [Review Flagged] [Submit]    │
   └──────────────────────────────┘
   
5. User answers questions:
   - Can flag for review
   - Can navigate back/forth
   - Cannot change answer once submitted (per Q)
   
6. When timer hits 0:
   → Auto-submit
   
7. Submit button clicked:
   → API: POST /api/attempts
   → Calculate results
   → Generate adaptive recommendation if needed
   
8. Results page:
   ┌────────────────────────────────┐
   │ EXAM RESULTS                   │
   ├────────────────────────────────┤
   │ Final Score: 78% (39/50)       │
   │ Time: 58:45                    │
   │                                │
   │ SKILL BREAKDOWN:               │
   │ - Vocabulary: 85% (17/20)      │
   │ - Grammar: 73% (22/30)         │
   │                                │
   │ ERROR ANALYSIS:                │
   │ - Vocab missing: 35% 🔴        │
   │ - Logic error: 40% 🔴          │
   │ - Hasty reading: 15% 🟡        │
   │ - Misunderstood: 10% 🟢        │
   │                                │
   │ WEAKEST AREA:                  │
   │ → Grammar (73% accuracy)       │
   │                                │
   │ NEXT STEPS:                    │
   │ [Practice Grammar] [Review]    │
   │ [Retake Exam] [Dashboard]      │
   └────────────────────────────────┘
   
9. Click "Review"
   → Show all Q with user answers + explanations
   
10. Click "Retake Exam"
    → If fixed exam: same 50Q again
    → If random: generate new 50Q
```

---

## 🚀 IMPLEMENTATION STEPS

### Phase 1: Setup & DB (Day 1-2)
- [ ] Create Next.js app: `npx create-next-app@latest`
- [ ] Install dependencies: Supabase, TailwindCSS, Zod, JWT
- [ ] Setup Supabase project
- [ ] Create all 6 tables (schema in DB section)
- [ ] Seed 210 questions from provided file
- [ ] Create 4 fixed exams from file
- [ ] Generate 100+ random practice questions

### Phase 2: Auth & Core Infrastructure (Day 2-3)
- [ ] Build `/api/auth/register` endpoint
- [ ] Build `/api/auth/login` endpoint
- [ ] Create JWT middleware
- [ ] Setup React Context for user auth
- [ ] Create Login page (`/auth/login`)
- [ ] Create Register page (`/auth/register`)
- [ ] Add layout with navbar (logo, user menu, logout)

### Phase 3: Dashboard & Stats (Day 3)
- [ ] Build `/api/stats/user` endpoint
- [ ] Create Dashboard component
- [ ] Display skill accuracy chart
- [ ] Display error distribution chart
- [ ] Show recent attempts list
- [ ] Add real-time update with Supabase subscriptions

### Phase 4: Practice Mode (Day 4)
- [ ] Build `/api/questions` endpoint (filtered queries)
- [ ] Create Practice Mode page (`/practice`)
- [ ] Build QuestionCard component
- [ ] Implement timer logic
- [ ] Build error classification UI
- [ ] Implement local state management for answers
- [ ] Create Practice Results screen
- [ ] Add adaptive algorithm logic

### Phase 5: Exam Mode (Day 5)
- [ ] Build `/api/exams` endpoints
- [ ] Build `/api/exams/generate` endpoint
- [ ] Create Exam Select page (`/exam-select`)
- [ ] Create Exam Interface component
- [ ] Implement 60-minute timer (auto-submit on end)
- [ ] Build exam flag & review system
- [ ] Create Exam Results screen (detailed breakdown)
- [ ] Build `/api/attempts` submit endpoint

### Phase 6: Adaptive Learning (Day 5-6)
- [ ] Implement `generateAdaptivePracticeSet()` algorithm
- [ ] Build recommendation generation logic
- [ ] Create `/api/stats/recommendation` endpoint
- [ ] Display recommendations on dashboard
- [ ] Test adaptive accuracy

### Phase 7: Styling & UX (Day 6)
- [ ] Design color scheme (navy, coral, lotus)
- [ ] Setup TailwindCSS config
- [ ] Build reusable components (Button, Card, Input)
- [ ] Apply responsive design (mobile-first)
- [ ] Add animations (fade-in, slide, progress bar)
- [ ] Test on desktop & mobile

### Phase 8: Testing & Deployment (Day 7)
- [ ] Manual testing of all flows
- [ ] Test error scenarios
- [ ] Performance optimization
- [ ] Deploy to Vercel
- [ ] Setup environment variables
- [ ] Test on production

---

## 📁 FILE STRUCTURE

```
project-root/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   ├── auth/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx
│   ├── practice/page.tsx
│   ├── exam-select/page.tsx
│   ├── exam/[exam_id]/page.tsx
│   ├── results/[attempt_id]/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   └── login/route.ts
│       ├── questions/route.ts
│       ├── exams/
│       │   ├── route.ts
│       │   ├── [exam_id]/route.ts
│       │   └── generate/route.ts
│       ├── attempts/
│       │   ├── route.ts
│       │   ├── [attempt_id]/route.ts
│       │   └── submit/route.ts
│       └── stats/
│           ├── user/route.ts
│           └── recommendation/route.ts
├── components/
│   ├── shared/
│   │   ├── Navbar.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── practice/
│   │   ├── QuestionCard.tsx
│   │   ├── ErrorClassifier.tsx
│   │   └── PracticeResults.tsx
│   ├── exam/
│   │   ├── ExamInterface.tsx
│   │   ├── Timer.tsx
│   │   └── ExamResults.tsx
│   └── dashboard/
│       ├── StatsOverview.tsx
│       ├── SkillChart.tsx
│       └── ErrorChart.tsx
├── context/
│   ├── AuthContext.tsx
│   ├── ExamContext.tsx
│   └── UserContext.tsx
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── jwt.ts                    # JWT utilities
│   ├── algorithms.ts             # Core algorithms
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Helper functions
├── styles/
│   └── globals.css               # TailwindCSS
├── .env.local                     # Environment variables
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🎮 KEY FEATURES & LOGIC

### Feature 1: Question Randomization
- **Fixed Exams**: Always same 50Q in same order (from file)
- **Random Exams**: New 50Q each time, balanced skill distribution
- **Practice Sets**: Generated adaptively based on user performance

### Feature 2: Error Classification
- **Auto-detection**: System suggests error type based on question type
- **User confirmation**: User selects from 4 options (vocab/logic/hasty_read/misunderstood)
- **Aggregation**: Error counts stored in `error_distribution` JSONB

### Feature 3: Adaptive Learning
- **Threshold**: If accuracy < 80% on a skill → generate recommendation
- **Composition**: 70% weak skill + 30% other skills
- **Difficulty**: Mostly medium/hard for weak skills
- **Trigger**: After 3 consecutive fails (MVP simplification)

### Feature 4: Real-Time Dashboard
- **Update on**: Every exam completion
- **Metrics shown**:
  - Overall accuracy (trending)
  - Skill breakdown (accuracy %)
  - Error distribution (pie chart)
  - Recent attempts (list)
- **Real-time**: Supabase subscriptions for live updates

### Feature 5: Mastery System
- **Mastery Threshold**: 90% accuracy on a skill
- **Action**: When mastered, show "Skill Mastered! 🎉" badge
- **Next**: Recommend practicing weak skills

### Feature 6: Answer Review
- **During Exam**: Can flag questions, review flagged before submit
- **After Exam**: Full review with explanations
- **Retake**: Can retake fixed exams (same Q) or random (new Q)

---

## ⚙️ TECHNICAL NOTES

### Performance Optimization
- Use `SQL indexes` on frequently queried columns (skill, difficulty, user_id)
- Cache user_stats to avoid recalculating on every request
- Implement pagination for attempt lists (show last 10)

### Security
- Hash passwords using `bcryptjs`
- Use JWT with short expiry (1 hour)
- Validate all API inputs with Zod
- Use Supabase Row-Level Security (RLS) for data isolation

### Scalability
- Database design supports 1M+ users easily
- Stateless API (can scale horizontally)
- Consider Redis cache for frequently accessed data (future)

### Testing
- Unit tests for algorithms (error classification, adaptive generation)
- E2E tests for user flows (register → practice → exam)
- Manual testing of all UI flows

---

## 📝 NOTES FOR AI/DEV

1. **Token Conservation**: This prompt is self-contained. Break implementation into phases.
2. **Data Seeding**: Parse provided Excel file (210 questions) → JSON → seed DB
3. **Color Scheme**: Navy (#0f172a), Coral (#ff6b6b), Lotus White (#f5f5f5)
4. **Responsive**: Desktop-first, optimize for mobile (flex layout)
5. **Error Handling**: Show user-friendly error messages (not stack traces)
6. **Deployment**: GitHub push → Vercel auto-deploys. Set env vars on Vercel dashboard.

---

**Project Ready for Senior Dev Execution** ✅

