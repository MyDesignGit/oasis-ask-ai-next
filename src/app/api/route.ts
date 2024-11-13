import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

const systemPrompt = `You are an AI assistant for Oasis Fertility clinic.
You provide information about fertility treatments, IVF, and related medical services.
Keep responses focused on fertility-related topics and Oasis Fertility services.
If asked about other topics, politely redirect to fertility-related information.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Get the last user message for the prompt
    const lastMessage = messages[messages.length - 1];

    // Create the stream
    const { textStream } = await streamText({
      model: openai('gpt-4-turbo'),
      prompt: lastMessage.content,
      systemPrompt: systemPrompt,
      temperature: 0.7,
    });

    // Create a readable stream from the text parts
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

    // Return the stream with proper headers
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