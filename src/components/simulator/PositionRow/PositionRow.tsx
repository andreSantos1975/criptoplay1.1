"use client";

import { useMemo } from 'react';
import styles from './PositionRow.module.css';

import { SimulatorPosition } from '@/hooks/useVigilante';

interface PositionRowProps {
  position: SimulatorPosition;
  isClosing: boolean;
  closePositionMutation: (symbol: string) => void; // A mutação agora aceita o símbolo
  currentPrice: number;
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return 'N/A';
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export const PositionRow = ({ position, isClosing, closePositionMutation, currentPrice }: PositionRowProps) => {

  const { totalValue, pnl, pnlPercentage, investedValue, riskSL, rewardTP } = useMemo(() => {
    if (!currentPrice) return { totalValue: 0, pnl: 0, pnlPercentage: 0, investedValue: 0, riskSL: 0, rewardTP: 0 };
    
    const avgPrice = Number(position.averageEntryPrice);
    const quantity = Number(position.totalQuantity);
    const stopLoss = Number(position.stopLoss);
    const takeProfit = Number(position.takeProfit);

    const investedValue = avgPrice * quantity;
    const currentValue = currentPrice * quantity;
    const pnl = currentValue - investedValue;
    const pnlPercentage = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

    let riskSL = 0;
    if (stopLoss > 0 && stopLoss < avgPrice) { // Assumindo posição LONG
        riskSL = (avgPrice - stopLoss) * quantity;
    }

    let rewardTP = 0;
    if (takeProfit > 0 && takeProfit > avgPrice) { // Assumindo posição LONG
        rewardTP = (takeProfit - avgPrice) * quantity;
    }

    return { totalValue: currentValue, pnl, pnlPercentage, investedValue, riskSL, rewardTP };
  }, [currentPrice, position]);

  const pnlClass = pnl > 0 ? styles.positivePnl : pnl < 0 ? styles.negativePnl : styles.neutralPnl;

  return (
    <tr className={styles.positionRow}>
      <td>{position.symbol}</td>
      <td>{position.totalQuantity.toFixed(4)}</td>
      <td>{formatCurrency(position.averageEntryPrice)}</td>
      <td>{formatCurrency(investedValue)}</td>
      <td>
        {riskSL > 0 ? `SL: ${formatCurrency(riskSL)}` : 'N/A'}
        <br />
        {rewardTP > 0 ? `TP: ${formatCurrency(rewardTP)}` : 'N/A'}
      </td>
      <td>{formatCurrency(totalValue)}</td>
      <td className={pnlClass}>
        {formatCurrency(pnl)} ({pnlPercentage.toFixed(2)}%)
      </td>
      <td>
        <button 
          onClick={() => closePositionMutation(position.symbol)}
          disabled={isClosing}
          className={styles.closeButton}
        >
          {isClosing ? 'Fechando...' : 'Fechar'}
        </button>
      </td>
    </tr>
  );
};
