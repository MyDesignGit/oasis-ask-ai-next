'use client';
import React from 'react';
import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import Image from 'next/image';
import { Menu, MessageSquare, Plus, Phone } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserProfileMenu } from '@/components/UserProfileMenu';
import { useUser } from '@clerk/nextjs';
import WelcomeSection from '@/components/WelcomeSection';
import MessageFormatter from '@/components/MessageFormatter';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

const recentChats = [
  { id: 1, title: 'What is IVF?' },
  { id: 2, title: 'Male Fertility Issues' },
  { id: 3, title: 'IVF myths debunked' },
  { id: 4, title: 'Medical tests before IVF' },
];

export default function ChatPage() {
  const { user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside sidebar to close it on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (window.innerWidth <= 1024 && // Only on mobile/tablet
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set default sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 1024);
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    handleSendMessage();
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
  
    setShowWelcome(false);
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
  
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });
  
      if (!response.ok) throw new Error('Failed to fetch response');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
  
      let accumulatedResponse = '';
      const decoder = new TextDecoder();
  
      let assistantMessage = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
  
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));
              accumulatedResponse += data.text;
  
              const formattedResponse = accumulatedResponse
                .replace(/\n{3,}/g, '\n\n')
                .replace(/(?<!\n)###/g, '\n###')
                .replace(/\*\*(?!\s)(.+?)(?<!\s)\*\*/g, '**$1**')
                .trim();
  
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: formattedResponse }
              ]);
            } catch (e) {
              console.warn('JSON parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const Message = ({ content, isUser }: { content: string; isUser: boolean }) => (
    <div
      className={`max-w-[80%] p-4 rounded-lg ${
        isUser
          ? 'bg-[#874487] text-white ml-auto'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
      }`}
    >
      {isUser ? (
        <p>{content}</p>
      ) : (
        <MessageFormatter content={content} />
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed lg:static inset-y-0 left-0 bg-white dark:bg-oasis-oasis-dark 
          transform transition-transform duration-300 ease-in-out flex flex-col z-40 
          border-r border-gray-200 dark:border-gray-800 w-64
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo Area */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <Image
              src="/oasis-logo.webp"
              alt="Oasis Logo"
              width={120}
              height={40}
              priority
              className="ml-8"
            />
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              setMessages([]);
              setShowWelcome(true);
              if (window.innerWidth <= 1024) {
                setIsSidebarOpen(false);
              }
            }}
            className="flex items-center justify-center gap-2 w-full p-4 rounded-full
              text-gray-600 dark:text-gray-300 border border-gray-200 
              dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 
              transition-all"
          >
            <Plus size={20} />
            <span>New chat</span>
          </button>
        </div>

        {/* Recent Chats */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Recent
          </h3>
          {recentChats.map((chat) => (
            <button
              key={chat.id}
              className="w-full text-left mb-1 flex items-center gap-2 p-2
                text-gray-600 dark:text-gray-300 hover:bg-gray-100 
                dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <MessageSquare size={20} />
              <span className="text-sm truncate">{chat.title}</span>
            </button>
          ))}
        </div>

        {/* Phone Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button className="flex items-center justify-center gap-3 w-full p-3 
            rounded-full bg-[#FFE5E5] dark:bg-[#874487] text-[#874487] 
            dark:text-white hover:bg-[#ffd6d6] dark:hover:bg-[#673367] 
            transition-colors"
          >
            <Phone size={20} className="rotate-12" />
            <span className="font-medium">1800-3001-1000</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-oasis-oasis-dark">
        {/* Chat Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 
              dark:hover:bg-gray-800 transition-colors"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
            <UserProfileMenu />
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {showWelcome ? (
              <WelcomeSection
                username={user?.firstName || ''}
                onPromptClick={handlePromptClick}
              />
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Message content={msg.content} isUser={msg.role === 'user'} />
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Status Message */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {isLoading 
            ? "Thinking..." 
            : "Ask me anything about fertility treatments and services at Oasis Fertility"
          }
        </p>

        {/* Input Area */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isLoading ? "Please wait..." : "Message Ask Oasis... (Shift + Enter for new line)"}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                bg-white dark:bg-gray-800 
                text-gray-900 dark:text-gray-100 
                placeholder-gray-500 dark:placeholder-gray-400
                focus:border-[#874487] dark:focus:border-[#ff9b9b] 
                focus:ring-1 focus:ring-[#874487] dark:focus:ring-[#ff9b9b] 
                outline-none transition-colors resize-none max-h-48"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                !input.trim() || isLoading 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-[#874487] dark:text-[#ff9b9b] hover:opacity-80'
              } transition-opacity`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}