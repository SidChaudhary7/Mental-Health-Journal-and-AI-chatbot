const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const User = require('./models/User');
const JournalEntry = require('./models/JournalEntry');
const ChatSession = require('./models/ChatSession');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Configure CORS explicitly before any other middleware
app.use(cors({
  origin: '*',
  credentials: false,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} from ${req.ip || req.connection.remoteAddress}`);
  next();
});


// Routes
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  console.log('Registration requested:', req.body);
  
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({ name, email, password });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    console.log('Registration successful for:', email);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  console.log('Login requested:', req.body.email);
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    console.log('Login successful for:', email);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  console.log('Logout requested');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Journal endpoints
app.post('/api/journal', auth, async (req, res) => {
  console.log('Journal entry creation requested by user:', req.user._id);
  
  try {
    const { title, content, mood, tags, isPrivate } = req.body;

    if (!title || !content || !mood) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, content and mood'
      });
    }

    const journalEntry = await JournalEntry.create({
      user: req.user._id,
      title,
      content,
      mood,
      tags: tags || [],
      isPrivate: isPrivate !== undefined ? isPrivate : true
    });

    console.log('Journal entry created successfully:', journalEntry._id);
    res.status(201).json({
      success: true,
      data: journalEntry
    });
  } catch (error) {
    console.error('Journal creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during journal entry creation',
      error: error.message
    });
  }
});

app.get('/api/journal', auth, async (req, res) => {
  console.log('Journal entries requested by user:', req.user._id);
  
  try {
    const { page = 1, limit = 10, mood, tags, startDate, endDate } = req.query;
    
    const query = { user: req.user._id };
    
    if (mood) query.mood = mood;
    if (tags) query.tags = { $in: tags.split(',') };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const entries = await JournalEntry.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await JournalEntry.countDocuments(query);

    console.log(`Retrieved ${entries.length} journal entries`);
    res.json({
      success: true,
      data: entries,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Journal retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during journal entries retrieval'
    });
  }
});

app.get('/api/journal/:id', auth, async (req, res) => {
  console.log('Single journal entry requested:', req.params.id);
  
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Journal entry retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during journal entry retrieval'
    });
  }
});

app.put('/api/journal/:id', auth, async (req, res) => {
  console.log('Journal entry update requested:', req.params.id);
  
  try {
    const { title, content, mood, tags, isPrivate } = req.body;

    const entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title, content, mood, tags, isPrivate },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    console.log('Journal entry updated successfully:', entry._id);
    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Journal entry update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during journal entry update'
    });
  }
});

app.delete('/api/journal/:id', auth, async (req, res) => {
  console.log('Journal entry deletion requested:', req.params.id);
  
  try {
    const entry = await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    console.log('Journal entry deleted successfully:', entry._id);
    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Journal entry deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during journal entry deletion'
    });
  }
});

// Chat endpoints with OpenRouter AI integration
app.post('/api/chat/sessions', auth, async (req, res) => {
  console.log('Chat session creation requested by user:', req.user._id);
  
  try {
    console.log('📦 Request body:', req.body);
    const { title, sessionType } = req.body || {};

    const chatSession = await ChatSession.create({
      user: req.user._id,
      title: title || 'Mental Health Chat',
      context: {
        sessionType: sessionType || 'general_support'
      },
      messages: [{
        role: 'assistant',
        content: "Hello! I'm your AI wellness companion. I'm here to listen, provide support, and help you work through any thoughts or feelings you'd like to discuss. How are you feeling today?",
        timestamp: new Date()
      }]
    });

    console.log('Chat session created successfully:', chatSession._id);
    res.status(201).json({
      success: true,
      data: chatSession
    });
  } catch (error) {
    console.error('Chat session creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during chat session creation',
      error: error.message
    });
  }
});

app.get('/api/chat/sessions', auth, async (req, res) => {
  console.log('Chat sessions requested by user:', req.user._id);
  
  try {
    const sessions = await ChatSession.find({ user: req.user._id })
      .sort({ lastActivity: -1 })
      .limit(10);

    console.log(`Retrieved ${sessions.length} chat sessions`);
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Chat sessions retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during chat sessions retrieval'
    });
  }
});

app.get('/api/chat/sessions/:id', auth, async (req, res) => {
  console.log('Chat session requested:', req.params.id);
  
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

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Chat session retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during chat session retrieval'
    });
  }
});

app.post('/api/chat/sessions/:id/messages', auth, async (req, res) => {
  console.log('Chat message requested for session:', req.params.id);
  
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
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

    // Add user message to session
    const userMessage = {
      role: 'user',
      content: content,
      timestamp: new Date()
    };
    
    session.messages.push(userMessage);

    // Generate AI response using OpenRouter
    try {
      const aiResponse = await generateAIResponse(session.messages, req.user.name);
      
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      session.messages.push(assistantMessage);
    } catch (aiError) {
      console.error('AI response generation error:', aiError);
      // Fallback response if AI fails
      const fallbackMessage = {
        role: 'assistant',
        content: "I apologize, but I'm experiencing some technical difficulties right now. However, I want you to know that I'm still here to listen. Could you tell me more about what's on your mind? Sometimes just expressing our thoughts can be helpful.",
        timestamp: new Date()
      };
      session.messages.push(fallbackMessage);
    }

    await session.save();

    console.log('Chat message processed successfully');
    res.json({
      success: true,
      data: {
        sessionId: session._id,
        messages: session.messages
      }
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during message processing'
    });
  }
});

// Analytics endpoints
app.get('/api/analytics/overview', auth, async (req, res) => {
  console.log('Analytics overview requested by user:', req.user._id);
  
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Get total journal entries
    const totalEntries = await JournalEntry.countDocuments({ user: req.user._id });
    
    // Get entries this month
    const entriesThisMonth = await JournalEntry.countDocuments({
      user: req.user._id,
      createdAt: { $gte: startOfMonth }
    });

    // Get entries with analysis for wellness calculation
    const analyzedEntries = await JournalEntry.find({
      user: req.user._id,
      'analysis.wellnessScore': { $exists: true, $ne: null }
    }).select('analysis.wellnessScore createdAt');

    // Calculate average wellness score
    let averageWellness = 50; // default
    if (analyzedEntries.length > 0) {
      const totalWellness = analyzedEntries.reduce((sum, entry) => sum + (entry.analysis.wellnessScore || 50), 0);
      averageWellness = Math.round(totalWellness / analyzedEntries.length);
    }

    // Get mood distribution
    const moodStats = await JournalEntry.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$mood', count: { $sum: 1 } } }
    ]);

    console.log(`Analytics overview: ${totalEntries} total entries, ${entriesThisMonth} this month, ${averageWellness}% wellness`);
    
    res.json({
      success: true,
      data: {
        totalEntries,
        entriesThisMonth,
        averageWellness,
        analyzedEntriesCount: analyzedEntries.length,
        moodDistribution: moodStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during analytics overview'
    });
  }
});

app.get('/api/analytics/trends', auth, async (req, res) => {
  console.log('Analytics trends requested by user:', req.user._id);
  
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Get entries with analysis for the specified period
    const entries = await JournalEntry.find({
      user: req.user._id,
      createdAt: { $gte: daysAgo },
      'analysis.wellnessScore': { $exists: true, $ne: null }
    })
    .select('createdAt analysis.wellnessScore analysis.sentiment mood title')
    .sort({ createdAt: 1 });

    // Group entries by date for trend analysis
    const trendData = entries.map(entry => ({
      date: entry.createdAt.toISOString().split('T')[0],
      wellnessScore: entry.analysis.wellnessScore,
      sentimentScore: entry.analysis.sentiment?.score || 0,
      mood: entry.mood,
      title: entry.title
    }));

    // Calculate trend metrics
    const averageWellness = entries.length > 0 
      ? Math.round(entries.reduce((sum, entry) => sum + (entry.analysis.wellnessScore || 50), 0) / entries.length)
      : 50;

    const averageSentiment = entries.length > 0
      ? entries.reduce((sum, entry) => sum + (entry.analysis.sentiment?.score || 0), 0) / entries.length
      : 0;

    // Mood frequency analysis
    const moodFrequency = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});

    console.log(`Trends analysis: ${entries.length} analyzed entries over ${period} days`);
    
    res.json({
      success: true,
      data: {
        period: parseInt(period),
        totalEntries: entries.length,
        averageWellness,
        averageSentiment: Math.round(averageSentiment * 100) / 100,
        trends: trendData,
        moodFrequency
      }
    });
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during trends analysis'
    });
  }
});

app.get('/api/analytics/insights', auth, async (req, res) => {
  console.log('Analytics insights requested by user:', req.user._id);
  
  try {
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Get recent entries for analysis
    const recentEntries = await JournalEntry.find({
      user: req.user._id,
      createdAt: { $gte: sevenDaysAgo }
    }).select('createdAt analysis mood');

    const olderEntries = await JournalEntry.find({
      user: req.user._id,
      createdAt: { $gte: thirtyDaysAgo, $lt: sevenDaysAgo }
    }).select('createdAt analysis mood');

    const insights = [];

    // Journaling streak detection
    const journalingDays = recentEntries.length;
    if (journalingDays >= 3) {
      insights.push({
        type: 'success',
        title: 'Consistent Journaling',
        message: `You've written ${journalingDays} entries in the past week. Great job maintaining your journaling habit!`
      });
    }

    // Wellness trend analysis
    const recentWellnessScores = recentEntries
      .filter(entry => entry.analysis?.wellnessScore)
      .map(entry => entry.analysis.wellnessScore);
    
    const olderWellnessScores = olderEntries
      .filter(entry => entry.analysis?.wellnessScore)
      .map(entry => entry.analysis.wellnessScore);

    if (recentWellnessScores.length > 0 && olderWellnessScores.length > 0) {
      const recentAverage = recentWellnessScores.reduce((a, b) => a + b, 0) / recentWellnessScores.length;
      const olderAverage = olderWellnessScores.reduce((a, b) => a + b, 0) / olderWellnessScores.length;
      const improvement = recentAverage - olderAverage;

      if (improvement > 10) {
        insights.push({
          type: 'success',
          title: 'Wellness Improvement',
          message: `Your wellness score has improved by ${Math.round(improvement)} points recently. Your self-care efforts are paying off!`
        });
      } else if (improvement < -10) {
        insights.push({
          type: 'warning',
          title: 'Wellness Attention',
          message: `Your wellness score has decreased recently. Consider focusing on self-care activities and reach out for support if needed.`
        });
      }
    }

    // Mood pattern analysis
    const positiveMoods = recentEntries.filter(entry => 
      ['very_happy', 'happy'].includes(entry.mood)
    ).length;
    
    const totalRecentEntries = recentEntries.length;
    
    if (totalRecentEntries > 0) {
      const positiveRatio = positiveMoods / totalRecentEntries;
      if (positiveRatio >= 0.6) {
        insights.push({
          type: 'success',
          title: 'Positive Mood Pattern',
          message: `${Math.round(positiveRatio * 100)}% of your recent entries show positive moods. Keep up the great work!`
        });
      }
    }

    // Default encouragement if no specific insights
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Keep Going',
        message: 'Continue your journaling journey! Regular reflection helps build self-awareness and emotional wellbeing.'
      });
    }

    console.log(`Generated ${insights.length} insights for user`);
    
    res.json({
      success: true,
      data: { insights }
    });
  } catch (error) {
    console.error('Analytics insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during insights generation'
    });
  }
});

