import React from 'react';
import { cn } from '../../utils/cn';

const Card = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-slate-200 bg-white text-slate-950 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-8", className)} {...props} />
);

const CardTitle = ({ className, ...props }) => (
  <h3
    className={cn("text-xl font-800 leading-none tracking-tight text-slate-900", className)}
    {...props}
  />
);

const CardDescription = ({ className, ...props }) => (
  <p className={cn("text-sm font-medium text-slate-500", className)} {...props} />
);

const CardContent = ({ className, ...props }) => (
  <div className={cn("p-8 pt-0", className)} {...props} />
);

const CardFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center p-8 pt-0", className)} {...props} />
);

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
