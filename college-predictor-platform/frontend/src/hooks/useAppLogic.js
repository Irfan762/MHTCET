import { useState, useEffect, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  
  // Intelligence Assistant states (Primary AI Interface)
  const [intelligenceMessages, setIntelligenceMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: '🧠 **MHT-CET Intelligence Assistant Active**\n\nI am your comprehensive AI advisor for Maharashtra engineering admissions. I can help you with:\n\n• **Strategic College Selection** - Personalized recommendations\n• **Cutoff Analysis** - Historical trends and predictions  \n• **Admission Guidance** - Document requirements and process\n• **Platform Support** - Feature navigation and troubleshooting\n\n**Privacy Note:** Your conversations are NOT saved. This session is private.\n\nHow can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [intelligenceInput, setIntelligenceInput] = useState('');
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [intelligenceSessionId, setIntelligenceSessionId] = useState(null);
  const [intelligenceHistory, setIntelligenceHistory] = useState([]);

  // Legacy Chat states (Keeping for compatibility or separate history if needed)
  const [chatMessages, setChatMessages] = useState([]);
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

  const handleIntelligenceChatSend = async () => {
    if (!intelligenceInput.trim()) return;
    
    if (!user) {
      setShowAuthModal(true);
      addNotification('Please login to use Intelligence Assistant', 'warning');
      return;
    }

    const userMsg = { id: Date.now(), type: 'user', message: intelligenceInput, timestamp: new Date() };
    setIntelligenceMessages(prev => [...prev, userMsg]);
    const input = intelligenceInput;
    setIntelligenceInput('');
    setIntelligenceLoading(true);

    try {
      const token = localStorage.getItem('mhtcet_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Use persistent session ID (stored in state or create new one)
      let sessionId = intelligenceSessionId;
      if (!sessionId) {
        sessionId = `intelligence_${Date.now()}`;
        setIntelligenceSessionId(sessionId);
      }

      const response = await fetch('http://127.0.0.1:3001/api/chat', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          message: input,
          sessionId: sessionId,
          storeHistory: false, // DISABLE history storage for Intelligence Assistant
          context: {
            currentSection: 'intelligence-assistant',
            userCategory: formData.category,
            userPercentile: formData.percentile,
            userCourses: formData.courses
          }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIntelligenceMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          type: 'bot', 
          message: data.response, 
          timestamp: new Date() 
        }]);
        // Reload history to show new conversation
        loadIntelligenceHistory(token);
      }
    } catch (error) {
      addNotification('Intelligence engine connection lost', 'error');
    } finally {
      setIntelligenceLoading(false);
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

  const downloadAllPDF = async () => {
    if (!predictions || predictions.length === 0) {
      addNotification('No predictions to export', 'warning');
      return;
    }

    addNotification('Generating report (Client-side)...', 'info');
    try {
      // Initialize jsPDF
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235); // Blue
      doc.text('MHT-CET 2025 College Prediction Report', 15, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 30);
      const studentName = user?.name || 'Guest User';
      const studentPercentile = formData.percentile || 'N/A';
      doc.text(`Student: ${studentName} | Percentile: ${studentPercentile}%`, 15, 36);
      doc.text(`Category: ${formData.category} | Course Preference: ${formData.courses.join(', ')}`, 15, 42);
      
      doc.line(15, 48, 195, 48);
      
      // Table Data Preparation
      const tableRows = predictions.map((p, index) => [
        index + 1,
        p.name || 'Unknown College',
        p.city || 'N/A',
        p.branch || p.course || 'N/A',
        `${p.riskLabel || 'N/A'} (${p.admissionChance || 0}%)`,
        p.cutoffForCategory || 'N/A',
        p.fees || 'N/A'
      ]);

      // Generate Table using functional approach for safety
      autoTable(doc, {
        startY: 55,
        head: [['#', 'College Name', 'City', 'Branch', 'Chance', 'Cutoff', 'Fees']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 50 },
          2: { cellWidth: 20 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
             const chance = String(data.cell.raw); // Ensure string
            if (chance.includes('High') || chance.includes('Safe')) {
              data.cell.styles.textColor = [22, 163, 74]; // Green
              data.cell.styles.fontStyle = 'bold';
            } else if (chance.includes('Medium') || chance.includes('Probable')) {
              data.cell.styles.textColor = [234, 179, 8]; // Amber
            } else if (chance.includes('Low') || chance.includes('Difficult')) {
              data.cell.styles.textColor = [220, 38, 38]; // Red
            }
          }
        }
      });
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} - Generated by MHT-CET Predictor Pro`, 105, 290, { align: 'center' });
      }

      // Save File
      doc.save(`MHT-CET-Complete-Report-${formData.percentile}-${Date.now()}.pdf`);
      addNotification(`✅ Successfully exported ${predictions.length} predictions`, 'success');

    } catch (error) {
      console.error('Download all error:', error);
      addNotification(`Report generation failed: ${error.message}`, 'error');
    }
  };

  // Intelligence Assistant History Management
  const loadIntelligenceHistory = async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:3001/api/chat/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Filter for intelligence assistant sessions only
        const intelligenceSessions = data.sessions
          .filter(s => s.sessionId.startsWith('intelligence_'))
          .map(s => ({
            sessionId: s.sessionId,
            firstMessage: s.messages[0]?.message || 'New Conversation',
            timestamp: s.updatedAt || s.createdAt
          }));
        setIntelligenceHistory(intelligenceSessions);
      }
    } catch (error) {
      console.error('Failed to load intelligence history:', error);
    }
  };

  const startNewIntelligenceChat = () => {
    setIntelligenceSessionId(null);
    setIntelligenceMessages([{
      id: 1,
      type: 'bot',
      message: '🧠 **MHT-CET Intelligence Assistant Active**\n\nI am your comprehensive AI advisor for Maharashtra engineering admissions. I can help you with:\n\n• **Strategic College Selection** - Personalized recommendations\n• **Cutoff Analysis** - Historical trends and predictions  \n• **Admission Guidance** - Document requirements and process\n• **Platform Support** - Feature navigation and troubleshooting\n\nYour conversations are saved for future reference. Start a new chat anytime!\n\nHow can I assist you today?',
      timestamp: new Date()
    }]);
    addNotification('Started new conversation', 'success');
  };

  const loadIntelligenceSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch(`http://127.0.0.1:3001/api/chat/session/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.session) {
        setIntelligenceSessionId(sessionId);
        const loadedMessages = data.session.messages.map((msg, idx) => ({
          id: idx + 1,
          type: msg.type,
          message: msg.message,
          timestamp: new Date(msg.timestamp)
        }));
        setIntelligenceMessages(loadedMessages);
       addNotification('Conversation loaded', 'success');
      }
    } catch (error) {
      addNotification('Failed to load conversation', 'error');
    }
  };

  const deleteIntelligenceSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('mhtcet_token');
      await fetch(`http://127.0.0.1:3001/api/chat/session/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setIntelligenceHistory(prev => prev.filter(s => s.sessionId !== sessionId));
      if (intelligenceSessionId === sessionId) {
        startNewIntelligenceChat();
      }
      addNotification('Conversation deleted', 'success');
    } catch (error) {
      addNotification('Delete failed', 'error');
    }
  };

  useEffect(() => {
    fetchColleges();
    const savedUser = localStorage.getItem('mhtcet_user');
    const token = localStorage.getItem('mhtcet_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      loadPredictionHistory(token);
      loadIntelligenceHistory(token);
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
    intelligenceMessages, intelligenceInput, setIntelligenceInput, intelligenceLoading,
    intelligenceHistory, intelligenceSessionId,
    adminUsers,
    deletePrediction, deleteAllPredictions, loadPredictionFromHistory,
    handleAuth, handleLogout, handlePredict, handleChatSend, handleIntelligenceChatSend, downloadPDF, downloadHistoryPDF, downloadAllPDF,
    startNewIntelligenceChat, loadIntelligenceSession, deleteIntelligenceSession,
    addNotification
  };
};
