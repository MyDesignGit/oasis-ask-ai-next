// context/ChatProvider.tsx
'use client';

import { createContext, useContext, useState } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface ChatContextType {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id'>) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (message: Omit<Message, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setMessages(prev => [...prev, { ...message, id }]);
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, isLoading, setIsLoading }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}