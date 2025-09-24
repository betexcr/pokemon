'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, MessageCircle, X } from 'lucide-react';
import { chatService, type ChatMessage } from '@/lib/chatService';

interface ChatOverlayProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatOverlay({ roomId, isOpen, onClose }: ChatOverlayProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Listen to messages from Firebase
  useEffect(() => {
    if (!roomId || !isOpen) return;
    
    const unsubscribe = chatService.onMessagesChange(roomId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [roomId, isOpen]);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await chatService.sendMessage(
        roomId,
        user.uid,
        user.displayName || 'Anonymous',
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={overlayRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md h-[500px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-semibold text-gray-900">Chat</span>
            {messages.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {messages.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Close chat"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef} 
          className="flex-1 p-4 space-y-3 overflow-y-auto"
        >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.userId === user?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
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
        </div>

        {/* Input */}
        {user && (
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {!user && (
          <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">
            Sign in to send messages
          </div>
        )}
      </div>
    </div>
  );
}
