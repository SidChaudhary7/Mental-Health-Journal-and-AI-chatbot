import axios, { AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  ApiResponse, 
  PaginatedResponse, 
  JournalEntry, 
  ChatSession, 
  ChatMessage,
  JournalStats,
  WellnessTrends,
  User 
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

console.log('🌐 API_BASE_URL configured as:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increased to 60 seconds for AI responses
  withCredentials: false, // Disable credentials for now to test
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 API Request:', {
      method: config.method,
      url: config.baseURL + config.url,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      requestUrl: error.config?.url,
      requestMethod: error.config?.method
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    console.log('🚀 Attempting registration with:', { 
      url: `${API_BASE_URL}/auth/register`,
      data: { ...data, password: '[HIDDEN]' }
    });
    
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', data);
      console.log('✅ Registration successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration failed:', {
        message: error.message,
        code: error.code,
        name: error.name,
        response: error.response,
        request: error.request ? 'Request was made' : 'Request was not made',
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      
      // Create a more informative error
      const enhancedError = {
        message: error.response?.data?.message || error.message || 'Registration failed',
        status: error.response?.status,
        data: error.response?.data
      };
      
      throw enhancedError;
    }
  },
  
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', data);
    return response.data;
  },
  
  logout: async (): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = await api.post('/auth/logout');
    return response.data;
  },
  
  getMe: async (): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/auth/me');
    return response.data;
  },
  
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put('/auth/update-profile', data);
    return response.data;
  },
};

// Journal API
export const journalApi = {
  create: async (data: {
    title: string;
    content: string;
    mood: string;
    tags?: string[];
    isPrivate?: boolean;
  }): Promise<ApiResponse<JournalEntry>> => {
    const response: AxiosResponse<ApiResponse<JournalEntry>> = await api.post('/journal', data);
    return response.data;
  },
  
  getAll: async (params?: {
    page?: number;
    limit?: number;
    mood?: string;
    tags?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<JournalEntry>> => {
    const response: AxiosResponse<PaginatedResponse<JournalEntry>> = await api.get('/journal', { params });
    return response.data;
  },
  
  getById: async (id: string): Promise<ApiResponse<JournalEntry>> => {
    const response: AxiosResponse<ApiResponse<JournalEntry>> = await api.get(`/journal/${id}`);
    return response.data;
  },
  
  update: async (id: string, data: Partial<JournalEntry>): Promise<ApiResponse<JournalEntry>> => {
    const response: AxiosResponse<ApiResponse<JournalEntry>> = await api.put(`/journal/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = await api.delete(`/journal/${id}`);
    return response.data;
  },
  
  getStats: async (): Promise<ApiResponse<JournalStats>> => {
    const response: AxiosResponse<ApiResponse<JournalStats>> = await api.get('/journal/stats/overview');
    return response.data;
  },
};

// Analysis API
export const analysisApi = {
  analyze: async (entryId: string): Promise<ApiResponse<{ entryId: string; analysis: any }>> => {
    console.log('🧠 Requesting AI analysis for entry:', entryId);
    const response: AxiosResponse<ApiResponse<{ entryId: string; analysis: any }>> = 
      await api.post(`/analysis/analyze/${entryId}`, {});
    console.log('📊 Analysis response:', response.data);
    return response.data;
  },
  
  getTrends: async (period: number = 30): Promise<ApiResponse<WellnessTrends>> => {
    const response: AxiosResponse<ApiResponse<WellnessTrends>> = 
      await api.get(`/analysis/trends?period=${period}`);
    return response.data;
  },
};

// Analytics API
export const analyticsApi = {
  getOverview: async (): Promise<ApiResponse<{
    totalEntries: number;
    entriesThisMonth: number;
    averageWellness: number;
    analyzedEntriesCount: number;
    moodDistribution: Record<string, number>;
  }>> => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },
  
  getTrends: async (period: number = 30): Promise<ApiResponse<{
    period: number;
    totalEntries: number;
    averageWellness: number;
    averageSentiment: number;
    trends: Array<{
      date: string;
      wellnessScore: number;
      sentimentScore: number;
      mood: string;
      title: string;
    }>;
    moodFrequency: Record<string, number>;
  }>> => {
    const response = await api.get(`/analytics/trends?period=${period}`);
    return response.data;
  },
  
  getInsights: async (): Promise<ApiResponse<{
    insights: Array<{
      type: 'success' | 'warning' | 'info';
      title: string;
      message: string;
    }>;
  }>> => {
    const response = await api.get('/analytics/insights');
    return response.data;
  },
};

// Chat API
export const chatApi = {
  createSession: async (data?: {
    title?: string;
    sessionType?: string;
  }): Promise<ApiResponse<ChatSession>> => {
    const response: AxiosResponse<ApiResponse<ChatSession>> = await api.post('/chat/sessions', data || {});
    return response.data;
  },
  
  getSessions: async (): Promise<ApiResponse<ChatSession[]>> => {
    const response: AxiosResponse<ApiResponse<ChatSession[]>> = await api.get('/chat/sessions');
    return response.data;
  },
  
  getSession: async (id: string): Promise<ApiResponse<ChatSession>> => {
    const response: AxiosResponse<ApiResponse<ChatSession>> = await api.get(`/chat/sessions/${id}`);
    return response.data;
  },
  
  sendMessage: async (sessionId: string, content: string): Promise<ApiResponse<{
    sessionId: string;
    messages: ChatMessage[];
  }>> => {
    const response: AxiosResponse<ApiResponse<{
      sessionId: string;
      messages: ChatMessage[];
    }>> = await api.post(`/chat/sessions/${sessionId}/messages`, { content });
    return response.data;
  },
  
  deleteSession: async (id: string): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = await api.delete(`/chat/sessions/${id}`);
    return response.data;
  },
};

export default api;