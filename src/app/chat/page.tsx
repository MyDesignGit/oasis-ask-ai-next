// app/page.tsx (continued)
'use client';
import React from 'react';
import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import Image from 'next/image';
import { Menu, MessageSquare, Plus, Phone, Trash2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserProfileMenu } from '@/components/UserProfileMenu';
import { useUser } from '@clerk/nextjs';
import WelcomeSection from '@/components/WelcomeSection';
import MessageFormatter from '@/components/MessageFormatter';
import { Message, ChatSession, UserInfo, FormState } from '@/types';
import { CHAT_HISTORY_KEY, USER_INFO_KEY, getChatSessions, saveChatSession, updateChatSession } from '@/utils/storage';

export default function ChatPage() {
  const { user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: null,
    email: null,
    phone: null,
    location: null,
    gender: null
  });
  const [formState, setFormState] = useState<FormState>({
    currentField: null,
    isComplete: false
  });
  const [savedPrompt, setSavedPrompt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load saved user info and chat sessions
  useEffect(() => {
    const savedUserInfo = localStorage.getItem(USER_INFO_KEY);
    if (savedUserInfo) {
      const parsedInfo = JSON.parse(savedUserInfo);
      setUserInfo(parsedInfo);
      setFormState({ currentField: null, isComplete: true });
    }
    setRecentChats(getChatSessions());
  }, []);

  // Save user info when it changes
  useEffect(() => {
    if (userInfo && Object.values(userInfo).some(value => value !== null)) {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    }
  }, [userInfo]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  const processUserInput = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      role: 'user',
      content: input
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    // Handle form state if active
    if (formState.currentField) {
      const updatedInfo = { ...userInfo, [formState.currentField]: input };
      setUserInfo(updatedInfo);
  
      const fields: (keyof UserInfo)[] = ['name', 'phone', 'email', 'location', 'gender'];
      const currentIndex = fields.indexOf(formState.currentField);
      const nextField = currentIndex < fields.length - 1 ? fields[currentIndex + 1] : null;
  
      if (nextField) {
        setFormState({ currentField: nextField, isComplete: false });
        const promptMessage: Message = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          role: 'assistant',
          content: `Thank you. Could you please provide your ${nextField}?`
        };
        setMessages(prev => [...prev, promptMessage]);
      } else {
        setFormState({ currentField: null, isComplete: true });
        if (savedPrompt) {
          await handleAIResponse(savedPrompt);
          setSavedPrompt(null);
        }
      }
    } else {
      await handleAIResponse(input);
    }
  };

  const handleAIResponse = async (userInput: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { 
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            role: 'user', 
            content: userInput 
          }],
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let accumulatedResponse = '';
      const decoder = new TextDecoder();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        role: 'assistant',
        content: ''
      };
      setMessages(prev => [...prev, assistantMessage])

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
                .trim();

                setMessages(prev => [
                  ...prev.slice(0, -1),
                  {
                    ...prev[prev.length - 1],
                    content: formattedResponse
                  }
                ]);
            } catch (e) {
              console.warn('JSON parse error:', e);
            }
          }
        }
      }

      // Update chat session
      if (!currentSessionId) {
        const sessionId = saveChatSession([...messages, { role: 'user', content: userInput }]);
        setCurrentSessionId(sessionId);
      } else {
        updateChatSession(currentSessionId, [...messages, { role: 'user', content: userInput }]);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setShowWelcome(false);
    if (!formState.isComplete && !userInfo.name) {
      setSavedPrompt(prompt);
      setFormState({ currentField: 'name', isComplete: false });
      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        role: 'assistant',
        content: 'Welcome! Before we proceed, could you please tell me your name?'
      };
      setMessages([welcomeMessage]);
    } else {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        role: 'user',
        content: prompt
      };
      setMessages(prev => [...prev, userMessage]);
      handleAIResponse(prompt);
    }
  };
  
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processUserInput();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setShowWelcome(true);
    setSavedPrompt(null);
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  };

  const loadChatSession = (sessionId: string) => {
    const sessions = getChatSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      setShowWelcome(false);
      if (window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      }
    }
  };

  const deleteChatSession = (sessionId: string) => {
    const sessions = getChatSessions();
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedSessions));
    setRecentChats(updatedSessions);
    if (currentSessionId === sessionId) {
      handleNewChat();
    }
  };

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
            onClick={handleNewChat}
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
            <div
              key={chat.id}
              className={`w-full mb-1 flex items-center justify-between p-2
                text-gray-600 dark:text-gray-300 hover:bg-gray-100 
                dark:hover:bg-gray-800 rounded-lg transition-colors group cursor-pointer
                ${currentSessionId === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => loadChatSession(chat.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare size={20} />
                <span className="text-sm truncate">{chat.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChatSession(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 
                  dark:hover:bg-gray-700 rounded transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
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
                username={userInfo?.name || user?.firstName || ''}
                onPromptClick={handlePromptClick}
              />
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-[#874487] text-white ml-auto'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p>{msg.content}</p>
                    ) : (
                      <MessageFormatter content={msg.content} />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                isLoading 
                  ? "Please wait..." 
                  : formState.currentField
                    ? `Enter your ${formState.currentField}...`
                    : "Message Ask Oasis... (Shift + Enter for new line)"
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                bg-white dark:bg-gray-800 
                text-gray-900 dark:text-gray-100 
                placeholder-gray-500 dark:placeholder-gray-400
                focus:border-[#874487] dark:focus:border-[#ff9b9b] 
                focus:ring-1 focus:ring-[#874487] dark:focus:ring-[#ff9b9b] 
                outline-none transition-colors resize-none max-h-48"
            />
            <button
              onClick={processUserInput}
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