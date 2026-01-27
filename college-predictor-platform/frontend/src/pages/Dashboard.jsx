import React from 'react';
import StatsCard from '../components/dashboard/StatsCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { 
  Users, 
  GraduationCap, 
  Target, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Sparkles,
  School
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const Dashboard = ({ user, collegesCount, predictionsCount, onAction }) => {
  return (
    <div className="space-y-10">
      {/* Hero / Welcome Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-10 rounded-[3rem] bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl"
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none pt-0.5">Empowered by AI Intelligence</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-900 text-white tracking-tight leading-tight">
              Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{user?.name || 'Academician'}</span>
            </h2>
            <p className="text-lg text-slate-400 font-medium max-w-lg leading-relaxed">
              Your engineering journey is strategically mapped. Explore 328+ institutions and generate data-driven admission reports instantly.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button 
                variant="primary" 
                size="lg" 
                className="h-14 px-8 rounded-2xl"
                onClick={() => onAction('predictor')}
                icon={<Target size={20} />}
              >
                Run New Prediction
              </Button>
              <Button 
                variant="glass" 
                size="lg" 
                className="h-14 px-8 rounded-2xl"
                onClick={() => onAction('colleges')}
                icon={<School size={20} />}
              >
                Explore Colleges
              </Button>
            </div>
          </div>
          
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-10">
              <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 text-white">
                <Target className="text-indigo-400 mb-3" size={24} />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Precision</p>
                <h4 className="text-xl font-bold italic">99.8% AI Model</h4>
              </div>
              <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 text-white">
                <TrendingUp className="text-emerald-400 mb-3" size={24} />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Coverage</p>
                <h4 className="text-xl font-bold italic">3CAP Rounds</h4>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 text-white">
                <Users className="text-purple-400 mb-3" size={24} />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Trust</p>
                <h4 className="text-xl font-bold italic">22K+ Dataset</h4>
              </div>
              <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 text-white">
                <GraduationCap className="text-amber-400 mb-3" size={24} />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Quality</p>
                <h4 className="text-xl font-bold italic">127 Autonomous</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]" />
      </motion.section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Colleges" 
          value={collegesCount || "328"} 
          icon={<GraduationCap />} 
          trend="up" 
          trendValue="12.5%"
          color="indigo"
        />
        <StatsCard 
          title="AI Predictions" 
          value={predictionsCount || "0"} 
          icon={<Target />} 
          trend="up" 
          trendValue="8.2%"
          color="emerald"
        />
        <StatsCard 
          title="Placement Index" 
          value="84.2%" 
          icon={<TrendingUp />} 
          trend="up" 
          trendValue="4.1%"
          color="amber"
        />
        <StatsCard 
          title="Avg Feedback" 
          value="4.9/5" 
          icon={<Users />} 
          trend="up" 
          trendValue="0.8%"
          color="rose"
        />
      </section>

      {/* Main Grid: Trends & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Updates / Notification Feed */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Updates & Announcements</CardTitle>
              <CardDescription>Stay updated with CAP round releases and verification deadlines</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest">View Archives</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: 'CAP Round 1 Seat Allocation', date: 'Just now', type: 'critical', desc: 'The provisional seat matrix for Round 1 is now live for institutional verification.' },
              { title: 'Document Verification Reminder', date: '2 hours ago', type: 'warning', desc: 'SC/ST category students must complete physical verification before the deadline.' },
              { title: 'AI Model v2.4 Release', date: 'Yesterday', type: 'success', desc: 'Enhanced prediction engine now incorporates TFWS and Female quota trends.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-3xl bg-slate-50 border border-transparent hover:border-slate-200 transition-colors cursor-pointer group">
                <div className={cn(
                  "w-2 h-12 rounded-full shrink-0",
                  item.type === 'critical' ? "bg-rose-500 shadow-lg shadow-rose-500/20" :
                  item.type === 'warning' ? "bg-amber-500 shadow-lg shadow-amber-500/20" :
                  "bg-emerald-500 shadow-lg shadow-emerald-500/20"
                )} />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic">{item.title}</h5>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed font-sans">{item.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions / Shortcuts */}
        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="h-2 bg-indigo-500" />
          <CardHeader>
            <CardTitle>Quick Intelligence Actions</CardTitle>
            <CardDescription>Rapid access to discovery tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Download History PDF', icon: <Calendar size={18} />, action: () => {} },
              { label: 'Compare Round Cutoffs', icon: <TrendingUp size={18} />, action: () => onAction('analysis') },
              { label: 'Contact AI Counselor', icon: <Sparkles size={18} />, action: () => onAction('chat') },
              { label: 'Update Academic Profile', icon: <Users size={18} />, action: () => {} },
            ].map((action, i) => (
              <Button 
                key={i} 
                variant="outline" 
                className="w-full justify-between h-auto py-5 px-6 rounded-2xl group border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                onClick={action.action}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    {action.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest italic">{action.label}</span>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </Button>
            ))}
          </CardContent>
          <div className="p-8 pt-0 mt-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden group cursor-pointer shadow-lg shadow-indigo-600/20">
              <div className="relative z-10">
                <h5 className="font-900 text-lg mb-2">Upgrade to Expert?</h5>
                <p className="text-xs text-indigo-100/80 mb-4 font-medium leading-relaxed italic">Get personalized counseling from MHT-CET experts and premium data insights.</p>
                <Button variant="glass" size="sm" className="bg-white/20 hover:bg-white/30 border-white/20 h-10 w-full rounded-xl uppercase tracking-widest text-[10px]">Learn More</Button>
              </div>
              <Sparkles className="absolute -bottom-4 -right-4 text-white/5 w-24 h-24 rotate-12 group-hover:scale-125 transition-transform duration-500" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
