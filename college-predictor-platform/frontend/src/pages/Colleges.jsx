import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { 
  Search, 
  MapPin, 
  School, 
  ArrowUpRight, 
  Filter, 
  ShieldCheck, 
  Star,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const Colleges = ({ colleges }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('All Cities');
  
  const cities = useMemo(() => {
    const list = new Set(colleges.map(c => c.city || c.location).filter(Boolean));
    return ['All Cities', ...Array.from(list).sort()];
  }, [colleges]);

  const filteredColleges = useMemo(() => {
    return colleges.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (c.city || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = cityFilter === 'All Cities' || (c.city || c.location) === cityFilter;
      return matchesSearch && matchesCity;
    });
  }, [colleges, searchTerm, cityFilter]);

  return (
    <div className="space-y-10">
      {/* Search and Filters */}
      <Card className="border-none shadow-xl shadow-slate-200/50">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="md:col-span-2">
              <Input 
                label="Search Institutions"
                placeholder="Search by name, city, or specialization..."
                icon={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-14 rounded-2xl"
              />
            </div>
            <Select 
              label="Instituional Location"
              options={cities.map(c => ({ label: c, value: c }))}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-14 rounded-2xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* College Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredColleges.slice(0, 50).map((college, index) => (
          <motion.div
            key={college._id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % 12) * 0.05 }}
          >
            <Card className="h-full group hover:ring-2 hover:ring-indigo-500/20 border-slate-200 overflow-hidden flex flex-col shadow-sm">
              <div className="p-6 relative">
                {/* Visual indicator for autonomous */}
                {college.autonomous && (
                  <div className="absolute top-6 right-6 px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest border border-amber-100 flex items-center gap-1">
                    <ShieldCheck size={10} /> Autonomous
                  </div>
                )}
                
                <div className="flex items-start gap-4 pr-20">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                    <School size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-800 text-slate-900 line-clamp-2 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors">
                      {college.name}
                    </h4>
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                      <MapPin size={12} className="text-indigo-500" />
                      {college.city || college.location}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-4 flex-1">
                <div className="h-px bg-slate-100 w-full" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none italic">Est. Year</p>
                    <p className="text-sm font-800 text-slate-700 uppercase tracking-tight italic">{college.establishedIn || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none italic">Cutoff Range</p>
                    <p className="text-sm font-800 text-indigo-600 uppercase tracking-tight italic">{college.cutoffHigh ? `${college.cutoffLow}-${college.cutoffHigh}` : 'Expert Only'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="inline-block h-6 w-6 rounded-full bg-slate-200 border-2 border-white ring-2 ring-transparent group-hover:ring-indigo-50 transition-all shadow-sm" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider">Join 1.2k+ applicants</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] py-3 italic">
                  Details <Info className="ml-1.5" size={12} />
                </Button>
                <Button variant="primary" size="sm" className="flex-1 rounded-xl shadow-indigo-600/10 h-10 italic">
                  Visit Site <ExternalLink className="ml-1.5" size={12} />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredColleges.length === 0 && (
        <div className="py-40 text-center">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-900 text-slate-900 tracking-tight">Intelligence Failure: No matches found</h3>
          <p className="text-sm font-medium text-slate-500 italic uppercase tracking-widest mt-2 px-10">Adjust your search parameters to discover other premier institutions.</p>
        </div>
      )}
    </div>
  );
};

export default Colleges;