// Analysis endpoint for journal entries
app.post('/api/analysis/analyze/:entryId', auth, async (req, res) => {
  console.log('Analysis requested for entry:', req.params.entryId);
  
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.entryId,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Check if entry already has complete analysis 
    const hasCompleteAnalysis = entry.analysis && 
        entry.analysis.analyzedAt && 
        entry.analysis.sentiment && 
        entry.analysis.wellnessScore !== undefined &&
        entry.analysis.suggestions && 
        entry.analysis.suggestions.length > 0 &&
        entry.analysis.keywords && 
        entry.analysis.keywords.length > 0 &&
        entry.analysis.emotions && 
        entry.analysis.emotions.length > 0;

    if (hasCompleteAnalysis) {
      console.log('✅ Using cached complete analysis for entry:', entry._id);
      return res.json({
        success: true,
        data: {
          entryId: entry._id,
          analysis: entry.analysis
        }
      });
    } else if (entry.analysis && entry.analysis.analyzedAt) {
      console.log('🔄 Found incomplete analysis, regenerating for entry:', entry._id);
      console.log('📊 Current analysis state:', {
        hasSentiment: !!entry.analysis.sentiment,
        hasWellnessScore: entry.analysis.wellnessScore !== undefined,
        suggestionsCount: entry.analysis.suggestions?.length || 0,
        keywordsCount: entry.analysis.keywords?.length || 0,
        emotionsCount: entry.analysis.emotions?.length || 0
      });
    } else {
      console.log('🆕 No analysis found, generating new analysis for entry:', entry._id);
    }

    // Generate new analysis using AI
    try {
      console.log('🧠 Generating AI analysis...');
      const analysis = await generateEntryAnalysis(entry.title, entry.content, entry.mood);
      
      // Save analysis to journal entry
      entry.analysis = {
        ...analysis,
        analyzedAt: new Date()
      };
      await entry.save();

      console.log('✅ Analysis completed and saved');
      res.json({
        success: true,
        data: {
          entryId: entry._id,
          analysis: entry.analysis
        }
      });
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      res.status(500).json({
        success: false,
        message: 'Failed to generate analysis',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Analysis endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during analysis'
    });
  }
});

