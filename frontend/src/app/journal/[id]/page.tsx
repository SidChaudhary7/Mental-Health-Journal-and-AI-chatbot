'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Calendar, ArrowLeft, Edit3, Trash2, Smile, Meh, Frown, Brain, BarChart3, TrendingUp, Lightbulb } from 'lucide-react';
import { journalApi, analysisApi } from '@/lib/api';
import { JournalEntry } from '@/types';

export default function JournalEntryPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    setUser(JSON.parse(userData));
    
    if (params.id) {
      fetchEntry(params.id as string);
    }
  }, [router, params.id]);

  const fetchEntry = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await journalApi.getById(id);
      console.log('📖 Journal entry fetched:', response);
      
      if (response.data) {
        console.log('🔍 Entry analysis field:', response.data.analysis);
        console.log('🔍 Analysis exists?', !!response.data.analysis);
        console.log('🔍 Analysis analyzedAt?', response.data.analysis?.analyzedAt);
        setEntry(response.data);
      } else {
        setError('Journal entry not found');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch journal entry:', error);
      setError('Failed to load journal entry');
    } finally {
      setLoading(false);
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'very_happy':
      case 'happy':
        return <Smile className="h-6 w-6 text-green-500" />;
      case 'neutral':
        return <Meh className="h-6 w-6 text-yellow-500" />;
      case 'sad':
      case 'very_sad':
        return <Frown className="h-6 w-6 text-red-500" />;
      default:
        return <Meh className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleAnalyzeEntry = async () => {
    console.log('🔬 Generate Analysis button clicked!');
    console.log('📄 Entry to analyze:', entry);
    
    if (!entry) {
      console.error('❌ No entry to analyze');
      return;
    }
    
    try {
      console.log('🚀 Starting analysis...');
      setAnalysisLoading(true);
      setAnalysisError('');
      
      console.log('🎯 Calling analysisApi.analyze with ID:', entry._id || entry.id);
      const response = await analysisApi.analyze(entry._id || entry.id);
      console.log('📊 Analysis response received:', response);
      
      if (response.data && response.data.analysis) {
        console.log('✅ Setting analysis data:', response.data.analysis);
        setAnalysis(response.data.analysis);
      } else {
        console.warn('⚠️ No analysis data in response');
      }
    } catch (error: any) {
      console.error('❌ Analysis failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      setAnalysisError(`Failed to generate analysis: ${error.message}`);
    } finally {
      console.log('🏁 Analysis complete, setting loading to false');
      setAnalysisLoading(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600 bg-green-100';
    if (score < -0.3) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getWellnessScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!entry || !confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }

    try {
      await journalApi.delete(entry._id || entry.id);
      router.push('/journal');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      setError('Failed to delete entry');
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !entry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center">
                <Heart className="h-8 w-8 text-indigo-600 mr-3" />
                <h1 className="text-xl font-bold text-gray-900">Mental Health Journal</h1>
              </Link>
            </div>
          </div>
        </nav>
        
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Entry Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link 
              href="/journal"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Journal
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            href="/journal"
            className="text-indigo-600 hover:text-indigo-800 inline-flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Journal
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {entry && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getMoodIcon(entry.mood)}
                  <h1 className="text-2xl font-bold text-gray-900">{entry.title}</h1>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/journal/${entry._id || entry.id}/edit`}
                    className="text-gray-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-gray-100"
                    title="Edit entry"
                  >
                    <Edit3 className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="text-gray-600 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100"
                    title="Delete entry"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center text-gray-500 text-sm mt-2">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(entry.createdAt)}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {entry.content}
                </div>
              </div>

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analytics Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Brain className="h-5 w-5 text-indigo-600 mr-2" />
                    AI Analytics
                  </h3>
                  
                  {/* Debug info - remove in production */}
                  <div className="text-xs text-gray-400">
                    Analysis: {entry.analysis ? 'exists' : 'none'} | 
                    AnalyzedAt: {entry.analysis?.analyzedAt ? 'yes' : 'no'} | 
                    State: {analysis ? 'loaded' : 'empty'}
                  </div>
                  <button
                    onClick={handleAnalyzeEntry}
                    disabled={analysisLoading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {analysisLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Generate Analysis
                      </>
                    )}
                  </button>
                </div>

                {analysisError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {analysisError}
                  </div>
                )}

                {(analysis || entry.analysis) && (
                  <div className="space-y-6">
                    {/* Sentiment and Wellness Score */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Sentiment Analysis</h4>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor((analysis?.sentiment?.score || entry.analysis?.sentiment?.score || 0))}`}>
                            {(analysis?.sentiment?.label || entry.analysis?.sentiment?.label || 'neutral').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">
                            Score: {((analysis?.sentiment?.score || entry.analysis?.sentiment?.score || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Wellness Score</h4>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                          <span className={`text-lg font-semibold ${getWellnessScoreColor(analysis?.wellnessScore || entry.analysis?.wellnessScore || 50)}`}>
                            {analysis?.wellnessScore || entry.analysis?.wellnessScore || 50}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Emotions */}
                    {(analysis?.emotions || entry.analysis?.emotions) && (
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Detected Emotions</h4>
                        <div className="flex flex-wrap gap-2">
                          {(analysis?.emotions || entry.analysis?.emotions)?.map((emotion: any, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {emotion.emotion} ({Math.round(emotion.confidence * 100)}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keywords */}
                    {(analysis?.keywords || entry.analysis?.keywords) && (
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Key Themes</h4>
                        <div className="flex flex-wrap gap-2">
                          {(analysis?.keywords || entry.analysis?.keywords)?.map((keyword: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Insights */}
                    {(analysis?.insights || entry.analysis?.insights) && (
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">AI Insights</h4>
                        <div className="space-y-3 text-sm text-gray-600">
                          {(analysis?.insights?.patterns || entry.analysis?.insights?.patterns) && (
                            <div>
                              <span className="font-medium text-gray-800">Patterns: </span>
                              {analysis?.insights?.patterns || entry.analysis?.insights?.patterns}
                            </div>
                          )}
                          {(analysis?.insights?.strengths || entry.analysis?.insights?.strengths) && (
                            <div>
                              <span className="font-medium text-gray-800">Strengths: </span>
                              {analysis?.insights?.strengths || entry.analysis?.insights?.strengths}
                            </div>
                          )}
                          {(analysis?.insights?.concerns || entry.analysis?.insights?.concerns) && (
                            <div>
                              <span className="font-medium text-gray-800">Areas of Focus: </span>
                              {analysis?.insights?.concerns || entry.analysis?.insights?.concerns}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {(analysis?.suggestions || entry.analysis?.suggestions) && (
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-1 text-yellow-500" />
                          Personalized Suggestions
                        </h4>
                        <ul className="space-y-2">
                          {(analysis?.suggestions || entry.analysis?.suggestions)?.map((suggestion: string, index: number) => (
                            <li key={index} className="flex items-start text-sm text-gray-600">
                              <span className="inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {!analysis && (!entry.analysis || !entry.analysis.analyzedAt) && !analysisLoading && (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">Get AI-powered insights about your mental wellness</p>
                    <p className="text-sm text-gray-500">Click "Generate Analysis" to analyze this journal entry with AI</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}