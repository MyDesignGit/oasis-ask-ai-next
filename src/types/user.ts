// types/user.ts
export interface UserInfo {
    name?: string;
    email?: string;
    gender?: 'male' | 'female';
    phone?: string;
    isInfoCollected: boolean;
  }
  
  export interface Message {
    role: 'assistant' | 'user';
    content: string;
  }