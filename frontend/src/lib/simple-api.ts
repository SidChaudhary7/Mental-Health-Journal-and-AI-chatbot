// Simple fetch-based API for testing
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

export const simpleApi = {
  testConnection: async () => {
    try {
      console.log('🔍 Testing connection to:', `${API_BASE_URL}/health`);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Health check successful:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Connection test failed:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  register: async (data: { name: string; email: string; password: string }) => {
    try {
      console.log('🚀 Testing registration to:', `${API_BASE_URL}/auth/register`);
      console.log('📤 Request data:', { ...data, password: '[HIDDEN]' });
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(data),
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ Registration failed:', responseData);
        throw new Error(responseData.message || 'Registration failed');
      }
      
      console.log('✅ Registration successful:', responseData);
      return responseData;
    } catch (error: any) {
      console.error('❌ Registration error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
};