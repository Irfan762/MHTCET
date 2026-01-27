import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, Bell } from 'lucide-react';
import { cn } from '../../utils/cn';

const Notification = ({ notifications }) => {
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={cn(
              "pointer-events-auto p-4 rounded-3xl border shadow-2xl flex items-start gap-4 bg-white/90 backdrop-blur-xl transition-all duration-300",
              n.type === 'success' ? "border-emerald-100 shadow-emerald-500/10" :
              n.type === 'error' ? "border-rose-100 shadow-rose-500/10" :
              "border-indigo-100 shadow-indigo-500/10"
            )}
          >
            <div className={cn(
              "p-2.5 rounded-2xl shrink-0",
              n.type === 'success' ? "bg-emerald-100 text-emerald-600" :
              n.type === 'error' ? "bg-rose-100 text-rose-600" :
              "bg-indigo-100 text-indigo-600"
            )}>
              {n.type === 'success' ? <CheckCircle2 size={18} /> :
               n.type === 'error' ? <AlertCircle size={18} /> :
               <Info size={18} />}
            </div>
            
            <div className="flex-1 pr-4 pt-1">
              <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{n.message}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">System Insight</span>
              </div>
            </div>

            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Notification;
