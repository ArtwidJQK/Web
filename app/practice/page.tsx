'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Brain, RotateCcw } from 'lucide-react';
import { RequireAuth } from '@/components/shared/RequireAuth';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Timer } from '@/components/exam/Timer';
import { ProgressBar } from '@/components/learning/ProgressBar';
import { QuestionCard } from '@/components/learning/QuestionCard';
import { SkillTag } from '@/components/learning/SkillTag';
import { PracticeResults } from '@/components/practice/PracticeResults';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/client-api';
import { ErrorType, Question } from '@/lib/types';

type PracticeMode = 'random' | 'weak' | 'wrong';

type SavedAnswer = {
  answer: string;
  correct: boolean;
  time_spent: number;
  error_type?: ErrorType | null;
};

type AnswerResult = {
  correct: boolean;
  correct_answer: string;
  explanation?: string;
  error_type?: ErrorType | null;
};

function PracticeContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<PracticeMode>(
    (searchParams.get('mode') as PracticeMode) || 'random'
  );
  const [skill, setSkill] = useState<'mixed' | 'vocab' | 'grammar'>(
    (searchParams.get('skill') as 'mixed' | 'vocab' | 'grammar') || 'mixed'
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [sessionStartedAt, setSessionStartedAt] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progressValue = questions.length
    ? ((currentIndex + (revealAnswer ? 1 : 0)) / questions.length) * 100
    : 0;

  const summary = useMemo(() => {
    const rows = Object.entries(answers);
    const total = rows.length || 1;
    const correct = rows.filter(([, answer]) => answer.correct).length;
    const skillData: Record<string, { correct: number; total: number }> = {};
    const errorDistribution: Record<ErrorType, number> = {
      vocab_missing: 0,
      logic_error: 0,
      hasty_read: 0,
      misunderstood: 0,
      unknown: 0,
    };

    for (const [questionId, answer] of rows) {
      const question = questions.find((item) => item.id === questionId);
      const currentSkill = question?.skill || 'mixed';
      if (!skillData[currentSkill]) skillData[currentSkill] = { correct: 0, total: 0 };
      skillData[currentSkill].total += 1;
      if (answer.correct) skillData[currentSkill].correct += 1;
      if (!answer.correct && answer.error_type) {
        errorDistribution[answer.error_type] += 1;
      }
    }

    return {
      accuracy: (correct / total) * 100,
      skillBreakdown: Object.fromEntries(
        Object.entries(skillData).map(([key, value]) => [
          key,
          (value.correct / value.total) * 100,
        ])
      ),
      errorDistribution,
    };
  }, [answers, questions]);

  useEffect(() => {
    if (!questions.length || complete) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [complete, questions.length, sessionStartedAt]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!currentQuestion || revealAnswer) return;
      const keyMap: Record<string, string> = {
        '1': 'A',
        '2': 'B',
        '3': 'C',
        '4': 'D',
      };
      if (keyMap[event.key]) {
        setSelectedAnswer(keyMap[event.key]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, revealAnswer]);

  async function startPractice(nextMode = mode) {
    if (!token) return;
    setIsLoading(true);
    setError('');
    setComplete(false);
    try {
      const data = await apiRequest<{ questions: Question[]; total: number }>(
        `/api/questions?mode=${nextMode}&skill=${skill}&limit=20`,
        { token }
      );

      if (!data.questions.length) {
        setError(
          nextMode === 'wrong'
            ? 'Chưa có câu sai để luyện wrong-only.'
            : 'Không tìm thấy câu hỏi. Hãy seed dữ liệu trước.'
        );
        setQuestions([]);
        return;
      }

      setQuestions(data.questions);
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

  async function checkAnswer() {
    if (!token || !currentQuestion || !selectedAnswer) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await apiRequest<AnswerResult>('/api/answer', {
        method: 'POST',
        token,
        body: JSON.stringify({
          question_id: currentQuestion.id,
          selected: selectedAnswer,
        }),
      });
      const timeSpent = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));

      setAnswers((current) => ({
        ...current,
        [currentQuestion.id]: {
          answer: selectedAnswer,
          correct: result.correct,
          time_spent: timeSpent,
          error_type: result.error_type,
        },
      }));
      setRevealAnswer(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record answer');
    } finally {
      setIsLoading(false);
    }
  }

  function goNext() {
    if (currentIndex === questions.length - 1) {
      setComplete(true);
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setSelectedAnswer(answers[questions[nextIndex].id]?.answer || '');
    setRevealAnswer(false);
    setQuestionStartedAt(Date.now());
  }

  if (complete) {
    return (
      <main className="container-main py-8">
        <PracticeResults
          accuracy={summary.accuracy}
          errorDistribution={summary.errorDistribution}
          onRestart={() => startPractice(mode)}
          skillBreakdown={summary.skillBreakdown}
          totalTime={elapsedSeconds}
        />
      </main>
    );
  }

  return (
    <main className="container-main grid gap-8 py-8">
      <header className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="meta-text text-coral">Practice engine</p>
          <h1 className="page-title mt-2">Luyện theo vòng phản hồi</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Chọn đáp án bằng phím 1-4, xem giải thích ngay, rồi mới sang câu tiếp theo.
          </p>
        </div>
        {currentQuestion ? <Timer mode="elapsed" secondsLeft={elapsedSeconds} /> : null}
      </header>

      {error ? (
        <Card className="bg-amber-300 text-navy">
          <p className="font-semibold">{error}</p>
        </Card>
      ) : null}

      {!currentQuestion ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card>
            <h2 className="section-title">Practice mode</h2>
            <div className="mt-8 grid gap-4">
              {[
                { value: 'random', label: 'Normal practice', desc: 'Mixed adaptive set' },
                { value: 'weak', label: 'Weakness practice', desc: 'Prioritize weakest skill' },
                { value: 'wrong', label: 'Wrong-only practice', desc: 'Only questions you missed' },
              ].map((item) => (
                <button
                  className={`rounded-md p-6 text-left transition hover:-translate-y-0.5 ${
                    mode === item.value ? 'bg-coral text-navy' : 'bg-surface-strong text-lotus'
                  }`}
                  key={item.value}
                  onClick={() => setMode(item.value as PracticeMode)}
                  type="button"
                >
                  <p className="text-lg font-semibold">{item.label}</p>
                  <p className="mt-2 text-sm opacity-75">{item.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="section-title">Scope</h2>
            <div className="mt-8 flex flex-wrap gap-2">
              {['mixed', 'vocab', 'grammar'].map((item) => (
                <button
                  className={`rounded-md px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                    skill === item ? 'bg-coral text-navy' : 'bg-surface-strong text-lotus'
                  }`}
                  key={item}
                  onClick={() => setSkill(item as typeof skill)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
            <Button className="mt-8 w-full" isLoading={isLoading} onClick={() => startPractice(mode)} type="button">
              <BookOpen className="h-4 w-4" />
              Start 20 questions
            </Button>
          </Card>
        </section>
      ) : (
        <>
          <ProgressBar label="Session progress" value={progressValue} />

          <QuestionCard
            disabled={revealAnswer}
            index={currentIndex}
            onSelect={setSelectedAnswer}
            question={currentQuestion}
            revealAnswer={revealAnswer}
            selectedAnswer={selectedAnswer}
            total={questions.length}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <SkillTag>
                <Brain className="mr-2 h-4 w-4" />
                Keys 1-4
              </SkillTag>
              <SkillTag tone={answers[currentQuestion.id]?.correct ? 'success' : revealAnswer ? 'warning' : 'neutral'}>
                {revealAnswer
                  ? answers[currentQuestion.id]?.correct
                    ? 'Correct'
                    : 'Review the explanation'
                  : 'Choose one option'}
              </SkillTag>
            </div>
            {!revealAnswer ? (
              <Button disabled={!selectedAnswer} isLoading={isLoading} onClick={checkAnswer} type="button">
                Check answer
              </Button>
            ) : (
              <Button onClick={goNext} type="button">
                {currentIndex === questions.length - 1 ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Finish
                  </>
                ) : (
                  'Next question'
                )}
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
