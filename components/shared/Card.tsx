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
        'rounded-md bg-surface p-6',
        className
      )}
    >
      {children}
    </section>
  );
}
