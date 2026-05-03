import Link from 'next/link';
import { LayoutDashboard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { ExplanationPanel } from '@/components/learning/ExplanationPanel';
import { ProgressBar } from '@/components/learning/ProgressBar';
import { SkillTag } from '@/components/learning/SkillTag';
import { StatCard } from '@/components/learning/StatCard';
import { ErrorType, Question } from '@/lib/types';
import { clampPercentage, formatDuration } from '@/lib/utils';

type ReviewRow = {
  question: Question;
  selected: string;
  correct: boolean;
  correct_answer: string;
};

export function ExamResults({
  accuracy,
  totalTime,
  skillBreakdown,
  errorDistribution,
  review,
  onRetake,
}: {
  accuracy: number;
  totalTime: number;
  skillBreakdown: Record<string, number>;
  errorDistribution: Partial<Record<ErrorType, number>>;
  review: ReviewRow[];
  onRetake: () => void;
}) {
  const wrongCount = review.filter((item) => !item.correct).length;

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          detail="Final score"
          label="Exam result"
          tone="accent"
          value={`${clampPercentage(accuracy)}%`}
        />
        <StatCard detail="Wrong answers" label="Review load" value={`${wrongCount}`} />
        <StatCard detail="Total time" label="Time spent" value={formatDuration(totalTime)} />
        <StatCard
          detail="Questions saved for review"
          label="Feedback loop"
          tone={wrongCount ? 'warning' : 'success'}
          value={wrongCount ? 'Review' : 'Clean'}
        />
      </section>

      <Card>
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(skillBreakdown).map(([skill, value]) => (
            <ProgressBar key={skill} label={skill} value={value} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={onRetake} type="button">
            <RotateCcw className="h-4 w-4" />
            Retake
          </Button>
          <Link className="btn-secondary" href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </Card>

      <section className="grid gap-6">
        <div>
          <p className="meta-text text-coral">Full review</p>
          <h2 className="section-title mt-2">Wrong answers are highlighted</h2>
        </div>
        {review.map((item, index) => (
          <Card
            className={item.correct ? 'bg-surface' : 'bg-red-400 text-navy'}
            key={item.question.id}
          >
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <SkillTag tone={item.correct ? 'success' : 'warning'}>
                {index + 1}
              </SkillTag>
              <SkillTag>{item.question.skill}</SkillTag>
              <SkillTag tone={item.correct ? 'success' : 'warning'}>
                {item.correct ? 'Correct' : 'Wrong'}
              </SkillTag>
            </div>
            <h3 className="text-xl font-semibold leading-8">
              {item.question.question_text}
            </h3>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {(['A', 'B', 'C', 'D'] as const).map((key) => {
                const isSelected = item.selected === key;
                const isCorrect = item.correct_answer === key;
                return (
                  <div
                    className={`rounded-md p-4 text-base ${
                      isCorrect
                        ? 'bg-emerald-300 text-navy'
                        : isSelected
                          ? 'bg-red-500 text-white'
                          : item.correct
                            ? 'bg-surface-strong text-slate-300'
                            : 'bg-navy/15 text-navy'
                    }`}
                    key={key}
                  >
                    <span className="font-bold">{key}. </span>
                    {item.question.options[key]}
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <ExplanationPanel
                answer={item.correct_answer}
                explanation={item.question.explanation}
              />
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
