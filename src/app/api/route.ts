// app/api/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { NextApiRequest, NextApiResponse } from 'next';
// import { console } from 'inspector';

interface UserInfo {
  name: string | null;
  email: string | null;
  gender?: string;
  age?: string;
}


// export default async function Page() {
//   // Get the userId from auth() -- if null, the user is not signed in
//   const { userId } = await auth()

//   if (userId) {
   
//   }

//   // Get the Backend API User object when you need access to the user's information
//   const user = await currentUser()
//   // Use `user` to render user details or create UI elements

// }
const getUserInfo = async (): Promise<UserInfo> => {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized');
  
  const user = await currentUser()
  if (!user) throw new Error('User not found');

  console.log("User details from Clerk:", user.firstName);

  return {
    name: user.firstName ?? null,
    email: user.emailAddresses[0]?.emailAddress ?? null,
    gender: (user.publicMetadata as { gender?: string })?.gender ?? undefined,
    age: (user.publicMetadata as { age?: string })?.age ?? undefined,
  };
};
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
  const userInfo = await getUserInfo();
    let conversationMemory = '';

    messages.forEach((msg: any, index: number) => {
      if (msg.role === 'user') {
        conversationMemory += `User asked: ${msg.content}\n`;
      } else if (msg.role === 'assistant' && messages[index - 1]?.role === 'user') {
        conversationMemory += `Assistant responded to "${messages[index - 1].content}": ${msg.content}\n`;
      }
    });

    const lastMessage = messages[messages.length - 1];

    const { textStream } = await streamText({
      model: openai('gpt-4-turbo'),
      messages: [
        {
          role: 'system',
          content: `
           You are an AI assistant for Oasis Fertility Clinic. 
        ${userInfo.name ? `Address the user as "${userInfo.name}"` : 'Ask for the user\'s name if not provided'}
        ${!userInfo.gender ? 'Politely ask for the user\'s gender if not already provided' : ''}
        ${!userInfo.age ? 'Politely ask for the user\'s age if not already provided' : ''}
        Focus solely on topics related to Oasis Fertility Clinic.

        Format your responses:
        - Start each response with a polite greeting.
        - Write in clear, concise paragraphs.
        - Keep information organized, relevant to fertility, and easy to read.
        - Politely redirect any unrelated questions back to Oasis Fertility Clinic.`,
        },
        {
          role: 'user',
          content: lastMessage.content
        }
      ],
      temperature: 0.7,
      async onFinish({ text, usage, finishReason }) {
        console.log('Conversation metrics:', { usage, finishReason, messageCount: messages.length, lastQuery: lastMessage.content });
        // console.log("User details from Clerk:", user?.firstName ||"Test");
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of textStream) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}