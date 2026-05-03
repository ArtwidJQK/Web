import { Card } from '@/components/shared/Card';
import { clampPercentage } from '@/lib/utils';

export function SkillChart({
  skillAccuracy,
}: {
  skillAccuracy?: Record<string, number>;
}) {
  const rows = [
    { label: 'Vocabulary', value: clampPercentage(skillAccuracy?.vocab) },
    { label: 'Grammar', value: clampPercentage(skillAccuracy?.grammar) },
  ];

  return (
    <Card>
      <h2 className="text-lg font-bold text-white">Skill Accuracy</h2>
      <div className="mt-5 grid gap-5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-300">{row.label}</span>
              <span className="text-white">{row.value}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-md bg-slate-800">
              <div
                className="h-full rounded-md bg-coral"
                style={{ width: `${row.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
