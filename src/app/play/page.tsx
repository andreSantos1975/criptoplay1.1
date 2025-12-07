"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './play.module.css';
import { Trade } from '@prisma/client';
import { Rankings } from '@/components/simulator/Rankings';
import { SimulatorChart } from '@/components/simulator/SimulatorChart/SimulatorChart';
import { TradeRow } from '@/components/simulator/TradeRow/TradeRow';

// Type definitions
interface SimulatorProfile {
  virtualBalance: number;
  openTrades: Trade[];
}

interface CurrentPrice {
  symbol: string;
  price: string;
}

interface TradeLevels {
  entry: number;
  takeProfit: number;
  stopLoss: number;
}

// API fetching functions
const fetchCurrentPrice = async (symbol: string): Promise<CurrentPrice> => {
  const res = await fetch(`/api/binance/price?symbol=${symbol}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Falha ao buscar preço atual.');
  }
  return res.json();
};

const fetchSimulatorProfile = async (): Promise<SimulatorProfile> => {
  const res = await fetch('/api/simulator/profile');
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Falha ao buscar dados do perfil.');
  }
  return res.json();
};

const createTrade = async (tradeData: { symbol: string, quantity: number, type: 'BUY', entryPrice: number, stopLoss: number, takeProfit: number }) => {
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

// Main Component
const PlayPage = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [symbol, setSymbol] = useState('BTCBRL');
  const [quantity, setQuantity] = useState(0.01);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);

  // Queries
  const { data: profile, isLoading, error } = useQuery<SimulatorProfile, Error>({
    queryKey: ['simulatorProfile'],
    queryFn: fetchSimulatorProfile,
  });

  const { data: currentPriceData, isLoading: isLoadingPrice, error: priceError } = useQuery<CurrentPrice, Error>({
    queryKey: ['currentPrice', symbol],
    queryFn: () => fetchCurrentPrice(symbol),
    refetchInterval: 5000,
  });
  
  const entryPrice = currentPriceData ? parseFloat(currentPriceData.price) : 0;
  const tradeLevelsForChart: TradeLevels = { entry: entryPrice, stopLoss, takeProfit };

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulatorProfile'] });
      setQuantity(0.01);
      setStopLoss(0);
      setTakeProfit(0);
    },
  });

  const closeMutation = useMutation<Trade, Error, string>({
    mutationFn: closeTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulatorProfile'] });
    },
  });

  // Handlers
  const handleLevelsChange = (newLevels: TradeLevels) => {
    // Only update SL and TP from chart dragging, entry is read-only from chart's perspective
    setStopLoss(newLevels.stopLoss);
    setTakeProfit(newLevels.takeProfit);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryPrice) return;
    createMutation.mutate({ 
        symbol, 
        quantity, 
        type: 'BUY', 
        entryPrice, 
        stopLoss, 
        takeProfit 
    });
  };
  
  // Formatting functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const formatPrice = (value: string) => {
    const numValue = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
    }).format(numValue);
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
        {isLoadingPrice ? (
            <p className={styles.currentPrice}>Carregando preço...</p>
        ) : priceError ? (
            <p className={styles.currentPrice}>Erro ao carregar preço</p>
        ) : currentPriceData && (
            <div className={styles.currentPrice}>
                Preço {currentPriceData.symbol}: <span>{formatPrice(currentPriceData.price)}</span>
            </div>
        )}
      </div>

      <div className={styles.mainContent}>

        <SimulatorChart 
            symbol={symbol} 
            tradeLevels={tradeLevelsForChart}
            onLevelsChange={handleLevelsChange}
        />

        <div className={styles.controlsContainer}>
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
                      value={stopLoss === 0 ? '' : stopLoss}
                      onChange={(e) => setStopLoss(Number(e.target.value))}
                      className={styles.input}
                      step="0.01"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="takeProfit" className={styles.label}>Take Profit</label>
                  <input
                      id="takeProfit"
                      type="number"
                      value={takeProfit === 0 ? '' : takeProfit}
                      onChange={(e) => setTakeProfit(Number(e.target.value))}
                      className={styles.input}
                      step="0.01"
                  />
                </div>
                <div className={styles.formGroup}>
                    <button type="submit" className={styles.submitButton} disabled={createMutation.isPending || !entryPrice}>
                    {createMutation.isPending ? 'Enviando...' : 'Comprar'}
                    </button>
                </div>
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
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Ativo</th>
                        <th className={styles.th}>Qtd.</th>
                        <th className={styles.th}>Preço Entrada</th>
                        <th className={styles.th}>Valor</th>
                        <th className={styles.th}>Lucro/Prejuízo</th>
                        <th className={styles.th}>Data</th>
                        <th className={styles.th}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.openTrades.map((trade) => (
                        <TradeRow key={trade.id} trade={trade} closeMutation={closeMutation} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                  <p>Nenhuma operação aberta no momento.</p>
              )}
            </div>
        </div>
      </div>
      
      <Rankings />
    </div>
  );
};

export default PlayPage;