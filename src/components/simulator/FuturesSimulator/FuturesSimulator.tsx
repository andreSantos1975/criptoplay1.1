'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import styles from './FuturesSimulator.module.css';

// Importando o gráfico existente e seus hooks de suporte
import SimulatorChart from '@/components/simulator/SimulatorChart/SimulatorChart';
import { useRealtimeChartUpdate } from '@/hooks/useRealtimeChartUpdate';
import AssetHeader from '@/components/dashboard/AssetHeader/AssetHeader';

/// --- Tipos ---
type PositionSide = 'LONG' | 'SHORT';

interface FuturesPosition {
  id: string;
  symbol: string;
  side: PositionSide;
  quantity: number;
  leverage: number;
  entryPrice: number;
  liquidationPrice: number;
  pnl: number | null;
  createdAt: string;
}

interface CreatePositionPayload {
  symbol: string;
  side: PositionSide;
  quantity: number;
  leverage: number;
  entryPrice: number;
}

interface ClosePositionPayload {
  positionId: string;
  exitPrice: number;
}

interface BinanceKlineData {
  0: number; // Open time
  1: string; // Open
  2: string; // High
  3: string; // Low
  4: string; // Close
}

// --- API Hooks ---
const fetchOpenPositions = async (): Promise<FuturesPosition[]> => {
  const response = await fetch('/api/futures/positions');
  if (!response.ok) throw new Error('Falha ao buscar posições abertas.');
  return response.json();
};

const createPosition = async (payload: CreatePositionPayload) => {
  const response = await fetch('/api/futures/positions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Falha ao criar posição.');
  }
  return response.json();
};

const closePosition = async (payload: ClosePositionPayload) => {
    const response = await fetch('/api/futures/positions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao fechar posição.');
    }
    return response.json();
};


// --- Componentes ---

const FuturesTradeForm = ({ symbol, setSymbol, createPositionMutation, isCreating }: { symbol: string, setSymbol: (s: string) => void, createPositionMutation: any, isCreating: boolean }) => {
  const [side, setSide] = useState<PositionSide>('LONG');
  const [quantity, setQuantity] = useState(0.01);
  const [leverage, setLeverage] = useState(10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.loading('Buscando preço de mercado...');
    
    try {
      const priceResponse = await fetch(`/api/binance/price?symbol=${symbol}`);
      if (!priceResponse.ok) throw new Error('Não foi possível obter o preço atual.');
      const priceData = await priceResponse.json();
      const entryPrice = parseFloat(priceData.price);

      toast.dismiss();
      toast.loading('Abrindo posição...');
      createPositionMutation.mutate({ symbol, side, quantity, leverage, entryPrice });

    } catch (error: any) {
      toast.dismiss();
      toast.error(`Erro: ${error.message}`);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={styles.tradeForm}>
      <h4>Abrir Nova Posição</h4>
      <div className={styles.formGroup}>
        <label htmlFor="symbol">Símbolo</label>
        <input id="symbol" type="text" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} />
      </div>
      <div className={styles.formGroup}>
        <label>Lado</label>
        <div className={styles.sideSelector}>
          <button type="button" onClick={() => setSide('LONG')} className={side === 'LONG' ? styles.activeSide : ''}>LONG</button>
          <button type="button" onClick={() => setSide('SHORT')} className={side === 'SHORT' ? styles.activeSide : ''}>SHORT</button>
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="quantity">Quantidade</label>
        <input id="quantity" type="number" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value))} step="0.001" />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="leverage">Alavancagem ({leverage}x)</label>
        <input id="leverage" type="range" min="1" max="125" value={leverage} onChange={e => setLeverage(parseInt(e.target.value, 10))} />
      </div>
      <button type="submit" disabled={isCreating} className={styles.submitButton}>
        {isCreating ? 'Abrindo...' : `Abrir Posição ${side}`}
      </button>
    </form>
  );
};

const FuturesPositionRow = ({ position, closePositionMutation, exchangeRate, isLoadingRate }: { position: FuturesPosition, closePositionMutation: any, exchangeRate: number, isLoadingRate: boolean }) => {
    const { data: priceData } = useQuery({
        queryKey: ['currentPrice', position.symbol],
        queryFn: async () => {
            const response = await fetch(`/api/binance/price?symbol=${position.symbol}`);
            if (!response.ok) return null;
            return response.json();
        },
        refetchInterval: 5000,
    });

    const currentPrice = priceData ? parseFloat(priceData.price) : null;
    let unrealizedPnl: number | null = null;
    if (currentPrice) {
        unrealizedPnl = position.side === 'LONG'
            ? (currentPrice - position.entryPrice) * position.quantity
            : (position.entryPrice - currentPrice) * position.quantity;
    }

    const pnlClass = unrealizedPnl === null ? '' : unrealizedPnl > 0 ? styles.long : styles.short;

    const handleClose = async () => {
        if (!currentPrice) {
            toast.error('Não foi possível obter o preço de fechamento. Tente novamente.');
            return;
        }
        toast.loading('Fechando posição...');
        closePositionMutation.mutate({ positionId: position.id, exitPrice: currentPrice });
    };
    
    const formatBRL = (value: number) => {
        if (isLoadingRate || isNaN(value)) return '...';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value * exchangeRate);
    }

    return (
        <tr>
            <td>{position.symbol}</td>
            <td className={position.side === 'LONG' ? styles.long : styles.short}>{position.side}</td>
            <td>{position.quantity}</td>
            <td>{position.leverage}x</td>
            <td>{formatBRL(position.entryPrice)}</td>
            <td className={pnlClass}>{unrealizedPnl !== null ? formatBRL(unrealizedPnl) : '...'}</td>
            <td>{formatBRL(position.liquidationPrice)}</td>
            <td>
                <button onClick={handleClose} disabled={closePositionMutation.isPending || !currentPrice} className={styles.closeButton}>
                    Fechar
                </button>
            </td>
        </tr>
    );
};

