const express = require('express');
const ChatSession = require('../models/ChatSession');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/chat/sessions
// @desc    Create a new chat session
// @access  Private
router.post('/sessions', auth, async (req, res) => {
  try {
    const { title, sessionType } = req.body;

    const session = await ChatSession.create({
      user: req.user._id,
      title: title || 'Mental Health Chat',
      context: {
        sessionType: sessionType || 'general_support'
      }
    });

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Create chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating chat session'
    });
  }
});

// @route   GET /api/chat/sessions
// @desc    Get all chat sessions for the user
// @access  Private
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user._id })
      .sort({ lastActivity: -1 })
      .select('-messages'); // Exclude messages for list view

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chat sessions'
    });
  }
});

// @route   GET /api/chat/sessions/:id
// @desc    Get a specific chat session with messages
// @access  Private
router.get('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('context.relatedJournalEntries', 'title createdAt');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chat session'
    });
  }
});

// @route   POST /api/chat/sessions/:id/messages
// @desc    Send a message in a chat session
// @access  Private
router.post('/sessions/:id/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: content
    });

    // TODO: Implement actual AI response using OpenAI API
    // For now, providing a mock response
    const mockResponse = generateMockResponse(content, session.context.sessionType);
    
    session.messages.push({
      role: 'assistant',
      content: mockResponse
    });

    await session.save();

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        messages: session.messages.slice(-2) // Return last 2 messages (user + assistant)
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

// @route   DELETE /api/chat/sessions/:id
// @desc    Delete a chat session
// @access  Private
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    await ChatSession.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting chat session'
    });
  }
});

// Helper function to generate mock responses
function generateMockResponse(userMessage, sessionType) {
  const responses = {
    general_support: [
      "I understand you're going through a challenging time. Can you tell me more about what's been on your mind lately?",
      "It sounds like you're dealing with a lot right now. Remember that it's okay to feel overwhelmed sometimes.",
      "Thank you for sharing that with me. How has this been affecting your daily routine?",
      "I hear what you're saying. What kind of support do you think would be most helpful for you right now?"
    ],
    mood_analysis: [
      "Based on what you've shared, it seems like you're experiencing some mixed emotions. That's completely normal.",
      "I notice some patterns in how you're feeling. Have you considered what might be contributing to these emotions?",
      "Your emotional awareness is really good. What strategies have you tried before when feeling this way?"
    ],
    coping_strategies: [
      "Here are some coping strategies that might help: deep breathing exercises, journaling, or taking a short walk.",
      "Have you tried mindfulness techniques? They can be really effective for managing stress and anxiety.",
      "It might help to establish a daily routine that includes activities you enjoy. What brings you joy?"
    ],
    crisis_intervention: [
      "I'm concerned about what you've shared. Please remember that you're not alone and help is available.",
      "If you're having thoughts of self-harm, please reach out to a crisis hotline or emergency services immediately.",
      "Your safety is the most important thing right now. Is there someone you trust who you can talk to?"
    ]
  };

  const responseArray = responses[sessionType] || responses.general_support;
  return responseArray[Math.floor(Math.random() * responseArray.length)];
}

module.exports = router;