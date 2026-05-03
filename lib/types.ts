// Type definitions for the entire app

export type ErrorType =
  | 'vocab_missing'
  | 'logic_error'
  | 'hasty_read'
  | 'misunderstood'
  | 'unknown';

export interface User {
  id: string;
  username: string;
  email?: string;
  created_at: string;
}

export interface Question {
  id: string;
  question_text: string;
  text?: string;
  answer: string; // A, B, C, D
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  skill: 'vocab' | 'grammar';
  difficulty: 'easy' | 'medium' | 'hard';
  difficulty_score?: number;
  topic?: string;
  explanation: string;
  source: 'file' | 'generated';
  exam_id?: string;
  created_at: string;
}

export interface Exam {
  id: string;
  name: string;
  question_ids: string[];
  total_questions: number;
  time_limit: number; // minutes
  source: 'file' | 'random';
  difficulty_distribution?: Record<string, number>;
  created_at: string;
}

export interface QuestionAttempt {
  question_id: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  time_spent: number; // seconds
  error_type?: ErrorType;
  skipped: boolean;
}

export interface Attempt {
  id: string;
  user_id: string;
  exam_id: string;
  question_attempts: QuestionAttempt[];
  total_time: number; // seconds
  total_accuracy: number; // 0-100
  score?: number;
  skill_breakdown: Record<string, number>; // {vocab: 85, grammar: 75}
  error_distribution: Record<ErrorType, number>;
  created_at: string;
}

export interface AnswerRecord {
  id: string;
  attempt_id: string;
  question_id: string;
  selected: string;
  correct: boolean;
  created_at: string;
}

export interface UserSkillStat {
  user_id: string;
  skill: string;
  correct_count: number;
  wrong_count: number;
  last_updated: string;
}

export interface WrongQuestion {
  user_id: string;
  question_id: string;
  wrong_count: number;
  last_seen: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  skill_accuracy: Record<string, number>; // {vocab: 85, grammar: 75}
  weak_skills?: string[];
  total_questions_done: number;
  last_exam_date?: string;
  accuracy_trend?: number[]; // [70, 72, 75, 80]
  error_distribution?: Record<ErrorType, number>;
  updated_at: string;
}

export interface PracticeRecommendation {
  id: string;
  user_id: string;
  recommended_skill: string;
  recommended_count: number;
  reason: string;
  status: 'active' | 'completed' | 'skipped';
  created_at: string;
  completed_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthPayload {
  username: string;
  password: string;
  email?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}
