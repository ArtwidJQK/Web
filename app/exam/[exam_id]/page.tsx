'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { RequireAuth } from '@/components/shared/RequireAuth';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { ExamResults } from '@/components/exam/ExamResults';
import { Timer } from '@/components/exam/Timer';
import { QuestionCard } from '@/components/practice/QuestionCard';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/client-api';
import { ErrorType, Exam, Question } from '@/lib/types';
import { cn } from '@/lib/utils';

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
};

function ExamContent() {
  const params = useParams<{ exam_id: string }>();
  const { token } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(60 * 60);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitStartedRef = useRef(false);

  const examId = params.exam_id;
  const currentQuestion = questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id]?.answer : '';
  const answeredCount = useMemo(
    () => questions.filter((question) => answers[question.id]?.answer).length,
    [answers, questions]
  );

  const loadExam = useCallback(async () => {
    if (!token || !examId) return;
    setIsLoading(true);
    setError('');
    try {
      const detail = await apiRequest<ExamDetail>(`/api/exams/${examId}`, {
        token,
      });
      setExam(detail.exam);
      setQuestions(detail.questions);
      setSecondsLeft((detail.exam.time_limit || 60) * 60);
      setAnswers({});
      setFlags({});
      setCurrentIndex(0);
      setResult(null);
      submitStartedRef.current = false;
      setQuestionStartedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exam');
    } finally {
      setIsLoading(false);
    }
  }, [examId, token]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  const submitExam = useCallback(async () => {
    if (!token || !exam || submitStartedRef.current) return;
    submitStartedRef.current = true;
    setIsSubmitting(true);
    setError('');
    try {
      const data = await apiRequest<ResultPayload>('/api/attempts', {
        method: 'POST',
        token,
        body: JSON.stringify({
          exam_id: exam.id,
          answers: questions.map((question) => ({
            question_id: question.id,
            answer: answers[question.id]?.answer || '',
            time_spent: answers[question.id]?.time_spent || 0,
          })),
        }),
      });
      setResult(data);
    } catch (err) {
      submitStartedRef.current = false;
      setError(err instanceof Error ? err.message : 'Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, exam, questions, token]);

  useEffect(() => {
    if (!exam || result) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [exam, result]);

  useEffect(() => {
    if (secondsLeft === 0 && questions.length && !result) {
      submitExam();
    }
  }, [questions.length, result, secondsLeft, submitExam]);

  function selectAnswer(answer: string) {
    if (!currentQuestion) return;
    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: {
        answer,
        time_spent: timeSpent,
      },
    }));
  }

  function goToQuestion(index: number) {
    setCurrentIndex(index);
    setQuestionStartedAt(Date.now());
  }

  if (result && exam) {
    const totalSeconds = (exam.time_limit || 60) * 60 - secondsLeft;
    return (
      <main className="container-main py-8">
        <ExamResults
          accuracy={result.accuracy}
          errorDistribution={result.error_distribution}
          onRetake={loadExam}
          skillBreakdown={result.skill_breakdown}
          totalTime={Math.max(0, totalSeconds)}
        />
      </main>
    );
  }

  return (
    <main className="container-main grid gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-coral">Exam</p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            {exam?.name || 'Loading exam'}
          </h1>
        </div>
        <Timer secondsLeft={secondsLeft} />
      </div>

      {error ? (
        <Card className="border-red-500/40 bg-red-500/10">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-100">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        </Card>
      ) : null}

      {isLoading || !currentQuestion ? (
        <Card>
          <p className="text-slate-300">Loading questions...</p>
        </Card>
      ) : (
        <>
          <Card className="p-3">
            <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
              <span>
                Answered {answeredCount}/{questions.length}
              </span>
              <span>{Object.values(flags).filter(Boolean).length} flagged</span>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 md:grid-cols-[repeat(25,minmax(0,1fr))]">
              {questions.map((question, index) => {
                const answered = Boolean(answers[question.id]?.answer);
                const flagged = Boolean(flags[question.id]);
                return (
                  <button
                    className={cn(
                      'h-9 rounded-md border border-slate-700 text-xs font-semibold text-slate-300 transition hover:border-coral',
                      index === currentIndex && 'border-coral bg-coral/15 text-white',
                      answered && 'bg-emerald-500/15 text-emerald-200',
                      flagged && 'border-amber-300 text-amber-200'
                    )}
                    key={question.id}
                    onClick={() => goToQuestion(index)}
                    type="button"
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </Card>

          <QuestionCard
            flagged={Boolean(flags[currentQuestion.id])}
            index={currentIndex}
            onSelect={selectAnswer}
            onToggleFlag={() =>
              setFlags((current) => ({
                ...current,
                [currentQuestion.id]: !current[currentQuestion.id],
              }))
            }
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            total={questions.length}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(currentIndex - 1)}
              type="button"
              variant="secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex gap-3">
              {currentIndex < questions.length - 1 ? (
                <Button
                  onClick={() => goToQuestion(currentIndex + 1)}
                  type="button"
                  variant="secondary"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
              <Button isLoading={isSubmitting} onClick={submitExam} type="button">
                <Send className="h-4 w-4" />
                Submit
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default function ExamPage() {
  return (
    <RequireAuth>
      <ExamContent />
    </RequireAuth>
  );
}
