import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Trash2, History, PlusCircle, Maximize2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../common/Card';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';

const ChatWidget = ({ 
  messages, 
  input, 
  setInput, 
  onSend, 
  loading, 
  sessions, 
  currentSessionId,
  onNewChat,
  onLoadSession,
  onDeleteSession,
  onDeleteAll,
  showHistory,
  setShowHistory,
  isIntelligence = false
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex gap-8 h-[calc(100vh-200px)] max-w-6xl mx-auto">
      {/* Sidebar - History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: -20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 300 }}
            exit={{ opacity: 0, x: -20, width: 0 }}
            className="hidden lg:flex flex-col gap-4 overflow-hidden"
          >
            <Card className="flex-1 flex flex-col border-none shadow-xl shadow-slate-200/50">
              <CardHeader className="p-6 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-900 text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <History size={14} className="text-indigo-500" /> Recent Dialogues
                  </span>
                  <button onClick={onDeleteAll} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-dashed border-2 hover:bg-slate-50 group py-6 h-auto"
                  onClick={onNewChat}
                  icon={<PlusCircle size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />}
                >
                  New Strategic Session
                </Button>
                
                {sessions.map((session) => (
                  <div 
                    key={session.sessionId}
                    className={cn(
                      "group relative p-4 rounded-2xl cursor-pointer transition-all border-2",
                      currentSessionId === session.sessionId 
                        ? "bg-indigo-50 border-indigo-200" 
                        : "bg-white border-transparent hover:border-slate-100 hover:bg-slate-50"
                    )}
                    onClick={() => onLoadSession(session.sessionId)}
                  >
                    <div className="pr-8">
                      <p className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                        {session.firstMessage || 'Admission Inquiry'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {formatTime(session.timestamp)}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.sessionId);
                      }}
                      className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-2xl shadow-indigo-500/5">
        <CardHeader className="p-6 border-b border-slate-50 bg-white/50 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <Sparkles size={20} />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {isIntelligence ? 'MHT-CET Intelligence Assistant' : 'AI Helpdesk'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    isIntelligence ? "bg-purple-500 animate-pulse" : "bg-emerald-500"
                  )} />
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isIntelligence ? "text-purple-600" : "text-emerald-600"
                  )}>
                    {isIntelligence ? 'Privacy-Shield Active (No Logs)' : 'Support Online'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isIntelligence && (
                <>
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                    title="Toggle History"
                  >
                    <History size={20} />
                  </button>
                  <button className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
                    <Maximize2 size={20} />
                  </button>
                </>
              )}
              {isIntelligence && (
                <div className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-900 uppercase tracking-widest flex items-center gap-2 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  Encrypted & Stateless
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 custom-scrollbar">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id || index}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-start gap-4",
                msg.type === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                msg.type === 'user' 
                  ? "bg-slate-900 text-white" 
                  : "bg-indigo-600 text-white bg-gradient-to-br from-indigo-500 to-purple-600"
              )}>
                {msg.type === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div className={cn(
                "max-w-[80%] space-y-2",
                msg.type === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "p-5 rounded-[2rem] text-sm font-semibold leading-relaxed shadow-sm",
                  msg.type === 'user' 
                    ? "bg-slate-900 text-white rounded-tr-none" 
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                )}>
                  {msg.message}
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-2",
                  msg.type === 'user' ? "justify-end" : "justify-start"
                )}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {msg.type === 'user' ? 'YOU' : 'AI EXPERT'} • {formatTime(msg.timestamp || new Date())}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot size={20} />
              </div>
              <div className="flex gap-1.5 p-5 bg-white border border-slate-200 rounded-[2rem] rounded-tl-none shadow-sm">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-300 rounded-full" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="p-6 bg-white border-t border-slate-50">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              onSend();
            }}
            className="flex items-center gap-4 w-full"
          >
            <div className="relative flex-1 group">
              <input
                type="text"
                placeholder="Ask about cutoffs, placement trends, or fee structures..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-14 pl-6 pr-14 rounded-3xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400">
                <Sparkles size={18} />
              </div>
            </div>
            <Button 
              type="submit" 
              variant="primary" 
              size="icon" 
              className="w-14 h-14 rounded-3xl shrink-0 shadow-lg shadow-indigo-600/20 active:scale-90"
              disabled={!input.trim() || loading}
            >
              <Send size={20} />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatWidget;
