const express = require('express');
const JournalEntry = require('../models/JournalEntry');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/journal
// @desc    Create a new journal entry
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, mood, tags, isPrivate } = req.body;

    // Validation
    if (!title || !content || !mood) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, content, and mood'
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

    await journalEntry.populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: journalEntry
    });
  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating journal entry',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/journal
// @desc    Get all journal entries for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    
    const { mood, tags, startDate, endDate } = req.query;
    
    // Build query
    const query = { user: req.user._id };
    
    if (mood) query.mood = mood;
    if (tags) query.tags = { $in: tags.split(',') };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await JournalEntry.countDocuments(query);
    const entries = await JournalEntry.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('user', 'name email');

    res.json({
      success: true,
      count: entries.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: entries
    });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching journal entries'
    });
  }
});

// @route   GET /api/journal/stats/overview
// @desc    Get user's journaling statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get total entries
    const totalEntries = await JournalEntry.countDocuments({ user: userId });
    
    // Get entries this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const entriesThisMonth = await JournalEntry.countDocuments({
      user: userId,
      createdAt: { $gte: thisMonth }
    });
    
    // Get mood distribution
    const moodStats = await JournalEntry.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$mood', count: { $sum: 1 } } }
    ]);
    
    // Get recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentActivity = await JournalEntry.aggregate([
      { 
        $match: { 
          user: userId, 
          createdAt: { $gte: weekAgo } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalEntries,
        entriesThisMonth,
        moodDistribution: moodStats,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get journal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// @route   GET /api/journal/:id
// @desc    Get a single journal entry
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email');

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
    console.error('Get journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching journal entry'
    });
  }
});

// @route   PUT /api/journal/:id
// @desc    Update a journal entry
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    const { title, content, mood, tags, isPrivate } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (mood) updateData.mood = mood;
    if (tags !== undefined) updateData.tags = tags;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    entry = await JournalEntry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating journal entry'
    });
  }
});

// @route   DELETE /api/journal/:id
// @desc    Delete a journal entry
// @access  Private
router.delete('/:id', auth, async (req, res) => {
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

    await JournalEntry.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting journal entry'
    });
  }
});

module.exports = router;