// app/api/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { userInfo } from 'os';
// import { console } from 'inspector';

interface UserInfo {
  name: string | null;
  email: string | null;
  gender?: string;
  age?: string;
}
// const getUserInfo = async (): Promise<UserInfo> => {
//   const { userId } = await auth()
//   if (!userId) throw new Error('Unauthorized');
  
//   const user = await currentUser()
//   if (!user) throw new Error('User not found');

//   console.log("User details from Clerk:", user.firstName);

//   return {
//     name: user.firstName ?? null,
//     email: user.emailAddresses[0]?.emailAddress ?? null,
//     gender: (user.publicMetadata as { gender?: string })?.gender ?? undefined,
//     age: (user.publicMetadata as { age?: string })?.age ?? undefined,
//   };
// };

const getUserInfo = async (): Promise<UserInfo> => {
  const { userId } = await auth();
  
  // Check if user is authenticated; if not, return guest user
  if (!userId) {
    console.log("Unauthorized access. Returning guest user.");
    return {
      name: "Guest",
      email: null,
      gender: undefined,
      age: undefined,
    };
  }

  const user = await currentUser();
  
  // If the user is not found, return guest user
  if (!user) {
    console.log("User not found. Returning guest user.");
    return {
      name: "Guest",
      email: null,
      gender: undefined,
      age: undefined,
    };
  }

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

        Important guidelines:
        - Avoid overusing the user's name after the initial greeting unless necessary.
        - Reference prior parts of the conversation when helpful.
        - Politely redirect any unrelated questions back to Oasis Fertility Clinic.
          
        Format your responses:
        - Start each response with a polite greeting with user name. later you can use name whwen it required according o the conversation
        - Write in clear, concise paragraphs.
        - Keep information organized, relevant to fertility, and easy to read.
        - Politely redirect any unrelated questions back to Oasis Fertility Clinic.
        
        At the end of each relevant response, politely ask if the user would like more information. 
        Suggest specific categories of Oasis Fertility Clinic information they might be interested in, such as:
        - Fertility treatments
        - Success rates
        - Consultation process
        - Clinic locations
        - Support services
        - Patient testimonials`,
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