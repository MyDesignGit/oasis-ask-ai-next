import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth.protect(); // Using new auth.protect() syntax

  if (!userId) {
    redirect('/sign-in');
  }

  return <>{children}</>;
}