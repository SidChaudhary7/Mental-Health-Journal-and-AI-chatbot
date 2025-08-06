'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, BookOpen, MessageCircle, BarChart3, User, Heart } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="flex justify-center items-center mb-6">
              <Heart className="h-12 w-12 text-indigo-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Mental Health Journal</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A digital space to track your mental wellness journey with AI-powered insights and support
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <BookOpen className="h-8 w-8 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Daily Journaling</h3>
              <p className="text-gray-600">Record your thoughts, feelings, and experiences in a safe, private space.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <BarChart3 className="h-8 w-8 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Mental Wellness Analysis</h3>
              <p className="text-gray-600">Get AI-powered insights into your mental state and track your progress over time.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <MessageCircle className="h-8 w-8 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI Support Chat</h3>
              <p className="text-gray-600">Receive personalized feedback and coping strategies from our AI counselor.</p>
            </div>
          </div>

          <div className="text-center">
            <div className="space-x-4">
              <Link 
                href="/auth/register" 
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors inline-block"
              >
                Get Started
              </Link>
              <Link 
                href="/auth/login" 
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors inline-block"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Mental Health Journal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user.name}</span>
              <Link href="/profile" className="text-indigo-600 hover:text-indigo-800">
                <User className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Wellness Dashboard</h2>
          <p className="text-gray-600">Track your mental health journey and get personalized insights</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link 
            href="/journal/new" 
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-indigo-500"
          >
            <div className="flex items-center">
              <PlusCircle className="h-8 w-8 text-indigo-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">New Entry</h3>
                <p className="text-gray-600 text-sm">Write in your journal</p>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/journal" 
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">My Entries</h3>
                <p className="text-gray-600 text-sm">View past entries</p>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/analytics" 
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-blue-500"
          >
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-gray-600 text-sm">View insights</p>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/chat" 
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-purple-500"
          >
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">AI Chat</h3>
                <p className="text-gray-600 text-sm">Get support</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <p className="text-gray-600">Your recent journal entries and chat sessions will appear here.</p>
        </div>
      </div>
    </div>
  );
}
