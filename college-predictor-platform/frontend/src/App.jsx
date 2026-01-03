import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import {
  HiHome,
  HiChartBar,
  HiAcademicCap,
  HiBriefcase,
  HiClipboardList,
  HiTrendingUp,
  HiSparkles,
  HiShieldCheck,
  HiLogout,
  HiUser,
  HiBell,
  HiMail
} from 'react-icons/hi';

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
  const [selectedPredictionForAnalysis, setSelectedPredictionForAnalysis] = useState(null);
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
  const [adminUsers, setAdminUsers] = useState([]); // Admin State
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  // New state for notifications and college connections
  const [studentNotifications, setStudentNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Admission Results Out!',
      message: 'MHT-CET CAP Round 1 results have been announced. Check your college allocations now.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'info',
      title: 'Document Verification',
      message: 'Remember to complete document verification by 15th January 2025.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'warning',
      title: 'Fee Payment Deadline',
      message: 'Last date for fee payment is approaching. Complete payment to confirm your seat.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      priority: 'high'
    }
  ]);

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

  const [formData, setFormData] = useState({
    percentile: '',
    category: 'General',
    courses: ['Computer Engineering'], // Changed to array for multiple selection
    universityType: 'Home University',
    includeTFWS: false,
    city: 'All Cities'
  });

  const fetchAdminUsers = async () => {
    console.log('Fetching admin users...');
    try {
      const token = localStorage.getItem('mhtcet_token');
      console.log('Token used:', token ? 'Found' : 'Missing');

      const response = await fetch('http://127.0.0.1:3001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Admin users data:', data);

      if (data.success) {
        setAdminUsers(data.users);
      } else {
        console.error('Fetch failed:', data.message);
        addNotification('Failed to fetch users: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Admin fetch error:', error);
      addNotification('Error fetching users', 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'adminUser' && user?.role === 'admin') {
      fetchAdminUsers();
    }
  }, [activeTab, user]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HiHome />, desc: 'Overview & Stats' },
    { id: 'predictor', label: 'AI Predictor', icon: <HiChartBar />, desc: 'Smart Predictions' },
    { id: 'colleges', label: 'Colleges', icon: <HiAcademicCap />, desc: 'Explore Colleges' },
    { id: 'placements', label: 'Placements', icon: <HiBriefcase />, desc: 'Career Data' },
    { id: 'notifications', label: 'Notifications', icon: <HiBell />, desc: 'Important Alerts', badge: studentNotifications.filter(n => !n.read).length },
    { id: 'connect', label: 'Connect', icon: <HiMail />, desc: 'Contact Colleges' },
    { id: 'results', label: 'My Results', icon: <HiClipboardList />, desc: 'Your Predictions' },
    { id: 'analysis', label: 'Round Analysis', icon: <HiTrendingUp />, desc: 'Multi-Round Trends' },
    { id: 'chat', label: 'AI Assistant', icon: <HiSparkles />, desc: 'Comprehensive Help' },
    ...(user?.role === 'admin' ? [{ id: 'adminUser', label: 'Admin Panel', icon: <HiShieldCheck />, desc: 'Student Management' }] : [])
  ];

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

      if (response.status === 401) {
        console.warn('Session expired while loading history');
        handleLogout();
        addNotification('Session expired. Please login again to save history.', 'warning');
        return;
      }

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
  // Load specific prediction from history
  const loadPredictionFromHistory = (historyItem) => {
    if (!historyItem) return;

    // Safety checks for required data
    const safePredictions = Array.isArray(historyItem.predictions) ? historyItem.predictions : [];
    const safeInputData = historyItem.inputData || {};

    setPredictions(safePredictions);
    setFormData({
      percentile: safeInputData.percentile ? safeInputData.percentile.toString() : '',
      category: safeInputData.category || 'General',
      courses: safeInputData.course || safeInputData.courses || [],
      universityType: safeInputData.universityType || 'Home University',
      includeLadies: safeInputData.includeLadies || false,
      includeTFWS: safeInputData.includeTFWS || false
    });

    setShowHistoryView(false);
    setActiveTab('results'); // Switch to results view to show data
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

    setLoading(true);
    try {
      const token = localStorage.getItem('mhtcet_token');

      // Build headers - only include Authorization if we have a real token
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token && token !== 'temp-token') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://127.0.0.1:3001/api/predictions', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setPredictions(data.predictions);
        setSelectedCourseFilter('all'); // Reset filter for new predictions
        setActiveTab('results');
        if (user) {
          if (!data.predictionId) {
            // Frontend thinks we are logged in, but backend didn't save it -> Session Expired (Token Invalid)
            addNotification('Prediction generated but not saved to history. Session may have expired.', 'warning');
            loadPredictionHistory(); // This will trigger the 401 check and logout if needed
          } else {
            loadPredictionHistory(); // Reload to see the new item
            // Only show double notification if we want to confirm save
            // addNotification('🎉 Predictions generated and saved to history!', 'success');
          }
        }
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
            userPercentile: formData.percentile, // Added for personalized predictions
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
    console.log('[App] Initiating PDF download for:', college.name);
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
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP error! status: ${response.status}`;

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          errorMessage = await response.text();
        }

        throw new Error(errorMessage);
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
    console.log('[App] Initiating bulk PDF download...');
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
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP error! status: ${response.status}`;

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          errorMessage = await response.text();
        }

        throw new Error(errorMessage);
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

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?\nThis action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('mhtcet_token');
      const response = await fetch(`http://127.0.0.1:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        addNotification('User deleted successfully', 'success');
        fetchAdminUsers(); // Refresh list
      } else {
        addNotification(data.message || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      addNotification('Error deleting user', 'error');
    }
  };

  const openCollegeModal = (college) => {
    setSelectedCollege(college);
    setShowCollegeModal(true);
  };

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (college.location && college.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const uniqueCities = ['All Cities', ...new Set(colleges.map(c => c.city || (c.location && c.location.split(',')[0]) || 'Unknown').filter(city => city !== 'Unknown'))].sort((a, b) => a === 'All Cities' ? -1 : a.localeCompare(b));




  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <div className="brand">
          <div className="brand-icon"><HiAcademicCap /></div>
          {sidebarOpen && <h1 style={{ fontSize: '20px', fontWeight: 800 }}>MHT-CET Pro</h1>}
        </div>

        <nav className="nav-group">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              title={item.label}
              style={{ position: 'relative' }}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
              {item.badge && item.badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: '700',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="user-section" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sidebarOpen && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontWeight: 'bold' }}>
                    {user.name.charAt(0)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.email}</div>
                  </div>
                </div>
              )}
              <button onClick={handleLogout} className="nav-item" style={{ padding: '8px 12px', fontSize: '13px' }}>
                <span className="nav-icon"><HiLogout /></span>
                {sidebarOpen && <span>Sign Out</span>}
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="btn-primary" style={{ padding: '10px', fontSize: '13px' }}>
              {sidebarOpen ? 'Sign In' : <HiUser />}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header-top">
          <div className="page-title">
            <h1>{sidebarItems.find(i => i.id === activeTab)?.label}</h1>
            <p>{sidebarItems.find(i => i.id === activeTab)?.desc}</p>
          </div>
          <div
            className="flex items-center justify-between gap-3 border rounded-xl px-4 py-2 shadow-sm bg-white"
          >
            <span className="px-3 py-1 text-sm font-semibold rounded-lg bg-indigo-100 text-indigo-700">
              MHT-CET 2025
            </span>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
              className="w-9 h-9 flex items-center justify-center border rounded-lg transition hover:bg-gray-100 active:scale-95"
            >
              {sidebarOpen ? '◂' : '▸'}
            </button>
          </div>
        </header>

        <div className="content-scroll">
          {activeTab === 'dashboard' && (
            <div className="fade-in">
              {/* Stats Grid */}
              <div className="stats-grid" style={{ marginBottom: '32px' }}>
                {[
                  {
                    label: 'Engineering Colleges',
                    value: '373+',
                    icon: <HiAcademicCap />,
                    style: {
                      bg: 'var(--pastel-blue-50)',
                      border: 'var(--pastel-blue-200)',
                      text: 'var(--primary-700)',
                      iconBg: 'var(--pastel-blue-100)',
                      iconColor: 'var(--primary-600)'
                    }
                  },
                  {
                    label: 'AI Prediction Accuracy',
                    value: '99.2%',
                    icon: <HiChartBar />,
                    style: {
                      bg: 'var(--pastel-mint-50)',
                      border: 'var(--pastel-mint-200)',
                      text: 'var(--success-600)',
                      iconBg: 'var(--pastel-mint-100)',
                      iconColor: 'var(--success-600)'
                    }
                  },
                  {
                    label: 'Active Students',
                    value: user ? '1,247' : '1,246',
                    icon: <HiUser />,
                    style: {
                      bg: 'var(--pastel-yellow-50)',
                      border: 'var(--pastel-yellow-200)',
                      text: 'var(--warning-600)',
                      iconBg: 'var(--pastel-yellow-100)',
                      iconColor: 'var(--warning-600)'
                    }
                  },
                  {
                    label: 'Avg Package',
                    value: '₹8.5 LPA',
                    icon: <HiBriefcase />,
                    style: {
                      bg: 'var(--pastel-pink-50)',
                      border: 'var(--pastel-pink-200)',
                      text: 'var(--danger-600)',
                      iconBg: 'var(--pastel-pink-100)',
                      iconColor: 'var(--danger-500)'
                    }
                  }
                ].map((stat, i) => (
                  <div key={i} className="stat-card" style={{
                    background: stat.style.bg,
                    borderColor: stat.style.border,
                  }}>
                    <div className="stat-info">
                      <h3 style={{ color: stat.style.text }}>{stat.label}</h3>
                      <div className="stat-value">{stat.value}</div>
                    </div>
                    <div className="stat-icon" style={{
                      background: stat.style.iconBg,
                      color: stat.style.iconColor
                    }}>
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Hero CTA Section */}
              <div className="form-card" style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: 'white',
                border: 'none',
                padding: '48px',
                marginBottom: '32px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '20px', marginBottom: '16px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#60a5fa' }}>🎓 MHT-CET 2025</span>
                  </div>
                  <h2 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                    Ready for CAP Round Admissions?
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '700px', marginBottom: '32px', lineHeight: '1.6' }}>
                    Our AI-powered prediction engine analyzes 22,000+ data points from all 4 CAP rounds to provide personalized college recommendations with 99.2% accuracy.
                  </p>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <button
                      className="btn-primary"
                      onClick={() => setActiveTab('predictor')}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        padding: '14px 32px',
                        fontSize: '16px',
                        fontWeight: 700,
                        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
                      }}
                    >
                      Start AI Prediction
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => setActiveTab('colleges')}
                      style={{
                        background: 'transparent',
                        border: '2px solid #475569',
                        color: '#cbd5e1',
                        padding: '14px 32px',
                        fontSize: '16px',
                        fontWeight: 600
                      }}
                    >
                      Explore Colleges
                    </button>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div style={{
                  position: 'absolute',
                  top: '-100px',
                  right: '-100px',
                  width: '300px',
                  height: '300px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                  zIndex: 0
                }} />
              </div>

              {/* Quick Actions Grid */}
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', color: '#1e293b' }}>Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {[
                  {
                    title: 'AI Predictor',
                    desc: 'Get personalized college predictions',
                    icon: <HiChartBar />,
                    action: 'predictor',
                    color: 'var(--primary-600)',
                    bg: 'var(--pastel-blue-50)',
                    border: 'var(--pastel-blue-200)'
                  },
                  {
                    title: 'Explore Colleges',
                    desc: 'Browse 373+ engineering colleges',
                    icon: <HiAcademicCap />,
                    action: 'colleges',
                    color: 'var(--success-600)',
                    bg: 'var(--pastel-mint-50)',
                    border: 'var(--pastel-mint-200)'
                  },
                  {
                    title: 'Round Analysis',
                    desc: 'Compare cutoff trends across rounds',
                    icon: <HiTrendingUp />,
                    action: 'analysis',
                    color: 'var(--warning-600)',
                    bg: 'var(--pastel-yellow-50)',
                    border: 'var(--pastel-yellow-200)'
                  },
                  {
                    title: 'AI Assistant',
                    desc: 'Get instant answers to your queries',
                    icon: <HiSparkles />,
                    action: 'chat',
                    color: '#8b5cf6',
                    bg: 'var(--pastel-pink-50)',
                    border: 'var(--pastel-pink-200)'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="form-card"
                    onClick={() => setActiveTab(item.action)}
                    style={{
                      padding: '24px',
                      background: item.bg,
                      border: `1px solid ${item.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                  >
                    <div style={{
                      fontSize: '28px',
                      color: item.color,
                      marginBottom: '16px',
                      background: 'white',
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {item.icon}
                    </div>
                    <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tips & Features Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div className="form-card" style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: '#1e293b' }}>
                    💡 Pro Tips for MHT-CET Admissions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      'Use AI Predictor early to plan your college choices strategically',
                      'Compare cutoffs across all 4 CAP rounds for better decision making',
                      'Check both Home University (HU) and Other University (OHU) options',
                      'Don\'t forget to explore TFWS and Ladies Quota opportunities'
                    ].map((tip, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#dcfce7',
                          color: '#166534',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </span>
                        <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.6' }}>
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-card" style={{
                  padding: '28px',
                  background: 'var(--pastel-mint-50)',
                  border: '1px solid var(--pastel-mint-200)',
                  height: '100%'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: '#1e293b' }}>
                    Platform Stats
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: 'Data Points', value: '22,296' },
                      { label: 'Colleges', value: '373' },
                      { label: 'Courses', value: '54+' },
                      { label: 'CAP Rounds', value: '4' }
                    ].map((stat, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{stat.label}</span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#166534' }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="fade-in">
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>Important Updates</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Stay informed about admissions, deadlines, and announcements
                  </p>
                </div>
                <button
                  onClick={() => setStudentNotifications(studentNotifications.map(n => ({ ...n, read: true })))}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Mark All as Read
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {studentNotifications.length === 0 ? (
                  <div className="form-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <HiBell style={{ fontSize: '64px', color: '#cbd5e1', marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                      No Notifications
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                      You're all caught up! New updates will appear here.
                    </p>
                  </div>
                ) : (
                  studentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="form-card"
                      style={{
                        background: notification.read ? 'white' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: `2px solid ${notification.read ? '#e2e8f0' : '#3b82f6'}`,
                        padding: '20px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => {
                        setStudentNotifications(studentNotifications.map(n =>
                          n.id === notification.id ? { ...n, read: true } : n
                        ));
                      }}
                    >
                      {!notification.read && (
                        <span style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#3b82f6'
                        }} />
                      )}

                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: notification.type === 'success' ? '#dcfce7' : notification.type === 'warning' ? '#fef3c7' : '#dbeafe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          flexShrink: 0
                        }}>
                          {notification.type === 'success' ? '✅' : notification.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                              {notification.title}
                            </h3>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 600,
                              background: notification.priority === 'high' ? '#fee2e2' : '#fef3c7',
                              color: notification.priority === 'high' ? '#991b1b' : '#92400e'
                            }}>
                              {notification.priority === 'high' ? 'URGENT' : 'IMPORTANT'}
                            </span>
                          </div>

                          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 12px 0', lineHeight: '1.6' }}>
                            {notification.message}
                          </p>

                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {new Date(notification.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Connect to Colleges Tab */}
          {activeTab === 'connect' && (
            <div className="fade-in">
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>College Contact Information</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Find direct contact details to reach out to colleges for admissions and queries
                </p>
              </div>

              <div className="form-card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '2px solid #3b82f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <HiMail style={{ fontSize: '32px', color: '#3b82f6' }} />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>How to Connect</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Use the contact details below to reach out directly to colleges</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '16px', background: 'white', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>📞</span>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>Call admissions office</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>📧</span>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>Send email inquiries</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🌐</span>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>Visit official website</span>
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>College Directory</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                {colleges.slice(0, 12).map((college, idx) => (
                  <div key={idx} className="form-card" style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#1e293b', lineHeight: '1.4' }}>
                      {college.name}
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                        <span style={{ fontSize: '16px', marginTop: '2px' }}>📍</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>Location</div>
                          <div style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                            {college.location || college.city || 'Maharashtra'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                        <span style={{ fontSize: '16px', marginTop: '2px' }}>📞</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>Phone</div>
                          <div style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                            {college.phone || '+91-XXX-XXX-XXXX'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                        <span style={{ fontSize: '16px', marginTop: '2px' }}>📧</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>Email</div>
                          <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 500, wordBreak: 'break-word' }}>
                            {college.email || 'admissions@college.edu'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                        <span style={{ fontSize: '16px', marginTop: '2px' }}>🌐</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>Website</div>
                          <a
                            href={college.website || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 500, textDecoration: 'none' }}
                          >
                            {college.website || 'www.college.edu'}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: '#eff6ff',
                        color: '#1e40af'
                      }}>
                        {college.type || 'Autonomous'}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: '#f0fdf4',
                        color: '#166534'
                      }}>
                        AICTE Approved
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {colleges.length > 12 && (
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <button
                    className="btn-primary"
                    onClick={() => setActiveTab('colleges')}
                    style={{ padding: '12px 32px' }}
                  >
                    View All {colleges.length} Colleges
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Professional AI Predictor */}
          {activeTab === 'predictor' && (
            <div className="predictor-container fade-in">
              <div className="form-card">
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Algorithm Parameters</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Enter your MHT-CET details for accurate prediction.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Percentile Score</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 98.45"
                    value={formData.percentile}
                    onChange={(e) => setFormData({ ...formData, percentile: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Candidate Category</label>
                  <select
                    className="input-field"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {['General', 'OBC', 'SC', 'ST', 'VJ/DT', 'NT-A', 'NT-B', 'NT-C', 'NT-D', 'SBC', 'EWS'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Courses</label>
                  <div className="multi-select-container">
                    {courseOptions.map((course) => (
                      <label key={course} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.courses.includes(course)}
                          onChange={() => {
                            const newCourses = formData.courses.includes(course)
                              ? formData.courses.filter(c => c !== course)
                              : [...formData.courses, course];
                            setFormData({ ...formData, courses: newCourses });
                          }}
                        />
                        <span style={{ fontSize: '14px' }}>{course}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">University Type</label>
                    <select
                      className="input-field"
                      value={formData.universityType}
                      onChange={(e) => setFormData({ ...formData, universityType: e.target.value })}
                    >
                      <option value="Home University">Home University (HU)</option>
                      <option value="Other than Home University">Other than HU (OHU)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Location</label>
                    <select
                      className="input-field"
                      value={formData.city || 'All Cities'}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    >
                      {uniqueCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                  <label className="checkbox-item">
                    <input type="checkbox" checked={formData.includeLadies} onChange={(e) => setFormData({ ...formData, includeLadies: e.target.checked })} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Ladies Quota</span>
                  </label>
                  <label className="checkbox-item">
                    <input type="checkbox" checked={formData.includeTFWS} onChange={(e) => setFormData({ ...formData, includeTFWS: e.target.checked })} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>TFWS Benefits</span>
                  </label>
                </div>

                <button
                  className="btn-primary"
                  onClick={handlePrediction}
                  disabled={loading || !formData.percentile || formData.courses.length === 0}
                >
                  {loading ? 'Analyzing Data...' : 'Generate Prediction Report 🚀'}
                </button>
              </div>

              <div className="sidebar-info" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-card" style={{ padding: '24px', background: '#f1f5f9', border: 'none' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Why MHT-CET Pro?</h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {['Real-time 2024 Cutoff Data', 'Smarter Probability Scoring', 'AI-Driven Career Insights', 'Seat-type Analysis (HU/OHU)'].map((text, i) => (
                      <li key={i} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                        <span style={{ color: '#10b981' }}>✓</span> {text}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="form-card" style={{ padding: '24px', background: 'var(--primary)', color: 'white', border: 'none' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Need Help?</h3>
                  <p style={{ fontSize: '13px', color: '#bfdbfe', marginBottom: '16px' }}>Ask our AI assistant about CAP round procedures or college life.</p>
                  <button onClick={() => setActiveTab('chat')} style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Chat Now</button>
                </div>
              </div>
            </div>
          )}
          {/* Colleges Tab */}
          {activeTab === 'colleges' && (
            <div className="animate-slide-bottom">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h3 className="gradient-text-pro" style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>
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
                        <div style={{ color: '#667eea', fontSize: '0.75rem', fontWeight: '600' }}>BEST CUTOFF</div>
                        <div style={{ color: '#1f2937', fontSize: '1.1rem', fontWeight: '700' }}>
                          {college.rounds && college.rounds.length > 0
                            ? `${Math.max(...college.rounds.map(r => r.cutoff?.general || 0))}%`
                            : (college.cutoff?.general ? `${college.cutoff.general}%` : 'N/A')}
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
                    style={{ padding: '1rem 2rem', fontSize: '1rem', border: ' 1px solid black', borderRadius: '12px', cursor: 'pointer' }}
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
                                border: `2px solid ${company.type === 'Product' ? 'var(--success-200)' :
                                  company.type === 'Service' ? 'var(--primary-200)' :
                                    company.type === 'Consulting' ? 'var(--warning-200)' : 'var(--error-200)'
                                  }`
                              }}>
                                <div className="card-body-pro">
                                  <div className="flex justify-between items-start mb-2">
                                    <h6 className="font-bold text-gray-800">{company.name}</h6>
                                    <span className={`badge-${company.type === 'Product' ? 'success' :
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
                          { icon: '📊', title: 'Average Package', value: '₹8.5 LPA', desc: 'Top Colleges', color: 'linear-gradient(135deg, var(--success-600) 0%, var(--success-500) 100%)' },
                          { icon: '🎯', title: 'Placement Rate', value: '95%', desc: 'Overall Success', color: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)' },
                          { icon: '🏢', title: 'Top Recruiters', value: '500+', desc: 'Companies', color: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }
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
                  <button onClick={() => setActiveTab('predictor')} className="btn-modern animate-pulse-glow " style={{ border: '1px solid black', padding: '20px', borderRadius: '2px' }}>
                    🎯 Start Prediction
                  </button>
                </div>
              ) : predictions.length === 0 && predictionHistory.length > 0 ? (
                <div>
                  <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h3 className="gradient-text-pro" style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 1rem 0' }}>
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

                          <div className="grid-pro grid-cols-4" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
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
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-800">{historyItem.inputData?.city || 'All Cities'}</div>
                              <div className="text-xs text-gray-500">Selected City</div>
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
                    <h3 className="gradient-text-pro" style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 1rem 0' }}>
                      📊 Your Prediction Results
                    </h3>
                    <p className="text-gray-600 font-medium text-lg m-0">
                      Based on your MHT-CET performance analysis
                    </p>
                    {/* History Toggle Button */}
                    {predictionHistory.length > 0 && (
                      <div style={{ position: 'absolute', top: 0, right: 0 }}>
                        <button
                          onClick={() => setShowHistoryView(!showHistoryView)}
                          className="btn-secondary-pro"
                          style={{ fontSize: '0.875rem', padding: 'var(--space-2) var(--space-4)', color: 'black' }}
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

                              <div className="grid-pro grid-cols-4" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
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
                                <div className="text-center">
                                  <div className="text-lg font-bold text-gray-800">{historyItem.inputData?.city || 'All Cities'}</div>
                                  <div className="text-xs text-gray-500">Selected City</div>
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
                            <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>ADMISSION CHANCE</div>
                            <div style={{ color: '#1f2937', fontSize: '2rem', fontWeight: '900' }}>
                              {Math.round(predictions.reduce((sum, p) => sum + p.admissionChance, 0) / (predictions.length || 1))}%
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: '600' }}>SAFE COLLEGES</div>
                            <div style={{ color: '#10b981', fontSize: '2rem', fontWeight: '900' }}>
                              {predictions.filter(p => p.admissionChance >= 85).length}
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
                              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'black' }}
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
                                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'black' }}
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

                      <div className="results-grid">
                        <div className="result-row" style={{ background: '#f8fafc', fontWeight: 700, border: 'none', cursor: 'default', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>
                          <div>College Name</div>
                          <div>City</div>
                          <div>Branch</div>
                          <div style={{ textAlign: 'center' }}>Type</div>
                          <div style={{ textAlign: 'center' }}>AI Accuracy</div>
                          <div style={{ textAlign: 'center' }}>Status</div>
                        </div>
                        {predictions
                          .filter(prediction => selectedCourseFilter === 'all' || prediction.course === selectedCourseFilter)
                          .map((prediction, index) => {
                            if (!prediction) return null;
                            const cityName = prediction.city || (prediction.location ? prediction.location.split(',')[0] : 'Unknown');
                            const riskLabel = prediction.riskLabel || 'Unknown';

                            return (
                              <div key={index} className="result-row fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                                <div className="col-name">{prediction.name || 'Unknown College'}</div>
                                <div className="col-city">{cityName}</div>
                                <div className="col-branch">{prediction.branch || prediction.course || 'N/A'}</div>
                                <div style={{ textAlign: 'center' }}>
                                  <span className={`badge ${prediction.seatTypeLabel === 'TFWS' ? 'badge-indigo' : prediction.seatTypeLabel === 'Ladies' ? 'badge-pink' : 'badge-success'}`}>
                                    {prediction.seatTypeLabel || 'HU'}
                                  </span>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary-600)' }}>
                                    {prediction.aiConfidence || 'N/A'}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>AI CONFIDENCE</div>
                                </div>
                                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                  <span className={`badge ${riskLabel.includes('High') ? 'badge-success animate-pulse-glow' : riskLabel === 'Probable' ? 'badge-success' : 'badge-warning'}`}>
                                    {riskLabel}
                                  </span>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '150px', lineHeight: '1.2' }}>
                                    {prediction.aiInsight || 'No insights available'}
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <button
                                      onClick={() => {
                                        setSelectedPredictionForAnalysis(prediction);
                                        setActiveTab('analysis');
                                      }}
                                      className="btn-link"
                                      style={{ fontSize: '12px', padding: '2px 6px', color: 'var(--primary)', fontWeight: '600', borderRadius: '4px', border: '2px solid black' }}
                                    >
                                      Analyze 📈
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Round Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="animate-fade-in-pro">
              <div className="glass-card animate-slide-top" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '20px' }}>
                <h2 className="gradient-text-pro" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
                  📈 Multi-Round Cutoff Analysis
                </h2>
                <p className="text-gray-600 text-lg">
                  Visualize and analyze cutoff trends across all 4 rounds of MHT-CET counseling.
                </p>
              </div>

              {selectedPredictionForAnalysis ? (
                <div className="grid-pro" style={{ gap: '2rem' }}>
                  <div className="card-pro animate-slide-in-pro">
                    <div className="card-header-pro">
                      <h3 style={{ margin: 0 }}>{selectedPredictionForAnalysis.name}</h3>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>{selectedPredictionForAnalysis.branch}</p>
                    </div>
                    <div className="card-body-pro">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        {[1, 2, 3, 4].map(roundNum => {
                          const roundData = selectedPredictionForAnalysis.allRounds?.find(r => r.round === roundNum);
                          const isBestRound = selectedPredictionForAnalysis.bestMatchingRound === roundNum;

                          return (
                            <div
                              key={roundNum}
                              className={`glass-card ${isBestRound ? 'animate-pulse-glow' : ''}`}
                              style={{
                                padding: '1rem',
                                textAlign: 'center',
                                border: isBestRound ? '2px solid var(--success-500)' : '1px solid rgba(0,0,0,0.1)',
                                background: isBestRound ? 'rgba(16, 185, 129, 0.05)' : 'white'
                              }}
                            >
                              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                ROUND {roundNum}
                              </div>
                              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: isBestRound ? 'var(--success-600)' : '#1f2937' }}>
                                {roundData ? `${roundData.cutoff}%` : 'N/A'}
                              </div>
                              {isBestRound && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--success-600)', fontWeight: '700', marginTop: '4px' }}>
                                  🎯 BEST MATCH
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Analysis Insights</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#4b5563', lineHeight: '1.6' }}>
                          <li>The cutoff generally <strong>{selectedPredictionForAnalysis.allRounds?.length > 1 && selectedPredictionForAnalysis.allRounds[0].cutoff > selectedPredictionForAnalysis.allRounds[selectedPredictionForAnalysis.allRounds.length - 1].cutoff ? 'decreased' : 'increased'}</strong> across rounds.</li>
                          <li>You have a <strong>{selectedPredictionForAnalysis.riskLabel}</strong> chance of admission based on Round {selectedPredictionForAnalysis.bestMatchingRound} data.</li>
                          <li>Your percentile ({formData.percentile}%) is <strong>{Math.abs(selectedPredictionForAnalysis.difference)}% {selectedPredictionForAnalysis.difference >= 0 ? 'above' : 'below'}</strong> the Round {selectedPredictionForAnalysis.bestMatchingRound} cutoff.</li>
                          {selectedPredictionForAnalysis.allRounds?.length < 3 && (
                            <li style={{ color: '#ef4444' }}>💡 Note: Limited historical round data available for this specific branch.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0' }}>Cutoff Trend Visualization</h3>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '2rem', padding: '0 2rem', borderBottom: '2px solid #e2e8f0' }}>
                      {[1, 2, 3, 4].map(roundNum => {
                        const roundData = selectedPredictionForAnalysis.allRounds?.find(r => r.round === roundNum);
                        const height = roundData ? (roundData.cutoff / 100) * 100 : 0;

                        return (
                          <div key={roundNum} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                            <div
                              style={{
                                width: '100%',
                                height: `${height}%`,
                                background: selectedPredictionForAnalysis.bestMatchingRound === roundNum ? 'var(--primary)' : '#cbd5e1',
                                borderRadius: '8px 8px 0 0',
                                transition: 'height 1s ease-out',
                                cursor: 'pointer',
                                position: 'relative'
                              }}
                              title={`Round ${roundNum}: ${roundData?.cutoff || 'N/A'}%`}
                            >
                              {roundData && (
                                <div style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                                  {roundData.cutoff}%
                                </div>
                              )}
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>R{roundNum}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <button
                      onClick={() => setActiveTab('results')}
                      className="btn-secondary-pro"
                      style={{ padding: '1rem 2rem' }}
                    >
                      ← Back to Predictions
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📈</div>
                  <h3>No Selection for Analysis</h3>
                  <p className="text-gray-500">Go to "My Results" and click "Analyze" on any college to see detailed round-wise trends.</p>
                  <button
                    onClick={() => setActiveTab('results')}
                    className="btn-primary-pro"
                    style={{ marginTop: '1.5rem' }}
                  >
                    View My Predictions
                  </button>
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
                          if (user) handleChatSubmit({ preventDefault: () => { } });
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

          {/* Admin Dashboard Tab */}
          {activeTab === 'adminUser' && user?.role === 'admin' && (
            <div className="animate-fade-in-pro">
              {/* Professional Admin Header */}
              <div className="glass-card-pro animate-slide-top" style={{
                padding: '2rem',
                marginBottom: '2rem',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    👑
                  </div>
                  <div>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: 0, letterSpacing: '-0.025em' }}>Admin Control Center</h2>
                    <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '1.1rem' }}>Enterprise-grade user management & system monitoring</p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={fetchAdminUsers}
                      className="btn-primary"
                      style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: 'none' }}
                    >
                      🔄 Refresh Data
                    </button>
                  </div>
                </div>
              </div>

              {/* System Stats Grid */}
              <div className="admin-stats-grid">
                {[
                  { label: 'Total Registrations', value: adminUsers.length, icon: '👥', color: '#eff6ff', textColor: '#3b82f6' },
                  { label: 'Verified Students', value: adminUsers.filter(u => u.role === 'student').length, icon: '🎓', color: '#ecfdf5', textColor: '#10b981' },
                  { label: 'System Admins', value: adminUsers.filter(u => u.role === 'admin').length, icon: '🛡️', color: '#fef3c7', textColor: '#d97706' },
                  { label: 'Recent Activity', value: '24h', icon: '⚡', color: '#fdf2f8', textColor: '#db2777' }
                ].map((stat, i) => (
                  <div key={i} className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: stat.color }}>{stat.icon}</div>
                    <div className="admin-stat-details">
                      <h4>{stat.label}</h4>
                      <div className="value">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced User Table Container */}
              <div className="admin-table-container animate-slide-in-pro">
                <div className="admin-table-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Student Directory</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage and monitor all platform participants</p>
                  </div>
                  <div className="admin-search-bar">
                    <input
                      type="text"
                      placeholder="Search users by name, email or category..."
                      value={adminSearchTerm}
                      onChange={(e) => setAdminSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User Identity</th>
                        <th>Role & Access</th>
                        <th>Location</th>
                        <th>Admission Profile</th>
                        <th>Joined Date</th>
                        <th style={{ textAlign: 'center' }}>Management</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers
                        .filter(u =>
                          u.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                          (u.profile?.city && u.profile.city.toLowerCase().includes(adminSearchTerm.toLowerCase()))
                        )
                        .map((u, i) => (
                          <tr key={u._id}>
                            <td>
                              <div className="user-info-cell">
                                <div className="user-avatar" style={{
                                  background: `linear-gradient(135deg, ${['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 6]
                                    } 0%, ${['#1d4ed8', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'][i % 6]
                                    } 100%)`
                                }}>
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="user-name">{u.name}</div>
                                  <div className="user-email">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${u.role === 'admin' ? 'badge-pink' : 'badge-indigo'}`} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                                <span>📍</span> {u.profile?.city || 'Not Set'}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{u.profile?.category || 'General'}</span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.profile?.percentile ? `Percentile: ${u.profile.percentile}%` : 'No percentile yet'}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                                {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {u.role !== 'admin' ? (
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="action-btn-delete"
                                  title="Revoke Access / Delete User"
                                >
                                  🗑️
                                </button>
                              ) : (
                                <span style={{ fontSize: '1.2rem', opacity: 0.3 }} title="System admins cannot be deleted">🔒</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      {adminUsers.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: '6rem 3rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <h3 style={{ color: '#64748b', margin: 0 }}>No users found</h3>
                            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Try refreshing or adjusting your search criteria</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '1rem 1.5rem', background: '#fcfdfe', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Showing <strong>{adminUsers.length}</strong> total system users
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1].map(p => (
                      <button key={p} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div> {/* End content-scroll */}
      </main >

      {/* Modals Container */}
      {
        showCollegeModal && selectedCollege && (
          <div className="modal-overlay" onClick={() => setShowCollegeModal(false)}>
            <div className="modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800 }}>{selectedCollege.name}</h2>
                <button onClick={() => setShowCollegeModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[1, 2, 3, 4].map(rNum => {
                  const rData = (selectedCollege.rounds || []).find(r => String(r.number) === String(rNum));
                  const cutoffVal = rData?.cutoff?.general;
                  return (
                    <div key={rNum} className="glass-card" style={{ padding: '12px', textAlign: 'center', background: '#f8fafc', border: rData ? '1px solid #e2e8f0' : '1px dashed #cbd5e1' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b' }}>ROUND {rNum}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: (cutoffVal && cutoffVal > 0) ? '#1e293b' : '#94a3b8' }}>
                        {cutoffVal && cutoffVal > 0 ? `${cutoffVal}%` : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>📚 Course-wise Round Cutoffs (General)</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                        <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Branch Name</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>R1</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>R2</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>R3</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>R4</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCollege.courses?.map((courseObj, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: '600', color: '#475569' }}>{courseObj.name || (typeof courseObj === 'string' ? courseObj : 'Unnamed Course')}</td>
                          {[1, 2, 3, 4].map(n => {
                            const r = (courseObj.rounds || []).find(r => String(r.number) === String(n));
                            const val = r?.cutoff?.general;
                            return (
                              <td key={n} style={{ padding: '10px', textAlign: 'center' }}>
                                {(val && val > 0) ? (
                                  <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: '#f0f9ff',
                                    color: '#0369a1',
                                    fontWeight: '700'
                                  }}>
                                    {val}%
                                  </span>
                                ) : (
                                  <span style={{ color: '#cbd5e1' }}>—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div className="stat-card" style={{ padding: '16px', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
                  <div className="stat-info">
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#0369a1' }}>Avg Placement Package</h3>
                    <div className="stat-value" style={{ fontSize: '1.25rem', color: '#0c4a6e' }}>{selectedCollege.placements?.averagePackage || '₹8.5 LPA'}</div>
                  </div>
                </div>
                <div className="stat-card" style={{ padding: '16px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                  <div className="stat-info">
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>Placement Rate</h3>
                    <div className="stat-value" style={{ fontSize: '1.25rem', color: '#064e3b' }}>{selectedCollege.placements?.placementRate || '95%'}</div>
                  </div>
                </div>
              </div>

              <button className="btn-primary" onClick={() => downloadPDF(selectedCollege)} style={{ marginTop: '24px' }}>Download Detailed Report</button>
            </div>
          </div>
        )
      }

      {
        showAuthModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {authMode === 'register' && (
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="input-field" type="text" value={authData.name} onChange={e => setAuthData({ ...authData, name: e.target.value })} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="input-field" type="email" value={authData.email} onChange={e => setAuthData({ ...authData, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="input-field" type="password" value={authData.password} onChange={e => setAuthData({ ...authData, password: e.target.value })} />
                </div>
                <button className="btn-primary" type="submit">{loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Register')}</button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <span onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ color: 'var(--primary)', cursor: 'pointer', marginLeft: '4px', fontWeight: 600 }}>
                  {authMode === 'login' ? 'Sign Up' : 'Login'}
                </span>
              </p>
              <button onClick={() => setShowAuthModal(false)} style={{ marginTop: '20px', width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default App;
