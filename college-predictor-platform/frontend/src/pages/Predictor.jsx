import React, { useState } from 'react';
import PredictorForm from '../components/predictor/PredictorForm';
import ResultCard from '../components/predictor/ResultCard';
import DetailsModal from '../components/predictor/DetailsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Filter, Download, Trash2, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { Button } from '../components/common/Button';

const Predictor = ({ 
  formData, 
  setFormData, 
  predictions, 
  loading, 
  onPredict, 
  onDownloadPDF, 
  onDownloadAll,
  courseOptions 
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShowDetails = (college) => {
    setSelectedCollege({
      ...college,
      percentile: formData.percentile,
      category: formData.category
    });
    setIsModalOpen(true);
  };
  
  return (
    <div className="space-y-12">
      {/* Search/Form Area */}
      <section>
        <PredictorForm 
          formData={formData} 
          setFormData={setFormData} 
          onSubmit={onPredict} 
          loading={loading}
          courseOptions={courseOptions}
        />
      </section>

      {/* Results Area */}
      <AnimatePresence>
        {predictions && predictions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="space-y-8"
          >
            {/* Results Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-900 tracking-tight text-slate-900">Expert Recommendations</h3>
                  <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest italic">Found {predictions.length} High-Affinity matches for your profile</p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-3">
                <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mr-2 shadow-inner">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <List size={18} />
                  </button>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-2xl border-slate-200 font-bold uppercase tracking-widest h-11"
                  icon={<Download size={16} />}
                  onClick={onDownloadAll}
                >
                  Export All
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="rounded-2xl h-11 px-6 shadow-indigo-600/10"
                  icon={<Filter size={16} />}
                >
                  Refine Filter
                </Button>
              </div>
            </div>

            {/* Grid vs List View */}
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" 
              : "space-y-6 max-w-5xl mx-auto"
            }>
              {predictions.map((prediction, index) => (
                <ResultCard 
                  key={index} 
                  prediction={prediction} 
                  onDownloadPDF={onDownloadPDF}
                  onShowDetails={handleShowDetails}
                />
              ))}
            </div>

            {/* Call to action */}
            {predictions.length > 12 && (
              <div className="flex justify-center pt-8 pb-12">
                <Button variant="secondary" size="lg" className="rounded-3xl border-none shadow-lg">
                  Load Strategic Samples <ArrowRight className="ml-2" size={18} />
                </Button>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
      
      {/* Empty State */}
      {!loading && (!predictions || predictions.length === 0) && (
        <section className="py-20 flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 rounded-[2rem] bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center text-slate-300">
            <Sparkles size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-900 tracking-tight text-slate-400">Ready to Discover?</h3>
            <p className="text-slate-400 font-medium italic max-w-sm mx-auto uppercase text-[10px] tracking-widest">Input your academic metrics above to generate institution affinity mapping.</p>
          </div>
        </section>
      )}

      {/* Details Modal Pop-up */}
      <AnimatePresence>
        {isModalOpen && (
          <DetailsModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            prediction={selectedCollege} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Predictor;
