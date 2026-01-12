// src/types/trade.ts
export type Trade = {
  id: string;
  symbol: string;
  type: string; // Adicionado de acordo com prisma/schema.prisma
  status: string;
  entryDate: string; // DateTime no Prisma, string no DTO para JSON
  exitDate?: string | null;
  entryPrice: number;
  exitPrice?: number | null;
  quantity: number;
  stopLoss: number; // Adicionado de acordo com prisma/schema.prisma
  takeProfit: number; // Adicionado de acordo com prisma/schema.prisma
  pnl?: number | null;
  notes?: string | null;
  sentiment?: string | null;
  strategy?: string | null;
  createdAt: string; // DateTime no Prisma, string no DTO para JSON
  updatedAt: string; // DateTime no Prisma, string no DTO para JSON
  userId: string;
  marketType: string; // Enum no Prisma, string no DTO
  isSimulator: boolean; // Adicionado de acordo com prisma/schema.prisma
};
