import Link from 'next/link';
import { LayoutDashboard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { ProgressBar } from '@/components/learning/ProgressBar';
import { StatCard } from '@/components/learning/StatCard';
import { ErrorType } from '@/lib/types';
import { clampPercentage, formatDuration } from '@/lib/utils';

const errorLabels: Record<ErrorType, string> = {
  vocab_missing: 'Vocab missing',
  logic_error: 'Logic error',
  hasty_read: 'Hasty read',
  misunderstood: 'Misunderstood',
  unknown: 'Unknown',
};

export function PracticeResults({
  accuracy,
  totalTime,
  skillBreakdown,
  errorDistribution,
  onRestart,
}: {
  accuracy: number;
  totalTime: number;
  skillBreakdown: Record<string, number>;
  errorDistribution: Partial<Record<ErrorType, number>>;
  onRestart: () => void;
}) {
  const topError = (Object.entries(errorDistribution) as Array<[ErrorType, number]>)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          detail="Practice accuracy"
          label="Session result"
          tone="accent"
          value={`${clampPercentage(accuracy)}%`}
        />
        <StatCard detail="Total time" label="Pace" value={formatDuration(totalTime)} />
        <StatCard
          detail={topError?.[1] ? `${topError[1]} misses` : 'No dominant error yet'}
          label="Top error"
          tone={topError?.[1] ? 'warning' : 'success'}
          value={topError?.[1] ? errorLabels[topError[0]] : 'Clean'}
        />
      </section>

      <Card>
        <h2 className="section-title">Skill breakdown</h2>
        <div className="mt-8 grid gap-6">
          {Object.entries(skillBreakdown).map(([skill, value]) => (
            <ProgressBar key={skill} label={skill} value={value} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={onRestart} type="button">
            <RotateCcw className="h-4 w-4" />
            Practice Again
          </Button>
          <Link className="btn-secondary" href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
