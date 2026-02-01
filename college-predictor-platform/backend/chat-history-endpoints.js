// Chat History Management Endpoints
// Add these to server.js after the main chat endpoint

// Get all chat sessions for a user
app.get('/api/chat/history', authenticateToken, async (req, res) => {
  try {
    const sessions = await ChatMessage.find({ user: req.user._id })
      .select('sessionId messages createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        messages: s.messages,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to load chat history' });
  }
});

// Get a specific chat session
app.get('/api/chat/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = await ChatMessage.findOne({
      user: req.user._id,
      sessionId: req.params.sessionId
    }).lean();

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to load session' });
  }
});

// Delete a specific chat session
app.delete('/api/chat/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    await ChatMessage.deleteOne({
      user: req.user._id,
      sessionId: req.params.sessionId
    });

    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    console.error('Session delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete session' });
  }
});
