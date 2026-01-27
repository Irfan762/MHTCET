import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-slate-950 text-slate-50 hover:bg-slate-800 shadow-lg shadow-slate-950/20",
        primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200 shadow-sm",
        outline: "border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700",
        ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
        link: "text-indigo-600 underline-offset-4 hover:underline",
        danger: "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-13 rounded-3xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, loading, children, icon, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