// Function to generate AI analysis of journal entry
async function generateEntryAnalysis(title, content, mood) {
  const OPENROUTER_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const analysisPrompt = {
    role: 'system',
    content: `You are an expert mental health analyst. Analyze the following journal entry and respond ONLY with valid JSON - no additional text, no markdown, no explanation.

Return this EXACT JSON structure with real analysis:
{
  "sentiment": {
    "score": <number between -1 and 1>,
    "magnitude": <number between 0 and 1>,
    "label": "positive" | "negative" | "neutral" | "mixed"
  },
  "emotions": [
    {"emotion": "<emotion name>", "confidence": <number between 0 and 1>}
  ],
  "keywords": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "wellnessScore": <number between 0 and 100>,
  "suggestions": [
    "<actionable suggestion 1>",
    "<actionable suggestion 2>", 
    "<actionable suggestion 3>"
  ],
  "insights": {
    "patterns": "<patterns you notice>",
    "strengths": "<positive aspects>", 
    "concerns": "<areas needing attention>",
    "growth": "<growth opportunities>"
  }
}

CRITICAL: Return ONLY valid JSON. No text before or after the JSON object.`
  };

  const userPrompt = {
    role: 'user',
    content: `Please analyze this journal entry:

Title: "${title}"
Content: "${content}"
Mood: "${mood}"

Provide analysis in the JSON format specified.`
  };

  try {
    console.log('🤖 Calling OpenRouter for analysis...');
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o', // Using GPT-4o which is better at following JSON format instructions
      messages: [analysisPrompt, userPrompt],
      max_tokens: 800,
      temperature: 0.2, // Lower temperature for more consistent analysis
      top_p: 0.8
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3001',
        'X-Title': 'Mental Health Journal - AI Analysis'
      },
      timeout: 45000
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
      const analysisText = response.data.choices[0].message.content;
      console.log('✅ Raw analysis response:', analysisText);
      
      try {
        // Clean the response text - sometimes AI adds markdown formatting
        let cleanedText = analysisText.trim();
        
        // Remove potential markdown code blocks
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        console.log('🧹 Cleaned analysis text:', cleanedText);
        
        // Parse the JSON response
        const analysis = JSON.parse(cleanedText);
        console.log('📊 Parsed analysis:', analysis);
        return analysis;
      } catch (parseError) {
        console.error('❌ Failed to parse analysis JSON:', parseError.message);
        console.error('📄 Original text:', analysisText);
        
        // Fallback: Try to extract JSON from the response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            console.log('🔄 Attempting to parse extracted JSON...');
            const analysis = JSON.parse(jsonMatch[0]);
            console.log('📊 Fallback parsing successful:', analysis);
            return analysis;
          } catch (fallbackError) {
            console.error('❌ Fallback parsing also failed:', fallbackError.message);
          }
        }
        
        // Final fallback: Return a basic analysis structure
        console.log('🏥 Using basic analysis fallback');
        return generateBasicAnalysis(title, content, mood);
      }
    } else {
      console.error('❌ Invalid analysis response structure:', response.data);
      throw new Error('Invalid response from OpenRouter API');
    }
  } catch (error) {
    console.error('❌ Analysis API error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error('Failed to generate AI analysis');
  }
}

