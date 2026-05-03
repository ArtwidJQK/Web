import { Clock } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

export function Timer({
  secondsLeft,
  mode = 'remaining',
}: {
  secondsLeft: number;
  mode?: 'remaining' | 'elapsed';
}) {
  const urgent = mode === 'remaining' && secondsLeft <= 300;

  return (
    <div
      className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-bold ${
        urgent ? 'bg-red-500/15 text-red-200' : 'bg-slate-900 text-white'
      }`}
    >
      <Clock className="h-4 w-4" />
      {mode === 'elapsed' ? 'Elapsed ' : null}
      {formatDuration(Math.max(0, secondsLeft))}
    </div>
  );
}
