'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
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
  stopLoss?: number;
  takeProfit?: number;
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

import { Alert, AlertType } from '@prisma/client';

// --- API Hooks ---
const fetchOpenPositions = async (): Promise<FuturesPosition[]> => {
  const response = await fetch('/api/futures/positions');
  if (!response.ok) throw new Error('Falha ao buscar posições abertas.');
  return response.json();
};

const fetchAlerts = async (): Promise<Alert[]> => {
    const response = await fetch('/api/alerts');
    if (!response.ok) throw new Error('Falha ao buscar alertas');
    return response.json();
};

const createAlert = async (alertData: Partial<Alert>): Promise<Alert> => {
    const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao criar alerta');
    }
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
// ... (FuturesTradeForm and FuturesPositionRow remain unchanged) ...
// (Omitting them here for brevity in replace call, assuming replace context handles it if I target carefully or re-include entire file content if safe. 
// Given replace tool constraints, I should target specific blocks. 
// BUT the prompt asks to implement logic which spans across imports, hook definitions and component body.
// I will target the Imports/API section first, then the Component Body.)

// Step 1: Replace imports and API functions
// Step 2: Replace Component Body logic

// Let's try to target the FuturesSimulator component body primarily.

// REPLACING ENTIRE FILE CONTENT IS SAFER IF I HAVE IT ALL, BUT I NEED TO BE CAREFUL.
// I will target the `FuturesSimulator` component definition to inject state and logic.

// --- Componentes ---

