-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== TABLES ==========

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  answer VARCHAR(1) NOT NULL,  -- A, B, C, D
  options JSONB NOT NULL,  -- {A: "...", B: "...", C: "...", D: "..."}
  skill VARCHAR(50) NOT NULL,  -- 'vocab', 'grammar'
  difficulty VARCHAR(20) NOT NULL,  -- 'easy', 'medium', 'hard'
  topic VARCHAR(100),
  explanation TEXT,
  source VARCHAR(20) NOT NULL,  -- 'file', 'generated'
  exam_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams table
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  question_ids UUID[] NOT NULL,
  total_questions INT DEFAULT 50,
  time_limit INT DEFAULT 60,  -- minutes
  source VARCHAR(20) NOT NULL,  -- 'file', 'random'
  difficulty_distribution JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attempts table (user test sessions)
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id),
  question_attempts JSONB NOT NULL,  -- array of answers
  total_time INT NOT NULL,  -- seconds
  total_accuracy FLOAT NOT NULL,  -- 0-100
  skill_breakdown JSONB NOT NULL,  -- {vocab: 85, grammar: 75}
  error_distribution JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User stats (denormalized for dashboard)
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_accuracy JSONB NOT NULL,  -- {vocab: 85, grammar: 75}
  weak_skills JSONB,
  total_questions_done INT DEFAULT 0,
  last_exam_date TIMESTAMP,
  accuracy_trend JSONB,  -- [70, 72, 75, 80]
  error_distribution JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Practice recommendations
CREATE TABLE practice_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommended_skill VARCHAR(50) NOT NULL,
  recommended_count INT DEFAULT 20,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- ========== INDEXES ==========

CREATE INDEX idx_questions_skill ON questions(skill);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_exam_id ON attempts(exam_id);
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_practice_recs_user_id ON practice_recommendations(user_id);
