import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, mode, setMode, onAuth, loading }) => {
  const [authData, setAuthData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setAuthData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAuth(authData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg z-10"
      >
        <Card className="overflow-hidden border-none shadow-2xl">
          <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Side - Visual Decoration (Hidden on mobile) */}
            <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 border border-white/30">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-3xl font-900 tracking-tight leading-tight">
                  Join the Next Generation of <span className="text-indigo-200">Engineers.</span>
                </h3>
              </div>
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 backdrop-blur-sm border border-green-500/30 flex items-center justify-center">
                    <Sparkles size={14} className="text-green-400" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-100 italic">Advanced AI Insights</p>
                </div>
                <p className="text-sm text-indigo-100/80 leading-relaxed font-medium">
                  Unlock detailed round analysis and save your prediction history to track CAP progress.
                </p>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-[-20%] left-[-20%] w-80 h-80 bg-purple-500/20 rounded-full blur-3xl transition-transform hover:scale-110 duration-1000" />
            </div>

            {/* Right Side - Form */}
            <div className="p-8 md:p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-900 text-slate-900 tracking-tight">
                  {mode === 'login' ? 'Welcome Back' : 'Get Started'}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {mode === 'login' ? 'Continue where you left off' : 'Create your free intelligence account'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {mode === 'register' && (
                  <Input 
                    label="Full Name"
                    name="name"
                    placeholder="Enter your name"
                    icon={<User size={18} />}
                    required
                    value={authData.name}
                    onChange={handleChange}
                  />
                )}
                <Input 
                  label="Academic Email"
                  name="email"
                  type="email"
                  placeholder="name@university.edu"
                  icon={<Mail size={18} />}
                  required
                  value={authData.email}
                  onChange={handleChange}
                />
                <Input 
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock size={18} />}
                  required
                  value={authData.password}
                  onChange={handleChange}
                />

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full h-13 group"
                  loading={loading}
                  icon={<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                >
                  {mode === 'login' ? 'Secure Login' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-8 text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100"></span>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-4 text-slate-400 font-bold uppercase tracking-widest">Authentication</span>
                  </div>
                </div>

                <p className="text-sm font-bold">
                  <span className="text-slate-500">{mode === 'login' ? "Don't have an account?" : "Already a member?"}</span>{' '}
                  <button 
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {mode === 'login' ? 'Register Now' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthModal;
