import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [predictions, setPredictions] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [collegesDisplayLimit, setCollegesDisplayLimit] = useState(24);
  const chatMessagesEndRef = useRef(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: '🎓 Welcome to MHT-CET Pro AI Assistant! I\'m your professional engineering college guidance system with comprehensive knowledge of 328+ Maharashtra colleges. I can provide expert insights on admissions, cutoffs, placements, fees, scholarships, and career guidance. How may I assist you with your engineering college journey today?',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  // Form states
  const [formData, setFormData] = useState({
    percentile: '',
    category: 'General',
    courses: ['Computer Engineering'], // Changed to array for multiple selection
    universityType: 'Home University',
    includeLadies: false,
    includeTFWS: false
  });

  const [authData, setAuthData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Load user from localStorage on component mount
  useEffect(() => {
    fetchColleges();
    const savedUser = localStorage.getItem('mhtcet_user');
    const savedToken = localStorage.getItem('mhtcet_token');
    
    console.log('Checking saved user:', savedUser ? 'Found' : 'Not found');
    console.log('Checking saved token:', savedToken ? 'Found' : 'Not found');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log('User restored from localStorage:', parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('mhtcet_user');
        localStorage.removeItem('mhtcet_token');
      }
    }
  }, []);

  // Initialize chat session when user logs in
  useEffect(() => {
    if (user && !chatSessionId) {
      initializeChatSession();
      loadChatHistory();
      loadPredictionHistory(); // Load prediction history when user logs in
    }
  }, [user]);

  // Initialize new chat session
  const initializeChatSession = () => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setChatSessionId(sessionId);
  };

  // Load prediction history for the user
  const loadPredictionHistory = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch('http://127.0.0.1:3001/api/predictions/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setPredictionHistory(data.predictions || []);
        console.log('Prediction history loaded:', data.predictions?.length || 0, 'predictions');
      }
    } catch (error) {
      console.error('Error loading prediction history:', error);
    }
  };

  // Load chat history for the user
  const loadChatHistory = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch('http://127.0.0.1:3001/api/chat/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setChatHistory(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Load specific chat session
  const loadChatSession = async (sessionId) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch(`http://127.0.0.1:3001/api/chat/history/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.messages.length > 0) {
        setChatMessages(data.messages.map((msg, index) => ({
          id: index + 1,
          type: msg.type,
          message: msg.message,
          timestamp: new Date(msg.timestamp)
        })));
        setChatSessionId(sessionId);
        setShowChatHistory(false);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  // Start new chat session
  const startNewChatSession = () => {
    initializeChatSession();
    setChatMessages([
      {
        id: 1,
        type: 'bot',
        message: '🎓 Welcome to MHT-CET Pro AI Assistant! I\'m your professional engineering college guidance system with comprehensive knowledge of 328+ Maharashtra colleges. I can provide expert insights on admissions, cutoffs, placements, fees, scholarships, and career guidance. How may I assist you with your engineering college journey today?',
        timestamp: new Date()
      }
    ]);
    setShowChatHistory(false);
  };

  // Load specific prediction from history
  const loadPredictionFromHistory = (historyItem) => {
    setPredictions(historyItem.predictions);
    setFormData({
      percentile: historyItem.inputData.percentile.toString(),
      category: historyItem.inputData.category,
      courses: historyItem.inputData.courses
    });
    setShowHistoryView(false);
    addNotification('📊 Prediction loaded from history', 'success');
  };

  // Delete specific prediction from history
  const deletePrediction = async (predictionId) => {
    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch(`http://127.0.0.1:3001/api/predictions/${predictionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        // Remove from local state
        setPredictionHistory(prev => prev.filter(p => p._id !== predictionId));
        addNotification('🗑️ Prediction deleted successfully', 'success');
      } else {
        addNotification('Failed to delete prediction', 'error');
      }
    } catch (error) {
      console.error('Error deleting prediction:', error);
      addNotification('Failed to delete prediction', 'error');
    }
  };

  // Delete all prediction history
  const deleteAllPredictions = async () => {
    if (!window.confirm('Are you sure you want to delete all prediction history? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch('http://127.0.0.1:3001/api/predictions', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setPredictionHistory([]);
        addNotification('🗑️ All predictions deleted successfully', 'success');
      } else {
        addNotification('Failed to delete predictions', 'error');
      }
    } catch (error) {
      console.error('Error deleting predictions:', error);
      addNotification('Failed to delete predictions', 'error');
    }
  };

  // Delete specific chat session
  const deleteChatSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch(`http://127.0.0.1:3001/api/chat/history/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        // Remove from local state
        setChatHistory(prev => prev.filter(session => session.sessionId !== sessionId));
        addNotification('🗑️ Chat session deleted successfully', 'success');
      } else {
        addNotification('Failed to delete chat session', 'error');
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
      addNotification('Failed to delete chat session', 'error');
    }
  };

  // Delete all chat history
  const deleteAllChatHistory = async () => {
    if (!window.confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch('http://127.0.0.1:3001/api/chat/history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setChatHistory([]);
        addNotification('🗑️ All chat history deleted successfully', 'success');
      } else {
        addNotification('Failed to delete chat history', 'error');
      }
    } catch (error) {
      console.error('Error deleting chat history:', error);
      addNotification('Failed to delete chat history', 'error');
    }
  };



  // Notification system
  const addNotification = (message, type = 'info') => {
    const notification = { id: Date.now(), message, type, timestamp: new Date() };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const fetchColleges = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3001/api/colleges');
      const data = await response.json();
      if (data.success) {
        setColleges(data.colleges);
      } else {
        addNotification('Failed to load colleges data', 'error');
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
      addNotification('Failed to load colleges data', 'error');
    }
  };

  // Handler functions
  const handlePrediction = async (e) => {
    e.preventDefault();
    
    // Temporary bypass for testing - remove this later
    if (!user) {
      const tempUser = { id: 'temp', name: 'Test User', email: 'test@test.com' };
      setUser(tempUser);
      localStorage.setItem('mhtcet_user', JSON.stringify(tempUser));
      localStorage.setItem('mhtcet_token', 'temp-token');
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('mhtcet_token') || 'temp-token';
      const response = await fetch('http://127.0.0.1:3001/api/predictions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setPredictions(data.predictions);
        setSelectedCourseFilter('all'); // Reset filter for new predictions
        setActiveTab('results');
        loadPredictionHistory(); // Reload prediction history after new prediction
        addNotification('🎉 Predictions generated successfully!', 'success');
      } else {
        addNotification(data.message || 'Failed to generate predictions', 'error');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      addNotification('Failed to generate predictions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Client-side validation
    if (authMode === 'register' && (!authData.name || authData.name.trim().length < 2)) {
      addNotification('Please enter a valid name (at least 2 characters)', 'error');
      setLoading(false);
      return;
    }
    
    if (!authData.email || !authData.email.includes('@')) {
      addNotification('Please enter a valid email address', 'error');
      setLoading(false);
      return;
    }
    
    if (!authData.password || authData.password.length < 6) {
      addNotification('Password must be at least 6 characters long', 'error');
      setLoading(false);
      return;
    }
    
    // Clear any previous errors
    console.log('Starting authentication process...');
    console.log('Auth mode:', authMode);
    console.log('Auth data:', { ...authData, password: '[HIDDEN]' });
    
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const url = `http://127.0.0.1:3001${endpoint}`;
      
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify(authData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        console.log('Authentication successful!');
        setUser(data.user);
        localStorage.setItem('mhtcet_user', JSON.stringify(data.user));
        localStorage.setItem('mhtcet_token', data.token);
        setShowAuthModal(false);
        setAuthData({ name: '', email: '', password: '' });
        addNotification(`🎉 ${authMode === 'login' ? 'Login' : 'Registration'} successful!`, 'success');
      } else {
        console.error('Authentication failed:', data.message);
        addNotification(data.message || 'Authentication failed', 'error');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      addNotification(`Authentication failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://127.0.0.1:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('mhtcet_user');
    localStorage.removeItem('mhtcet_token');
    setPredictions([]);
    setActiveTab('dashboard');
    addNotification('👋 Logged out successfully', 'info');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    // If user is not logged in, show auth modal
    if (!user) {
      setShowAuthModal(true);
      addNotification('Please login to use the AI assistant', 'warning');
      return;
    }

    // Initialize session if not exists
    if (!chatSessionId) {
      initializeChatSession();
    }

    const userMessage = { id: Date.now(), type: 'user', message: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
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
          message: currentInput,
          sessionId: chatSessionId,
          context: {
            currentSection: activeTab,
            selectedCollege: selectedCollege?.name,
            userCategory: formData.category,
            userCourses: formData.courses, // Changed from userCourse to userCourses
            colleges: colleges.slice(0, 10).map(c => ({ name: c.name, location: c.location }))
          }
        }),
      });
      const data = await response.json();
      if (data.success) {
        const botResponse = { id: Date.now() + 1, type: 'bot', message: data.response, timestamp: new Date() };
        setChatMessages(prev => [...prev, botResponse]);
        
        // Refresh chat history after new message
        loadChatHistory();
      } else {
        const errorResponse = { id: Date.now() + 1, type: 'bot', message: '😔 Sorry, I encountered an error. Please try again.', timestamp: new Date() };
        setChatMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      const errorResponse = { id: Date.now() + 1, type: 'bot', message: '😔 Sorry, I\'m having trouble connecting right now. Please try again later.', timestamp: new Date() };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setChatLoading(false);
    }
  };

  const downloadPDF = async (college) => {
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
          studentInfo: { 
            ...formData, 
            name: user?.name || 'Guest User',
            course: college.course
          } 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);

      // Handle PDF response with explicit MIME type
      const arrayBuffer = await response.arrayBuffer();
      const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      
      console.log('PDF blob size:', pdfBlob.size);
      console.log('PDF blob type:', pdfBlob.type);

      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${college.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')}-MHT-CET-Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addNotification('📄 PDF Report downloaded successfully!', 'success');
    } catch (error) {
      console.error('PDF download error:', error);
      addNotification(`Failed to download PDF report: ${error.message}`, 'error');
    }
  };

  const downloadAllPredictionsPDF = async () => {
    try {
      if (!predictions || predictions.length === 0) {
        addNotification('No predictions available to download', 'warning');
        return;
      }

      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch('http://127.0.0.1:3001/api/generate-pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'temp-token'}`
        },
        credentials: 'include',
        body: JSON.stringify({ 
          predictions: predictions, 
          studentInfo: { 
            ...formData, 
            name: user?.name || 'Guest User',
            courses: formData.courses
          } 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle PDF response
      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MHT-CET-Complete-Prediction-Report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addNotification(`📄 Complete PDF Report with ${predictions.length} predictions downloaded!`, 'success');
    } catch (error) {
      console.error('PDF download error:', error);
      addNotification('Failed to download complete PDF report', 'error');
    }
  };

  const openCollegeModal = (college) => {
    setSelectedCollege(college);
    setShowCollegeModal(true);
  };

  const filteredColleges = colleges.filter(college => 
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', desc: 'Overview & Stats' },
    { id: 'predictor', label: 'AI Predictor', icon: '🎯', desc: 'Smart Predictions' },
    { id: 'colleges', label: 'Colleges', icon: '🏛️', desc: 'Explore Colleges' },
    { id: 'placements', label: 'Placements', icon: '💼', desc: 'Career Data' },
    { id: 'results', label: 'My Results', icon: '📊', desc: 'Your Predictions' },
    { id: 'chat', label: 'AI Assistant', icon: '🤖', desc: 'Comprehensive Help' }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Particles */}
      <div className="particles">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 3}px`,
              height: `${Math.random() * 6 + 3}px`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${Math.random() * 6 + 6}s`,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '50%'
            }}
          />
        ))}
      </div>

      {/* Professional Notifications */}
      <div style={{
        position: 'fixed', top: 'var(--space-6)', right: 'var(--space-6)', zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'
      }}>
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification-pro notification-${notification.type} animate-slide-in-pro`}>
            <div style={{ 
              fontSize: '1.25rem',
              color: notification.type === 'success' ? 'var(--success-600)' : 
                     notification.type === 'error' ? 'var(--error-500)' : 
                     notification.type === 'warning' ? 'var(--warning-500)' : 'var(--primary-600)'
            }}>
              {notification.type === 'success' ? '✅' : 
               notification.type === 'error' ? '❌' : 
               notification.type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-800">
                {notification.message}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Professional Sidebar */}
      <div className="glass-card-dark-pro animate-slide-in-pro" style={{
        width: sidebarOpen ? '340px' : '80px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        margin: 'var(--space-4)', 
        boxShadow: 'var(--shadow-2xl)'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: 'var(--space-8) var(--space-6)', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          {sidebarOpen && (
            <div className="animate-fade-in-pro">
              <h1 className="gradient-text-pro text-2xl font-black m-0">
                🎓 MHT-CET Pro
              </h1>
              <p className="text-sm font-medium m-0 mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                ✨ Professional Engineering Portal
              </p>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="btn-secondary-pro"
            style={{ padding: 'var(--space-3)', fontSize: '1.125rem' }}
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: 'var(--space-6) 0' }}>
          {sidebarItems.map((item, index) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className="animate-slide-in-pro"
              style={{
                width: '100%', 
                padding: 'var(--space-4) var(--space-6)', 
                textAlign: 'left', 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-4)', 
                fontSize: '0.875rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                border: 'none', 
                margin: 'var(--space-1) var(--space-4)',
                borderRadius: 'var(--radius-xl)', 
                fontWeight: '600',
                background: activeTab === item.id ? 
                  'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)' : 
                  'transparent',
                color: activeTab === item.id ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                animationDelay: `${index * 0.05}s`,
                boxShadow: activeTab === item.id ? 'var(--shadow-md)' : 'none'
              }}
            >
              <span style={{ fontSize: '1.375rem', minWidth: '24px' }}>{item.icon}</span>
              {sidebarOpen && (
                <div>
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-xs opacity-75">{item.desc}</div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Professional User Section */}
        <div style={{ 
          padding: 'var(--space-6)', 
          borderTop: '1px solid rgba(255, 255, 255, 0.08)' 
        }}>
          {user ? (
            <div className="animate-scale-pro">
              {sidebarOpen && (
                <div style={{ 
                  marginBottom: 'var(--space-4)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-4)' 
                }}>
                  <div style={{
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#ffffff', 
                    fontWeight: '700', 
                    fontSize: '1.125rem',
                    boxShadow: 'var(--shadow-lg)'
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm m-0">
                      {user.name}
                    </p>
                    <p className="text-xs m-0" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      {user.email}
                    </p>
                  </div>
                </div>
              )}
              <button 
                onClick={handleLogout} 
                className="btn-secondary-pro"
                style={{ width: '100%', fontSize: '0.875rem' }}
              >
                {sidebarOpen ? '🚪 Sign Out' : '↗'}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)} 
              className="btn-primary-pro"
              style={{ width: '100%', fontSize: '0.875rem' }}
            >
              {sidebarOpen ? '✨ Sign In / Register' : '👤'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        margin: 'var(--space-4) var(--space-4) var(--space-4) 0'
      }}>
        {/* Professional Header */}
        <header className="glass-card-white-pro animate-slide-in-pro" style={{
          padding: 'var(--space-6) var(--space-8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 'var(--space-4)'
        }}>
          <div>
            <h2 className="gradient-text-pro text-3xl font-black m-0">
              {sidebarItems.find(item => item.id === activeTab)?.icon} {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-gray-600 font-medium text-base m-0 mt-1">
              {sidebarItems.find(item => item.id === activeTab)?.desc || 'MHT-CET 2025 Professional Platform'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div className="badge-primary">
              🎓 MHT-CET 2025
            </div>
            {user && (
              <div className="status-indicator status-online badge-success">
                Online
              </div>
            )}
          </div>
        </header>

        {/* Professional Content Area */}
        <main className="glass-card-white-pro animate-slide-in-pro" style={{
          flex: 1, 
          padding: 'var(--space-8)', 
          overflow: 'auto'
        }}>
          {/* Professional Dashboard */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="text-center mb-12 animate-fade-in-pro">
                <h3 className="gradient-text-pro text-6xl font-black m-0 mb-6">
                  Welcome to MHT-CET Pro ✨
                </h3>
                <p className="text-gray-600 text-xl font-medium m-0" style={{ maxWidth: '700px', margin: '0 auto' }}>
                  🚀 Your ultimate platform for Maharashtra engineering college admissions with AI-powered predictions and smart insights
                </p>
              </div>

              <div className="grid-pro grid-auto-fit mb-12">
                {[
                  { 
                    icon: '🎯', 
                    title: 'AI-Powered Predictions', 
                    desc: 'Get accurate college predictions using advanced ML algorithms and historical data analysis', 
                    gradient: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                    delay: '0s' 
                  },
                  { 
                    icon: '🏛️', 
                    title: 'Premium College Database', 
                    desc: 'Comprehensive information about Maharashtra\'s top engineering institutions with real-time updates', 
                    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    delay: '0.1s' 
                  },
                  { 
                    icon: '🤖', 
                    title: 'Smart AI Assistant', 
                    desc: 'Get instant answers to your admission queries with our intelligent ChatGPT-style assistant', 
                    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    delay: '0.2s' 
                  },
                  { 
                    icon: '📊', 
                    title: 'Advanced Analytics', 
                    desc: 'Detailed placement statistics and career outcome data for informed decision making', 
                    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    delay: '0.3s' 
                  }
                ].map((feature, index) => (
                  <div 
                    key={index} 
                    className="card-pro animate-slide-in-pro"
                    style={{
                      background: feature.gradient,
                      color: '#ffffff',
                      textAlign: 'center',
                      cursor: 'pointer',
                      animationDelay: feature.delay,
                      border: 'none'
                    }}
                  >
                    <div className="card-body-pro">
                      <div className="text-6xl mb-6 animate-bounce">
                        {feature.icon}
                      </div>
                      <h4 className="text-2xl font-bold mb-4">
                        {feature.title}
                      </h4>
                      <p className="text-base font-medium opacity-90 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card-pro animate-scale-pro">
                <div className="card-header-pro text-center">
                  <h4 className="gradient-text-pro text-4xl font-black m-0">
                    🏆 Platform Statistics
                  </h4>
                </div>
                <div className="card-body-pro">
                  <div className="grid-pro grid-cols-4">
                    {[
                      { value: '150+', label: 'Engineering Colleges', color: 'var(--primary-500)', icon: '🏛️' },
                      { value: '98%', label: 'Prediction Accuracy', color: 'var(--success-500)', icon: '🎯' },
                      { value: '50+', label: 'Courses Available', color: '#f093fb', icon: '📚' },
                      { value: '₹45L', label: 'Highest Package', color: '#4facfe', icon: '💰' }
                    ].map((stat, index) => (
                      <div 
                        key={index} 
                        className="card-pro animate-scale-pro"
                        style={{
                          textAlign: 'center',
                          background: `linear-gradient(135deg, ${stat.color}10 0%, ${stat.color}20 100%)`,
                          border: `2px solid ${stat.color}30`,
                          animationDelay: `${index * 0.1}s`
                        }}
                      >
                        <div className="card-body-pro">
                          <div className="text-3xl mb-2">{stat.icon}</div>
                          <div className="text-4xl font-black mb-2" style={{ color: stat.color }}>
                            {stat.value}
                          </div>
                          <div className="text-gray-600 font-semibold text-sm">
                            {stat.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Professional AI Predictor */}
          {activeTab === 'predictor' && (
            <div className="animate-fade-in-pro">
              <div className="text-center mb-12">
                <h3 className="gradient-text-pro text-5xl font-black mb-4">
                  🎯 AI-Powered College Predictor
                </h3>
                <p className="text-gray-600 text-lg font-medium">
                  Get personalized college recommendations based on your MHT-CET performance
                </p>
              </div>

              <div className="grid-pro grid-cols-2" style={{ alignItems: 'start' }}>
                {/* Professional Prediction Form */}
                <div className="card-pro animate-slide-in-pro">
                  <div className="card-header-pro">
                    <h4 className="gradient-text-pro text-2xl font-bold m-0">
                      📝 Enter Your Details
                    </h4>
                  </div>
                  
                  <div className="card-body-pro">
                    <form onSubmit={handlePrediction} className="grid-pro" style={{ gap: 'var(--space-6)' }}>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          🎯 MHT-CET Percentile
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="Enter your percentile (0-100)"
                          value={formData.percentile}
                          onChange={(e) => setFormData({...formData, percentile: e.target.value})}
                          className="input-pro focus-ring-pro"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          👥 Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="input-pro focus-ring-pro"
                        >
                          <option value="General">General Open (GOPENS)</option>
                          <option value="OBC">Other Backward Class (OBC)</option>
                          <option value="SC">Scheduled Caste (SC)</option>
                          <option value="ST">Scheduled Tribe (ST)</option>
                          <option value="EWS">Economically Weaker Section (EWS)</option>
                          <option value="VJNT">Vimukta Jati & Nomadic Tribes (VJNT)</option>
                          <option value="NT1">Nomadic Tribe 1 (NT1)</option>
                          <option value="NT2">Nomadic Tribe 2 (NT2)</option>
                          <option value="NT3">Nomadic Tribe 3 (NT3)</option>
                          <option value="SEBC">Socially & Educationally Backward Class (SEBC)</option>
                          <option value="TFWS">Tuition Fee Waiver Scheme (TFWS)</option>
                          <option value="Ladies_General">Ladies General Open</option>
                          <option value="Ladies_OBC">Ladies OBC</option>
                          <option value="Ladies_SC">Ladies SC</option>
                          <option value="Ladies_ST">Ladies ST</option>
                          <option value="Ladies_VJNT">Ladies VJNT</option>
                          <option value="Ladies_NT1">Ladies NT1</option>
                          <option value="Ladies_NT2">Ladies NT2</option>
                          <option value="Ladies_NT3">Ladies NT3</option>
                          <option value="Ladies_SEBC">Ladies SEBC</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          🏛️ University Type
                        </label>
                        <select
                          value={formData.universityType || 'Home University'}
                          onChange={(e) => setFormData({...formData, universityType: e.target.value})}
                          className="input-pro focus-ring-pro"
                        >
                          <option value="Home University">Home University</option>
                          <option value="Other Than Home University">Other Than Home University</option>
                        </select>
                        <div className="mt-1 text-xs text-gray-500">
                          Home University: For students from the same university region
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          👩‍🎓 Seat Preferences
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.includeLadies || false}
                              onChange={(e) => setFormData({...formData, includeLadies: e.target.checked})}
                              className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              👩‍🎓 Include Ladies Quota Seats
                            </span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.includeTFWS || false}
                              onChange={(e) => setFormData({...formData, includeTFWS: e.target.checked})}
                              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              💰 Include TFWS (Tuition Fee Waiver Scheme)
                            </span>
                          </label>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          TFWS: Free tuition for economically weaker sections
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          🎓 Preferred Courses (Select Multiple)
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white">
                          {[
                            'Computer Engineering',
                            'Information Technology', 
                            'Electronics & Telecommunication',
                            'Mechanical Engineering',
                            'Civil Engineering',
                            'Electrical Engineering',
                            'Chemical Engineering',
                            'Automobile Engineering',
                            'Instrumentation Engineering',
                            'Production Engineering',
                            'Textile Engineering',
                            'Mining Engineering'
                          ].map((course) => (
                            <label key={course} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={formData.courses.includes(course)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData, 
                                      courses: [...formData.courses, course]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData, 
                                      courses: formData.courses.filter(c => c !== course)
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">{course}</span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Selected: {formData.courses.length} course{formData.courses.length !== 1 ? 's' : ''}
                          {formData.courses.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {formData.courses.map((course) => (
                                <span key={course} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {course}
                                  <button
                                    type="button"
                                    onClick={() => setFormData({
                                      ...formData, 
                                      courses: formData.courses.filter(c => c !== course)
                                    })}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || formData.courses.length === 0}
                        className={`btn-primary-pro focus-ring-pro ${(loading || formData.courses.length === 0) ? 'opacity-50' : ''}`}
                        style={{
                          width: '100%', 
                          padding: 'var(--space-5)', 
                          fontSize: '1.125rem', 
                          fontWeight: '700',
                          marginTop: 'var(--space-4)'
                        }}
                      >
                        {loading ? '⏳ Generating Predictions...' : 
                         formData.courses.length === 0 ? '⚠️ Select at least one course' :
                         `🚀 Get Predictions for ${formData.courses.length} Course${formData.courses.length !== 1 ? 's' : ''}`}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Professional Info Panel */}
                <div className="animate-slide-in-pro" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <div className="card-pro" style={{ 
                    background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)', 
                    color: '#ffffff',
                    border: 'none'
                  }}>
                    <div className="card-body-pro">
                      <h5 className="text-xl font-bold mb-4">
                        🤖 How Our AI Works
                      </h5>
                      <ul className="text-base font-medium leading-relaxed" style={{ paddingLeft: 'var(--space-6)' }}>
                        <li>Analyzes 5+ years of historical cutoff data</li>
                        <li>Considers category-wise seat availability</li>
                        <li>Factors in college ranking and popularity</li>
                        <li>Uses machine learning for accurate predictions</li>
                      </ul>
                    </div>
                  </div>

                  <div className="card-pro" style={{ 
                    background: 'linear-gradient(135deg, var(--success-500) 0%, #38f9d7 100%)', 
                    color: '#ffffff',
                    border: 'none'
                  }}>
                    <div className="card-body-pro">
                      <h5 className="text-xl font-bold mb-4">
                        ✨ What You'll Get
                      </h5>
                      <ul className="text-base font-medium leading-relaxed" style={{ paddingLeft: 'var(--space-6)' }}>
                        <li>Multi-course predictions in one go</li>
                        <li>Course-wise breakdown and filtering</li>
                        <li>Admission probability analysis</li>
                        <li>Detailed placement statistics</li>
                        <li>Downloadable prediction report</li>
                      </ul>
                    </div>
                  </div>

                  <div className="card-pro" style={{ 
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                    color: '#ffffff',
                    border: 'none'
                  }}>
                    <div className="card-body-pro text-center">
                      <h5 className="text-xl font-bold mb-4">
                        📊 Success Rate
                      </h5>
                      <div className="text-6xl font-black mb-2">98%</div>
                      <p className="text-base font-medium opacity-90">Prediction Accuracy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Colleges Tab */}
          {activeTab === 'colleges' && (
            <div className="animate-slide-bottom">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h3 className="gradient-text-fire" style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>
                    🏛️ Engineering Colleges
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0.5rem 0 0 0' }}>
                    Explore Maharashtra's top engineering institutions with comprehensive data from 2025 MHT-CET
                  </p>
                </div>
                <div className="glass-card" style={{ padding: '1rem 1.5rem', borderRadius: '15px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: '#ffffff' }}>
                  <strong>{searchTerm ? `${filteredColleges.length} of ${colleges.length}` : `${colleges.length}`} Colleges</strong>
                </div>
              </div>

              {/* Search Bar */}
              <div className="glass-card animate-slide-top" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '20px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search colleges by name or location..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCollegesDisplayLimit(24); // Reset display limit when searching
                  }}
                  className="neon-blue"
                  style={{
                    width: '100%', padding: '1rem 1.5rem', border: '2px solid #e2e8f0',
                    borderRadius: '15px', fontSize: '1rem', color: '#374151', backgroundColor: '#ffffff'
                  }}
                />
              </div>

              {/* Colleges Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {filteredColleges.slice(0, collegesDisplayLimit).map((college, index) => (
                  <div key={college.id || index} className="glass-card card-hover-lift animate-slide-bottom" style={{
                    padding: '2rem', borderRadius: '20px', cursor: 'pointer',
                    animationDelay: `${index * 0.1}s`
                  }} onClick={() => openCollegeModal(college)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#1f2937', flex: 1 }}>
                        {college.name}
                      </h4>
                      {college.featured && (
                        <span className="animate-pulse-glow" style={{
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          color: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '12px',
                          fontSize: '0.75rem', fontWeight: '600'
                        }}>
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                      📍 {college.location}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="glass-card" style={{ padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ color: '#667eea', fontSize: '0.75rem', fontWeight: '600' }}>CUTOFF</div>
                        <div style={{ color: '#1f2937', fontSize: '1.1rem', fontWeight: '700' }}>
                          {college.cutoff?.general || 'N/A'}%
                        </div>
                      </div>
                      <div className="glass-card" style={{ padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '600' }}>FEES</div>
                        <div style={{ color: '#1f2937', fontSize: '1.1rem', fontWeight: '700' }}>
                          {college.fees || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem', borderRadius: '12px', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem' }}>
                        💼 PLACEMENTS
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1f2937' }}>
                            {college.placements?.averagePackage || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Average</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1f2937' }}>
                            {college.placements?.placementRate || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {filteredColleges.length > collegesDisplayLimit && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button
                    onClick={() => setCollegesDisplayLimit(prev => prev + 24)}
                    className="btn-modern animate-pulse-glow"
                    style={{ padding: '1rem 2rem', fontSize: '1rem' }}
                  >
                    📚 Load More Colleges ({filteredColleges.length - collegesDisplayLimit} remaining)
                  </button>
                </div>
              )}

              {filteredColleges.length === 0 && (
                <div className="animate-zoom-in" style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                  <h4 style={{ color: '#64748b', fontSize: '1.5rem', margin: 0 }}>No colleges found</h4>
                  <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>Try adjusting your search terms</p>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Placement Analytics */}
          {activeTab === 'placements' && (
            <div className="animate-fade-in-pro">
              <div className="text-center mb-12">
                <h3 className="gradient-text-pro text-5xl font-black mb-4">
                  💼 Placement Analytics
                </h3>
                <p className="text-gray-600 text-lg font-medium">
                  Comprehensive placement data and career insights for Maharashtra engineering colleges
                </p>
              </div>

              {/* College Selection and Search */}
              <div className="card-pro mb-8 animate-slide-in-pro">
                <div className="card-header-pro">
                  <h4 className="gradient-text-pro text-2xl font-bold m-0">
                    🏛️ College-wise Placement Analysis
                  </h4>
                </div>
                <div className="card-body-pro">
                  <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                    <select 
                      className="input-pro focus-ring-pro"
                      style={{ flex: 1 }}
                      onChange={(e) => {
                        const selectedCollege = colleges.find(c => c.name === e.target.value);
                        setSelectedCollege(selectedCollege);
                      }}
                    >
                      <option value="">Select a college to view detailed placement data</option>
                      {colleges.map((college, index) => (
                        <option key={index} value={college.name}>{college.name}</option>
                      ))}
                    </select>
                    <button 
                      className="btn-primary-pro"
                      onClick={() => setSelectedCollege(null)}
                    >
                      Show All
                    </button>
                  </div>

                  {selectedCollege ? (
                    /* College-specific Placement Data */
                    <div className="animate-scale-pro">
                      <div className="card-pro mb-6" style={{ 
                        background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                        color: 'white',
                        border: 'none'
                      }}>
                        <div className="card-body-pro text-center">
                          <h5 className="text-2xl font-bold mb-2">{selectedCollege.name}</h5>
                          <p className="text-lg opacity-90">📍 {selectedCollege.location}</p>
                        </div>
                      </div>

                      {/* College Stats */}
                      <div className="grid-pro grid-cols-4 mb-8">
                        <div className="card-pro text-center">
                          <div className="card-body-pro">
                            <div className="text-3xl mb-2">💰</div>
                            <div className="text-2xl font-black text-success mb-1">
                              {selectedCollege.placements?.averagePackage || '₹8.5 LPA'}
                            </div>
                            <div className="text-sm text-gray-600 font-semibold">Average Package</div>
                          </div>
                        </div>
                        <div className="card-pro text-center">
                          <div className="card-body-pro">
                            <div className="text-3xl mb-2">🚀</div>
                            <div className="text-2xl font-black text-primary mb-1">
                              {selectedCollege.placements?.highestPackage || '₹45 LPA'}
                            </div>
                            <div className="text-sm text-gray-600 font-semibold">Highest Package</div>
                          </div>
                        </div>
                        <div className="card-pro text-center">
                          <div className="card-body-pro">
                            <div className="text-3xl mb-2">🎯</div>
                            <div className="text-2xl font-black text-warning mb-1">
                              {selectedCollege.placements?.placementRate || '95%'}
                            </div>
                            <div className="text-sm text-gray-600 font-semibold">Placement Rate</div>
                          </div>
                        </div>
                        <div className="card-pro text-center">
                          <div className="card-body-pro">
                            <div className="text-3xl mb-2">🏢</div>
                            <div className="text-2xl font-black text-error mb-1">150+</div>
                            <div className="text-sm text-gray-600 font-semibold">Companies Visited</div>
                          </div>
                        </div>
                      </div>

                      {/* Companies Visited */}
                      <div className="card-pro mb-8">
                        <div className="card-header-pro">
                          <h5 className="gradient-text-pro text-xl font-bold m-0">
                            🏢 Companies Visited {selectedCollege.name}
                          </h5>
                        </div>
                        <div className="card-body-pro">
                          <div className="grid-pro grid-auto-fill">
                            {[
                              { name: 'Microsoft', package: '₹45 LPA', type: 'Product', selected: 12 },
                              { name: 'Google', package: '₹42 LPA', type: 'Product', selected: 8 },
                              { name: 'Amazon', package: '₹38 LPA', type: 'Product', selected: 15 },
                              { name: 'TCS', package: '₹7 LPA', type: 'Service', selected: 85 },
                              { name: 'Infosys', package: '₹6.5 LPA', type: 'Service', selected: 72 },
                              { name: 'Wipro', package: '₹6 LPA', type: 'Service', selected: 68 },
                              { name: 'Accenture', package: '₹8 LPA', type: 'Consulting', selected: 45 },
                              { name: 'Deloitte', package: '₹9 LPA', type: 'Consulting', selected: 32 },
                              { name: 'L&T', package: '₹8.5 LPA', type: 'Core', selected: 28 },
                              { name: 'Bajaj Auto', package: '₹7.5 LPA', type: 'Core', selected: 22 },
                              { name: 'Mahindra', package: '₹7 LPA', type: 'Core', selected: 25 },
                              { name: 'Tata Motors', package: '₹8 LPA', type: 'Core', selected: 18 }
                            ].map((company, index) => (
                              <div key={index} className="card-pro animate-slide-in-pro" style={{
                                animationDelay: `${index * 0.05}s`,
                                border: `2px solid ${
                                  company.type === 'Product' ? 'var(--success-200)' :
                                  company.type === 'Service' ? 'var(--primary-200)' :
                                  company.type === 'Consulting' ? 'var(--warning-200)' : 'var(--error-200)'
                                }`
                              }}>
                                <div className="card-body-pro">
                                  <div className="flex justify-between items-start mb-2">
                                    <h6 className="font-bold text-gray-800">{company.name}</h6>
                                    <span className={`badge-${
                                      company.type === 'Product' ? 'success' :
                                      company.type === 'Service' ? 'primary' :
                                      company.type === 'Consulting' ? 'warning' : 'primary'
                                    }`}>
                                      {company.type}
                                    </span>
                                  </div>
                                  <div className="text-lg font-bold text-primary mb-1">{company.package}</div>
                                  <div className="text-sm text-gray-600">
                                    <strong>{company.selected}</strong> students selected
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Branch-wise Placement for Selected College */}
                      <div className="card-pro">
                        <div className="card-header-pro">
                          <h5 className="gradient-text-pro text-xl font-bold m-0">
                            📊 Branch-wise Placement Statistics - {selectedCollege.name}
                          </h5>
                        </div>
                        <div className="card-body-pro">
                          <div className="grid-pro grid-auto-fit">
                            {[
                              { 
                                branch: 'Computer Engineering', 
                                students: 120, 
                                placed: 118, 
                                avg: '₹14 LPA', 
                                highest: '₹45 LPA', 
                                companies: ['Microsoft', 'Google', 'Amazon', 'TCS'],
                                color: 'var(--primary-500)' 
                              },
                              { 
                                branch: 'Information Technology', 
                                students: 90, 
                                placed: 87, 
                                avg: '₹13 LPA', 
                                highest: '₹42 LPA', 
                                companies: ['Google', 'Amazon', 'Infosys', 'Wipro'],
                                color: 'var(--success-500)' 
                              },
                              { 
                                branch: 'Electronics & Telecom', 
                                students: 80, 
                                placed: 74, 
                                avg: '₹9 LPA', 
                                highest: '₹35 LPA', 
                                companies: ['Qualcomm', 'Intel', 'TCS', 'L&T'],
                                color: '#f093fb' 
                              },
                              { 
                                branch: 'Mechanical Engineering', 
                                students: 100, 
                                placed: 88, 
                                avg: '₹8 LPA', 
                                highest: '₹28 LPA', 
                                companies: ['L&T', 'Bajaj Auto', 'Mahindra', 'Tata Motors'],
                                color: '#4facfe' 
                              },
                              { 
                                branch: 'Civil Engineering', 
                                students: 85, 
                                placed: 72, 
                                avg: '₹7 LPA', 
                                highest: '₹22 LPA', 
                                companies: ['L&T', 'Shapoorji Pallonji', 'Godrej', 'Tata Projects'],
                                color: '#fbbf24' 
                              },
                              { 
                                branch: 'Electrical Engineering', 
                                students: 75, 
                                placed: 68, 
                                avg: '₹8.5 LPA', 
                                highest: '₹30 LPA', 
                                companies: ['Siemens', 'ABB', 'L&T', 'Schneider Electric'],
                                color: '#ef4444' 
                              }
                            ].map((branch, index) => (
                              <div key={index} className="card-pro animate-slide-in-pro" style={{
                                border: `2px solid ${branch.color}30`,
                                background: `linear-gradient(135deg, ${branch.color}10 0%, ${branch.color}20 100%)`,
                                animationDelay: `${index * 0.1}s`
                              }}>
                                <div className="card-body-pro">
                                  <h6 className="font-bold mb-3" style={{ color: branch.color }}>
                                    {branch.branch}
                                  </h6>
                                  
                                  <div className="grid-pro grid-cols-2 mb-4" style={{ gap: 'var(--space-3)' }}>
                                    <div className="text-center">
                                      <div className="text-lg font-black text-gray-800">{branch.placed}/{branch.students}</div>
                                      <div className="text-xs text-gray-600">Students Placed</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-black" style={{ color: branch.color }}>
                                        {Math.round((branch.placed / branch.students) * 100)}%
                                      </div>
                                      <div className="text-xs text-gray-600">Placement Rate</div>
                                    </div>
                                  </div>

                                  <div className="grid-pro grid-cols-2 mb-4" style={{ gap: 'var(--space-3)' }}>
                                    <div className="text-center">
                                      <div className="text-sm font-bold text-gray-800">{branch.avg}</div>
                                      <div className="text-xs text-gray-600">Average</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-sm font-bold text-gray-800">{branch.highest}</div>
                                      <div className="text-xs text-gray-600">Highest</div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-xs text-gray-600 font-semibold mb-2">Top Recruiters:</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                                      {branch.companies.map((company, idx) => (
                                        <span key={idx} className="badge-primary text-xs">
                                          {company}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Overall Placement Statistics */
                    <div>
                      {/* Overall Stats Cards */}
                      <div className="grid-pro grid-cols-4 mb-8">
                        {[
                          { icon: '💰', title: 'Highest Package', value: '₹45 LPA', desc: 'Microsoft, Google', color: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)' },
                          { icon: '📊', title: 'Average Package', value: '₹8.5 LPA', desc: 'Top Colleges', color: 'linear-gradient(135deg, var(--success-500) 0%, #38f9d7 100%)' },
                          { icon: '🎯', title: 'Placement Rate', value: '95%', desc: 'Overall Success', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
                          { icon: '🏢', title: 'Top Recruiters', value: '500+', desc: 'Companies', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }
                        ].map((stat, index) => (
                          <div key={index} className="card-pro animate-slide-in-pro" style={{
                            background: stat.color,
                            color: '#ffffff',
                            textAlign: 'center',
                            border: 'none',
                            animationDelay: `${index * 0.1}s`
                          }}>
                            <div className="card-body-pro">
                              <div className="text-4xl mb-4">{stat.icon}</div>
                              <h4 className="text-xl font-bold mb-2">{stat.title}</h4>
                              <div className="text-3xl font-black mb-2">{stat.value}</div>
                              <p className="text-sm opacity-90">{stat.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Top Recruiters */}
                      <div className="card-pro mb-8 animate-scale-pro">
                        <div className="card-header-pro text-center">
                          <h4 className="gradient-text-pro text-2xl font-bold m-0">
                            🏆 Top Recruiters Across Maharashtra
                          </h4>
                        </div>
                        <div className="card-body-pro">
                          <div className="grid-pro grid-auto-fill">
                            {[
                              'Microsoft', 'Google', 'Amazon', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'IBM',
                              'Cognizant', 'Capgemini', 'L&T', 'Bajaj Auto', 'Mahindra', 'Tata Motors',
                              'Reliance', 'HDFC Bank', 'Deloitte', 'PwC', 'EY', 'KPMG'
                            ].map((company, index) => (
                              <div key={index} className="card-pro card-hover-lift animate-slide-in-pro" style={{
                                textAlign: 'center',
                                animationDelay: `${index * 0.03}s`
                              }}>
                                <div className="card-body-pro">
                                  <div className="font-semibold text-gray-800">{company}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Overall Branch-wise Data */}
                      <div className="card-pro animate-slide-in-pro">
                        <div className="card-header-pro text-center">
                          <h4 className="gradient-text-pro text-2xl font-bold m-0">
                            📈 Branch-wise Placement Trends
                          </h4>
                        </div>
                        <div className="card-body-pro">
                          <div className="grid-pro grid-auto-fit">
                            {[
                              { branch: 'Computer Engineering', avg: '₹12 LPA', highest: '₹45 LPA', rate: '98%', color: 'var(--primary-500)' },
                              { branch: 'Information Technology', avg: '₹11 LPA', highest: '₹42 LPA', rate: '97%', color: 'var(--success-500)' },
                              { branch: 'Electronics & Telecom', avg: '₹8 LPA', highest: '₹35 LPA', rate: '92%', color: '#f093fb' },
                              { branch: 'Mechanical Engineering', avg: '₹7 LPA', highest: '₹28 LPA', rate: '88%', color: '#4facfe' },
                              { branch: 'Civil Engineering', avg: '₹6 LPA', highest: '₹22 LPA', rate: '85%', color: '#fbbf24' },
                              { branch: 'Electrical Engineering', avg: '₹7.5 LPA', highest: '₹30 LPA', rate: '90%', color: '#ef4444' }
                            ].map((branch, index) => (
                              <div key={index} className="card-pro animate-slide-in-pro" style={{
                                border: `2px solid ${branch.color}30`,
                                background: `linear-gradient(135deg, ${branch.color}15 0%, ${branch.color}25 100%)`,
                                animationDelay: `${index * 0.1}s`
                              }}>
                                <div className="card-body-pro">
                                  <h5 className="font-bold mb-4" style={{ color: branch.color }}>
                                    {branch.branch}
                                  </h5>
                                  <div className="grid-pro grid-cols-3 text-center">
                                    <div>
                                      <div className="text-sm text-gray-600 font-semibold">AVG</div>
                                      <div className="text-lg font-bold text-gray-800">{branch.avg}</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-gray-600 font-semibold">HIGHEST</div>
                                      <div className="text-lg font-bold text-gray-800">{branch.highest}</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-gray-600 font-semibold">RATE</div>
                                      <div className="text-lg font-bold text-gray-800">{branch.rate}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div className="animate-slide-bottom">
              {!user ? (
                <div className="animate-zoom-in" style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🔐</div>
                  <h3 className="gradient-text" style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
                    Login Required
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Please login to view your prediction results
                  </p>
                  <button onClick={() => setShowAuthModal(true)} className="btn-modern animate-pulse-glow">
                    🚀 Login Now
                  </button>
                </div>
              ) : predictions.length === 0 && predictionHistory.length === 0 ? (
                <div className="animate-zoom-in" style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>📊</div>
                  <h3 className="gradient-text" style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
                    No Predictions Yet
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Use the AI Predictor to generate your college recommendations
                  </p>
                  <button onClick={() => setActiveTab('predictor')} className="btn-modern animate-pulse-glow">
                    🎯 Start Prediction
                  </button>
                </div>
              ) : predictions.length === 0 && predictionHistory.length > 0 ? (
                <div>
                  <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h3 className="gradient-text-fire" style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 1rem 0' }}>
                      📚 Your Prediction History
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>
                      View and reload your previous predictions
                    </p>
                  </div>

                  {/* History List */}
                  <div className="grid-pro" style={{ gap: 'var(--space-6)' }}>
                    {predictionHistory.map((historyItem, index) => (
                      <div key={historyItem._id} className="card-pro animate-slide-in-pro" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="card-body-pro">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                            <div>
                              <h4 className="gradient-text-pro text-xl font-bold mb-2">
                                📊 Prediction #{predictionHistory.length - index}
                              </h4>
                              <p className="text-gray-600 text-sm">
                                {new Date(historyItem.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              <button
                                onClick={() => loadPredictionFromHistory(historyItem)}
                                className="btn-primary-pro"
                                style={{ fontSize: '0.875rem', padding: 'var(--space-2) var(--space-4)' }}
                              >
                                📂 Load
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this prediction? This action cannot be undone.')) {
                                    deletePrediction(historyItem._id);
                                  }
                                }}
                                className="btn-secondary-pro"
                                style={{ 
                                  fontSize: '0.875rem', 
                                  padding: 'var(--space-2) var(--space-4)',
                                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                  color: 'white',
                                  border: 'none'
                                }}
                                title="Delete this prediction"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid-pro grid-cols-3" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary-600">{historyItem.inputData.percentile}%</div>
                              <div className="text-xs text-gray-500">Percentile</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-success-600">{historyItem.metadata?.highProbability || 0}</div>
                              <div className="text-xs text-gray-500">High Probability</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-700">{historyItem.predictions?.length || 0}</div>
                              <div className="text-xs text-gray-500">Total Colleges</div>
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: 'var(--space-3)' }}>
                            <div className="text-sm font-semibold text-gray-700 mb-1">Category: {historyItem.inputData.category}</div>
                            <div className="text-sm text-gray-600">
                              Courses: {historyItem.inputData.courses?.join(', ') || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setActiveTab('predictor')} className="btn-modern animate-pulse-glow">
                      🎯 Generate New Prediction
                    </button>
                    {predictionHistory.length > 0 && (
                      <button 
                        onClick={deleteAllPredictions}
                        className="btn-secondary-pro"
                        style={{ 
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          border: 'none',
                          padding: 'var(--space-3) var(--space-6)'
                        }}
                      >
                        🗑️ Delete All History
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '3rem', textAlign: 'center', position: 'relative' }}>
                    <h3 className="gradient-text-fire" style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 1rem 0' }}>
                      📊 Your Prediction Results
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>
                      Based on your MHT-CET performance analysis
                    </p>
                  hw
                    {/* History Toggle Button */}
                    {predictionHistory.length > 0 && (
                      <div style={{ position: 'absolute', top: 0, right: 0 }}>
                        <button
                          onClick={() => setShowHistoryView(!showHistoryView)}
                          className="btn-secondary-pro"
                          style={{ fontSize: '0.875rem', padding: 'var(--space-2) var(--space-4)' ,color: 'black' }}
                        >
                          {showHistoryView ? '📊 Current Results' : '📚 View History'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Show History View or Current Results */}
                  {showHistoryView ? (
                    /* History View */
                    <div>
                      <div className="grid-pro" style={{ gap: 'var(--space-6)' }}>
                        {predictionHistory.map((historyItem, index) => (
                          <div key={historyItem._id} className="card-pro animate-slide-in-pro" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="card-body-pro">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                                <div>
                                  <h4 className="gradient-text-pro text-xl font-bold mb-2">
                                    📊 Prediction #{predictionHistory.length - index}
                                  </h4>
                                  <p className="text-gray-600 text-sm">
                                    {new Date(historyItem.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                  <button
                                    onClick={() => loadPredictionFromHistory(historyItem)}
                                    className="btn-primary-pro"
                                    style={{ fontSize: '0.875rem', padding: 'var(--space-2) var(--space-4)' }}
                                  >
                                    📂 Load
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to delete this prediction? This action cannot be undone.')) {
                                        deletePrediction(historyItem._id);
                                      }
                                    }}
                                    className="btn-secondary-pro"
                                    style={{ 
                                      fontSize: '0.875rem', 
                                      padding: 'var(--space-2) var(--space-4)',
                                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                      color: 'white',
                                      border: 'none'
                                    }}
                                    title="Delete this prediction"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              
                              <div className="grid-pro grid-cols-3" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-primary-600">{historyItem.inputData.percentile}%</div>
                                  <div className="text-xs text-gray-500">Percentile</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-success-600">{historyItem.metadata?.highProbability || 0}</div>
                                  <div className="text-xs text-gray-500">High Probability</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-700">{historyItem.predictions?.length || 0}</div>
                                  <div className="text-xs text-gray-500">Total Colleges</div>
                                </div>
                              </div>
                              
                              <div style={{ marginBottom: 'var(--space-3)' }}>
                                <div className="text-sm font-semibold text-gray-700 mb-1">Category: {historyItem.inputData.category}</div>
                                <div className="text-sm text-gray-600">
                                  Courses: {historyItem.inputData.courses?.join(', ') || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Current Results View */
                    <div>
                  {/* Results Summary */}
                  <div className="glass-card animate-slide-top" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#667eea', fontSize: '0.875rem', fontWeight: '600' }}>YOUR PERCENTILE</div>
                        <div style={{ color: '#1f2937', fontSize: '2rem', fontWeight: '900' }}>{formData.percentile}%</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>HIGH PROBABILITY</div>
                        <div style={{ color: '#1f2937', fontSize: '2rem', fontWeight: '900' }}>
                          {predictions.filter(p => p.probability === 'High').length}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: '600' }}>MEDIUM PROBABILITY</div>
                        <div style={{ color: '#1f2937', fontSize: '2rem', fontWeight: '900' }}>
                          {predictions.filter(p => p.probability === 'Medium').length}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: '600' }}>TOTAL COLLEGES</div>
                        <div style={{ color: '#1f2937', fontSize: '2rem', fontWeight: '900' }}>{predictions.length}</div>
                      </div>
                    </div>
                    
                    {/* Course-wise Breakdown */}
                    {formData.courses && formData.courses.length > 1 && (
                      <div>
                        <h4 style={{ color: '#1f2937', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', textAlign: 'center' }}>
                          📚 Course-wise Breakdown
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                          {formData.courses.map((course, index) => {
                            const coursePredictions = predictions.filter(p => p.course === course);
                            return (
                              <div key={course} className="glass-card" style={{ padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                  {course}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.75rem' }}>
                                  <div>
                                    <div style={{ color: '#10b981', fontWeight: '700' }}>
                                      {coursePredictions.filter(p => p.probability === 'High').length}
                                    </div>
                                    <div style={{ color: '#64748b' }}>High</div>
                                  </div>
                                  <div>
                                    <div style={{ color: '#f59e0b', fontWeight: '700' }}>
                                      {coursePredictions.filter(p => p.probability === 'Medium').length}
                                    </div>
                                    <div style={{ color: '#64748b' }}>Medium</div>
                                  </div>
                                  <div>
                                    <div style={{ color: '#ef4444', fontWeight: '700' }}>
                                      {coursePredictions.filter(p => p.probability === 'Low').length}
                                    </div>
                                    <div style={{ color: '#64748b' }}>Low</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Course Filter */}
                  {formData.courses && formData.courses.length > 1 && (
                    <div className="glass-card animate-slide-top" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '20px' }}>
                      <h4 style={{ color: '#1f2937', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
                        🔍 Filter by Course
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button
                          onClick={() => setSelectedCourseFilter('all')}
                          className={`btn-${selectedCourseFilter === 'all' ? 'primary' : 'secondary'}-pro`}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem',color:'black' }}
                        >
                          All Courses ({predictions.length})
                        </button>
                        {formData.courses.map((course) => {
                          const courseCount = predictions.filter(p => p.course === course).length;
                          return (
                            <button
                              key={course}
                              onClick={() => setSelectedCourseFilter(course)}
                              className={`btn-${selectedCourseFilter === course ? 'primary' : 'secondary'}-pro`}
                              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color:'black' }}
                            >
                              {course} ({courseCount})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Download All PDF Button */}
                  <div className="glass-card animate-slide-top" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '20px', textAlign: 'center' }}>
                    <h4 style={{ color: '#1f2937', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
                      📄 Download Complete Report
                    </h4>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                      Get a comprehensive PDF report with all {predictions.length} college predictions
                    </p>
                    <button 
                      onClick={downloadAllPredictionsPDF}
                      className="btn-modern animate-pulse-glow"
                      style={{ 
                        padding: '1rem 2rem', 
                        fontSize: '1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      📄 Download Complete PDF Report
                    </button>
                  </div>

                  {/* Predictions List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {predictions
                      .filter(prediction => selectedCourseFilter === 'all' || prediction.course === selectedCourseFilter)
                      .slice(0, 20)
                      .map((prediction, index) => (
                      <div key={index} className={`glass-card card-hover-lift animate-slide-bottom ${prediction.probability.toLowerCase()}`} style={{
                        padding: '1.5rem', borderRadius: '15px', animationDelay: `${index * 0.1}s`,
                        borderLeft: `5px solid ${
                          prediction.probability === 'High' ? '#10b981' : 
                          prediction.probability === 'Medium' ? '#f59e0b' : '#ef4444'
                        }`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                              {prediction.name}
                            </h4>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                              📍 {prediction.location} • 🎓 {prediction.course}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span style={{
                              background: prediction.probability === 'High' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                                         prediction.probability === 'Medium' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                         'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '20px',
                              fontSize: '0.875rem', fontWeight: '700'
                            }}>
                              {prediction.probability} Chance
                            </span>
                            <button onClick={() => downloadPDF(prediction)} className="btn-modern" style={{
                              padding: '0.5rem 1rem', fontSize: '0.875rem'
                            }}>
                              📄 Download
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                          <div className="glass-card" style={{ padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600' }}>CUTOFF</div>
                            <div style={{ color: '#1f2937', fontSize: '1.1rem', fontWeight: '700' }}>
                              {prediction.cutoffForCategory}%
                            </div>
                          </div>
                          <div className="glass-card" style={{ padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600' }}>DIFFERENCE</div>
                            <div style={{ 
                              color: prediction.difference >= 0 ? '#10b981' : '#ef4444', 
                              fontSize: '1.1rem', fontWeight: '700' 
                            }}>
                              {prediction.difference > 0 ? '+' : ''}{prediction.difference}%
                            </div>
                          </div>
                          <div className="glass-card" style={{ padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600' }}>FEES</div>
                            <div style={{ color: '#1f2937', fontSize: '1.1rem', fontWeight: '700' }}>
                              {prediction.fees}
                            </div>
                          </div>
                          <div className="glass-card" style={{ padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600' }}>AVG PACKAGE</div>
                            <div style={{ color: '#1f2937', fontSize: '1.1rem', fontWeight: '700' }}>
                              {prediction.placements?.averagePackage}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Professional AI Assistant Tab */}
          {activeTab === 'chat' && (
            <div className="animate-fade-in-pro" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Professional Header */}
              <div className="glass-card-pro animate-slide-top" style={{ 
                padding: '2rem', 
                marginBottom: '2rem', 
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem'
                  }}>
                    🤖
                  </div>
                  <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>
                      MHT-CET AI Assistant
                    </h2>
                    <p style={{ fontSize: '1.1rem', margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                      Professional Engineering College Guidance System
                    </p>
                  </div>
                </div>
                
                {/* Capabilities */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '1rem',
                  marginTop: '1.5rem'
                }}>
                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Smart Predictions</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>AI-powered college recommendations</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Real-time Data</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>2025 MHT-CET cutoffs & trends</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💼</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Career Guidance</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Placement insights & advice</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎓</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Expert Knowledge</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>328+ colleges database</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {!user && (
                <div className="glass-card animate-slide-top" style={{ 
                  padding: '1.5rem', 
                  marginBottom: '2rem', 
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem' }}>⚡</div>
                    <div>
                      <h4 style={{ margin: 0, color: '#8b4513', fontWeight: '700' }}>Quick Start</h4>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#a0522d', fontSize: '0.9rem' }}>
                        Try these popular questions or login for personalized assistance
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '0.75rem',
                    marginTop: '1rem'
                  }}>
                    {[
                      "What are the cutoffs for Computer Engineering?",
                      "Compare COEP vs VJTI placements",
                      "Best colleges for Mechanical Engineering",
                      "Scholarship options for OBC category"
                    ].map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setChatInput(question);
                          if (user) handleChatSubmit({ preventDefault: () => {} });
                        }}
                        className="btn-secondary-pro"
                        style={{ 
                          padding: '0.75rem 1rem', 
                          fontSize: '0.8rem', 
                          textAlign: 'left',
                          background: 'rgba(255, 255, 255, 0.8)',
                          color: '#8b4513',
                          border: '1px solid rgba(139, 69, 19, 0.2)'
                        }}
                      >
                        💡 {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-6)', height: '100%' }}>
                {/* Chat History Sidebar */}
                {user && (
                  <div className="card-pro" style={{ 
                    width: showChatHistory ? '300px' : '60px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div className="card-header-pro" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: 'var(--space-4)'
                    }}>
                      {showChatHistory && (
                        <h4 className="font-bold text-gray-800 m-0">Chat History</h4>
                      )}
                      <button
                        onClick={() => setShowChatHistory(!showChatHistory)}
                        className="btn-secondary-pro"
                        style={{ padding: 'var(--space-2)', fontSize: '1rem' }}
                      >
                        {showChatHistory ? '←' : '💬'}
                      </button>
                    </div>

                    {showChatHistory && (
                      <div className="card-body-pro" style={{ flex: 1, overflow: 'auto' }}>
                        <button
                          onClick={startNewChatSession}
                          className="btn-primary-pro mb-4"
                          style={{ width: '100%', fontSize: '0.875rem' }}
                        >
                          ✨ New Chat
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                          {chatHistory.map((session, index) => (
                            <div
                              key={session.sessionId}
                              className="card-pro"
                              style={{
                                padding: 'var(--space-3)',
                                border: session.sessionId === chatSessionId ? '2px solid var(--primary-500)' : '1px solid var(--gray-200)',
                                background: session.sessionId === chatSessionId ? 'var(--primary-50)' : 'white',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                              }}
                            >
                              <div
                                onClick={() => loadChatSession(session.sessionId)}
                                style={{
                                  flex: 1,
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                <div className="font-semibold text-sm text-gray-800 mb-1">
                                  Session {index + 1}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(session.lastMessage).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-600 mt-1 truncate">
                                  {session.preview}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
                                    deleteChatSession(session.sessionId);
                                  }
                                }}
                                className="btn-secondary-pro"
                                style={{ 
                                  fontSize: '0.75rem', 
                                  padding: 'var(--space-1) var(--space-2)',
                                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                  color: 'white',
                                  border: 'none',
                                  minWidth: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Delete this chat session"
                              >
                                🗑️
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Professional Main Chat Container */}
                <div className="card-pro" style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  border: '2px solid rgba(102, 126, 234, 0.1)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}>
                  {/* Professional Chat Header */}
                  <div className="card-header-pro" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '15px 15px 0 0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem'
                      }}>
                        🤖
                      </div>
                      <div>
                        <h4 className="font-bold m-0" style={{ fontSize: '1.1rem' }}>
                          {user ? `Professional AI Assistant` : 'MHT-CET AI Assistant'}
                        </h4>
                        <p className="text-sm m-0" style={{ opacity: 0.9, fontSize: '0.85rem' }}>
                          {user ? `Session: ${chatSessionId?.slice(-8) || 'New'} • Online` : 'Login for personalized assistance'}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {user && chatMessages.length > 1 && (
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          💬 {chatMessages.length - 1} messages
                        </div>
                      )}
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#10b981',
                        animation: 'pulse 2s infinite'
                      }}></div>
                    </div>
                  </div>

                  {/* Professional Chat Messages */}
                  <div className="card-body-pro chat-scroll" style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--space-4)',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
                  }}>
                    {chatMessages.map((msg, index) => (
                      <div 
                        key={msg.id} 
                        className={`animate-slide-in-pro`}
                        style={{
                          display: 'flex', 
                          justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                          animationDelay: `${index * 0.05}s`,
                          alignItems: 'flex-end',
                          gap: '0.75rem'
                        }}
                      >
                        {/* AI Avatar */}
                        {msg.type === 'bot' && (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1rem',
                            flexShrink: 0
                          }}>
                            🤖
                          </div>
                        )}
                        
                        <div 
                          className="card-pro"
                          style={{
                            maxWidth: '75%', 
                            padding: msg.type === 'user' ? 'var(--space-4) var(--space-5)' : 'var(--space-4) var(--space-5)',
                            background: msg.type === 'user' ? 
                              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                              'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            color: msg.type === 'user' ? '#ffffff' : 'var(--gray-800)',
                            border: msg.type === 'user' ? 'none' : '2px solid rgba(102, 126, 234, 0.1)',
                            borderRadius: msg.type === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                            boxShadow: msg.type === 'user' ? 
                              '0 10px 25px rgba(102, 126, 234, 0.3)' : 
                              '0 5px 15px rgba(0, 0, 0, 0.08)'
                          }}
                        >
                          <div className="text-base font-medium leading-relaxed mb-2" style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}>
                            {msg.message}
                          </div>
                          <div 
                            className="text-xs opacity-75"
                            style={{ 
                              textAlign: msg.type === 'user' ? 'right' : 'left',
                              color: msg.type === 'user' ? 'rgba(255, 255, 255, 0.8)' : 'var(--gray-500)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                              gap: '0.5rem'
                            }}
                          >
                            {msg.type === 'bot' && (
                              <span style={{ fontSize: '0.7rem' }}>🤖 AI Assistant</span>
                            )}
                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {/* User Avatar */}
                        {msg.type === 'user' && user && (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '700',
                            flexShrink: 0
                          }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {chatLoading && (
                      <div className="animate-slide-in-pro" style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-start',
                        alignItems: 'flex-end',
                        gap: '0.75rem'
                      }}>
                        {/* AI Avatar for loading */}
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '1rem',
                          flexShrink: 0
                        }}>
                          🤖
                        </div>
                        
                        <div className="card-pro" style={{
                          padding: 'var(--space-4) var(--space-5)',
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          border: '2px solid rgba(102, 126, 234, 0.1)',
                          borderRadius: '20px 20px 20px 5px',
                          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem',
                            color: '#667eea',
                            fontWeight: '600'
                          }}>
                            <div className="animate-spin" style={{ 
                              width: '20px', 
                              height: '20px', 
                              border: '2px solid #e5e7eb',
                              borderTop: '2px solid #667eea',
                              borderRadius: '50%'
                            }}></div>
                            <span>AI Assistant is analyzing your query...</span>
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#9ca3af', 
                            marginTop: '0.5rem' 
                          }}>
                            Processing 328+ colleges database
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Professional Chat Input */}
                  <div className="card-footer-pro" style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                    borderTop: '2px solid rgba(102, 126, 234, 0.1)',
                    padding: '1.5rem'
                  }}>
                    {!user && (
                      <div className="mb-4 p-4" style={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '2px solid #f59e0b',
                        borderRadius: '15px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ fontSize: '1.5rem' }}>💡</div>
                          <div>
                            <p className="font-medium text-sm m-0" style={{ color: '#92400e' }}>
                              🚀 Unlock Full AI Assistant Features
                            </p>
                            <p className="text-xs m-0 mt-1" style={{ color: '#a16207' }}>
                              Login to save chat history, get personalized recommendations, and access advanced features
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <form onSubmit={handleChatSubmit} style={{ 
                      display: 'flex', 
                      gap: 'var(--space-4)', 
                      alignItems: 'flex-end',
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '25px',
                      border: '2px solid rgba(102, 126, 234, 0.2)',
                      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)'
                    }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="💬 Ask about colleges, admissions, cutoffs, placements, scholarships, or any MHT-CET queries..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          disabled={chatLoading}
                          className="input-pro focus-ring-pro"
                          style={{ 
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            fontSize: '1rem',
                            padding: '0.75rem 1rem',
                            outline: 'none'
                          }}
                        />
                        {chatInput && (
                          <button
                            type="button"
                            onClick={() => setChatInput('')}
                            style={{
                              position: 'absolute',
                              right: '1rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#9ca3af',
                              cursor: 'pointer',
                              fontSize: '1.2rem'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={chatLoading || !chatInput.trim()}
                        className={`btn-primary-pro focus-ring-pro ${(chatLoading || !chatInput.trim()) ? 'opacity-50' : ''}`}
                        style={{
                          padding: '0.75rem 1.5rem', 
                          fontSize: '1rem', 
                          fontWeight: '600',
                          borderRadius: '20px',
                          background: chatLoading || !chatInput.trim() ? 
                            '#9ca3af' : 
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          color: 'white',
                          cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {chatLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="animate-spin" style={{ 
                              width: '16px', 
                              height: '16px', 
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              borderTop: '2px solid white',
                              borderRadius: '50%'
                            }}></div>
                            <span>Sending</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Send</span>
                            <span>🚀</span>
                          </div>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* College Modal */}
      {showCollegeModal && selectedCollege && (
        <div className="animate-zoom-in" style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '2rem',
          backdropFilter: 'blur(10px)', overflowY: 'auto'
        }}>
          <div className="glass-card-white animate-bounce-in" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            padding: '3rem', borderRadius: '25px', width: '100%', maxWidth: '900px',
            position: 'relative', border: '2px solid rgba(102, 126, 234, 0.2)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <button onClick={() => setShowCollegeModal(false)} className="animate-pulse" style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', color: '#64748b',
              backgroundColor: 'rgba(100, 116, 139, 0.1)', border: 'none', fontSize: '1.5rem',
              cursor: 'pointer', borderRadius: '50%', width: '40px', height: '40px', zIndex: 10
            }}>
              ×
            </button>

            <div style={{ marginBottom: '2rem' }}>
              <h2 className="gradient-text-fire" style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 1rem 0' }}>
                {selectedCollege.name}
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>
                📍 {selectedCollege.location} • {selectedCollege.type}
              </p>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '15px', textAlign: 'center', background: 'linear-gradient(135deg, #667eea15 0%, #764ba225 100%)' }}>
                <div style={{ color: '#667eea', fontSize: '0.875rem', fontWeight: '600' }}>CUTOFF (General)</div>
                <div style={{ color: '#1f2937', fontSize: '2rem', fontWeight: '900' }}>{selectedCollege.cutoff?.general || 'N/A'}%</div>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '15px', textAlign: 'center', background: 'linear-gradient(135deg, #10b98115 0%, #05966925 100%)' }}>
                <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>ANNUAL FEES</div>
                <div style={{ color: '#1f2937', fontSize: '2rem', fontWeight: '900' }}>{selectedCollege.fees || 'N/A'}</div>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '15px', textAlign: 'center', background: 'linear-gradient(135deg, #f093fb15 0%, #f5576c25 100%)' }}>
                <div style={{ color: '#f5576c', fontSize: '0.875rem', fontWeight: '600' }}>AVG PACKAGE</div>
                <div style={{ color: '#1f2937', fontSize: '2rem', fontWeight: '900' }}>{selectedCollege.placements?.averagePackage || 'N/A'}</div>
              </div>
            </div>

            {/* Courses */}
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px', marginBottom: '2rem' }}>
              <h4 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 1rem 0' }}>
                🎓 Available Courses
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {(selectedCollege.courses || []).map((course, index) => (
                  <span key={index} className="glass-card" style={{
                    padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.875rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    color: '#374151', fontWeight: '600'
                  }}>
                    {course}
                  </span>
                ))}
              </div>
            </div>

            {/* Placements */}
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px', marginBottom: '2rem', background: 'linear-gradient(135deg, #43e97b15 0%, #38f9d725 100%)' }}>
              <h4 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 1.5rem 0' }}>
                💼 Placement Statistics
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600' }}>Average Package</div>
                  <div style={{ color: '#1f2937', fontSize: '1.5rem', fontWeight: '900', margin: '0.5rem 0' }}>
                    {selectedCollege.placements?.averagePackage || 'N/A'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600' }}>Highest Package</div>
                  <div style={{ color: '#1f2937', fontSize: '1.5rem', fontWeight: '900', margin: '0.5rem 0' }}>
                    {selectedCollege.placements?.highestPackage || 'N/A'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600' }}>Placement Rate</div>
                  <div style={{ color: '#1f2937', fontSize: '1.5rem', fontWeight: '900', margin: '0.5rem 0' }}>
                    {selectedCollege.placements?.placementRate || 'N/A'}
                  </div>
                </div>
              </div>
              
              {selectedCollege.placements?.topRecruiters && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                    Top Recruiters
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedCollege.placements.topRecruiters.slice(0, 8).map((recruiter, index) => (
                      <span key={index} style={{
                        padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem',
                        background: '#ffffff', color: '#374151', fontWeight: '600',
                        border: '1px solid #e2e8f0'
                      }}>
                        {recruiter}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cutoff Details */}
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px', marginBottom: '2rem' }}>
              <h4 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 1.5rem 0' }}>
                📊 Category-wise Cutoffs
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {selectedCollege.cutoff && Object.entries(selectedCollege.cutoff).map(([category, cutoff]) => (
                  <div key={category} style={{
                    padding: '1rem', borderRadius: '12px', textAlign: 'center',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
                  }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
                      {category}
                    </div>
                    <div style={{ color: '#1f2937', fontSize: '1.5rem', fontWeight: '900', margin: '0.25rem 0' }}>
                      {cutoff}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => downloadPDF(selectedCollege)} className="btn-modern animate-pulse-glow" style={{
                padding: '1rem 2rem', fontSize: '1rem', fontWeight: '700'
              }}>
                📄 Download College Report
              </button>
              <button onClick={() => setShowCollegeModal(false)} className="btn-gradient-1" style={{
                padding: '1rem 2rem', fontSize: '1rem', fontWeight: '700', border: 'none',
                borderRadius: '15px', cursor: 'pointer', color: '#ffffff'
              }}>
                ✓ Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Professional Auth Modal */}
      {showAuthModal && (
        <div className="animate-fade-in-pro" style={{
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.6)', 
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 50, 
          padding: 'var(--space-8)',
          backdropFilter: 'blur(12px)'
        }}>
          <div className="glass-card-white-pro animate-scale-pro" style={{
            padding: 'var(--space-12)', 
            width: '100%', 
            maxWidth: '480px',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowAuthModal(false)} 
              className="btn-secondary-pro"
              style={{
                position: 'absolute', 
                top: 'var(--space-6)', 
                right: 'var(--space-6)',
                padding: 'var(--space-3)',
                fontSize: '1.25rem',
                borderRadius: '50%',
                width: '44px',
                height: '44px'
              }}
            >
              ×
            </button>

            <div className="text-center mb-8">
              <h2 className="gradient-text-pro text-3xl font-black mb-2">
                {authMode === 'login' ? '🔐 Welcome Back!' : '📝 Join MHT-CET Pro'}
              </h2>
              <p className="text-gray-600 font-medium">
                {authMode === 'login' ? 'Sign in to access your predictions' : 'Create your account to get started'}
              </p>
            </div>
            
            <form onSubmit={handleAuth} className="grid-pro" style={{ gap: 'var(--space-6)' }}>
              {authMode === 'register' && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    👤 Full Name
                  </label>
                  <input
                    type="text" 
                    placeholder="Enter your full name" 
                    value={authData.name}
                    onChange={(e) => setAuthData({...authData, name: e.target.value})}
                    className="input-pro focus-ring-pro"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  📧 Email Address
                </label>
                <input
                  type="email" 
                  placeholder="Enter your email address" 
                  value={authData.email}
                  onChange={(e) => setAuthData({...authData, email: e.target.value})}
                  className="input-pro focus-ring-pro"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  🔒 Password
                </label>
                <input
                  type="password" 
                  placeholder="Enter your password" 
                  value={authData.password}
                  onChange={(e) => setAuthData({...authData, password: e.target.value})}
                  className="input-pro focus-ring-pro"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className={`btn-primary-pro focus-ring-pro ${loading ? 'opacity-50' : ''}`}
                style={{
                  width: '100%', 
                  padding: 'var(--space-5)', 
                  fontSize: '1.125rem', 
                  fontWeight: '700',
                  marginTop: 'var(--space-4)'
                }}
              >
                {loading ? '⏳ Processing...' : (authMode === 'login' ? '🚀 Sign In' : '✨ Create Account')}
              </button>
            </form>
            
            <div className="text-center mt-8">
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-primary font-semibold hover:underline"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {authMode === 'login' ? 
                  "🆕 Don't have an account? Create one" : 
                  "🔙 Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;