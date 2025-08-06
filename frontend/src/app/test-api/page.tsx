'use client';

import { useState, useEffect } from 'react';
import { simpleApi } from '@/lib/simple-api';

export default function TestAPIPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('Loading...');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const testHealthEndpoint = async () => {
    setLoading(true);
    setResult('Testing connection...');
    
    try {
      const data = await simpleApi.testConnection();
      setResult(`✅ Health Check Success: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Health Check Error: ${error.message}\n\nFull error: ${JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack
      }, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegistration = async () => {
    setLoading(true);
    setResult('Testing registration...');
    
    try {
      const data = await simpleApi.register({
        name: 'API Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'testpass123'
      });
      setResult(`✅ Registration Success: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Registration Error: ${error.message}\n\nFull error: ${JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack
      }, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">API Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Environment Check</h2>
          <p className="mb-2">
            <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}
          </p>
          <p className="mb-4">
            <strong>Current URL:</strong> {currentUrl}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">API Tests</h2>
          <div className="space-x-4 mb-4">
            <button
              onClick={testHealthEndpoint}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test Health Endpoint
            </button>
            
            <button
              onClick={testRegistration}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Test Registration
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
            {result || 'Click a test button to see results...'}
          </pre>
        </div>
      </div>
    </div>
  );
}