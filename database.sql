-- English Learning Platform product schema
-- Safe to run on a fresh database or over the MVP schema.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== CORE TABLES ==========

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  text TEXT,
  answer VARCHAR(1) NOT NULL,
  options JSONB NOT NULL,
  skill VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium',
  difficulty_score FLOAT DEFAULT 0.5 CHECK (difficulty_score >= 0 AND difficulty_score <= 1),
  topic VARCHAR(100),
  explanation TEXT,
  source VARCHAR(20) NOT NULL DEFAULT 'file',
  exam_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  question_ids UUID[] NOT NULL,
  total_questions INT DEFAULT 50,
  time_limit INT DEFAULT 60,
  source VARCHAR(20) NOT NULL,
  difficulty_distribution JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
  score FLOAT,
  question_attempts JSONB DEFAULT '[]'::jsonb,
  total_time INT DEFAULT 0,
  total_accuracy FLOAT DEFAULT 0,
  skill_breakdown JSONB DEFAULT '{}'::jsonb,
  error_distribution JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected VARCHAR(1),
  correct BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_skill_stats (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill VARCHAR(50) NOT NULL,
  correct_count INT DEFAULT 0,
  wrong_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, skill)
);

CREATE TABLE IF NOT EXISTS wrong_questions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  wrong_count INT DEFAULT 1,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, question_id)
);

-- MVP compatibility tables.
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_accuracy JSONB NOT NULL DEFAULT '{}'::jsonb,
  weak_skills JSONB,
  total_questions_done INT DEFAULT 0,
  last_exam_date TIMESTAMP,
  accuracy_trend JSONB,
  error_distribution JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practice_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommended_skill VARCHAR(50) NOT NULL,
  recommended_count INT DEFAULT 20,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- ========== MIGRATIONS FOR EXISTING MVP DBS ==========

ALTER TABLE questions ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty_score FLOAT DEFAULT 0.5;
ALTER TABLE questions ALTER COLUMN difficulty_score SET DEFAULT 0.5;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS score FLOAT;
ALTER TABLE attempts ALTER COLUMN exam_id DROP NOT NULL;
ALTER TABLE attempts ALTER COLUMN question_attempts SET DEFAULT '[]'::jsonb;
ALTER TABLE attempts ALTER COLUMN total_time SET DEFAULT 0;
ALTER TABLE attempts ALTER COLUMN total_accuracy SET DEFAULT 0;
ALTER TABLE attempts ALTER COLUMN skill_breakdown SET DEFAULT '{}'::jsonb;
ALTER TABLE attempts ALTER COLUMN error_distribution SET DEFAULT '{}'::jsonb;

UPDATE questions
SET
  text = COALESCE(text, question_text),
  difficulty_score = COALESCE(
    difficulty_score,
    CASE difficulty
      WHEN 'easy' THEN 0.25
      WHEN 'hard' THEN 0.8
      ELSE 0.5
    END
  );

UPDATE attempts
SET score = COALESCE(score, total_accuracy);

-- ========== INDEXES ==========

CREATE INDEX IF NOT EXISTS idx_questions_skill ON questions(skill);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty_score ON questions(difficulty_score);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_id ON attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_recs_user_id ON practice_recommendations(user_id);

-- ========== RLS BASELINE ==========
-- Current app routes use server-side service role, which bypasses RLS.
-- Policies are still defined so user-owned tables are safe when migrating to Supabase Auth.

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own attempts" ON attempts;
CREATE POLICY "Users read own attempts"
ON attempts FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own answers" ON answers;
CREATE POLICY "Users read own answers"
ON answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM attempts
    WHERE attempts.id = answers.attempt_id
      AND attempts.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users read own skill stats" ON user_skill_stats;
CREATE POLICY "Users read own skill stats"
ON user_skill_stats FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own wrong questions" ON wrong_questions;
CREATE POLICY "Users read own wrong questions"
ON wrong_questions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own recommendations" ON practice_recommendations;
CREATE POLICY "Users read own recommendations"
ON practice_recommendations FOR SELECT
USING (auth.uid() = user_id);
