// utils/storage.ts
import { ChatSession, UserInfo, Message } from '../types';

export const CHAT_HISTORY_KEY = 'oasis_chat_history';
export const USER_INFO_KEY = 'oasis_user_info';
export const MAX_CHATS = 10;

export const getChatSessions = (): ChatSession[] => {
  try {
    const sessions = localStorage.getItem(CHAT_HISTORY_KEY);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Error getting chat sessions:', error);
    return [];
  }
};

export const saveChatSession = (messages: Message[]): string => {
  try {
    const firstUserMessage = messages.find(m => m.role === 'user')?.content;
    const title = firstUserMessage
      ? firstUserMessage.slice(0, 30) + (firstUserMessage.length > 30 ? '...' : '')
      : 'New Chat';

    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title,
      messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingSessions = getChatSessions();
    const updatedSessions = [newSession, ...existingSessions].slice(0, MAX_CHATS);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedSessions));
    return newSession.id;
  } catch (error) {
    console.error('Error saving chat session:', error);
    return '';
  }
};

export const updateChatSession = (sessionId: string, messages: Message[]): boolean => {
  try {
    const sessions = getChatSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return false;

    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      messages,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error('Error updating chat session:', error);
    return false;
  }
};

// Optional: Add user info storage utilities
export const saveUserInfo = (userInfo: UserInfo): void => {
  try {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  } catch (error) {
    console.error('Error saving user info:', error);
  }
};

export const getUserInfo = (): UserInfo | null => {
  try {
    const info = localStorage.getItem(USER_INFO_KEY);
    return info ? JSON.parse(info) : null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

export const clearUserInfo = (): void => {
  try {
    localStorage.removeItem(USER_INFO_KEY);
  } catch (error) {
    console.error('Error clearing user info:', error);
  }
};