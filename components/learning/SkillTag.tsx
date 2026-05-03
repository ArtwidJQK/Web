import { cn } from '@/lib/utils';

export function SkillTag({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'warning' | 'success';
}) {
  const tones = {
    neutral: 'bg-surface-strong text-slate-300',
    accent: 'bg-coral text-navy',
    warning: 'bg-amber-300 text-navy',
    success: 'bg-emerald-300 text-navy',
  };

  return (
    <span
      className={cn(
        'inline-flex h-8 items-center rounded-md px-3 text-sm font-semibold',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
