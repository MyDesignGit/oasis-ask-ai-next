// app/api/route.ts
import OpenAI from 'openai';
import { StreamingTextResponse } from 'ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const runtime = 'edge';

const systemPrompt = `You are an AI assistant for Oasis Fertility clinic.
You provide information about fertility treatments, IVF, and related medical services.
Keep responses focused on fertility-related topics and Oasis Fertility services.
If asked about other topics, politely redirect to fertility-related information.

Format your responses:
- Write in clear, complete paragraphs
- Use proper sentence structure
- Start new topics in new paragraphs
- Keep information organized and easy to read`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.filter((msg: any) => msg.role !== 'system')
      ],
      temperature: 0.7,
      stream: true,
    });

    // Return streaming response
    return new StreamingTextResponse(response);

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