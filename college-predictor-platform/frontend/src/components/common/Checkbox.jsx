import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

const Checkbox = React.forwardRef(({ className, label, ...props }, ref) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer group select-none">
      <div className="relative">
        <input
          type="checkbox"
          className="peer sr-only"
          ref={ref}
          {...props}
        />
        <div className={cn(
          "w-6 h-6 rounded-lg border-2 border-slate-200 bg-white transition-all duration-200 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 group-hover:border-indigo-300 shadow-sm",
          className
        )} />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
          <Check size={14} className="text-white stroke-[3px]" />
        </div>
      </div>
      {label && (
        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">
          {label}
        </span>
      )}
    </label>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
