"use client";
// components/chat/ChatSidebar.tsx
import { useState } from 'react';
import Link from 'next/link';
import { MessageSquarePlus } from 'lucide-react';
// import { UserButton } from '@clerk/nextjs';
import type { Chat } from '@/types';

export default function ChatSidebar() {
  const [chats, setChats] = useState<Chat[]>([]);

  return (
    <div className="w-64 h-full border-r bg-gray-50 flex flex-col">
      <div className="p-4 border-b">
        <Link 
          href="/chat" 
          className="flex items-center justify-center gap-2 w-full p-2 bg-[#874487] text-white rounded-lg hover:bg-[#673367] transition-colors"
        >
          <MessageSquarePlus size={20} />
          New Chat
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Recent chats</h3>
        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className="block p-2 hover:bg-gray-100 rounded-lg mb-1 text-sm text-gray-600"
          >
            {chat.title}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
}