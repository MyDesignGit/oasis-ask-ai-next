// types/index.ts
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }
  
  export interface Chat {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface UserProfile {
    id: string;
    email: string;
    name?: string;
  }
  

  export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface UserInfo {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    gender: string | null;
  }
  
  export interface FormState {
    currentField: keyof UserInfo | null;
    isComplete: boolean;
  }
  