'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { RequireAuth } from '@/components/shared/RequireAuth';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { ExamResults } from '@/components/exam/ExamResults';
import { Timer } from '@/components/exam/Timer';
import { ProgressBar } from '@/components/learning/ProgressBar';
import { QuestionCard } from '@/components/learning/QuestionCard';
import { SkillTag } from '@/components/learning/SkillTag';
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
  score: number;
  skill_breakdown: Record<string, number>;
  error_distribution: Record<ErrorType, number>;
  review: Array<{
    question: Question;
    selected: string;
    correct: boolean;
    correct_answer: string;
  }>;
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
      const totalTime = (exam.time_limit || 60) * 60 - secondsLeft;
      const data = await apiRequest<ResultPayload>('/api/submit-exam', {
        method: 'POST',
        token,
        body: JSON.stringify({
          exam_id: exam.id,
          total_time: Math.max(0, totalTime),
          answers: questions.map((question) => ({
            question_id: question.id,
            selected: answers[question.id]?.answer || '',
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
  }, [answers, exam, questions, secondsLeft, token]);

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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!currentQuestion || result) return;
      const keyMap: Record<string, string> = {
        '1': 'A',
        '2': 'B',
        '3': 'C',
        '4': 'D',
      };
      if (keyMap[event.key]) {
        selectAnswer(keyMap[event.key]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

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
          review={result.review}
          skillBreakdown={result.skill_breakdown}
          totalTime={Math.max(0, totalSeconds)}
        />
      </main>
    );
  }

  return (
    <main className="container-main grid gap-8 py-8">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="meta-text text-coral">Exam mode</p>
          <h1 className="page-title mt-2">
            {exam?.name || 'Loading exam'}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Clear progress, visible time pressure, keyboard answers 1-4.
          </p>
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
          <ProgressBar
            label={`Answered ${answeredCount}/${questions.length}`}
            value={(answeredCount / questions.length) * 100}
          />

          <Card className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <SkillTag tone="accent">
                Answered {answeredCount}/{questions.length}
              </SkillTag>
              <SkillTag>{Object.values(flags).filter(Boolean).length} flagged</SkillTag>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 md:grid-cols-[repeat(25,minmax(0,1fr))]">
              {questions.map((question, index) => {
                const answered = Boolean(answers[question.id]?.answer);
                const flagged = Boolean(flags[question.id]);
                return (
                  <button
                    className={cn(
                      'h-10 rounded-md bg-surface-strong text-xs font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-700 focus-ring',
                      index === currentIndex && 'bg-coral text-navy',
                      answered && index !== currentIndex && 'bg-emerald-300 text-navy',
                      flagged && index !== currentIndex && 'bg-amber-300 text-navy'
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
            showExplanation={false}
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
