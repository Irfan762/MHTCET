import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

const Select = React.forwardRef(({ className, label, options, error, ...props }, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider block">
          {label}
        </label>
      )}
      <div className="relative group">
        <select
          className={cn(
            "flex h-13 w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold ring-offset-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-sm pr-10",
            error && "border-red-500 focus-visible:ring-red-500/10 focus-visible:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
          <ChevronDown size={18} />
        </div>
      </div>
      {error && (
        <p className="text-xs font-bold text-red-500 ml-1">{error}</p>
      )}
    </div>
  );
});
Select.displayName = "Select";

export { Select };
