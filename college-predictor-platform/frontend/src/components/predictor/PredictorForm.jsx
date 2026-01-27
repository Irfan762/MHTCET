import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Checkbox } from '../common/Checkbox';
import { Button } from '../common/Button';
import { Percent, MapPin, Users, School, Sparkles } from 'lucide-react';

const PredictorForm = ({ formData, setFormData, onSubmit, loading, courseOptions }) => {
  const categories = [
    'General', 'OBC', 'SC', 'ST', 'VJ/DT(A)', 'NT(B)', 'NT(C)', 'NT(D)', 'SBC', 'EWS'
  ];

  const universityTypes = [
    'Home University', 'Other Than Home University', 'State Level'
  ];

  const cities = [
    'All Cities', 'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Amravati', 'Kolhapur', 'Sangli', 'Solapur'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCourseToggle = (course) => {
    setFormData(prev => {
      const currentCourses = prev.courses || [];
      const newCourses = currentCourses.includes(course)
        ? currentCourses.filter(c => c !== course)
        : [...currentCourses, course];
      return { ...prev, courses: newCourses };
    });
  };

  return (
    <Card className="max-w-4xl mx-auto overflow-hidden border-none shadow-2xl shadow-indigo-500/5">
      <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
          <Sparkles size={24} />
        </div>
        <CardTitle className="text-3xl font-900 tracking-tight">AI Admission Predictor</CardTitle>
        <CardDescription className="text-base">
          Our advanced algorithm analyzes historical cutoffs across multiple CAP rounds to predict your best fit.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-10">
        <form onSubmit={onSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input 
              label="MHT-CET Percentile"
              name="percentile"
              type="number"
              step="0.0000001"
              placeholder="e.g. 98.45"
              icon={<Percent size={18} />}
              value={formData.percentile}
              onChange={handleChange}
              required
            />
            
            <Select 
              label="Candidature Category"
              name="category"
              options={categories.map(c => ({ label: c, value: c }))}
              value={formData.category}
              onChange={handleChange}
            />

            <Select 
              label="University Type"
              name="universityType"
              options={universityTypes.map(u => ({ label: u, value: u }))}
              value={formData.universityType}
              onChange={handleChange}
            />

            <Select 
              label="Preferred City"
              name="city"
              options={cities.map(c => ({ label: c, value: c }))}
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider block">
              Target Branches
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {courseOptions.map(course => (
                <button
                  key={course}
                  type="button"
                  onClick={() => handleCourseToggle(course)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 border-2 flex items-center justify-between group ${
                    formData.courses?.includes(course)
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
                  }`}
                >
                  <span className="truncate mr-2 uppercase tracking-wide">{course}</span>
                  {formData.courses?.includes(course) && (
                    <div className="shrink-0 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8 py-4 px-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
            <Checkbox 
              label="Include TFWS Seats"
              name="includeTFWS"
              checked={formData.includeTFWS}
              onChange={handleChange}
            />
            <Checkbox 
              label="Include Ladies Quota"
              name="includeLadies"
              checked={formData.includeLadies}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              loading={loading}
              className="w-full sm:w-auto min-w-[300px] h-14 text-base"
              icon={<Sparkles size={20} />}
            >
              Generate Strategic Prediction
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PredictorForm;