const FuturesPositionsList = ({ positions, isLoading, closePositionMutation, exchangeRate, isLoadingRate }: { positions: FuturesPosition[] | undefined, isLoading: boolean, closePositionMutation: any, exchangeRate: number, isLoadingRate: boolean }) => {
    if (isLoading) return <p>Carregando posições...</p>;
    
    return (
        <div className={styles.positionsList}>
            <h4>Posições Abertas</h4>
            {!positions || positions.length === 0 ? <p>Nenhuma posição aberta.</p> : (
                <div className={styles.tableContainer}>
                    <table className={styles.positionsTable}>
                        <thead>
                            <tr>
                                <th>Símbolo</th><th>Lado</th><th>Qtd.</th><th>Alav.</th>
                                <th>Preço Entrada</th><th>PnL (Não Realizado)</th>
                                <th>Preço Liq.</th><th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.map(pos => <FuturesPositionRow key={pos.id} position={pos} closePositionMutation={closePositionMutation} exchangeRate={exchangeRate} isLoadingRate={isLoadingRate} />)}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const FuturesSimulator = () => {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState("1m");
  const [prospectiveAlert, setProspectiveAlert] = useState<{ price: number } | null>(null);
  const [tradeLevels, setTradeLevels] = useState({ entry: 0, stopLoss: 0, takeProfit: 0 });

  // Busca a taxa de câmbio no componente pai para ser distribuída
  const { data: exchangeRateData, isLoading: isLoadingRate } = useQuery({
    queryKey: ['usdtToBrlRate'],
    queryFn: async () => {
      const response = await fetch('/api/exchange-rate');
      if (!response.ok) throw new Error('Falha ao buscar taxa de câmbio.');
      return response.json();
    },
    staleTime: 60000,
  });
  const exchangeRate = exchangeRateData?.usdtToBrl || 1;

  // Lógica de busca de dados para o gráfico (reutilizada do Simulator.tsx)
  const { data: initialChartData, isFetching: isChartLoading } = useQuery({
    queryKey: ["binanceKlines", 'futures', interval, symbol],
    queryFn: async () => {
      const response = await fetch(`/api/binance/futures-klines?symbol=${symbol}&interval=${interval}`);
      if (!response.ok) throw new Error("A resposta da rede não foi ok para klines de futuros.");
      const data: BinanceKlineData[] = await response.json();
      return data.map(k => ({ time: (k[0] / 1000) as any, open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]) }));
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { realtimeChartUpdate } = useRealtimeChartUpdate({
    symbol: symbol,
    interval,
    marketType: 'futures',
    enabled: true,
  });

  const assetHeaderData = useMemo(() => {
    if (!initialChartData || initialChartData.length === 0) return { open: 0, high: 0, low: 0, close: 0, time: 0 };
    const lastCandle = initialChartData[initialChartData.length - 1];
    return { ...lastCandle, close: realtimeChartUpdate?.close || lastCandle.close };
  }, [initialChartData, realtimeChartUpdate]);

  // Lógica de busca de dados e mutações para as posições
  const { data: positions, isLoading } = useQuery<FuturesPosition[]>({
    queryKey: ['futuresPositions'],
    queryFn: fetchOpenPositions,
    refetchInterval: 10000,
  });

  const createPositionMutation = useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      toast.dismiss();
      toast.success('Posição aberta com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['futuresPositions'] });
    },
    onError: (error: Error) => {
      toast.dismiss();
      toast.error(`Erro: ${error.message}`);
    }
  });

  const closePositionMutation = useMutation({
    mutationFn: closePosition,
    onSuccess: () => {
        toast.dismiss();
        toast.success('Posição fechada com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['futuresPositions'] });
    },
    onError: (error: Error) => {
        toast.dismiss();
        toast.error(`Erro: ${error.message}`);
    }
  });
  
  return (
    <div className={styles.simulatorContainer}>
      <AssetHeader 
        symbol={symbol} 
        price={assetHeaderData.close} 
        open={assetHeaderData.open} 
        high={assetHeaderData.high} 
        low={assetHeaderData.low}
        exchangeRate={exchangeRate}
      />
      
      <div className={styles.chartWrapper}>
        <SimulatorChart
          symbol={symbol}
          initialChartData={initialChartData}
          isChartLoading={isChartLoading}
          interval={interval}
          onIntervalChange={setInterval}
          realtimeChartUpdate={realtimeChartUpdate}
          tradeLevels={tradeLevels}
          onLevelsChange={setTradeLevels}
          tipoOperacao="compra" // Manter como "compra" ou adicionar estado se necessário
          alerts={[]} // Futures simulator doesn't manage alerts directly on chart
          openPositions={[]} // Futures simulator manages its own positions
          prospectiveAlert={prospectiveAlert}
          onProspectiveAlertChange={() => {}} // No-op for futures
          onStartCreateAlert={() => {}} // No-op for futures
          onSaveAlert={() => {}} // No-op for futures
          onCancelCreateAlert={() => {}} // No-op for futures
        />
      </div>

      <div className={styles.mainContent}>
        <FuturesTradeForm symbol={symbol} setSymbol={setSymbol} createPositionMutation={createPositionMutation} isCreating={createPositionMutation.isPending} />
        <FuturesPositionsList 
          positions={positions} 
          isLoading={isLoading} 
          closePositionMutation={closePositionMutation}
          exchangeRate={exchangeRate}
          isLoadingRate={isLoadingRate}
        />
      </div>
    </div>
  );
};

export default FuturesSimulator;
