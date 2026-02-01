import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '../../utils/cn';

const Layout = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  user, 
  notificationsCount, 
  onLogout,
  onOpenAuth
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Map active tab to header title
  const getHeaderInfo = (tab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Strategic overview of your admission journey' };
      case 'predictor':
        return { title: 'AI Predictor', subtitle: 'Advanced percentile-based college recommendations' };
      case 'colleges':
        return { title: 'Colleges', subtitle: 'Explore 328+ premier engineering institutions' };
      case 'placements':
        return { title: 'Placements', subtitle: 'Real-world career outcome data for every branch' };
      case 'notifications':
        return { title: 'Notifications', subtitle: 'Latest admission alerts and CAP round updates' };
      case 'connect':
        return { title: 'Connect', subtitle: 'Direct inquiries to college admission desks' };
      case 'results':
        return { title: 'My Results', subtitle: 'Your personalized prediction repository' };
      case 'analysis':
        return { title: 'Round Analysis', subtitle: 'Multi-round cutoff trend intelligence' };
      case 'intelligence':
        return { title: 'Intelligence Assistant', subtitle: 'Advanced AI-powered admission strategy advisor' };
      case 'adminUser':
        return { title: 'Admin Panel', subtitle: 'Institutional student management dashboard' };
      default:
        return { title: 'Overview', subtitle: 'Welcome back to MHT-CET Pro' };
    }
  };

  const headerInfo = getHeaderInfo(activeTab);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar background overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        notificationsCount={notificationsCount}
        onLogout={onLogout}
      />

      <main className={cn(
        "flex-1 flex flex-col transition-all duration-300 min-w-0",
        sidebarOpen ? "lg:ml-72" : "lg:ml-24"
      )}>
        <Header 
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          user={user}
          notificationCount={notificationsCount}
          onNotificationClick={() => setActiveTab('notifications')}
          onAuthClick={onOpenAuth}
        />
        
        <div className="flex-1 p-8 pt-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-6">
            {children}
          </div>
        </div>
        
        {/* Simple Footer */}
        <footer className="px-8 py-6 border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs font-medium text-slate-500 italic">
              Empowering engineers through data-driven decisions.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Privacy Policy</a>
              <a href="#" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Terms of Service</a>
              <a href="#" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Support</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Layout;
