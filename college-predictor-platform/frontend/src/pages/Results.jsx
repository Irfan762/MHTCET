import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { 
  ClipboardList, 
  Trash2, 
  ArrowRight, 
  Download, 
  Clock, 
  Calendar,
  Sparkles,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Results = ({ history, onLoad, onDelete, onDeleteAll, onDownload }) => {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-900 text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
               <ClipboardList size={24} />
             </div>
             Archived <span className="text-indigo-600 italic">Predictions</span>
          </h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2 italic pl-15">Historical institution mapping and strategic reports</p>
        </div>
        
        {history.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-rose-600 border-rose-100 hover:bg-rose-50 h-12 rounded-2xl px-6 uppercase tracking-widest font-bold"
            onClick={onDeleteAll}
            icon={<Trash2 size={16} />}
          >
            Clear Intelligence Logs
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {history.map((item, i) => (
            <motion.div
              key={item._id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group overflow-hidden border-none shadow-xl shadow-slate-200/40 hover:ring-2 hover:ring-indigo-500/10 transition-all">
                <div className="p-8 flex flex-col md:flex-row md:items-center gap-8">
                   <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                     <Sparkles size={28} />
                   </div>
                   
                   <div className="flex-1 space-y-4">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div>
                         <h4 className="text-xl font-900 text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tighter">
                           {item.inputData?.percentile}% <span className="text-slate-400 font-medium">Percentile Strategy</span>
                         </h4>
                         <div className="flex items-center gap-4 text-[10px] font-900 text-slate-400 uppercase tracking-widest mt-1">
                           <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString()}</span>
                           <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => onDownload(item)}
                           className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                         >
                           <Download size={18} />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => onDelete(item._id)}
                           className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                         >
                           <Trash2 size={18} />
                         </Button>
                         <Button 
                           variant="primary" 
                           size="sm" 
                           onClick={() => onLoad(item)}
                           className="rounded-xl h-10 px-6 uppercase tracking-widest font-bold text-[10px] italic shadow-lg shadow-indigo-600/10"
                         >
                           Execute Load <ArrowRight className="ml-2" size={14} />
                         </Button>
                       </div>
                     </div>
                     
                     <div className="flex flex-wrap gap-2">
                       {item.inputData?.courses?.slice(0, 3).map((c, idx) => (
                         <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-100/80 text-slate-500 text-[9px] font-bold uppercase tracking-widest italic group-hover:bg-white transition-colors">{c}</span>
                       ))}
                       {item.predictions?.length > 0 && (
                         <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase tracking-widest italic">{item.predictions.length} Institutions Mapped</span>
                       )}
                     </div>
                   </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {history.length === 0 && (
           <div className="py-40 text-center space-y-6">
             <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
               <ClipboardList size={40} />
             </div>
             <div className="space-y-2">
               <h3 className="text-2xl font-900 text-slate-900 uppercase tracking-tight italic">No Archival Logs Detected</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic max-w-sm mx-auto">Generate institutional mapping reports to populate your strategic intelligence history.</p>
             </div>
             <Button variant="secondary" className="rounded-2xl px-10 h-12 uppercase font-bold tracking-widest text-xs italic">Initiate First Prediction</Button>
           </div>
        )}
      </div>
    </div>
  );
};

export default Results;
