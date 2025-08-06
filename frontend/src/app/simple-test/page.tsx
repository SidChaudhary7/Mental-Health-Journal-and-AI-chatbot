'use client';

import { useState } from 'react';

export default function SimpleTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBasicFetch = async () => {
    setLoading(true);
    setResult('Testing basic fetch...');
    
    try {
      console.log('Starting basic fetch test...');
      
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response received:', response);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Data:', data);
      
      setResult(`✅ Basic fetch successful!\n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      console.error('Basic fetch failed:', error);
      setResult(`❌ Basic fetch failed: ${error.message}\n\nError details: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegistration = async () => {
    setLoading(true);
    setResult('Testing registration...');
    
    try {
      console.log('Starting registration test...');
      
      const testData = {
        name: 'Simple Test User',
        email: `simple.test.${Date.now()}@example.com`,
        password: 'password123'
      };
      
      console.log('Sending data:', { ...testData, password: '[HIDDEN]' });
      
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      console.log('Registration response received:', response);
      console.log('Registration response status:', response.status);
      console.log('Registration response ok:', response.ok);
      
      const data = await response.json();
      console.log('Registration response data:', data);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || response.statusText}`);
      }
      
      setResult(`✅ Registration successful!\n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setResult(`❌ Registration failed: ${error.message}\n\nError details: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testAxiosRegistration = async () => {
    setLoading(true);
    setResult('Testing axios registration...');
    
    try {
      console.log('Starting axios registration test...');
      
      // Import axios dynamically
      const axios = (await import('axios')).default;
      
      const testData = {
        name: 'Axios Test User',
        email: `axios.test.${Date.now()}@example.com`,
        password: 'password123'
      };
      
      console.log('Sending axios data:', { ...testData, password: '[HIDDEN]' });
      
      const response = await axios.post('http://localhost:5000/api/auth/register', testData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });
      
      console.log('Axios response:', response);
      
      setResult(`✅ Axios registration successful!\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      console.error('Axios registration failed:', error);
      setResult(`❌ Axios registration failed: ${error.message}\n\nError details: ${JSON.stringify({
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      }, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple API Connection Test</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testBasicFetch}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Test Basic Fetch (Health Check)
          </button>
          
          <button
            onClick={testRegistration}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            Test Fetch Registration
          </button>
          
          <button
            onClick={testAxiosRegistration}
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 ml-4"
          >
            Test Axios Registration
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap h-96 overflow-auto">
            {result || 'Click a test button to see results...'}
          </pre>
        </div>
        
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}