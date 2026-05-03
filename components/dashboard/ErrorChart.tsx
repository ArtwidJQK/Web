import { Card } from '@/components/shared/Card';
import { ErrorType } from '@/lib/types';

const labels: Record<ErrorType, string> = {
  vocab_missing: 'Vocab missing',
  logic_error: 'Logic error',
  hasty_read: 'Hasty read',
  misunderstood: 'Misunderstood',
  unknown: 'Unknown',
};

const colors: Record<ErrorType, string> = {
  vocab_missing: 'bg-coral',
  logic_error: 'bg-amber-400',
  hasty_read: 'bg-sky-400',
  misunderstood: 'bg-emerald-400',
  unknown: 'bg-slate-500',
};

export function ErrorChart({
  errorDistribution,
}: {
  errorDistribution?: Partial<Record<ErrorType, number>>;
}) {
  const rows = (Object.keys(labels) as ErrorType[]).map((key) => ({
    key,
    label: labels[key],
    value: errorDistribution?.[key] || 0,
  }));
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <Card>
      <h2 className="text-lg font-bold text-white">Error Distribution</h2>
      <div className="mt-5 grid gap-4">
        {rows.map((row) => {
          const width = total ? Math.round((row.value / total) * 100) : 0;
          return (
            <div key={row.key}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-300">{row.label}</span>
                <span className="text-white">{row.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-md bg-slate-800">
                <div
                  className={`h-full rounded-md ${colors[row.key]}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
