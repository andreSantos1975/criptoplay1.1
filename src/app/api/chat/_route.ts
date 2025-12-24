import { convertToModelMessages, streamText, type UIMessage, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { searchCourseContent } from '@/lib/course';
import { getUserFinancialData } from '@/lib/financial-data';
import { z } from 'zod';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = 'nodejs';

const gemini = google('gemini-2.5-flash');

export async function POST(req: Request) {
  const { messages } = await req.json();
  const session = await getServerSession(authOptions);

  let userContext = '';
  if (session?.user) {
    userContext = `\n\nCONTEXTO DO USUÁRIO ATUAL:
    - Nome: ${session.user.name || 'Não informado'}
    - Email: ${session.user.email || 'Não informado'}
    - Status da Assinatura: ${session.user.subscriptionStatus || 'Sem assinatura'}
    - ID do Usuário: ${session.user.id}
    
    Use essas informações para personalizar a conversa. Trate o usuário pelo nome quando apropriado.`;
  }

  const result = await streamText({
    model: gemini,
    system: `Você é um assistente útil especializado em criptomoedas para a plataforma CriptoPlay. Você deve SEMPRE responder em Português do Brasil (pt-BR).
    
    CAPACIDADES:
    1. Responda perguntas sobre o curso usando a ferramenta "consultar_curso".
       - IMPORTANTE: Ao usar "consultar_curso", você DEVE fornecer um "termo_busca" válido e específico baseado na pergunta do usuário. JAMAIS chame esta ferramenta com string vazia ou genérica.
    2. Se o usuário estiver LOGADO e perguntar sobre suas finanças (saldo, gastos, alertas), use a ferramenta "consultar_financas".
    
    IMPORTANTE: Não invente dados financeiros. Se a ferramenta retornar vazio, diga que não encontrou dados.${userContext}`,
    messages: await convertToModelMessages(messages as UIMessage[]),
    tools: {
      consultar_curso: tool({
        description: 'Busca informações no conteúdo do curso "Jornada Cripto". Use isso para responder perguntas sobre o que é ensinado, definições e guias.',
        parameters: z.object({
          termo_busca: z.string().describe('O termo de busca OBRIGATÓRIO para encontrar informações no material do curso. Ex: "Hardware Wallet" ou "gerenciamento de risco".'),
        }),
        execute: async (args) => {
          console.log('[ChatAPI] Args recebidos:', JSON.stringify(args));
          const termo = args.termo_busca;
          
          if (!termo) {
            return 'Erro: Termo de busca não fornecido.';
          }

          console.log(`[ChatAPI] Consultar curso: ${termo}`);
          try {
            const context = searchCourseContent(termo);
            console.log(`[ChatAPI] Resultado busca: ${context ? 'Encontrado' : 'Vazio'}`);
            return context || 'Nenhuma informação relevante encontrada no curso para este termo.';
          } catch (e) {
            console.error('[ChatAPI] Erro na busca:', e);
            return 'Erro interno ao buscar no curso.';
          }
        },
      }),
      consultar_financas: tool({
        description: 'Consulta os dados financeiros reais do usuário logado (saldo, contas bancárias, últimas despesas e alertas ativos). Use isso quando o usuário perguntar sobre a "minha conta", "meu saldo", "meus gastos" ou "meus alertas".',
        parameters: z.object({}),
        execute: async () => {
          if (!session?.user?.id) {
            return 'Erro: Usuário não está logado. Peça para ele fazer login para ver esses dados.';
          }
          try {
            const data = await getUserFinancialData(session.user.id);
            return JSON.stringify(data, null, 2);
          } catch (error) {
            return 'Erro ao buscar dados financeiros.';
          }
        },
      }),
    },
    maxSteps: 5,
  });

  console.log('Result keys:', Object.keys(result));
  console.log('Result prototype:', Object.getPrototypeOf(result));
  // console.log('Result full:', result); // Pode ser muito grande

  return result.toUIMessageStreamResponse();
}
