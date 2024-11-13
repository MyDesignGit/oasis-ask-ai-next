// app/api/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth } from '@clerk/nextjs/server'


interface UserInfo {
  name: string | null;
  email: string | null;
  gender?: string;
  age?: string;
}

const getUserInfo = async (): Promise<UserInfo> => {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  const user = await clerkClient.users.getUser(userId);
  return {
    name: user.firstName,
    email: user.emailAddresses[0]?.emailAddress || null,
    gender: user.publicMetadata?.gender as string,
    age: user.publicMetadata?.age as string
  };
};
export const runtime = 'edge';

// Enhanced system prompt with conversation memory instructions
const systemPrompt = (userInfo: UserInfo) => `
You are an AI assistant for Oasis Fertility clinic.
${userInfo.name ? `You are speaking with ${userInfo.name}` : 'You are speaking with a user'} 
${userInfo.gender ? `(Gender: ${userInfo.gender}` : ''} 
${userInfo.age ? `, Age: ${userInfo.age}` : ''})
${userInfo.email ? `(Email: ${userInfo.email})` : ''}.

Important conversation guidelines:
- Always address the user as "${userInfo.name}"
- Reference previous parts of the conversation when relevant
- Maintain context from earlier questions
- Build upon previously discussed topics
- If referring to past information, mention "as we discussed earlier"
- Keep track of the user's specific concerns and interests

Format your responses:
- Start each response with "${userInfo.name},"
- Write in clear, complete paragraphs
- Use proper sentence structure
- Keep information organized and easy to read
- after Every coverstion check if they Provide Gender and Age, if not ask them `;

export async function POST(req: Request) {
  try {
    const { messages, userInfo } = await req.json();

    let conversationMemory = '';
    
    // Build conversation memory from previous messages
    messages.forEach((msg: any, index: number) => {
      if (msg.role === 'user') {
        conversationMemory += `User asked: ${msg.content}\n`;
      } else if (msg.role === 'assistant' && messages[index - 1]?.role === 'user') {
        conversationMemory += `Previous response about "${messages[index - 1].content}": ${msg.content}\n`;
      }
    });

    // Get the last user message
    const lastMessage = messages[messages.length - 1];

    // Create the stream with conversation memory
    const { textStream } = await streamText({
      model: openai('gpt-4-turbo'),
      prompt: lastMessage.content,
      // systemPrompt: `${systemPrompt(userInfo)}\n\nConversation history:\n${conversationMemory}`,
      temperature: 0.7,
      async onFinish({ text, usage, finishReason }) {
        // Optional: Log conversation metrics
        console.log('Conversation metrics:', {
          usage,
          finishReason,
          messageCount: messages.length,
          lastQuery: lastMessage.content
        });
      },
    });

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
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
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}