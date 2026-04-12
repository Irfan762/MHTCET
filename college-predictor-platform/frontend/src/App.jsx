import React from 'react';
import { useState } from 'react';
import { useAppLogic } from './hooks/useAppLogic';
import Layout from './components/layout/Layout';
import AuthModal from './components/auth/AuthModal';
import Notification from './components/common/Notification';

// Pages
import Dashboard from './pages/Dashboard';
import Predictor from './pages/Predictor';
import Colleges from './pages/Colleges';
import Analysis from './pages/Analysis';
import Placements from './pages/Placements';
import NotificationsPage from './pages/Notifications';
import Connect from './pages/Connect';
import Results from './pages/Results';
import AdminPanel from './pages/AdminPanel';
import ChatWidget from './components/chat/ChatWidget';

// Styling
import './index.css';

function App() {
  const [showIntelligenceHistory, setShowIntelligenceHistory] = useState(false);

  const {
    activeTab, setActiveTab,
    predictions,
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
    startNewIntelligenceChat, loadIntelligenceSession, deleteIntelligenceSession, deleteAllIntelligenceHistory,
    addNotification
  } = useAppLogic();

  // Render current tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            collegesCount={colleges.length} 
            predictionsCount={predictions.length}
            onAction={setActiveTab} 
          />
        );
      case 'predictor':
        return (
          <Predictor 
            formData={formData}
            setFormData={setFormData}
            predictions={predictions}
            loading={loading}
            onPredict={handlePredict}
            onDownloadPDF={downloadPDF}
            onDownloadAll={downloadAllPDF}
            courseOptions={courseOptions}
          />
        );
      case 'colleges':
        return <Colleges colleges={colleges} />;
      case 'placements':
        return <Placements />;
      case 'notifications':
        return <NotificationsPage />;
      case 'connect':
        return <Connect />;
      case 'results':
        return (
          <Results 
            history={predictionHistory}
            onLoad={loadPredictionFromHistory}
            onDelete={deletePrediction}
            onDeleteAll={deleteAllPredictions}
            onDownload={downloadHistoryPDF}
          />
        );
      case 'analysis':
        return <Analysis />;
      case 'intelligence':
        return (
          <ChatWidget 
            messages={intelligenceMessages}
            input={intelligenceInput}
            setInput={setIntelligenceInput}
            onSend={handleIntelligenceChatSend}
            loading={intelligenceLoading}
            sessions={intelligenceHistory} 
            currentSessionId={intelligenceSessionId}
            onNewChat={startNewIntelligenceChat}
            onLoadSession={loadIntelligenceSession}
            onDeleteSession={deleteIntelligenceSession}
            onDeleteAll={deleteAllIntelligenceHistory}
            showHistory={showIntelligenceHistory}
            setShowHistory={setShowIntelligenceHistory}
            isIntelligence={true}
          />
        );
      case 'adminUser':
        return (
          <AdminPanel 
            users={adminUsers}
            onDeleteUser={() => addNotification('Operation restricted to super-admin', 'warning')}
          />
        );
      default:
        return (
          <div className="py-20 text-center">
            <h3 className="text-2xl font-900 text-slate-400 italic">SECTION UNDER STRATEGIC DEVELOPMENT</h3>
            <p className="text-slate-400 font-medium uppercase tracking-widest text-xs mt-4">Our engineers are working on advanced intelligence modules for this section.</p>
          </div>
        );
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        notificationsCount={2} 
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
      >
        {renderContent()}
      </Layout>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        setMode={setAuthMode}
        onAuth={handleAuth}
        loading={loading}
      />

      <Notification notifications={notifications} />
    </>
  );
}

export default App;
