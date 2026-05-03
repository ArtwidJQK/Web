import Link from 'next/link';
import { RotateCcw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { ErrorChart } from '@/components/dashboard/ErrorChart';
import { SkillChart } from '@/components/dashboard/SkillChart';
import { ErrorType } from '@/lib/types';
import { clampPercentage, formatDuration } from '@/lib/utils';

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
  return (
    <div className="grid gap-6">
      <Card className="border-coral/40">
        <p className="text-sm font-semibold text-coral">Complete</p>
        <h2 className="mt-2 text-4xl font-bold text-white">
          {clampPercentage(accuracy)}%
        </h2>
        <p className="mt-2 text-slate-300">Time {formatDuration(totalTime)}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={onRestart} type="button">
            <RotateCcw className="h-4 w-4" />
            Practice Again
          </Button>
          <Link className="btn-secondary inline-flex items-center gap-2 rounded-md" href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkillChart skillAccuracy={skillBreakdown} />
        <ErrorChart errorDistribution={errorDistribution} />
      </div>
    </div>
  );
}
