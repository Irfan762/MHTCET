import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { 
  Mail, 
  MessageSquare, 
  PhoneCall, 
  Users, 
  Building2, 
  Send,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

const Connect = () => {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <Card className="p-12 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users size={32} />
          </div>
          <h2 className="text-4xl font-900 text-white tracking-tight leading-tight">
            Direct <span className="text-indigo-400">Institutional Interface</span>
          </h2>
          <p className="text-lg text-slate-400 font-medium leading-relaxed italic">
            Strategic communication architecture connecting prospective engineering students with verified institutional administration and placement cells.
          </p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Inquiry Form */}
        <Card className="border-none shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle>Inquiry Dispatch</CardTitle>
            <CardDescription>Send an official inquiry to institutional representatives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
               <Input label="Student Name" placeholder="Ex: Rahul S." className="h-12 rounded-2xl" />
               <Input label="Contact Matrix" placeholder="email@example.com" className="h-12 rounded-2xl" />
             </div>
             <Input label="Target Institution" placeholder="Select College..." className="h-12 rounded-2xl" />
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 italic">Intelligence Query</label>
               <textarea 
                 className="w-full h-32 p-6 rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-sm font-medium italic"
                 placeholder="Formulate your institutional inquiry here..."
               />
             </div>
             <Button variant="primary" className="w-full h-14 rounded-[2rem] shadow-xl shadow-indigo-600/20 group">
               Transmit Query <Send className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={18} />
             </Button>
          </CardContent>
        </Card>

        {/* Channels */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 p-8 flex items-center gap-6 group hover:ring-2 hover:ring-indigo-500/10 transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <PhoneCall size={24} />
            </div>
            <div>
              <h4 className="font-800 text-slate-900 tracking-tight uppercase italic">VIP Counseling Line</h4>
              <p className="text-xs font-medium text-slate-500 italic mt-1 uppercase tracking-wider">Priority access for premium intelligence users</p>
            </div>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 p-8 flex items-center gap-6 group hover:ring-2 hover:ring-indigo-500/10 transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <MessageSquare size={24} />
            </div>
            <div>
              <h4 className="font-800 text-slate-900 tracking-tight uppercase italic">Secure Chat Protocol</h4>
              <p className="text-xs font-medium text-slate-500 italic mt-1 uppercase tracking-wider">Real-time interface with admission specialists</p>
            </div>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 p-10 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden group shadow-2xl shadow-indigo-600/30">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-md">
                <Sparkles size={12} />
                <span className="text-[10px] font-900 uppercase tracking-widest leading-none pt-0.5">Enterprise Verification</span>
              </div>
              <h4 className="text-2xl font-900 tracking-tight italic">Verified Institutional Status</h4>
              <p className="text-sm font-medium text-indigo-100/80 italic leading-relaxed">Institutions with the <ShieldCheck size={14} className="inline mb-1" /> badge have undergone rigorous intelligence audit for placement data accuracy.</p>
              <Button variant="glass" className="h-12 px-8 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white border-white/20 mt-2">View Audit Reports</Button>
            </div>
            <Building2 className="absolute -bottom-10 -right-10 text-white/5 w-48 h-48 rotate-12 group-hover:scale-110 transition-transform duration-700" />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Connect;
