import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { 
  Users, 
  ShieldCheck, 
  Search, 
  Mail, 
  Trash2, 
  Edit3, 
  UserPlus,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const AdminPanel = ({ users, onAddUser, onDeleteUser, onEditUser }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-10">
      {/* Admin Hero */}
      <Card className="p-12 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="space-y-6">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
               <ShieldCheck size={16} />
               <span className="text-[10px] font-bold uppercase tracking-widest pt-0.5">Administrative Access</span>
             </div>
             <h2 className="text-4xl font-900 text-white tracking-tight leading-tight">
               Student <span className="text-indigo-400">Intelligence Nexus</span>
             </h2>
             <p className="text-lg text-slate-400 font-medium max-w-lg leading-relaxed italic">
               Manage user identities, oversee system interactions, and maintain institutional mapping integrity across the MHT-CET ecosystem.
             </p>
           </div>
           
           <div className="grid grid-cols-2 gap-4 shrink-0">
             <div className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 text-white text-center">
                <Users className="text-indigo-400 mx-auto mb-3" size={32} />
                <h4 className="text-3xl font-900 italic">{users?.length || 0}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Active Profiles</p>
             </div>
             <div className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 text-white text-center">
                <ShieldCheck className="text-emerald-400 mx-auto mb-3" size={32} />
                <h4 className="text-3xl font-900 italic">SECURED</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Audit Status</p>
             </div>
           </div>
        </div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </Card>

      {/* User Management */}
      <Card className="border-none shadow-xl shadow-slate-200/50">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-10">
          <div>
            <CardTitle>Registered Userbase</CardTitle>
            <CardDescription>Comprehensive list of authenticated students and administrators</CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Input 
                placeholder="Find persona..." 
                className="h-12 w-64 rounded-2xl pl-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
            <Button variant="primary" className="h-12 rounded-2xl px-6 uppercase tracking-widest font-bold shadow-lg shadow-indigo-600/10" icon={<UserPlus size={18} />}>
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 border-t border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-10 py-5 text-[10px] font-900 text-slate-400 uppercase tracking-widest italic">Identity</th>
                  <th className="px-10 py-5 text-[10px] font-900 text-slate-400 uppercase tracking-widest italic">Role</th>
                  <th className="px-10 py-5 text-[10px] font-900 text-slate-400 uppercase tracking-widest italic">Created At</th>
                  <th className="px-10 py-5 text-[10px] font-900 text-slate-400 uppercase tracking-widest italic text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user, i) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                          {user.name?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-800 text-slate-900 tracking-tight italic">{user.name}</p>
                          <p className="text-xs font-medium text-slate-400 italic">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest italic",
                        user.role === 'admin' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                      )}>
                        {user.role || 'Student'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-xs font-medium text-slate-400 italic">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-10 py-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl">
                            <Edit3 size={16} />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => onDeleteUser(user._id)} className="h-10 w-10 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                            <Trash2 size={16} />
                         </Button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <Search className="mx-auto text-slate-200" size={48} />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Identity lookup failed. No matches in database.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
