'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnswerOption({
  optionKey,
  children,
  selected,
  correct,
  wrong,
  disabled,
  onSelect,
}: {
  optionKey: string;
  children: React.ReactNode;
  selected?: boolean;
  correct?: boolean;
  wrong?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={cn(
        'grid min-h-16 grid-cols-[2rem_1fr] items-start gap-4 rounded-md bg-surface-strong px-4 py-4 text-left text-base leading-7 text-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 focus:ring-offset-navy disabled:cursor-not-allowed disabled:hover:translate-y-0',
        selected && 'bg-coral text-navy shadow-lift',
        correct && 'bg-emerald-300 text-navy',
        wrong && 'bg-red-400 text-navy'
      )}
      disabled={disabled}
      onClick={onSelect}
      type="button"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy/20 text-sm font-bold">
        {correct ? <CheckCircle2 className="h-5 w-5" /> : wrong ? <XCircle className="h-5 w-5" /> : optionKey}
      </span>
      <span className="text-[17px]">{children}</span>
    </button>
  );
}
