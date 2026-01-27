import { useState, useEffect, useRef, useCallback } from 'react';

export const useAppLogic = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [predictions, setPredictions] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [notifications, setNotifications] = useState([]);
  
  // Chat states
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: '🎓 Welcome to MHT-CET Pro Intelligence. I am your strategic advisor for Maharashtra engineering admissions. How can I assist you with institution mapping or cutoff trends today?',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);

  const [formData, setFormData] = useState({
    percentile: '',
    category: 'General',
    courses: ['Computer Engineering'],
    universityType: 'Home University',
    includeTFWS: false,
    includeLadies: false,
    city: 'All Cities'
  });

  const courseOptions = [
    'Computer Engineering',
    'Information Technology',
    'Electronics & Telecom',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Artificial Intelligence & Data Science',
    'Chemical Engineering'
  ];

  const addNotification = useCallback((message, type = 'info') => {
    const notification = { id: Date.now(), message, type, timestamp: new Date() };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3001/api/colleges');
      const data = await response.json();
      if (data.success) setColleges(data.colleges);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const loadPredictionHistory = async (token) => {
    if (!token) return;
    try {
      const response = await fetch('http://127.0.0.1:3001/api/predictions/history', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      const data = await response.json();
      if (data.success) setPredictionHistory(data.predictions || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleAuth = async (authData) => {
    setLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(`http://127.0.0.1:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(authData),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('mhtcet_user', JSON.stringify(data.user));
        localStorage.setItem('mhtcet_token', data.token);
        setShowAuthModal(false);
        addNotification(`Success! Authenticated as ${data.user.name}`, 'success');
        loadPredictionHistory(data.token);
      } else {
        addNotification(data.message || 'Auth failed', 'error');
      }
    } catch (error) {
      addNotification('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mhtcet_user');
    localStorage.removeItem('mhtcet_token');
    setPredictions([]);
    setActiveTab('dashboard');
    addNotification('Logged out successfully', 'info');
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('mhtcet_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('http://127.0.0.1:3001/api/predictions', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setPredictions(data.predictions);
        setActiveTab('predictor');
        addNotification('Strategic predictions generated', 'success');
        if (token) loadPredictionHistory(token);
      } else {
        addNotification(data.message || 'Prediction failed', 'error');
      }
    } catch (error) {
      addNotification('API connection failure', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    if (!user) {
      setShowAuthModal(true);
      addNotification('Identity verification required for AI access', 'warning');
      return;
    }

    const userMsg = { id: Date.now(), type: 'user', message: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    const input = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch('http://127.0.0.1:3001/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          message: input,
          sessionId: chatSessionId || `sess_${Date.now()}`,
          context: {
            currentSection: activeTab,
            userCategory: formData.category,
            userPercentile: formData.percentile,
            userCourses: formData.courses
          }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          type: 'bot', 
          message: data.response, 
          timestamp: new Date() 
        }]);
      }
    } catch (error) {
      addNotification('Chat engine connection lost', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const downloadPDF = async (college) => {
    addNotification('Synthesizing PDF report...', 'info');
    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch('http://127.0.0.1:3001/api/generate-pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'temp-token'}`
        },
        credentials: 'include',
        body: JSON.stringify({
          predictions: [college],
          studentInfo: { ...formData, name: user?.name || 'Guest User' }
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${college.name.replace(/\s+/g, '-')}-MHT-CET-Report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        addNotification('Report exported successfully', 'success');
      }
    } catch (error) {
      addNotification('PDF generation failed', 'error');
    }
  };

  const downloadHistoryPDF = async (item) => {
    addNotification('Synthesizing archive report...', 'info');
    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch('http://127.0.0.1:3001/api/generate-pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          predictions: item.predictions,
          studentInfo: { ...item.inputData, name: user?.name || 'Guest User' }
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Archive-${item.inputData.percentile}-MHT-CET-Report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        addNotification('Archive exported successfully', 'success');
      }
    } catch (error) {
      addNotification('Export failed', 'error');
    }
  };

  useEffect(() => {
    fetchColleges();
    const savedUser = localStorage.getItem('mhtcet_user');
    const token = localStorage.getItem('mhtcet_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      loadPredictionHistory(token);
    }
  }, []);

  const [adminUsers, setAdminUsers] = useState([]);

  const fetchAdminUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch('http://127.0.0.1:3001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setAdminUsers(data.users);
    } catch (error) {
      console.error('Admin fetch error:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'adminUser' && user?.role === 'admin') {
      fetchAdminUsers();
    }
  }, [activeTab, user, fetchAdminUsers]);

  const deletePrediction = async (id) => {
    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch(`http://127.0.0.1:3001/api/predictions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPredictionHistory(prev => prev.filter(p => p._id !== id));
        addNotification('Record deleted', 'success');
      }
    } catch (error) {
      addNotification('Deletion failed', 'error');
    }
  };

  const deleteAllPredictions = async () => {
    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch('http://127.0.0.1:3001/api/predictions', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPredictionHistory([]);
        addNotification('Archives cleared', 'success');
      }
    } catch (error) {
      addNotification('Clear failed', 'error');
    }
  };

  const loadPredictionFromHistory = (item) => {
    if (!item) return;
    setPredictions(item.predictions || []);
    const input = item.inputData || {};
    setFormData({
      percentile: input.percentile ? input.percentile.toString() : '',
      category: input.category || 'General',
      courses: input.courses || [input.course].filter(Boolean) || ['Computer Engineering'],
      universityType: input.universityType || 'Home University',
      includeTFWS: input.includeTFWS || false,
      includeLadies: input.includeLadies || false,
      city: input.city || 'All Cities'
    });
    setActiveTab('results');
    addNotification('Intelligence log loaded', 'success');
  };

  return {
    activeTab, setActiveTab,
    predictions, setPredictions,
    predictionHistory,
    colleges,
    loading,
    user,
    showAuthModal, setShowAuthModal,
    authMode, setAuthMode,
    notifications,
    formData, setFormData,
    courseOptions,
    chatMessages, chatInput, setChatInput, chatLoading,
    adminUsers,
    deletePrediction, deleteAllPredictions, loadPredictionFromHistory,
    handleAuth, handleLogout, handlePredict, handleChatSend, downloadPDF, downloadHistoryPDF,
    addNotification
  };
};
