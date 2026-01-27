import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  LineChart, 
  Layers, 
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const Analysis = () => {
  const roundInsights = [
    { 
      round: 'Round 1', 
      status: 'Stable', 
      trend: 'up', 
      percentile: '+0.45%', 
      desc: 'Significant competition in Tier-1 Computer Engineering branches.',
      color: 'bg-indigo-500 shadow-indigo-500/20'
    },
    { 
      round: 'Round 2', 
      status: 'Volatile', 
      trend: 'down', 
      percentile: '-1.20%', 
      desc: 'Better vacancy reported in autonomous institutions compared to previous year.',
      color: 'bg-amber-500 shadow-amber-500/20'
    },
    { 
      round: 'Round 3', 
      status: 'Opportunistic', 
      trend: 'neutral', 
      percentile: '0.00%', 
      desc: 'Strategic branch-shifting observed in suburban college clusters.',
      color: 'bg-emerald-500 shadow-emerald-500/20'
    }
  ];

  return (
    <div className="space-y-10">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-10 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <LineChart size={24} />
              </div>
              <h2 className="text-4xl font-900 text-white tracking-tight leading-tight">
                Strategic <span className="text-indigo-400">Trend Intelligence</span>
              </h2>
              <p className="text-lg text-slate-400 font-medium max-w-lg leading-relaxed italic">
                Advanced cross-round percentile fluctuation mapping for Maharashtra CAP admissions.
              </p>
            </div>
            
            <div className="mt-12 flex gap-8 items-center border-t border-slate-800 pt-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confidence</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white italic">High-98%</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 h-3 bg-indigo-500/50 rounded-full" />)}
                  </div>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-800" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data Source</p>
                <p className="text-2xl font-bold text-white italic">CET Cell Official</p>
              </div>
            </div>
          </div>
          
          <div className="absolute top-[10%] right-[-5%] w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000" />
        </Card>

        {/* Quick Intelligence Panel */}
        <Card className="border-none shadow-xl shadow-slate-200/50 p-8 space-y-6">
          <CardTitle className="flex items-center gap-3 italic">
            <Zap size={20} className="text-amber-500" />
            Live Insights
          </CardTitle>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider italic">CS Dominance</h5>
              <p className="text-xs font-medium text-slate-500 leading-relaxed italic">Cutoffs for Comp/IT branches are rising by approx 0.8% annually across Tier-1 colleges.</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2">
              <h5 className="font-bold text-indigo-700 text-xs uppercase tracking-wider italic">Strategic Pivot</h5>
              <p className="text-xs font-medium text-indigo-600 leading-relaxed italic">Students with 95+ percentile should target autonomous institutions for better placement index.</p>
            </div>
          </div>
          <button className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 border border-dashed border-slate-200 hover:border-indigo-200 rounded-2xl transition-all h-auto italic">
            Generate Detailed Report
          </button>
        </Card>
      </div>

      {/* Round Breakdown */}
      <h3 className="text-2xl font-900 tracking-tight text-slate-900 flex items-center gap-3 pl-2">
        <Layers size={24} className="text-indigo-600" />
        Multi-Round Stratigraphy
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {roundInsights.map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -8 }}
            className="relative"
          >
            <Card className="h-full border-none shadow-xl shadow-slate-200/40 p-1 bg-white overflow-hidden">
              <div className={cn("h-1.5 w-full rounded-t-full mb-1", item.color)} />
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-900 text-slate-400 uppercase tracking-widest leading-none italic">{item.round}</span>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1",
                    item.trend === 'up' ? "bg-rose-50 text-rose-600" : 
                    item.trend === 'down' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
                  )}>
                    {item.trend === 'up' ? <ArrowUpRight size={10} /> : 
                     item.trend === 'down' ? <ArrowDownRight size={10} /> : <Clock size={10} />}
                    {item.percentile}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-2xl font-900 text-slate-900 tracking-tight italic">{item.status}</h4>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                    {item.desc}
                  </p>
                </div>

                <ul className="space-y-3 pt-4">
                  {[1, 2, 3].map(j => (
                    <li key={j} className="flex gap-3 items-center text-xs font-bold text-slate-700 italic group">
                      <CheckCircle2 size={16} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                      Strategic point {j} identification
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Analysis;