// Fallback function to generate basic analysis
function generateBasicAnalysis(title, content, mood) {
  const contentLength = content.length;
  const positiveWords = ['happy', 'joy', 'good', 'great', 'amazing', 'wonderful', 'excited', 'grateful', 'love', 'success'];
  const negativeWords = ['sad', 'angry', 'frustrated', 'worried', 'anxious', 'stressed', 'depressed', 'tired', 'lonely', 'difficult'];
  
  const contentLower = content.toLowerCase();
  const titleLower = title.toLowerCase();
  
  const positiveCount = positiveWords.reduce((count, word) => 
    count + (contentLower.split(word).length - 1), 0);
  const negativeCount = negativeWords.reduce((count, word) => 
    count + (contentLower.split(word).length - 1), 0);
  
  // Basic sentiment calculation
  let sentimentScore = 0;
  if (mood === 'very_happy') sentimentScore = 0.8;
  else if (mood === 'happy') sentimentScore = 0.5;
  else if (mood === 'sad') sentimentScore = -0.5;
  else if (mood === 'very_sad') sentimentScore = -0.8;
  
  // Adjust based on content
  if (positiveCount > negativeCount) sentimentScore += 0.3;
  else if (negativeCount > positiveCount) sentimentScore -= 0.3;
  
  sentimentScore = Math.max(-1, Math.min(1, sentimentScore)); // Clamp between -1 and 1
  
  // Basic wellness score
  let wellnessScore = 50; // Default neutral
  if (sentimentScore > 0.3) wellnessScore = 75;
  else if (sentimentScore > 0) wellnessScore = 65;
  else if (sentimentScore < -0.3) wellnessScore = 25;
  else if (sentimentScore < 0) wellnessScore = 35;
  
  return {
    sentiment: {
      score: sentimentScore,
      magnitude: Math.abs(sentimentScore),
      label: sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral'
    },
    emotions: [
      { emotion: mood.replace('_', ' '), confidence: 0.8 }
    ],
    keywords: [title.toLowerCase(), 'journal', 'reflection'],
    wellnessScore: wellnessScore,
    suggestions: [
      'Continue regular journaling to track your mental wellness',
      'Consider talking to friends or family about your experiences',
      'Practice mindfulness or meditation to enhance self-awareness'
    ],
    insights: {
      patterns: 'This entry reflects your current emotional state and daily experiences',
      strengths: 'You are actively engaging in self-reflection through journaling',
      concerns: sentimentScore < 0 ? 'Consider seeking support if negative feelings persist' : 'No major concerns identified',
      growth: 'Continue using journaling as a tool for emotional processing and growth'
    }
  };
}

