'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, PlusCircle, BookOpen, Calendar, Smile, Meh, Frown } from 'lucide-react';
import { journalApi } from '@/lib/api';
import { JournalEntry } from '@/types';

export default function JournalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchEntries();
  }, [router]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await journalApi.getAll();
      console.log('📖 Journal entries fetched:', response);
      
      if (response.data) {
        setEntries(response.data);
      } else {
        setEntries([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch journal entries:', error);
      setError('Failed to load journal entries');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'very_happy':
      case 'happy':
        return <Smile className="h-5 w-5 text-green-500" />;
      case 'neutral':
        return <Meh className="h-5 w-5 text-yellow-500" />;
      case 'sad':
      case 'very_sad':
        return <Frown className="h-5 w-5 text-red-500" />;
      default:
        return <Meh className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <Heart className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Mental Health Journal</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user.name}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Journal Entries</h2>
            <p className="text-gray-600">Track your thoughts and emotions over time</p>
          </div>
          <Link 
            href="/journal/new"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            New Entry
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Journal Entries */}
        <div className="space-y-6">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No journal entries yet</h3>
              <p className="text-gray-600 mb-6">Start your mental health journey by writing your first entry</p>
              <Link 
                href="/journal/new"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Write Your First Entry
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {entries.map((entry) => (
                <div key={entry._id || entry.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getMoodIcon(entry.mood)}
                      <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(entry.createdAt)}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {entry.content}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {entry.tags && entry.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <Link 
                      href={`/journal/${entry._id || entry.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Read more
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}