'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Send, Bot, User } from 'lucide-react';
import { chatApi } from '@/lib/api';

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    setUser(JSON.parse(userData));
    initializeChat();
  }, [router]);

  const initializeChat = async () => {
    try {
      setInitializing(true);
      
      // Check for existing sessions
      const sessionsResponse = await chatApi.getSessions();
      console.log('📞 Sessions response:', sessionsResponse);
      
      if (sessionsResponse.data && sessionsResponse.data.length > 0) {
        // Use the most recent session
        const recentSession = sessionsResponse.data[0];
        setCurrentSession(recentSession);
        setMessages(recentSession.messages || []);
      } else {
        // Create a new session
        const newSessionResponse = await chatApi.createSession();
        console.log('🆕 New session response:', newSessionResponse);
        if (newSessionResponse.data) {
          setCurrentSession(newSessionResponse.data);
          setMessages(newSessionResponse.data.messages || []);
        }
      }
    } catch (error: any) {
      console.error('Failed to initialize chat:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      // Fallback to default message
      setMessages([{
        _id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI wellness companion. I'm here to listen, provide support, and help you work through any thoughts or feelings you'd like to discuss. How are you feeling today?",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setInitializing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading || !currentSession) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    // Add user message to UI immediately
    const userMessage = {
      _id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Send message to backend and get AI response
      const response = await chatApi.sendMessage(currentSession._id, messageContent);
      
      if (response.data && response.data.messages) {
        // Update with the complete conversation from backend
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message to UI
      const errorMessage = {
        _id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm experiencing some technical difficulties right now. However, I want you to know that I'm still here to listen. Could you tell me more about what's on your mind?",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };


  if (!user || initializing) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{initializing ? 'Initializing chat...' : 'Loading...'}</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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

      {/* Chat Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="container mx-auto">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-full mr-3">
              <Bot className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Wellness Companion</h2>
              <p className="text-sm text-gray-600">Your supportive mental health assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message._id || message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`p-2 rounded-full ${
                      message.role === 'user' 
                        ? 'bg-indigo-100' 
                        : 'bg-purple-100'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <Bot className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                  </div>
                  <div
                    className={`px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex max-w-3xl">
                  <div className="flex-shrink-0 mr-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Bot className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-white border shadow-sm rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Share your thoughts or ask for support..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            This AI is here to provide support, but it's not a replacement for professional mental health care.
          </p>
        </div>
      </div>
    </div>
  );
}