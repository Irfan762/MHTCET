import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { motion } from 'framer-motion';
import { 
  Download, 
  MapPin, 
  School, 
  Target, 
  TrendingUp, 
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';

const ResultCard = ({ prediction, onDownloadPDF, onShowDetails }) => {
  const getChanceColor = (chance) => {
    if (chance >= 80) return "text-emerald-500 bg-emerald-50 border-emerald-100";
    if (chance >= 50) return "text-amber-500 bg-amber-50 border-amber-100";
    return "text-rose-500 bg-rose-50 border-rose-100";
  };

  const getChanceIcon = (chance) => {
    if (chance >= 80) return <CheckCircle2 size={16} />;
    if (chance >= 50) return <AlertCircle size={16} />;
    return <HelpCircle size={16} />;
  };

  const getRiskLabel = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'probable':
      case 'high':
        return { text: 'High Probablity', class: 'bg-emerald-500 text-white shadow-emerald-500/20' };
      case 'borderline':
      case 'medium':
        return { text: 'Borderline Chance', class: 'bg-amber-500 text-white shadow-amber-500/20' };
      default:
        return { text: 'Ambitious Target', class: 'bg-indigo-500 text-white shadow-indigo-500/20' };
    }
  };

  const risk = getRiskLabel(prediction.riskLabel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="group h-full flex flex-col overflow-hidden hover:ring-2 hover:ring-indigo-500/20 border-slate-200/60 shadow-lg shadow-slate-200/40">
        {/* Header with Risk Badge */}
        <div className="relative p-6 pb-0">
          <div className={cn(
            "absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg",
            risk.class
          )}>
            {risk.text}
          </div>
          
          <div className="flex items-start gap-4 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
              <School size={24} />
            </div>
            <div className="space-y-2 min-w-0 flex-1">
              <h3 className="font-900 text-slate-900 tracking-tight text-base line-clamp-3 leading-snug break-words">
                {prediction.name || 'College Name Not Available'}
              </h3>
              <div className="flex items-center gap-2 text-slate-600 font-bold text-[11px] uppercase tracking-widest">
                <MapPin size={12} className="text-indigo-500 flex-shrink-0" />
                <span className="line-clamp-1">{prediction.location || prediction.city || 'Location TBD'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex-1 space-y-6">
          {/* Branch Info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                <Target size={14} />
              </div>
              <span className="text-[10px] font-900 text-indigo-600 uppercase tracking-widest">Selected Specialization</span>
            </div>
            <p className="font-bold text-slate-800 text-sm pl-0">
              {prediction.branch || prediction.course}
            </p>
            {prediction.seatTypeLabel && (
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-200/50 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  {prediction.seatTypeLabel}
                </span>
                {prediction.universityType && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-200/50 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    {prediction.universityType}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Admission Chance</p>
              <div className={cn(
                "py-2 rounded-xl border flex items-center justify-center gap-2 font-900",
                getChanceColor(prediction.admissionChance || 50)
              )}>
                {getChanceIcon(prediction.admissionChance || 50)}
                {prediction.admissionChance || 'Expert Analysis'}%
              </div>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Category Cutoff</p>
              <div className="py-2 rounded-xl bg-slate-900 text-white flex items-center justify-center gap-2 font-900 border border-slate-800">
                <TrendingUp size={14} className="text-indigo-400" />
                {prediction.cutoffForCategory || 'N/A'}
              </div>
            </div>
          </div>

          {/* Probability Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-900 text-slate-500 uppercase tracking-widest">Statistical Confidence</span>
              <span className="text-xs font-900 text-indigo-600 tracking-tight">{prediction.admissionChance || 'AI Mode'}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${prediction.admissionChance || 50}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full shadow-[0_0_10px_rgba(79,70,229,0.2)]",
                  prediction.admissionChance >= 80 ? "bg-emerald-500" : 
                  prediction.admissionChance >= 50 ? "bg-amber-500" : "bg-rose-500"
                )}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 py-3 h-auto rounded-xl border-slate-200"
            onClick={() => onShowDetails(prediction)}
            icon={<Info size={14} />}
          >
            Details
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            className="flex-1 py-3 h-auto rounded-xl"
            onClick={() => onDownloadPDF(prediction)}
            icon={<Download size={14} />}
          >
            Report
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default ResultCard;
