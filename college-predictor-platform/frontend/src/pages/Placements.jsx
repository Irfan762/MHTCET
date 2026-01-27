import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { 
  Briefcase, 
  TrendingUp, 
  Users, 
  Building2, 
  DollarSign, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const Placements = () => {
  const stats = [
    { title: 'Avg. Package', value: '₹8.4 LPA', icon: <DollarSign />, color: 'indigo' },
    { title: 'Highest Package', value: '₹44.2 LPA', icon: <TrendingUp />, color: 'emerald' },
    { title: 'Placements %', value: '94.8%', icon: <CheckCircle2 />, color: 'amber' },
    { title: 'Recruiters', value: '180+', icon: <Building2 />, color: 'rose' },
  ];

  const topRecruiters = [
    'Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Capgemini'
  ];

  return (
    <div className="space-y-10">
      {/* Placement Hero */}
      <Card className="p-10 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Briefcase size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest pt-0.5">Career Intelligence</span>
            </div>
            <h2 className="text-4xl font-900 text-white tracking-tight leading-tight">
              Institutional <span className="text-indigo-400">Career Trajectory</span>
            </h2>
            <p className="text-lg text-slate-400 font-medium max-w-lg leading-relaxed italic">
              Analyze engineering placement metrics, recruiter networks, and salary distributions across Maharashtra's premier technical institutions.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 shrink-0">
            {stats.map((stat, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 text-white min-w-[160px]">
                <div className={cn("mb-3", stat.color === 'indigo' ? "text-indigo-400" : stat.color === 'emerald' ? "text-emerald-400" : stat.color === 'amber' ? "text-amber-400" : "text-rose-400")}>
                  {React.cloneElement(stat.icon, { size: 24 })}
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.title}</p>
                <h4 className="text-xl font-bold italic">{stat.value}</h4>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-[10%] right-[-5%] w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px]" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recruiter Network */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle>Premier Recruiter Network</CardTitle>
            <CardDescription>Major corporations participating in campus placement drives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {topRecruiters.map((company, i) => (
                <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-white hover:border-indigo-200 transition-all cursor-pointer group">
                  <span className="font-900 text-slate-400 group-hover:text-indigo-600 transition-colors italic uppercase tracking-tighter">{company}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Career Insights */}
        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader>
            <CardTitle>Placement Trend</CardTitle>
            <CardDescription>Branch-wise distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { branch: 'Computer/IT', percentage: 98, color: 'bg-indigo-500' },
              { branch: 'ENTC', percentage: 85, color: 'bg-purple-500' },
              { branch: 'Mechanical', percentage: 72, color: 'bg-amber-500' },
              { branch: 'Others', percentage: 65, color: 'bg-slate-400' },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px] font-900 uppercase tracking-widest">
                  <span className="text-slate-600 italic">{item.branch}</span>
                  <span className="text-indigo-600">{item.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className={cn("h-full rounded-full", item.color)} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-6 pt-0 mt-4">
             <Button variant="outline" className="w-full rounded-2xl h-12 text-[10px] font-bold uppercase tracking-widest italic group">
               Detailed Branch Report <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={14} />
             </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Placements;
