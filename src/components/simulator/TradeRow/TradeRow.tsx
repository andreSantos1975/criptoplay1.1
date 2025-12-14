"use client";

import { useQuery } from '@tanstack/react-query';
import { Trade } from '@prisma/client';
import styles from './TradeRow.module.css';
import simStyles from '../Simulator/Simulator.module.css';

// Tipagem para o preço atual
interface CurrentPrice {
  symbol: string;
  price: string;
}

// Função para buscar o preço atual do ativo
const fetchCurrentPrice = async (symbol: string): Promise<CurrentPrice> => {
  const res = await fetch(`/api/binance/price?symbol=${symbol}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Falha ao buscar preço atual.');
  }
  return res.json();
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '...';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
}

interface TradeRowProps {
  trade: Trade;
  closeMutation: any; // Using 'any' for simplicity, could be more specific
  isClosing: boolean;
}

export const TradeRow = ({ trade, closeMutation, isClosing }: TradeRowProps) => {
  const { data: currentPriceData } = useQuery<CurrentPrice, Error>({
    queryKey: ['currentPrice', trade.symbol],
    queryFn: () => fetchCurrentPrice(trade.symbol),
    refetchInterval: 5000, // Fetch every 5 seconds
  });

  const calculatePL = () => {
    if (!currentPriceData?.price) {
      return null;
    }
    const currentPrice = parseFloat(currentPriceData.price);
    const entryPrice = Number(trade.entryPrice);
    const quantity = Number(trade.quantity);
    return (currentPrice - entryPrice) * quantity;
  };

  const pl = calculatePL();

  return (
    <tr key={trade.id}>
      <td data-label="Ativo" className={simStyles.td}>{trade.symbol}</td>
      <td data-label="Qtd." className={simStyles.td}>{Number(trade.quantity)}</td>
      <td data-label="Preço Entrada" className={simStyles.td}>{formatCurrency(Number(trade.entryPrice))}</td>
      <td data-label="Valor" className={simStyles.td}>{formatCurrency(Number(trade.quantity) * Number(trade.entryPrice))}</td>
      <td data-label="Lucro/Prejuízo" className={simStyles.td}>
        {pl !== null ? (
          <span className={pl >= 0 ? styles.textProfit : styles.textLoss}>
            {formatCurrency(pl)}
          </span>
        ) : (
          'Calculando...'
        )}
      </td>
      <td data-label="Data" className={simStyles.td}>{new Date(trade.entryDate).toLocaleDateString('pt-BR')}</td>
      <td data-label="Ações" className={simStyles.td}>
        <button
          onClick={() => closeMutation.mutate(trade.id)}
          disabled={isClosing}
          className={simStyles.submitButton}
        >
          {isClosing ? '...' : 'Fechar'}
        </button>
      </td>
    </tr>
  );
};