const FuturesTradeForm = ({ 
  symbol, 
  setSymbol, 
  createPositionMutation, 
  isCreating,
  currentPrice,
  exchangeRate,
  tradeLevels,
  onLevelsChange,
  side,
  setSide
}: { 
  symbol: string, 
  setSymbol: (s: string) => void, 
  createPositionMutation: any, 
  isCreating: boolean,
  currentPrice: number,
  exchangeRate: number,
  tradeLevels: { entry: number, stopLoss: number, takeProfit: number },
  onLevelsChange: (levels: any) => void,
  side: PositionSide,
  setSide: (s: PositionSide) => void
}) => {
  const [quantity, setQuantity] = useState(0.01);
  const [leverage, setLeverage] = useState(10);

  // Cálculos de Estimativa
  const notionalValueUSDT = quantity * currentPrice;
  const marginRequiredUSDT = notionalValueUSDT / leverage;
  const marginRequiredBRL = marginRequiredUSDT * exchangeRate;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Cálculos de Risco/Recompensa em BRL
  // Se tradeLevels.entry não estiver definido (o usuário ainda não clicou no gráfico), usa o preço atual convertido.
  const entryPriceBRL = tradeLevels.entry > 0 ? tradeLevels.entry : (currentPrice * exchangeRate);
  
  let riskAmountBRL = 0;
  if (entryPriceBRL > 0 && tradeLevels.stopLoss > 0) {
    if (side === 'LONG') {
      riskAmountBRL = (entryPriceBRL - tradeLevels.stopLoss) * quantity;
    } else { // SHORT
      riskAmountBRL = (tradeLevels.stopLoss - entryPriceBRL) * quantity;
    }
  }
  // Garante que o risco não seja exibido como negativo se o SL estiver acima/abaixo do Entry de forma "ganhadora" (por ex, SL em gain)
  riskAmountBRL = Math.max(0, riskAmountBRL);

  let rewardAmountBRL = 0;
  if (entryPriceBRL > 0 && tradeLevels.takeProfit > 0) {
    if (side === 'LONG') {
      rewardAmountBRL = (tradeLevels.takeProfit - entryPriceBRL) * quantity;
    } else { // SHORT
      rewardAmountBRL = (entryPriceBRL - tradeLevels.takeProfit) * quantity;
    }
  }
  // Garante que a recompensa não seja exibida como negativo
  rewardAmountBRL = Math.max(0, rewardAmountBRL);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Usa o preço atual passado via prop se disponível, senão busca (fallback)
    let entryPrice = currentPrice;

    if (!entryPrice) {
        toast.loading('Buscando preço de mercado...');
        try {
            const priceResponse = await fetch(`/api/binance/price?symbol=${symbol}`);
            if (!priceResponse.ok) throw new Error('Não foi possível obter o preço atual.');
            const priceData = await priceResponse.json();
            entryPrice = parseFloat(priceData.price);
        } catch (error: any) {
            toast.dismiss();
            toast.error(`Erro: ${error.message}`);
            return;
        }
    }

    toast.dismiss();
    toast.loading('Abrindo posição...');
    
    // Convertendo SL/TP de volta para a moeda original (USDT) se necessário
    let finalStopLoss = tradeLevels.stopLoss > 0 ? tradeLevels.stopLoss : undefined;
    let finalTakeProfit = tradeLevels.takeProfit > 0 ? tradeLevels.takeProfit : undefined;

    if (!symbol.endsWith('BRL') && exchangeRate > 0) {
        if (finalStopLoss) finalStopLoss = finalStopLoss / exchangeRate;
        if (finalTakeProfit) finalTakeProfit = finalTakeProfit / exchangeRate;
    }

    createPositionMutation.mutate({ 
      symbol, 
      side, 
      quantity, 
      leverage, 
      entryPrice,
      stopLoss: finalStopLoss,
      takeProfit: finalTakeProfit
    });
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
        <label htmlFor="quantity">Quantidade ({symbol.replace('USDT', '')})</label>
        <input 
          id="quantity" 
          type="number" 
          value={quantity} 
          onChange={e => setQuantity(parseFloat(e.target.value))} 
          step="any" 
          min="0" 
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="leverage">Alavancagem ({leverage}x)</label>
        <input id="leverage" type="range" min="1" max="125" value={leverage} onChange={e => setLeverage(parseInt(e.target.value, 10))} />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="stopLoss">Stop Loss (R$)</label>
        <input 
          id="stopLoss" 
          type="number" 
          value={tradeLevels.stopLoss || ''} 
          onChange={e => onLevelsChange({ ...tradeLevels, stopLoss: parseFloat(e.target.value) })} 
          step="any" 
        />
        {riskAmountBRL > 0 && <p className={styles.riskInfo}>Risco: {formatCurrency(riskAmountBRL)}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="takeProfit">Take Profit (R$)</label>
        <input 
          id="takeProfit" 
          type="number" 
          value={tradeLevels.takeProfit || ''} 
          onChange={e => onLevelsChange({ ...tradeLevels, takeProfit: parseFloat(e.target.value) })} 
          step="any" 
        />
        {rewardAmountBRL > 0 && <p className={styles.rewardInfo}>Ganho Potencial: {formatCurrency(rewardAmountBRL)}</p>}
      </div>

      <div className={styles.costEstimate} style={{ 
          backgroundColor: '#1e293b', 
          padding: '10px', 
          borderRadius: '4px', 
          margin: '10px 0',
          fontSize: '0.9rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Preço Ref.:</span>
          <span>{currentPrice ? formatCurrency(currentPrice * exchangeRate) : '...'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fbbf24' }}>
          <span>Custo (Margem):</span>
          <span>{currentPrice ? formatCurrency(marginRequiredBRL) : '...'}</span>
        </div>
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
  const [side, setSide] = useState<PositionSide>('LONG');

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

  // Convert chart data to BRL
  const chartDataInBRL = useMemo(() => {
    if (!initialChartData) return undefined;
    if (symbol.endsWith('BRL')) return initialChartData;
    
    return initialChartData.map(d => ({
        ...d,
        open: d.open * exchangeRate,
        high: d.high * exchangeRate,
        low: d.low * exchangeRate,
        close: d.close * exchangeRate,
    }));
  }, [initialChartData, exchangeRate, symbol]);

  const realtimeUpdateInBRL = useMemo(() => {
      if (!realtimeChartUpdate) return null;
      if (symbol.endsWith('BRL')) return realtimeChartUpdate;
      
      return {
          ...realtimeChartUpdate,
          open: realtimeChartUpdate.open * exchangeRate,
          high: realtimeChartUpdate.high * exchangeRate,
          low: realtimeChartUpdate.low * exchangeRate,
          close: realtimeChartUpdate.close * exchangeRate,
      };
  }, [realtimeChartUpdate, exchangeRate, symbol]);

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

  const { data: alerts, isLoading: isLoadingAlerts } = useQuery<Alert[], Error>({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });

  const createAlertMutation = useMutation<Alert, Error, Partial<Alert>>({
    mutationFn: createAlert,
    onSuccess: () => {
        toast.success('Alerta criado com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        setProspectiveAlert(null);
    },
    onError: (error) => toast.error(`Erro ao criar alerta: ${error.message}`),
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
      if (error.message.includes('Usuário não encontrado')) {
          toast.error('Sessão inválida. Redirecionando para login...');
          setTimeout(() => signOut(), 1500);
      } else {
          toast.error(`Erro: ${error.message}`);
      }
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

  // Handlers para Alertas
  const handleStartCreateAlert = () => {
    const currentPrice = assetHeaderData.close; // Já está em BRL se exchangeRate for aplicado no assetHeaderData?
    // Verificar assetHeaderData.close acima. Ele pega do initialChartData RAW ou realtimeChartUpdate RAW?
    // initialChartData é RAW (USDT). chartDataInBRL é convertido.
    // assetHeaderData usa initialChartData RAW.
    // Precisamos do preço em BRL se o gráfico estiver em BRL.
    
    // CORREÇÃO: Pegar o último preço do `chartDataInBRL` se disponível
    const lastCloseBRL = chartDataInBRL && chartDataInBRL.length > 0 
        ? chartDataInBRL[chartDataInBRL.length - 1].close 
        : (assetHeaderData.close * exchangeRate);

    if (lastCloseBRL > 0) {
      setProspectiveAlert({ price: lastCloseBRL });
    }
  };

  const handleSaveAlert = () => {
    if (prospectiveAlert) {
      // Se o símbolo for USDT, precisamos converter o preço do alerta de volta para USDT para salvar no banco?
      // OU salvamos em BRL e o backend lida? O sistema de alertas parece simples.
      // Assumindo que o alerta deve ser no valor do par. Se o par é BTCUSDT, o alerta é em USDT.
      // Mas o usuário vê em BRL.
      // Para simplificar, se o usuário está vendo em BRL, ele quer ser alertado naquele preço em BRL.
      // MAS, o preço da Binance vem em USDT. O alerta precisa comparar maçãs com maçãs.
      
      // SOLUÇÃO: Converter o preço alvo de volta para a moeda do par (USDT) antes de salvar
      let targetPrice = prospectiveAlert.price;
      if (!symbol.endsWith('BRL')) {
          targetPrice = targetPrice / exchangeRate;
      }

      createAlertMutation.mutate({
        type: AlertType.PRICE,
        config: {
          symbol: symbol,
          price: targetPrice,
          condition: 'above', // Simplificação, backend ou lógica complexa poderia determinar
        }
      });
    }
  };

  const handleCancelCreateAlert = () => {
    setProspectiveAlert(null);
  };
  
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
          initialChartData={chartDataInBRL}
          isChartLoading={isChartLoading}
          interval={interval}
          onIntervalChange={setInterval}
          realtimeChartUpdate={realtimeUpdateInBRL}
          tradeLevels={tradeLevels}
          onLevelsChange={setTradeLevels}
          tipoOperacao={side === 'LONG' ? 'compra' : 'venda'}
          alerts={alerts}
          openPositions={[]} // Mantemos vazio pois o futures mostra posições na tabela abaixo, não desenha linhas (por enquanto)
          prospectiveAlert={prospectiveAlert}
          onProspectiveAlertChange={setProspectiveAlert}
          onStartCreateAlert={handleStartCreateAlert}
          onSaveAlert={handleSaveAlert}
          onCancelCreateAlert={handleCancelCreateAlert}
        />
      </div>

      <div className={styles.mainContent}>
        <FuturesTradeForm 
          symbol={symbol} 
          setSymbol={setSymbol} 
          createPositionMutation={createPositionMutation} 
          isCreating={createPositionMutation.isPending}
          currentPrice={assetHeaderData.close} 
          exchangeRate={exchangeRate}
          tradeLevels={tradeLevels}
          onLevelsChange={setTradeLevels}
          side={side}
          setSide={setSide}
        />
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