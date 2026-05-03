import { cn } from '@/lib/utils';

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('grid gap-2', className)}>
      {label ? (
        <div className="flex items-center justify-between text-sm font-medium text-slate-400">
          <span>{label}</span>
          <span>{Math.round(safeValue)}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-md bg-surface-strong">
        <div
          className="h-full rounded-md bg-coral transition-all duration-300 ease-out"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
