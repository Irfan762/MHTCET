import React from 'react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({ className, type, label, error, icon, ...props }, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider block">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-13 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
            icon && "pl-12",
            error && "border-red-500 focus-visible:ring-red-500/10 focus-visible:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs font-bold text-red-500 ml-1">{error}</p>
      )}
    </div>
  );
});
Input.displayName = "Input";

export { Input };
