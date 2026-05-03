import { Activity, BadgeCheck, Clock, Target } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { clampPercentage } from '@/lib/utils';

type StatsOverviewProps = {
  totalQuestions: number;
  vocabAccuracy: number;
  grammarAccuracy: number;
  lastExamDate?: string;
};

export function StatsOverview({
  totalQuestions,
  vocabAccuracy,
  grammarAccuracy,
  lastExamDate,
}: StatsOverviewProps) {
  const overall =
    vocabAccuracy || grammarAccuracy
      ? Math.round((clampPercentage(vocabAccuracy) + clampPercentage(grammarAccuracy)) / 2)
      : 0;

  const cards = [
    {
      label: 'Overall',
      value: `${overall}%`,
      icon: Target,
      accent: 'text-coral bg-coral/15',
    },
    {
      label: 'Questions',
      value: totalQuestions.toString(),
      icon: Activity,
      accent: 'text-emerald-300 bg-emerald-500/15',
    },
    {
      label: 'Vocab',
      value: `${clampPercentage(vocabAccuracy)}%`,
      icon: BadgeCheck,
      accent: 'text-sky-300 bg-sky-500/15',
    },
    {
      label: 'Last Attempt',
      value: lastExamDate ? new Date(lastExamDate).toLocaleDateString() : 'None',
      icon: Clock,
      accent: 'text-amber-300 bg-amber-500/15',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
              </div>
              <div className={`rounded-md p-3 ${item.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
