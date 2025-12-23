import { streamText } from 'ai';
import { gemini } from '@/lib/ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: gemini,
    messages,
  });

  return result.toTextStreamResponse();
}
