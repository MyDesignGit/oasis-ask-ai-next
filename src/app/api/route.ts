// app/api/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth, currentUser } from '@clerk/nextjs/server';

interface UserInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  gender?: string;
  age?: string;
}

const getUserInfo = async (): Promise<UserInfo> => {
  const { userId } = await auth();
  
  if (!userId) {
    console.log("Unauthorized access. Returning guest user.");
    return {
      name: null,
      email: null,
      phone: null,
      location: null,
      gender: undefined,
      age: undefined,
    };
  }

  const user = await currentUser();
  
  if (!user) {
    console.log("User not found. Returning guest user.");
    return {
      name: null,
      email: null,
      phone: null,
      location: null,
      gender: undefined,
      age: undefined,
    };
  }

  return {
    name: user.firstName ?? null,
    email: user.emailAddresses[0]?.emailAddress ?? null,
    phone: user.phoneNumbers?.[0]?.phoneNumber ?? null,
    location: null,
    gender: (user.publicMetadata as { gender?: string })?.gender ?? undefined,
    age: (user.publicMetadata as { age?: string })?.age ?? undefined,
  };
};

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userInfo = await getUserInfo();

    // Build conversation history for context
    let conversationMemory = '';
    const userDataNeeded = [];

    // Track what information we need from the user
    if (!userInfo.name) userDataNeeded.push('name');
    if (!userInfo.gender) userDataNeeded.push('gender');
    if (!userInfo.age) userDataNeeded.push('age');
    if (!userInfo.location) userDataNeeded.push('location');

    // Build conversation history
    messages.forEach((msg: any, index: number) => {
      if (msg.role === 'user') {
        conversationMemory += `User: ${msg.content}\n`;
        
        // Check for user information in messages
        const content = msg.content.toLowerCase();
        if (content.includes('my name is')) {
          const nameMatch = msg.content.match(/my name is (.*?)(?:\.|$)/i);
          if (nameMatch) userInfo.name = nameMatch[1].trim();
        }
        if (content.includes('my gender is') || content.includes('i am male') || content.includes('i am female')) {
          const genderMatch = msg.content.match(/(?:i am|my gender is) (male|female|other)(?:\.|$)/i);
          if (genderMatch) userInfo.gender = genderMatch[1].trim();
        }
        if (content.includes('my age is') || content.includes('i am') && content.includes('years old')) {
          const ageMatch = msg.content.match(/(?:i am|my age is) (\d+)(?: years old)?(?:\.|$)/i);
          if (ageMatch) userInfo.age = ageMatch[1].trim();
        }
        if (content.includes('my location is') || content.includes('i live in')) {
          const locationMatch = msg.content.match(/(?:i live in|my location is) (.*?)(?:\.|$)/i);
          if (locationMatch) userInfo.location = locationMatch[1].trim();
        }
      } else if (msg.role === 'assistant') {
        conversationMemory += `Assistant: ${msg.content}\n`;
      }
    });

    const lastMessage = messages[messages.length - 1];
    const isFirstMessage = messages.length <= 1;

    let systemPrompt = `
You are an AI assistant for Oasis Fertility Clinic. 

Current user information:
${userInfo.name ? `- Name: ${userInfo.name}` : '- Name: Not provided'}
${userInfo.gender ? `- Gender: ${userInfo.gender}` : '- Gender: Not provided'}
${userInfo.age ? `- Age: ${userInfo.age}` : '- Age: Not provided'}
${userInfo.location ? `- Location: ${userInfo.location}` : '- Location: Not provided'}
oasis fertility clinic phone number: 1800-3001-1000 
Guidelines for response:
1. If user has shared their name, greet them personally
2. If this is their first message or essential information is missing:
   - Politely ask for missing information one at a time
   - Start with name if missing, then gender, then age
   - Ask for location if relevant to the conversation
3. Focus on fertility-related topics and Oasis Fertility services
4. Be empathetic and professional at all times

Previous conversation context:
${conversationMemory}

Response format:
1. Begin with personalized greeting if name is known
2. Address their query or provide information about Oasis Fertility
3. If relevant, ask for one missing piece of information
4. End with a helpful prompt about other fertility-related topics they might be interested in

Remember:
- Keep responses focused on Oasis Fertility services
- Be sensitive and professional when discussing fertility topics
- Provide clear, accurate information
- Offer relevant follow-up topics related to their query`;

    const { textStream } = await streamText({
      model: openai('gpt-4-turbo'),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: lastMessage.content
        }
      ],
      temperature: 0.7,
      async onFinish({ text, usage, finishReason }) {
        console.log('Conversation metrics:', { 
          usage, 
          finishReason, 
          messageCount: messages.length, 
          lastQuery: lastMessage.content,
          userInfo: {
            hasName: !!userInfo.name,
            hasGender: !!userInfo.gender,
            hasAge: !!userInfo.age,
            hasLocation: !!userInfo.location
          }
        });
      },
    });

    return new Response(new ReadableStream({
      async start(controller) {
        for await (const chunk of textStream) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.close();
      },
    }), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}