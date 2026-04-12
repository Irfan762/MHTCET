import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  School, 
  MapPin, 
  Target, 
  TrendingUp, 
  IndianRupee, 
  Briefcase, 
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Zap,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

const DetailsModal = ({ isOpen, onClose, prediction }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    if (prediction) {
      if (prediction.branch) {
        // From Predictor
        setSelectedCourse({
          name: prediction.branch,
          rounds: prediction.allRounds,
          bestMatchingRound: prediction.bestMatchingRound
        });
      } else if (prediction.courses && prediction.courses.length > 0) {
        // From Colleges page
        setSelectedCourse(prediction.courses[0]);
      }
    }
  }, [prediction]);

  if (!isOpen || !prediction) return null;

  const currentRounds = selectedCourse?.rounds || [];
  const roundsToDisplay = currentRounds.length > 0 ? currentRounds : (prediction.allRounds || []);
  const normalizedCategory = (prediction.category || 'General').toLowerCase().replace(/[^a-z0-9]/g, '');
  const categoryKeyMap = {
    general: 'general',
    open: 'general',
    obc: 'obc',
    sc: 'sc',
    st: 'st',
    ews: 'ews',
    vjnt: 'vjnt',
    vjdta: 'vjnt',
    nt1: 'nt1',
    nta: 'nt1',
    nt2: 'nt2',
    ntb: 'nt2',
    nt3: 'nt3',
    ntc: 'nt3',
    sebc: 'sebc',
    sbc: 'sebc',
    tfws: 'tfws'
  };
  const selectedCategoryKey = categoryKeyMap[normalizedCategory] || 'general';
  const selectedCategoryLabel = (prediction.category || 'General').toUpperCase();
  const displayedRounds = roundsToDisplay;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl z-10 custom-scrollbar"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-20"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 shrink-0">
              <School size={40} />
            </div>
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <h2 className="text-3xl font-900 text-slate-900 tracking-tight italic">
                     {prediction.name}
                   </h2>
                   {prediction.featured && (
                     <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Premier</span>
                   )}
                </div>
                <div className="flex items-center gap-4 text-slate-500 font-bold text-xs uppercase tracking-widest italic">
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-indigo-500" /> {prediction.location || prediction.city}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-500" /> Est. {prediction.establishedYear || 'N/A'}</span>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200">{prediction.type}</span>
                </div>
              </div>
              
              {/* Branch Selector / Display */}
              <div className="flex flex-col sm:flex-row gap-4">
                {prediction.branch ? (
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 inline-flex items-center gap-3">
                    <Target size={18} className="text-indigo-600" />
                    <div>
                      <p className="text-[10px] font-900 text-indigo-400 uppercase tracking-widest leading-none mb-1">Prediction Specialization</p>
                      <p className="text-sm font-bold text-indigo-900 italic">{prediction.branch}</p>
                    </div>
                  </div>
                ) : prediction.courses && (
                  <div className="relative group w-full sm:w-80">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                      <Target size={18} />
                    </div>
                    <select 
                      className="w-full h-14 pl-12 pr-10 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm font-bold text-indigo-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={selectedCourse?.name}
                      onChange={(e) => {
                        const course = prediction.courses.find(c => c.name === e.target.value);
                        setSelectedCourse(course);
                      }}
                    >
                      {prediction.courses.map((course, idx) => (
                        <option key={idx} value={course.name}>{course.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {/* Rounds Table */}
              <div className="space-y-4">
                <h4 className="text-lg font-900 text-slate-900 flex items-center gap-2 italic">
                  <TrendingUp size={20} className="text-indigo-600" />
                  Category-wise Cutoff Stratigraphy
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                  Showing cutoff for category: {selectedCategoryLabel}
                </p>
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/50">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-900 text-slate-400 uppercase tracking-widest italic text-center">Round</th>
                        <th className="px-6 py-4 text-[10px] font-900 text-slate-400 uppercase tracking-widest italic">{selectedCategoryLabel} Cutoff</th>
                        <th className="px-6 py-4 text-[10px] font-900 text-slate-400 uppercase tracking-widest italic">Type</th>
                        <th className="px-6 py-4 text-[10px] font-900 text-slate-400 uppercase tracking-widest italic text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {displayedRounds.length > 0 ? displayedRounds.map((round, idx) => {
                        const cutoff =
                          round.cutoffByCategory?.[selectedCategoryKey] ??
                          round.cutoffMap?.[selectedCategoryKey] ??
                          round.cutoff?.[selectedCategoryKey] ??
                          round.cutoffForCategory ??
                          round.cutoff ??
                          'N/A';
                        const cutoffNumber = parseFloat(cutoff);
                        const percentileNumber = parseFloat(prediction.percentile);
                        const isCleared = !Number.isNaN(percentileNumber) && !Number.isNaN(cutoffNumber)
                          ? percentileNumber >= cutoffNumber
                          : false;
                        
                        return (
                          <tr key={idx} className={cn(
                            "transition-colors",
                            round.round === prediction.bestMatchingRound ? "bg-indigo-50 border-l-4 border-indigo-500" : "hover:bg-white"
                          )}>
                            <td className="px-6 py-4 text-center">
                              <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mx-auto">
                                {round.round || (idx + 1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 italic">{cutoff ?? 'N/A'}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-lg bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {round.seatTypeLabel || round.seatType || prediction.seatTypeLabel || 'GENERAL'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                               {prediction.percentile ? (
                                 isCleared ? (
                                   <div className="flex flex-col items-center">
                                     <CheckCircle2 size={16} className="text-emerald-500" />
                                     <span className="text-[8px] font-bold text-emerald-600 uppercase mt-1">Cleared</span>
                                   </div>
                                 ) : (
                                   <div className="flex flex-col items-center opacity-40">
                                     <AlertCircle size={16} className="text-rose-500" />
                                     <span className="text-[8px] font-bold text-rose-600 uppercase mt-1">Shortfall</span>
                                   </div>
                                 )
                               ) : (
                                 <div className="flex flex-col items-center opacity-20">
                                   <Zap size={16} />
                                 </div>
                               )}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-sm font-bold text-slate-400 italic">
                            Last year cutoff data is not available for this college.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Insights Card (Conditional) */}
              {prediction.aiInsight && (
                <div className="p-8 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden group">
                   <div className="relative z-10 flex gap-6 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                        <Zap size={24} />
                      </div>
                      <div className="space-y-3">
                         <div className="flex items-center gap-3">
                           <h5 className="font-900 text-xl tracking-tight italic">Predictive Logic</h5>
                           <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-bold uppercase tracking-widest text-indigo-300">Confidence: {prediction.aiConfidence}</span>
                         </div>
                         <p className="text-slate-400 text-sm leading-relaxed italic font-medium">
                           {prediction.aiInsight}
                         </p>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Stats Card */}
            <div className="space-y-6">
               <Card className="border-none bg-slate-50 shadow-none p-6 space-y-6">
                 <div className="space-y-4">
                    <h5 className="text-[10px] font-900 text-slate-400 uppercase tracking-widest italic border-b border-slate-200 pb-2">Institutional Metrics</h5>
                    <div className="space-y-4">
                      <MetricItem icon={<IndianRupee size={18} />} label="Fees" value={prediction.fees} color="text-indigo-600" />
                      <MetricItem icon={<Briefcase size={18} />} label="Avg Package" value={prediction.placements?.averagePackage} color="text-emerald-600" />
                      <MetricItem icon={<TrendingUp size={18} />} label="Placements" value={prediction.placements?.placementRate} color="text-rose-600" />
                      <MetricItem icon={<GraduationCap size={18} />} label="Ranking" value={`#${prediction.ranking?.overall || 50} in State`} color="text-amber-600" />
                    </div>
                 </div>
                 <Button variant="primary" className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-600/10 font-bold uppercase tracking-widest text-xs">
                   Inquire Admission
                 </Button>
               </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const MetricItem = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-4">
     <div className={cn("p-2.5 rounded-xl bg-white shadow-sm", color)}>
       {icon}
     </div>
     <div>
       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
       <p className="font-bold text-slate-900 text-sm italic">{value || 'N/A'}</p>
     </div>
  </div>
);

export default DetailsModal;
