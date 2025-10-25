const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [2000, 'Message content cannot be more than 2000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ChatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Mental Health Chat',
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  messages: [MessageSchema],
  context: {
    relatedJournalEntries: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry'
    }],
    userMentalState: {
      type: String,
      enum: ['excellent', 'good', 'neutral', 'concerning', 'critical']
    },
    sessionType: {
      type: String,
      enum: ['general_support', 'mood_analysis', 'coping_strategies', 'crisis_intervention'],
      default: 'general_support'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Update lastActivity before saving
ChatSessionSchema.pre('save', function(next) {
  this.lastActivity = Date.now();
  next();
});

// Index for efficient queries
ChatSessionSchema.index({ user: 1, lastActivity: -1 });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);