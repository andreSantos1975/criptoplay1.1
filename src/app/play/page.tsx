"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './play.module.css';
import { Trade } from '@prisma/client';
import { Rankings } from '@/components/simulator/Rankings';

// Tipagem para os dados do perfil do simulador
interface SimulatorProfile {
  virtualBalance: number;
  openTrades: Trade[];
}

// Função para buscar os dados do perfil
const fetchSimulatorProfile = async (): Promise<SimulatorProfile> => {
  const res = await fetch('/api/simulator/profile');
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Falha ao buscar dados do perfil.');
  }
  return res.json();
};

// Função para criar uma nova operação
const createTrade = async (tradeData: { symbol: string, quantity: number, type: 'BUY', stopLoss: number, takeProfit: number }) => {
  const res = await fetch('/api/simulator/trades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tradeData),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Falha ao criar operação.');
  }
  return res.json();
};

// Função para fechar uma operação
const closeTrade = async (tradeId: string) => {
  const res = await fetch(`/api/simulator/trades/${tradeId}/close`, {
    method: 'POST',
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Falha ao fechar operação.');
  }
  return res.json();
};


const PlayPage = () => {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [quantity, setQuantity] = useState(0.01);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);

  // Query para buscar dados do perfil (saldo e operações abertas)
  const { data: profile, isLoading, error } = useQuery<SimulatorProfile, Error>({
    queryKey: ['simulatorProfile'],
    queryFn: fetchSimulatorProfile,
  });

  // Mutation para criar uma nova operação
  const createMutation = useMutation({
    mutationFn: createTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulatorProfile'] });
      setQuantity(0.01);
      setStopLoss(0);
      setTakeProfit(0);
    },
  });

  // Mutation para fechar uma operação
  const closeMutation = useMutation<Trade, Error, string>({
    mutationFn: closeTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulatorProfile'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ symbol, quantity, type: 'BUY', stopLoss, takeProfit });
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Simulador de Trading</h1>
        {isLoading && <p className={styles.balance}>Carregando saldo...</p>}
        {error && <p className={styles.balance}>Erro ao carregar</p>}
        {profile && (
          <div className={styles.balance}>
            Saldo Virtual: <span>{formatCurrency(profile.virtualBalance)}</span>
          </div>
        )}
      </div>

      <div className={styles.mainContent}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Abrir Nova Operação</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="symbol" className={styles.label}>Ativo</label>
              <input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="quantity" className={styles.label}>Quantidade</label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={styles.input}
                step="0.001"
                min="0.001"
                required
              />
            </div>
             <div className={styles.formGroup}>
              <label htmlFor="stopLoss" className={styles.label}>Stop Loss</label>
              <input
                id="stopLoss"
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className={styles.input}
                step="0.01"
                min="0"
              />
            </div>
             <div className={styles.formGroup}>
              <label htmlFor="takeProfit" className={styles.label}>Take Profit</label>
              <input
                id="takeProfit"
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(Number(e.target.value))}
                className={styles.input}
                step="0.01"
                min="0"
              />
            </div>
            <button type="submit" className={styles.submitButton} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Enviando...' : 'Comprar'}
            </button>
            {createMutation.isError && (
              <p style={{ color: 'red', marginTop: '1rem' }}>Erro: {createMutation.error.message}</p>
            )}
          </form>
        </div>

        <div className={styles.tradesContainer}>
          <h2 className={styles.tradesTitle}>Operações Abertas</h2>
          {isLoading && <p>Carregando operações...</p>}
          {error && <p style={{ color: 'red' }}>Não foi possível carregar as operações.</p>}
          {profile && profile.openTrades.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Ativo</th>
                  <th className={styles.th}>Qtd.</th>
                  <th className={styles.th}>Preço Entrada</th>
                  <th className={styles.th}>Data</th>
                  <th className={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {profile.openTrades.map((trade) => (
                  <tr key={trade.id}>
                    <td className={styles.td}>{trade.symbol}</td>
                    <td className={styles.td}>{Number(trade.quantity)}</td>
                    <td className={styles.td}>{formatCurrency(Number(trade.entryPrice))}</td>
                    <td className={styles.td}>{new Date(trade.entryDate).toLocaleDateString('pt-BR')}</td>
                    <td className={styles.td}>
                      <button 
                        onClick={() => closeMutation.mutate(trade.id)}
                        disabled={closeMutation.isPending && closeMutation.variables === trade.id}
                        className={styles.submitButton}
                      >
                        {(closeMutation.isPending && closeMutation.variables === trade.id) ? '...' : 'Fechar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Nenhuma operação aberta no momento.</p>
          )}
        </div>
      </div>
      
      <Rankings />
    </div>
  );
};

export default PlayPage;