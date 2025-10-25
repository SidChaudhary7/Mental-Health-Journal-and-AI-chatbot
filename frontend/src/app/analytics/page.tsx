'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, BarChart3, TrendingUp, Calendar, Brain, Smile, Meh, Frown, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { analyticsApi } from '@/lib/api';

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchAnalyticsData();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchTrends(selectedPeriod);
    }
  }, [selectedPeriod, user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [overviewRes, trendsRes, insightsRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getTrends(selectedPeriod),
        analyticsApi.getInsights()
      ]);

      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
      setInsights(insightsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async (period: number) => {
    try {
      const trendsRes = await analyticsApi.getTrends(period);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    }
  };

  const getMoodIcon = (mood: string, size = 'h-4 w-4') => {
    switch (mood) {
      case 'very_happy':
      case 'happy':
        return <Smile className={`${size} text-green-500`} />;
      case 'neutral':
        return <Meh className={`${size} text-yellow-500`} />;
      case 'sad':
      case 'very_sad':
        return <Frown className={`${size} text-red-500`} />;
      default:
        return <Meh className={`${size} text-gray-500`} />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (!user || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading analytics...</p>
      </div>
    </div>;
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
          <p className="text-gray-600">Track your mental wellness journey over time</p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex justify-end">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{overview?.totalEntries || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wellness Score</p>
                <p className="text-2xl font-bold text-gray-900">{overview?.averageWellness || 50}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{overview?.entriesThisMonth || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Analyzed</p>
                <p className="text-2xl font-bold text-gray-900">{overview?.analyzedEntriesCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Visualizations */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Mood Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Mood Distribution</h3>
            {overview?.moodDistribution && Object.keys(overview.moodDistribution).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(overview.moodDistribution).map(([mood, count]) => (
                  <div key={mood} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getMoodIcon(mood)}
                      <span className="ml-2 text-sm font-medium capitalize">{mood.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-200 rounded-full h-2 w-24">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ 
                            width: `${((count as number) / overview.totalEntries * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No mood data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Wellness Trends */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Wellness Trends ({selectedPeriod} days)</h3>
            {trends?.trends && trends.trends.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Average: {trends.averageWellness}%</span>
                  <span>{trends.totalEntries} entries</span>
                </div>
                
                {/* Simple trend visualization */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {trends.trends.slice(-10).map((trend: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-2">
                        {getMoodIcon(trend.mood)}
                        <span className="text-xs text-gray-600">
                          {new Date(trend.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="bg-gray-200 rounded-full h-2 w-16">
                          <div 
                            className={`h-2 rounded-full ${
                              trend.wellnessScore >= 70 ? 'bg-green-500' : 
                              trend.wellnessScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${trend.wellnessScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-8">{trend.wellnessScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No wellness data available</p>
                  <p className="text-xs text-gray-400 mt-1">Generate AI analysis on your journal entries</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Insights */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Insights</h3>
          {insights?.insights && insights.insights.length > 0 ? (
            <div className="space-y-4">
              {insights.insights.map((insight: any, index: number) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${getInsightStyle(insight.type)}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-0.5">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        insight.type === 'success' ? 'text-green-800' :
                        insight.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {insight.title}
                      </p>
                      <p className={`text-sm mt-1 ${
                        insight.type === 'success' ? 'text-green-700' :
                        insight.type === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No insights available yet</p>
              <p className="text-sm text-gray-500">Start journaling and analyzing your entries to generate personalized insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}