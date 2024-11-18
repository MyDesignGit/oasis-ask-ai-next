// components/UserProfileMenu.tsx
'use client';

import { useUser, SignInButton, SignedOut, useClerk  } from '@clerk/nextjs';
import { useState } from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link'

export function UserProfileMenu() {
  const { user, isLoaded } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useClerk(); // Hook to get sign out function

  if (!isLoaded || !user) return (
    <SignedOut>
    <SignInButton>
      <button className="inline-block px-10 py-3 bg-[#ff8484] text-white rounded-full hover:bg-[#ff8484] transition-colors transform hover:-translate-y-0.5 hover:shadow-lg">
        Sign in
      </button>
    </SignInButton>
  </SignedOut>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
      >
        {user.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={user.fullName || 'User'}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#874487] text-white flex items-center justify-center">
            {user.firstName?.[0] || 'U'}
          </div>
        )}
        <span className="text-gray-700 dark:text-gray-300 hidden md:block">
          {user.fullName}
        </span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.emailAddresses[0]?.emailAddress}</p>
          </div>
          <button
            onClick={() => window.location.href = '/profile'}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <User size={16} />
            Profile
          </button>
          <button
            onClick={() => window.location.href = '/settings'}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Settings size={16} />
            Settings
          </button>
          <button
            onClick={() => signOut()} // Proper sign-out functionality
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}