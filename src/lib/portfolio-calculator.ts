
import type { Decimal } from "@prisma/client/runtime/library";

// These interfaces are for type-checking the data that comes from the API
export interface Trade {
  id: string;
  symbol: string;
  type: string;
  status: 'OPEN' | 'CLOSED';
  entryDate: string;
  exitDate?: string;
  entryPrice: Decimal;
  exitPrice?: Decimal;
  quantity: Decimal;
  pnl?: Decimal;
}

export interface CapitalMovement {
  id: string;
  userId: string;
  amount: Decimal;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  date: string;
}

// REWRITTEN LOGIC for generating portfolio data
export const generatePortfolioData = (
  trades: Trade[],
  capitalMovements: CapitalMovement[],
  granularity: 'weekly' | 'monthly',
  usdtToBrlRate: number,
  initialBalance: number = 10000
) => {
  const events: { date: Date; amount: number }[] = [];

  capitalMovements.forEach(movement => {
    events.push({
      date: new Date(movement.date),
      amount: Number(movement.amount) * (movement.type === 'DEPOSIT' ? 1 : -1)
    });
  });

  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl != null && t.exitDate);
  closedTrades.forEach(trade => {
    // Correctly calculate PnL in BRL
    const pnlInBrl = trade.symbol.includes('BRL')
      ? Number(trade.pnl)
      : (Number(trade.pnl) || 0) * usdtToBrlRate;

    events.push({
      date: new Date(trade.exitDate!),
      amount: pnlInBrl
    });
  });

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  const aggregatedEvents: { [key: string]: number } = {};

  if (granularity === 'monthly') {
    events.forEach(event => {
      const yearMonth = `${event.date.getFullYear()}-${(event.date.getMonth() + 1).toString().padStart(2, '0')}`;
      aggregatedEvents[yearMonth] = (aggregatedEvents[yearMonth] || 0) + event.amount;
    });
  } else { // weekly
    const getMonday = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    };
    events.forEach(event => {
      const monday = getMonday(event.date);
      const weekKey = monday.toISOString().split('T')[0];
      aggregatedEvents[weekKey] = (aggregatedEvents[weekKey] || 0) + event.amount;
    });
  }
  
  const chartData: { date: string; portfolio: number }[] = [];
  let currentPortfolioValue = initialBalance;
  chartData.push({ date: "Início", portfolio: currentPortfolioValue });

  const sortedKeys = Object.keys(aggregatedEvents).sort();

  sortedKeys.forEach(key => {
    currentPortfolioValue += aggregatedEvents[key];
    let label = key;
    if (granularity === 'monthly') {
      const [year, month] = key.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('pt-BR', { month: 'short' });
      label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
    } else {
      const date = new Date(key);
      const monthName = date.toLocaleString('pt-BR', { month: 'short' });
      const day = date.getDate();
      label = `${day} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
    }
    chartData.push({ date: label, portfolio: currentPortfolioValue });
  });

  return chartData;
};
