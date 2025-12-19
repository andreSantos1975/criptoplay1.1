"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './PositionRow.module.css';

// Tipo para a posição agregada (deve corresponder ao que a API retorna)
interface Position {
  symbol: string;
  totalQuantity: number;
  averageEntryPrice: number;
  tradeIds: string[];
}

// Tipo para o preço atual
interface CurrentPrice {
  price: string;
}

interface PositionRowProps {
  position: Position;
  isClosing: boolean;
  closePositionMutation: (symbol: string) => void; // A mutação agora aceita o símbolo
}

const fetchCurrentPrice = async (symbol: string): Promise<CurrentPrice> => {
  if (!symbol) throw new Error("Símbolo é necessário");
  const response = await fetch(`/api/binance/price?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error('Falha ao buscar preço atual');
  }
  return response.json();
};

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return 'N/A';
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export const PositionRow = ({ position, isClosing, closePositionMutation }: PositionRowProps) => {
  const { data: currentPriceData } = useQuery<CurrentPrice, Error>({
    queryKey: ['currentPrice', position.symbol],
    queryFn: () => fetchCurrentPrice(position.symbol),
    refetchInterval: 5000,
  });

  const { totalValue, pnl, pnlPercentage } = useMemo(() => {
    const currentPrice = currentPriceData ? parseFloat(currentPriceData.price) : 0;
    if (!currentPrice) return { totalValue: 0, pnl: 0, pnlPercentage: 0 };
    
    const avgPrice = Number(position.averageEntryPrice);
    const quantity = Number(position.totalQuantity);

    const totalInvested = avgPrice * quantity;
    const currentValue = currentPrice * quantity;
    const pnl = currentValue - totalInvested;
    const pnlPercentage = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

    return { totalValue: currentValue, pnl, pnlPercentage };
  }, [currentPriceData, position]);

  const pnlClass = pnl > 0 ? styles.positivePnl : pnl < 0 ? styles.negativePnl : styles.neutralPnl;

  return (
    <tr className={styles.positionRow}>
      <td>{position.symbol}</td>
      <td>{position.totalQuantity.toFixed(4)}</td>
      <td>{formatCurrency(position.averageEntryPrice)}</td>
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
