import { Trade } from "@prisma/client";

export interface TradingStats {
  totalTrades: number;
  winRate: number; // Porcentagem 0-100
  profitFactor: number;
  payoff: number;
  maxDrawdown: number; // Valor absoluto ou porcentagem
  totalProfit: number;
  bestTrade: number;
  worstTrade: number;
  expectancy: number; // Expectativa matemática por trade
}

export function calculateTradingStats(trades: Trade[]): TradingStats {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      payoff: 0,
      maxDrawdown: 0,
      totalProfit: 0,
      bestTrade: 0,
      worstTrade: 0,
      expectancy: 0,
    };
  }

  // Filtrar apenas trades fechados ou que tenham PnL definido
  const closedTrades = trades.filter(t => t.status === 'CLOSED' || t.pnl !== null);
  const totalTrades = closedTrades.length;

  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      payoff: 0,
      maxDrawdown: 0,
      totalProfit: 0,
      bestTrade: 0,
      worstTrade: 0,
      expectancy: 0,
    };
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let maxWin = -Infinity;
  let maxLoss = Infinity;
  let currentEquity = 0; // Para simplificar, assumimos saldo inicial 0 para cálculo do drawdown relativo ao lucro acumulado
  let maxEquity = 0;
  let maxDD = 0;
  let totalPnl = 0;

  // Ordenar trades por data de saída (ou entrada se saída não existir) para cálculo correto de Drawdown
  const sortedTrades = [...closedTrades].sort((a, b) => {
    const dateA = a.exitDate ? new Date(a.exitDate).getTime() : new Date(a.entryDate).getTime();
    const dateB = b.exitDate ? new Date(b.exitDate).getTime() : new Date(b.entryDate).getTime();
    return dateA - dateB;
  });

  sortedTrades.forEach((trade) => {
    const pnl = Number(trade.pnl || 0);
    totalPnl += pnl;

    // Stats básicos
    if (pnl > 0) {
      grossProfit += pnl;
      winningTrades++;
      if (pnl > maxWin) maxWin = pnl;
    } else if (pnl < 0) {
      grossLoss += Math.abs(pnl);
      losingTrades++;
      if (pnl < maxLoss) maxLoss = pnl;
    }

    // Drawdown Calculation
    // Drawdown é a queda do pico de capital até o fundo atual
    currentEquity += pnl;
    if (currentEquity > maxEquity) {
      maxEquity = currentEquity;
    }
    
    const drawdown = maxEquity - currentEquity;
    if (drawdown > maxDD) {
      maxDD = drawdown;
    }
  });

  const winRate = (winningTrades / totalTrades) * 100;
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;
  
  const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const payoff = avgLoss === 0 ? (avgWin > 0 ? Infinity : 0) : avgWin / avgLoss;

  // Expectativa Matemática = (Probabilidade de Ganho * Ganho Médio) - (Probabilidade de Perda * Perda Média)
  // WinRate decimal * AvgWin - LossRate decimal * AvgLoss
  const winRateDecimal = winningTrades / totalTrades;
  const lossRateDecimal = losingTrades / totalTrades;
  const expectancy = (winRateDecimal * avgWin) - (lossRateDecimal * avgLoss);

  return {
    totalTrades,
    winRate,
    profitFactor,
    payoff,
    maxDrawdown: maxDD,
    totalProfit: totalPnl,
    bestTrade: maxWin === -Infinity ? 0 : maxWin,
    worstTrade: maxLoss === Infinity ? 0 : maxLoss,
    expectancy
  };
}
