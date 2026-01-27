import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { 
  Bell, 
  Calendar, 
  Info, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ExternalLink,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const NotificationsPage = () => {
  const notifications = [
    {
      id: 1,
      type: 'critical',
      title: 'CAP Round 1 Seat Allocation',
      message: 'The provisional seat matrix for Round 1 is now live for institutional verification and student confirmation.',
      date: 'Jan 27, 2026',
      time: '10:45 AM',
      icon: <AlertCircle />,
      link: '#'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Document Verification Reminder',
      message: 'SC/ST/OBC category students must complete physical verification at Scrutiny Centers before the Jan 30 deadline.',
      date: 'Jan 26, 2026',
      time: '02:15 PM',
      icon: <Clock />,
      link: '#'
    },
    {
      id: 3,
      type: 'success',
      title: 'AI Model v2.4 Release',
      message: 'Enhanced prediction engine now incorporates TFWS and Female quota trends for more accurate institutional matching.',
      date: 'Jan 25, 2026',
      time: '11:00 AM',
      icon: <CheckCircle2 />,
      link: '#'
    },
    {
      id: 4,
      type: 'info',
      title: 'Scholarship Portal Open',
      message: 'State government merit-based scholarship applications are now being accepted for the 2026-27 academic cycle.',
      date: 'Jan 24, 2026',
      time: '09:30 AM',
      icon: <Info />,
      link: '#'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h2 className="text-3xl font-900 text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
               <Bell size={24} />
             </div>
             System Intelligence Broadcast
          </h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2 italic pl-15">Real-time alerts, deadlines, and CAP process updates</p>
        </div>
        
        <div className="flex gap-2">
          <button className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
            Mark All Read
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="group border-none shadow-xl shadow-slate-200/40 overflow-hidden hover:ring-2 hover:ring-indigo-500/10 transition-all">
              <div className="flex">
                <div className={cn(
                  "w-2",
                  n.type === 'critical' ? 'bg-rose-500' :
                  n.type === 'warning' ? 'bg-amber-500' :
                  n.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
                )} />
                <div className="p-8 flex-1 flex flex-col md:flex-row gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center",
                    n.type === 'critical' ? 'bg-rose-50 text-rose-600' :
                    n.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                    n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                  )}>
                    {n.icon}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <h4 className="text-lg font-800 text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight uppercase italic">{n.title}</h4>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {n.date}</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {n.time}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm font-medium text-slate-500 leading-relaxed italic">{n.message}</p>
                    
                    <div className="flex justify-end pt-2">
                      <a href={n.link} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors">
                        View Official Annexure <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {notifications.length === 0 && (
         <div className="py-40 text-center space-y-4">
           <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
             <Search size={32} />
           </div>
           <h3 className="text-xl font-900 text-slate-900 uppercase tracking-tight italic">Zero Transmission Logs</h3>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">All systems operational. No new broadcasts detected.</p>
         </div>
      )}
    </div>
  );
};

export default NotificationsPage;
