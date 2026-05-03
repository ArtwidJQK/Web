'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ExplanationPanel({
  answer,
  explanation,
  defaultOpen = true,
}: {
  answer: string;
  explanation?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-md bg-surface-strong">
      <button
        className="flex w-full items-center justify-between gap-4 rounded-md px-6 py-4 text-left focus-ring"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <div>
          <p className="text-sm font-semibold text-coral">Explanation</p>
          <p className="mt-2 text-base font-semibold text-lotus">
            Correct answer: {answer}
          </p>
        </div>
        <ChevronDown
          className={cn('h-5 w-5 text-slate-400 transition', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <div className="px-6 pb-6 text-base leading-7 text-slate-300">
          {explanation || 'No explanation is available for this question yet.'}
        </div>
      ) : null}
    </section>
  );
}
