export interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      daily_reminder: boolean;
      analysis_updates: boolean;
    };
    privacy: {
      data_sharing: boolean;
    };
  };
  createdAt: string;
}

export interface JournalEntry {
  _id: string;
  user: string | User;
  title: string;
  content: string;
  mood: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy';
  tags: string[];
  isPrivate: boolean;
  analysis?: {
    sentiment: {
      score: number;
      magnitude: number;
      label: 'positive' | 'negative' | 'neutral' | 'mixed';
    };
    emotions: Array<{
      emotion: string;
      confidence: number;
    }>;
    keywords: string[];
    wellnessScore: number;
    suggestions: string[];
    analyzedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  _id: string;
  user: string;
  title: string;
  messages: ChatMessage[];
  context: {
    relatedJournalEntries: string[];
    userMentalState?: 'excellent' | 'good' | 'neutral' | 'concerning' | 'critical';
    sessionType: 'general_support' | 'mood_analysis' | 'coping_strategies' | 'crisis_intervention';
  };
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  count: number;
  total: number;
  currentPage: number;
  totalPages: number;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface JournalStats {
  totalEntries: number;
  entriesThisMonth: number;
  moodDistribution: Array<{
    _id: string;
    count: number;
  }>;
  recentActivity: Array<{
    _id: string;
    count: number;
  }>;
}

export interface WellnessTrends {
  period: number;
  averageWellness: number;
  trends: Array<{
    date: string;
    wellnessScore: number;
    mood: string;
  }>;
  totalEntries: number;
}