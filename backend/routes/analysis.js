const express = require('express');
const JournalEntry = require('../models/JournalEntry');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/analysis/analyze/:entryId
// @desc    Analyze a journal entry for sentiment and wellness
// @access  Private
router.post('/analyze/:entryId', auth, async (req, res) => {
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

    // TODO: Implement actual sentiment analysis using OpenAI API
    // For now, providing mock analysis
    const mockAnalysis = {
      sentiment: {
        score: Math.random() * 2 - 1, // -1 to 1
        magnitude: Math.random(),
        label: ['positive', 'negative', 'neutral', 'mixed'][Math.floor(Math.random() * 4)]
      },
      emotions: [
        { emotion: 'joy', confidence: Math.random() },
        { emotion: 'sadness', confidence: Math.random() },
        { emotion: 'anxiety', confidence: Math.random() }
      ],
      keywords: ['stress', 'work', 'family', 'health'],
      wellnessScore: Math.floor(Math.random() * 100),
      suggestions: [
        'Consider practicing mindfulness meditation',
        'Try to maintain a regular sleep schedule',
        'Engage in physical activity to boost mood'
      ],
      analyzedAt: new Date()
    };

    // Update the entry with analysis
    entry.analysis = mockAnalysis;
    await entry.save();

    res.json({
      success: true,
      data: {
        entryId: entry._id,
        analysis: mockAnalysis
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during analysis'
    });
  }
});

// @route   GET /api/analysis/trends
// @desc    Get wellness trends for the user
// @access  Private
router.get('/trends', auth, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const entries = await JournalEntry.find({
      user: req.user._id,
      createdAt: { $gte: daysAgo },
      'analysis.wellnessScore': { $exists: true }
    }).select('createdAt analysis.wellnessScore mood').sort({ createdAt: 1 });

    const trends = entries.map(entry => ({
      date: entry.createdAt.toISOString().split('T')[0],
      wellnessScore: entry.analysis.wellnessScore,
      mood: entry.mood
    }));

    const averageWellness = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + entry.analysis.wellnessScore, 0) / entries.length 
      : 0;

    res.json({
      success: true,
      data: {
        period: parseInt(period),
        averageWellness: Math.round(averageWellness),
        trends,
        totalEntries: entries.length
      }
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trends'
    });
  }
});

module.exports = router;