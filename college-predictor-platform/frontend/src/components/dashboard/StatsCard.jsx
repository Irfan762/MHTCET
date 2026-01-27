import React from 'react';
import { Card } from '../common/Card';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon, trend, trendValue, color = "indigo" }) => {
  const colors = {
    indigo: "from-indigo-500 to-purple-600 shadow-indigo-500/20 text-indigo-500 bg-indigo-50 border-indigo-100",
    emerald: "from-emerald-400 to-teal-500 shadow-emerald-500/20 text-emerald-500 bg-emerald-50 border-emerald-100",
    amber: "from-amber-400 to-orange-500 shadow-amber-500/20 text-amber-500 bg-amber-50 border-amber-100",
    rose: "from-rose-400 to-pink-500 shadow-rose-500/20 text-rose-500 bg-rose-50 border-rose-100",
    blue: "from-blue-400 to-indigo-500 shadow-blue-500/20 text-blue-500 bg-blue-50 border-blue-100",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-none shadow-md">
        <div className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300",
              colors[color].split(' ').slice(3).join(' ')
            )}>
              {React.cloneElement(icon, { size: 24 })}
            </div>
            {trend && (
              <div className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                trend === 'up' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              )}>
                {trend === 'up' ? '↗' : '↘'} {trendValue}
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-900 text-slate-900 tracking-tight">{value}</h3>
          </div>
          
          {/* Subtle background decoration */}
          <div className={cn(
            "absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 blur-2xl",
            colors[color].split(' ')[1] // Get the 'to-' part
          )} />
        </div>
      </Card>
    </motion.div>
  );
};

export default StatsCard;
