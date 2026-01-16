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
  try {
    const jsonBody = await req.json();
    const { messages } = jsonBody;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('O campo "messages" é obrigatório e deve ser um array.');
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado. Por favor, faça login.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Verificação de Quota Mensal
    if (user.chatMessageCount >= user.chatMessageLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'Você atingiu seu limite mensal de mensagens. O limite será renovado no próximo mês.' 
        }), 
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verificação de Velocidade (Throttling)
    if (user.lastChatMessageAt) {
      const now = new Date();
      const lastMessageTime = new Date(user.lastChatMessageAt);
      const diffInSeconds = (now.getTime() - lastMessageTime.getTime()) / 1000;
      if (diffInSeconds < THROTTLE_SECONDS) {
        return new Response(
          JSON.stringify({ 
            error: `Você está enviando mensagens muito rápido. Por favor, aguarde ${THROTTLE_SECONDS} segundos.` 
          }), 
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // 3. Atualizar contagem ANTES de chamar a IA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        chatMessageCount: { increment: 1 },
        lastChatMessageAt: new Date(),
      },
    });

    let userContext = `\n\nCONTEXTO DO USUÁRIO ATUAL:
      - Nome: ${user.name || 'Não informado'}
      - Email: ${user.email || 'Não informado'}
      - Status da Assinatura: ${user.subscriptionStatus || 'Sem assinatura'}
      - ID do Usuário: ${user.id}
      
      Use essas informações para personalizar a conversa. Trate o usuário pelo nome quando apropriado.`;

    const cursoSchema = z.object({
      termo_busca: z.string().describe('O termo de busca OBRIGATÓRIO para encontrar informações no material do curso. Ex: "Hardware Wallet" ou "gerenciamento de risco".'),
    });

    const tools = {
      consultar_curso: tool({
        description: 'Busca informações no conteúdo do curso "Jornada Cripto". Use isso para responder perguntas sobre o que é ensinado, definições e guias.',
        parameters: cursoSchema,
        // @ts-ignore
        execute: async (input) => {
          const { termo_busca } = input;
          if (!termo_busca) {
            return 'Erro: Termo de busca não fornecido.';
          }
          try {
            const context = searchCourseContent(termo_busca);
            return context || 'Nenhuma informação relevante encontrada no curso para este termo.';
          } catch (e) {
            return 'Erro interno ao buscar no curso.';
          }
        },
      }),
      consultar_financas: tool({
        description: 'Consulta os dados financeiros reais do usuário logado (saldo, contas bancárias, últimas despesas e alertas ativos). Use isso quando o usuário perguntar sobre a "minha conta", "meu saldo", "meus gastos" ou "meus alertas".',
        parameters: z.object({}),
        // @ts-ignore
        execute: async () => {
          try {
            const data = await getUserFinancialData(user.id);
            return JSON.stringify(data, null, 2);
          } catch (error) {
            return 'Erro ao buscar dados financeiros.';
          }
        },
      }),
    };

    const result = await streamText({
      model: gemini,
      system: `Você é um assistente útil especializado em criptomoedas para a plataforma CriptoPlay. Você deve SEMPRE responder em Português do Brasil (pt-BR).
      
      CAPACIDADES:
      1. Responda perguntas sobre o curso usando a ferramenta "consultar_curso".
         - IMPORTANTE: Ao usar "consultar_curso", você DEVE fornecer um "termo_busca" válido e específico baseado na pergunta do usuário. JAMAIS chame esta ferramenta com string vazia ou genérica.
      2. Se o usuário estiver LOGADO e perguntar sobre suas finanças (saldo, gastos, alertas), use a ferramenta "consultar_financas".
      
      IMPORTANTE: Não invente dados financeiros. Se a ferramenta retornar vazio, diga que não encontrou dados.${userContext}`,
      messages: simpleConvertToCoreMessages(messages),
      tools: tools as any,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('[ChatAPI] Fatal Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno no servidor de chat.', details: error.message, stack: error.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
