import { streamText, type UIMessage, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { searchCourseContent } from '@/lib/course';
import prisma from '@/lib/prisma'; // Importa o Prisma

// Função auxiliar manual para converter mensagens, contornando erro na biblioteca
function simpleConvertToCoreMessages(messages: any[]) {
  return messages.map(m => ({
    role: m.role,
    content: m.content,
  }));
}
import { getUserFinancialData } from '@/lib/financial-data';
import { z } from 'zod';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

const gemini = google('gemini-2.5-flash');

const THROTTLE_SECONDS = 3; // Limite de 1 mensagem a cada 3 segundos

export async function POST(req: Request) {
  // Rota do chatbot temporariamente desativada
  return new Response(
    JSON.stringify({ 
      error: 'O chatbot está temporariamente indisponível. Por favor, tente novamente mais tarde.' 
    }), 
    { 
      status: 503, // Service Unavailable
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}
