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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const [showWelcome, setShowWelcome] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);



  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  };



  useEffect(() => {

    scrollToBottom();

  }, [messages]);



  // Auto-resize textarea

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
  
              // Format the response while preserving markdown
              const formattedResponse = accumulatedResponse
                .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
                .replace(/(?<!\n)###/g, '\n###') // Ensure headings start on new lines
                .replace(/\*\*(?!\s)(.+?)(?<!\s)\*\*/g, '**$1**') // Preserve bold text
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

      {/* Sidebar */}

      <div

        className={`fixed lg:static inset-y-0 left-0 bg-white dark:bg-oasis-oasis-dark transform 

          transition-all duration-300 ease-in-out flex flex-col z-40 

          border-r border-gray-200 dark:border-gray-800 ${

          isSidebarOpen ? 'w-64' : 'w-20'

        }`}

      >

        {/* Logo Area */}

        <div className={`relative p-4 border-b border-gray-200 dark:border-gray-800 ${

          isSidebarOpen ? 'min-w-64' : 'min-w-20'

        }`}>

          <div className="flex items-center justify-between">

            {isSidebarOpen ? (

              <Image

                src="/oasis-logo.webp"

                alt="Oasis Logo"

                width={120}

                height={40}

                priority

                className="ml-8"

              />

            ) : (

              <div className="w-full flex justify-center py-5">

                {/* <Image

                  src="/oasis-icon.png"

                  // alt="Oasis Icon"

                  width={32}

                  height={32}

                  priority

                  className="rounded-full"

                /> */}

              </div>

            )}

          </div>

          <button

            onClick={() => setIsSidebarOpen(!isSidebarOpen)}

            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 

              dark:hover:bg-gray-800 rounded-lg transition-colors"

          >

            <Menu size={20} className="text-gray-600 dark:text-gray-400" />

          </button>

        </div>



        {/* New Chat Button */}

        <div className={`p-4 ${isSidebarOpen ? 'min-w-64' : 'min-w-20'}`}>

          <button

            onClick={() => {

              setMessages([]);

              setShowWelcome(true);

            }}

            className={`flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 

              border border-gray-200 dark:border-gray-700 hover:bg-gray-100 

              dark:hover:bg-gray-800 transition-all ${

              isSidebarOpen 

                ? 'w-full p-4 rounded-full' 

                : 'w-12 h-12 mx-auto rounded-full'

            }`}

          >

            <Plus size={20} />

            {isSidebarOpen && <span>New chat</span>}

          </button>

        </div>



        {/* Recent Chats */}

        <div className={`flex-1 overflow-y-auto p-4 ${isSidebarOpen ? 'min-w-64' : 'min-w-20'}`}>

          {isSidebarOpen && (

            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">

              Recent

            </h3>

          )}

          {recentChats.map((chat) => (

            <button

              key={chat.id}

              className={`w-full text-left mb-1 flex items-center gap-2 text-gray-600 

                dark:oasis-light-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg 

                transition-colors ${isSidebarOpen ? 'p-2' : 'p-2 justify-center'}`}

            >

              <MessageSquare size={20} className="flex-shrink-0" />

              {isSidebarOpen && <span className="text-sm truncate">{chat.title}</span>}

            </button>

          ))}

        </div>



        {/* Phone Button */}

        <div className={`p-4 border-t border-gray-200 dark:border-gray-800 ${

          isSidebarOpen ? 'min-w-64' : 'min-w-20'

        }`}>

          <button 

            className={`flex items-center justify-center gap-3 bg-[#FFE5E5] 

              dark:bg-[#874487] text-[#874487] dark:text-white hover:bg-[#ffd6d6] 

              dark:hover:bg-[#673367] transition-colors ${

              isSidebarOpen 

                ? 'w-full p-3 rounded-full' 

                : 'w-12 h-12 mx-auto rounded-full'

            }`}

          >

            <Phone size={20} className="rotate-12 flex-shrink-0" />

            {isSidebarOpen && <span className="font-medium">1800-3001-1000</span>}

          </button>

        </div>

      </div>



      {/* Main Chat Area */}

      <div className="flex-1 flex flex-col bg-white dark:bg-oasis-oasis-dark">

        {/* Chat Header */}

        <div className="px-6 py-4 

          flex items-center justify-between"

        >

          <h1 className="text-lg font-medium text-[#874487] dark:text-[#ff9b9b]">

            {/* Ask Oasis */}

          </h1>

          <div className="flex items-center gap-4">

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
<p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">

{isLoading 

  ? "Thinking..." 

  : "Ask me anything about fertility treatments and services at Oasis Fertility"

}

</p>
        {/* Input Area */}

        <div className=" p-6">

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