// Function to generate AI response using OpenRouter
async function generateAIResponse(messages, userName) {
  const OPENROUTER_API_KEY = process.env.OPENAI_API_KEY; // Using OPENAI_API_KEY for OpenRouter
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  // Prepare conversation history for the AI
  const conversationHistory = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // Add system prompt for mental health context
  const systemPrompt = {
    role: 'system',
    content: `You are a compassionate AI mental health companion. Your role is to:

1. Provide emotional support and active listening
2. Offer evidence-based coping strategies and techniques
3. Encourage professional help when appropriate
4. Be empathetic, non-judgmental, and supportive
5. Ask thoughtful follow-up questions to help users process their feelings
6. Provide practical suggestions for managing stress, anxiety, depression, and other mental health challenges

Important guidelines:
- Always prioritize user safety and wellbeing
- If someone mentions self-harm or suicide, encourage them to contact emergency services or a crisis hotline
- You are not a replacement for professional therapy or medical care
- Be authentic and warm in your responses
- Keep responses concise but meaningful
- The user's name is ${userName}

Respond as a caring mental health companion would.`
  };

  try {
    console.log('🤖 Calling OpenRouter API...');
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3.5-sonnet', // Using a good model for mental health conversations
      messages: [systemPrompt, ...conversationHistory],
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3001',
        'X-Title': 'Mental Health Journal - AI Companion'
      },
      timeout: 45000 // 45 seconds timeout for OpenRouter API
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
      console.log('✅ OpenRouter API response received');
      return response.data.choices[0].message.content;
    } else {
      console.error('❌ Invalid OpenRouter API response structure:', response.data);
      throw new Error('Invalid response from OpenRouter API');
    }
  } catch (error) {
    console.error('❌ OpenRouter API error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error('Failed to generate AI response');
  }
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Server error' });
});

// MongoDB connection and server start
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-health-journal')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Ultra-simple server running on port ${PORT}`);
      console.log(`Test with: curl http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });