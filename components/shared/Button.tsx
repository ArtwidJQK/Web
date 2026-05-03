import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
};

const variants = {
  primary: 'bg-coral text-navy hover:bg-coral-light',
  secondary: 'bg-surface-strong text-lotus hover:bg-slate-700',
  ghost: 'text-lotus hover:bg-surface-strong',
  danger: 'bg-red-500 text-white hover:bg-red-400',
};

export function Button({
  className,
  children,
  variant = 'primary',
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 focus:ring-offset-navy disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        variants[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
