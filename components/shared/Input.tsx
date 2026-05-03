import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, className, id, ...props }: InputProps) {
  const inputId = id || props.name || label;

  return (
    <label className="grid gap-2 text-sm font-medium text-lotus" htmlFor={inputId}>
      <span>{label}</span>
      <input
        id={inputId}
        className={cn(
          'h-11 rounded-md border border-slate-700 bg-slate-950 px-3 text-white outline-none transition placeholder:text-slate-500 focus:border-coral focus:ring-2 focus:ring-coral/20',
          className
        )}
        {...props}
      />
    </label>
  );
}
