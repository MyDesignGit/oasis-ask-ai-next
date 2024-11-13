import OpenAI from 'openai';

import { OpenAIStream, StreamingTextResponse } from 'ai';



const openai = new OpenAI({

  apiKey: process.env.OPENAI_API_KEY!,

});



export const runtime = 'edge';



const systemPrompt = "You are an AI assistant for Oasis Fertility clinic You provide information about fertility treatments, IVF, and related medical services.Keep responses focused on fertility-related topics and Oasis Fertility services.If asked about other topics, politely redirect to fertility-related information.;"



export async function POST(req: Request) {

  try {

    const { messages } = await req.json();



    // Filter out the welcome message if it exists

    const userMessages = messages.filter((message: any) => 

      message.role !== 'system' && 

      message.content !== "Hi! I'm your Oasis Fertility assistant. How can I help you today?"

    );



    const response = await openai.chat.completions.create({

      model: 'gpt-4-turbo-preview',

      messages: [

        { role: 'system', content: systemPrompt },

        ...userMessages

      ],

      temperature: 0.7,

      stream: true,

    });



    const stream = OpenAIStream(response);

    return new StreamingTextResponse(stream);



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