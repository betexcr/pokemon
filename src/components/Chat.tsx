'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'user' | 'system';
}

interface ChatProps {
  roomId: string;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export default function Chat({ 
  roomId, 
  isCollapsible = false, 
  isCollapsed = false, 
  onToggleCollapse,
  className = ""
}: ChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with empty messages - will be replaced with Firebase/Firestore
  useEffect(() => {
    // Start with empty messages array - real messages will come from Firebase
    setMessages([]);
  }, [roomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      message: newMessage.trim(),
      timestamp: new Date(),
      type: 'user'
    };

    // TODO: Send to Firebase/Firestore
    console.log('Sending message:', message);
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleToggleMinimize = () => {
    if (isCollapsible && onToggleCollapse) {
      onToggleCollapse();
    } else {
      setIsMinimized(!isMinimized);
    }
  };

  if (isCollapsed || isMinimized) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Chat</span>
            {messages.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {messages.length}
              </span>
            )}
          </div>
          <button
            onClick={handleToggleMinimize}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Maximize2 className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Chat</span>
          {messages.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <button
          onClick={handleToggleMinimize}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <Minimize2 className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 space-y-3 max-h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.userId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                  message.type === 'system'
                    ? 'bg-gray-100 text-gray-700 mx-auto'
                    : message.userId === user?.uid
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {message.type === 'user' && message.userId !== user?.uid && (
                  <div className="text-xs font-medium mb-1 opacity-75">
                    {message.userName}
                  </div>
                )}
                <div>{message.message}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.userId === user?.uid ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {user && (
        <form onSubmit={sendMessage} className="p-3 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {!user && (
        <div className="p-3 border-t border-gray-200 text-center text-gray-500 text-sm">
          Sign in to send messages
        </div>
      )}
    </div>
  );
}
