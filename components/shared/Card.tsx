import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-md border border-slate-700 bg-slate-900/80 p-5 shadow-sm',
        className
      )}
    >
      {children}
    </section>
  );
}
