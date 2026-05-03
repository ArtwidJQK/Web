import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'neutral' | 'accent' | 'warning' | 'success';
}) {
  const tones = {
    neutral: 'bg-surface',
    accent: 'bg-coral text-navy',
    warning: 'bg-amber-300 text-navy',
    success: 'bg-emerald-300 text-navy',
  };

  const muted = tone === 'neutral' ? 'text-slate-400' : 'text-navy/70';

  return (
    <section className={cn('rounded-md p-6 transition hover:-translate-y-0.5', tones[tone])}>
      <p className={cn('text-sm font-semibold', muted)}>{label}</p>
      <p className="mt-4 text-4xl font-semibold leading-none">{value}</p>
      {detail ? <p className={cn('mt-4 text-sm font-medium', muted)}>{detail}</p> : null}
    </section>
  );
}
