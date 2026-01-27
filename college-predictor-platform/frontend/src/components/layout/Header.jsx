import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, X, Calendar, User as UserIcon, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const Header = ({ 
  title, 
  subtitle, 
  user, 
  onNotificationClick, 
  notificationCount,
  onAuthClick
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    
    const timer = setInterval(() => setDateTime(new Date()), 60000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full transition-all duration-300 px-8 py-4 flex items-center justify-between",
      isScrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm" : "bg-transparent"
    )}>
      {/* Page Title Section */}
      <div className="flex flex-col">
        <motion.h2 
          key={title}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-800 tracking-tight text-slate-900"
        >
          {title}
        </motion.h2>
        <p className="text-sm font-medium text-slate-500">{subtitle}</p>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-6">
        {/* Search Bar - Professional look */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all duration-200 w-80 shadow-inner">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search prediction history, colleges..." 
            className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-full placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300 bg-white font-mono text-[10px] font-medium text-slate-400 shadow-sm">
            CMD K
          </kbd>
        </div>

        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Calendar size={16} className="text-indigo-500" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{formatDate(dateTime)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onNotificationClick}
            className="relative p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200 shadow-sm group"
          >
            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900">{user.name}</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{user.role}</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden group hover:ring-2 hover:ring-indigo-500/20 transition-all">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={20} className="text-slate-500 group-hover:scale-110 transition-transform" />
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="px-5 py-2.5 bg-slate-950 text-white text-sm font-bold rounded-2xl flex items-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-950/20 transition-all duration-300 active:scale-95"
            >
              <LogIn size={18} />
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
