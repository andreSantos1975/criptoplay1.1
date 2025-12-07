import { Trade } from '@prisma/client';
import styles from './TradeCard.module.css';

interface TradeCardProps {
  trade: Trade;
  closeMutation: any;
}

export function TradeCard({ trade, closeMutation }: TradeCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const profitLoss = 10; // Replace with actual profit/loss calculation

  return (
    <div className={styles.card}>
      <div className={styles.cardRow}>
        <strong>Ativo:</strong>
        <span>{trade.symbol}</span>
      </div>
      <div className={styles.cardRow}>
        <strong>Qtd.:</strong>
        <span>{trade.quantity.toString()}</span>
      </div>
      <div className={styles.cardRow}>
        <strong>Preço Entrada:</strong>
        <span>{formatCurrency(trade.entryPrice.toNumber())}</span>
      </div>
      <div className={styles.cardRow}>
        <strong>Valor:</strong>
        <span>{formatCurrency(trade.quantity.mul(trade.entryPrice).toNumber())}</span>
      </div>
      <div className={styles.cardRow}>
        <strong>Lucro/Prejuízo:</strong>
        <span className={profitLoss > 0 ? styles.profit : styles.loss}>
          {formatCurrency(profitLoss)}
        </span>
      </div>
      <div className={styles.cardRow}>
        <strong>Data:</strong>
        <span>{new Date(trade.createdAt).toLocaleDateString('pt-BR')}</span>
      </div>
      <div className={styles.actions}>
        <button
          onClick={() => closeMutation.mutate(trade.id)}
          disabled={closeMutation.isLoading}
          className={styles.closeButton}
        >
          {closeMutation.isLoading ? 'Fechando...' : 'Fechar'}
        </button>
      </div>
    </div>
  );
}