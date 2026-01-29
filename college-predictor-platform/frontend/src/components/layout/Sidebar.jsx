import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  BarChart3, 
  GraduationCap, 
  Briefcase, 
  Bell, 
  Mail, 
  ClipboardList, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '../../utils/cn';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen, 
  user, 
  notificationsCount,
  onLogout 
}) => {
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, desc: 'Overview & Stats' },
    { id: 'predictor', label: 'AI Predictor', icon: <BarChart3 size={20} />, desc: 'Smart Predictions' },
    { id: 'colleges', label: 'Colleges', icon: <GraduationCap size={20} />, desc: 'Explore Colleges' },
    { id: 'placements', label: 'Placements', icon: <Briefcase size={20} />, desc: 'Career Data' },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: <Bell size={20} />, 
      desc: 'Important Alerts', 
      badge: notificationsCount 
    },
    { id: 'connect', label: 'Connect', icon: <Mail size={20} />, desc: 'Contact Colleges' },
    { id: 'results', label: 'My Results', icon: <ClipboardList size={20} />, desc: 'Your Predictions' },
    { id: 'analysis', label: 'Round Analysis', icon: <TrendingUp size={20} />, desc: 'Multi-Round Trends' },
    { id: 'intelligence', label: 'Intelligence Assistant', icon: <Sparkles size={20} />, desc: 'Privacy-First AI' },
    { id: 'chat', label: 'AI Help', icon: <Mail size={20} />, desc: 'General Support' },
    ...(user?.role === 'admin' ? [{ id: 'adminUser', label: 'Admin Panel', icon: <ShieldCheck size={20} />, desc: 'Student Management' }] : [])
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 88 }}
      className={cn(
        "fixed top-0 left-0 h-screen bg-slate-950 text-slate-300 flex flex-col z-50 border-r border-slate-800/50 shadow-2xl transition-all duration-300",
        !isOpen && "items-center"
      )}
    >
      {/* Brand Header */}
      <div className={cn(
        "p-6 flex items-center gap-3 h-20 border-b border-slate-800/50",
        !isOpen && "justify-center p-4 px-0"
      )}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <GraduationCap className="text-white" size={24} />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-xl tracking-tight text-white whitespace-nowrap"
            >
              MHT-CET <span className="text-indigo-400">Pro</span>
            </motion.h1>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
              activeTab === item.id 
                ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.1)]" 
                : "hover:bg-slate-900 hover:text-white"
            )}
          >
            <div className={cn(
              "shrink-0 transition-transform duration-200 group-hover:scale-110",
              activeTab === item.id ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
            )}>
              {item.icon}
            </div>
            
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col items-start overflow-hidden"
                >
                  <span className="font-semibold text-sm whitespace-nowrap">{item.label}</span>
                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{item.desc}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {item.badge > 0 && (
              <div className={cn(
                "absolute bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] px-1 shadow-sm shadow-indigo-500/50",
                isOpen ? "right-3" : "top-2 right-2"
              )}>
                {item.badge}
              </div>
            )}

            {activeTab === item.id && (
              <motion.div
                layoutId="active-indicator"
                className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className={cn(
        "p-4 border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-sm",
        !isOpen && "flex flex-col items-center"
      )}>
        {user ? (
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-slate-900/50 ring-1 ring-slate-800/50",
            !isOpen && "justify-center w-12 h-12 p-0"
          )}>
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0 border border-slate-700">
              <span className="text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
            </div>
            {isOpen && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-white truncate">{user.name}</span>
                <span className="text-[10px] font-medium text-slate-500 truncate">{user.email}</span>
              </div>
            )}
            {isOpen && (
              <button 
                onClick={onLogout}
                className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        ) : isOpen && (
          <button 
            onClick={() => setActiveTab('login')}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200"
          >
            Sign In
          </button>
        )}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "mt-4 w-full flex items-center justify-center py-2 text-slate-500 hover:text-white transition-colors",
            !isOpen && "mt-2"
          )}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
