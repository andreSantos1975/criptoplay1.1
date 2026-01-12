// src/types/trade.ts
export type Trade = {
  id: string;
  symbol: string;
  type: string;
  status: string;
  entryDate: string; // DateTime no Prisma, string no DTO para JSON
  exitDate?: string | null;
  entryPrice: string; // Decimal no Prisma, string no DTO para JSON
  exitPrice?: string | null; // Decimal no Prisma, string no DTO para JSON
  quantity: string; // Decimal no Prisma, string no DTO para JSON
  stopLoss: string; // Decimal no Prisma, string no DTO para JSON
  takeProfit: string; // Decimal no Prisma, string no DTO para JSON
  pnl?: string | null; // Decimal no Prisma, string no DTO para JSON
  notes?: string | null;
  sentiment?: string | null;
  strategy?: string | null;
  createdAt: string; // DateTime no Prisma, string no DTO para JSON
  updatedAt: string; // DateTime no Prisma, string no DTO para JSON
  userId: string;
  marketType: string; // Enum no Prisma, string no DTO
  isSimulator: boolean;
};