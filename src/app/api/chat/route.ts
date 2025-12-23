import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { google } from '@ai-sdk/google';

export const runtime = 'edge';

const gemini = google('gemini-2.5-flash');

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: gemini,
    system: 'Você é um assistente útil especializado em criptomoedas para a plataforma CriptoPlay. Você deve SEMPRE responder em Português do Brasil (pt-BR). Mesmo que o usuário pergunte em outro idioma, responda em Português do Brasil.',
    messages: await convertToModelMessages(messages as UIMessage[]),
  });

  return result.toUIMessageStreamResponse();
}
