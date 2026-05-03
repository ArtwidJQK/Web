import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
};

const variants = {
  primary: 'bg-coral text-white hover:bg-coral-light',
  secondary: 'border border-slate-600 bg-slate-900 text-lotus hover:border-coral',
  ghost: 'text-lotus hover:bg-slate-800',
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
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
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
