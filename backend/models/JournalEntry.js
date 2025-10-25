const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide journal content'],
    maxlength: [5000, 'Content cannot be more than 5000 characters']
  },
  mood: {
    type: String,
    enum: ['very_sad', 'sad', 'neutral', 'happy', 'very_happy'],
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPrivate: {
    type: Boolean,
    default: true
  },
  analysis: {
    sentiment: {
      score: {
        type: Number,
        min: -1,
        max: 1
      },
      magnitude: {
        type: Number,
        min: 0,
        max: 1
      },
      label: {
        type: String,
        enum: ['positive', 'negative', 'neutral', 'mixed']
      }
    },
    emotions: [{
      emotion: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    keywords: [String],
    wellnessScore: {
      type: Number,
      min: 0,
      max: 100
    },
    suggestions: [String],
    analyzedAt: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
JournalEntrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
JournalEntrySchema.index({ user: 1, createdAt: -1 });
JournalEntrySchema.index({ user: 1, tags: 1 });

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);