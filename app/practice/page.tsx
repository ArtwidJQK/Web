'use client';

import { useEffect, useState } from 'react';
import { Play, SlidersHorizontal } from 'lucide-react';
import { RequireAuth } from '@/components/shared/RequireAuth';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { ErrorClassifier } from '@/components/practice/ErrorClassifier';
import { PracticeResults } from '@/components/practice/PracticeResults';
import { QuestionCard } from '@/components/practice/QuestionCard';
import { Timer } from '@/components/exam/Timer';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/client-api';
import { ErrorType, Exam, Question } from '@/lib/types';

type ExamDetail = {
  exam: Exam;
  questions: Question[];
};

type ResultPayload = {
  attempt_id: string;
  accuracy: number;
  skill_breakdown: Record<string, number>;
  error_distribution: Record<ErrorType, number>;
};

type SavedAnswer = {
  answer: string;
  time_spent: number;
  error_type?: ErrorType;
};

function PracticeContent() {
  const { token } = useAuth();
  const [skill, setSkill] = useState<'vocab' | 'grammar' | 'mixed'>('vocab');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [sessionStartedAt, setSessionStartedAt] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = questions[currentIndex];
  useEffect(() => {
    if (!questions.length || result) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [questions.length, result, sessionStartedAt]);

  function resetSession() {
    setQuestions([]);
    setExam(null);
    setCurrentIndex(0);
    setSelectedAnswer('');
    setRevealAnswer(false);
    setAnswers({});
    setQuestionStartedAt(Date.now());
    setSessionStartedAt(Date.now());
    setElapsedSeconds(0);
    setResult(null);
    setError('');
  }

  async function startPractice() {
    if (!token) return;
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const generatedExam = await apiRequest<Exam>('/api/exams/generate', {
        method: 'POST',
        token,
        body: JSON.stringify({
          type: 'practice',
          skill,
          difficulty,
          limit: 20,
        }),
      });

      const detail = await apiRequest<ExamDetail>(`/api/exams/${generatedExam.id}`, {
        token,
      });

      setExam(detail.exam);
      setQuestions(detail.questions);
      setCurrentIndex(0);
      setSelectedAnswer('');
      setRevealAnswer(false);
      setAnswers({});
      setQuestionStartedAt(Date.now());
      setSessionStartedAt(Date.now());
      setElapsedSeconds(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start practice');
    } finally {
      setIsLoading(false);
    }
  }

  async function submitPractice(nextAnswers: Record<string, SavedAnswer>) {
    if (!token || !exam) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<ResultPayload>('/api/attempts', {
        method: 'POST',
        token,
        body: JSON.stringify({
          exam_id: exam.id,
          answers: questions.map((question) => ({
            question_id: question.id,
            answer: nextAnswers[question.id]?.answer || '',
            time_spent: nextAnswers[question.id]?.time_spent || 0,
            error_type: nextAnswers[question.id]?.error_type,
          })),
        }),
      });
      setResult(data);
      setQuestions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit practice');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCheck() {
    if (!currentQuestion || !selectedAnswer) return;
    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
    const defaultErrorType: ErrorType =
      currentQuestion.skill === 'vocab' ? 'vocab_missing' : 'logic_error';

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: {
        answer: selectedAnswer,
        time_spent: timeSpent,
        error_type:
          selectedAnswer === currentQuestion.answer ? undefined : defaultErrorType,
      },
    }));
    setRevealAnswer(true);
  }

  function updateErrorType(errorType: ErrorType) {
    if (!currentQuestion) return;
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: {
        ...current[currentQuestion.id],
        answer: selectedAnswer,
        time_spent: current[currentQuestion.id]?.time_spent || 1,
        error_type: errorType,
      },
    }));
  }

  function handleNext() {
    if (currentIndex === questions.length - 1) {
      submitPractice(answers);
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextQuestion = questions[nextIndex];
    setCurrentIndex(nextIndex);
    setSelectedAnswer(answers[nextQuestion.id]?.answer || '');
    setRevealAnswer(false);
    setQuestionStartedAt(Date.now());
  }

  if (result) {
    return (
      <main className="container-main py-8">
        <PracticeResults
          accuracy={result.accuracy}
          errorDistribution={result.error_distribution}
          onRestart={resetSession}
          skillBreakdown={result.skill_breakdown}
          totalTime={elapsedSeconds}
        />
      </main>
    );
  }

  return (
    <main className="container-main grid gap-6 py-8">
      <div>
        <p className="text-sm font-semibold text-coral">Practice</p>
        <h1 className="mt-1 text-3xl font-bold text-white">Focused session</h1>
      </div>

      {error ? (
        <Card className="border-red-500/40 bg-red-500/10">
          <p className="text-sm font-semibold text-red-100">{error}</p>
        </Card>
      ) : null}

      {!currentQuestion ? (
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-md bg-coral/15 p-3 text-coral">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Session Settings</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Skill
              <select
                className="h-11 rounded-md border border-slate-700 bg-slate-950 px-3 text-white outline-none focus:border-coral"
                onChange={(event) => setSkill(event.target.value as typeof skill)}
                value={skill}
              >
                <option value="vocab">Vocabulary</option>
                <option value="grammar">Grammar</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Difficulty
              <select
                className="h-11 rounded-md border border-slate-700 bg-slate-950 px-3 text-white outline-none focus:border-coral"
                onChange={(event) =>
                  setDifficulty(event.target.value as typeof difficulty)
                }
                value={difficulty}
              >
                <option value="all">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
          </div>
          <div className="mt-6">
            <Button isLoading={isLoading} onClick={startPractice} type="button">
              <Play className="h-4 w-4" />
              Start 20 Questions
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-md bg-slate-800">
              <div
                className="h-full rounded-md bg-coral"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <Timer mode="elapsed" secondsLeft={elapsedSeconds} />
          </div>

          <QuestionCard
            disabled={revealAnswer}
            index={currentIndex}
            onSelect={setSelectedAnswer}
            question={currentQuestion}
            revealAnswer={revealAnswer}
            selectedAnswer={selectedAnswer}
            total={questions.length}
          />

          {revealAnswer && selectedAnswer !== currentQuestion.answer ? (
            <ErrorClassifier
              onChange={updateErrorType}
              value={answers[currentQuestion.id]?.error_type}
            />
          ) : null}

          <div className="flex justify-end gap-3">
            {!revealAnswer ? (
              <Button disabled={!selectedAnswer} onClick={handleCheck} type="button">
                Check
              </Button>
            ) : (
              <Button isLoading={isLoading} onClick={handleNext} type="button">
                {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
              </Button>
            )}
          </div>
        </>
      )}
    </main>
  );
}

export default function PracticePage() {
  return (
    <RequireAuth>
      <PracticeContent />
    </RequireAuth>
  );
}
