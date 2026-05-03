'use client';

import { ErrorType } from '@/lib/types';
import { cn } from '@/lib/utils';

const options: Array<{ value: ErrorType; label: string }> = [
  { value: 'vocab_missing', label: 'Vocab missing' },
  { value: 'logic_error', label: 'Logic error' },
  { value: 'hasty_read', label: 'Hasty read' },
  { value: 'misunderstood', label: 'Misunderstood' },
];

export function ErrorClassifier({
  value,
  onChange,
}: {
  value?: ErrorType;
  onChange: (value: ErrorType) => void;
}) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900 p-4">
      <p className="mb-3 text-sm font-semibold text-white">Error type</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            className={cn(
              'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-coral',
              value === option.value && 'border-coral bg-coral/10 text-white'
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
