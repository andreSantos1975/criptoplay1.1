'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import styles from './FuturesSimulator.module.css';
import { Button } from '@/components/ui/button';

// Importando o gráfico existente e seus hooks de suporte
import SimulatorChart from '@/components/simulator/SimulatorChart/SimulatorChart';
import { useRealtimeChartUpdate } from '@/hooks/useRealtimeChartUpdate';
import AssetHeader from '@/components/dashboard/AssetHeader/AssetHeader';
import { CryptoList } from '@/components/dashboard/CryptoList/CryptoList'; // Import CryptoList
import { useVigilante, SimulatorPosition } from '@/hooks/useVigilante';
import { Alert, AlertType } from '@prisma/client';

/// --- Tipos ---
type PositionSide = 'LONG' | 'SHORT';

// Interface atualizada para refletir a agregação do backend
interface FuturesPosition {
  id: string; // ID de referência
  ids: string[]; // Lista de todos os IDs agregados
  symbol: string;
  side: PositionSide;
  quantity: number;
  leverage: number;
  entryPrice: number; // Preço médio
  liquidationPrice: number;
  margin: number;
  pnl: number | null;
  createdAt: string;
  stopLoss: number | null;
  takeProfit: number | null;
  marketType: 'futures';
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
  positionIds: string[]; // Alterado para aceitar múltiplos IDs
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
  
  const [slInput, setSlInput] = useState(tradeLevels.stopLoss > 0 ? tradeLevels.stopLoss.toString().replace('.', ',') : '');
  const [tpInput, setTpInput] = useState(tradeLevels.takeProfit > 0 ? tradeLevels.takeProfit.toString().replace('.', ',') : '');

  useEffect(() => {
    const currentSlNumeric = parseFloat(slInput.replace(',', '.')) || 0;
    if (Math.abs(tradeLevels.stopLoss - currentSlNumeric) > 0.000001) {
       setSlInput(tradeLevels.stopLoss > 0 ? tradeLevels.stopLoss.toString().replace('.', ',') : '');
    }
  }, [tradeLevels.stopLoss]);

  useEffect(() => {
    const currentTpNumeric = parseFloat(tpInput.replace(',', '.')) || 0;
    if (Math.abs(tradeLevels.takeProfit - currentTpNumeric) > 0.000001) {
       setTpInput(tradeLevels.takeProfit > 0 ? tradeLevels.takeProfit.toString().replace('.', ',') : '');
    }
  }, [tradeLevels.takeProfit]);

  const handleSlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawValue = e.target.value;
      if (!/^[0-9.,]*$/.test(rawValue)) return;

      setSlInput(rawValue); 
      
      const normalized = rawValue.replace(',', '.');
      const numValue = parseFloat(normalized);
      
      onLevelsChange({ 
          ...tradeLevels, 
          stopLoss: isNaN(numValue) ? 0 : numValue 
      });
  };

  const handleTpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawValue = e.target.value;
      if (!/^[0-9.,]*$/.test(rawValue)) return;

      setTpInput(rawValue); 
      
      const normalized = rawValue.replace(',', '.');
      const numValue = parseFloat(normalized);
      
      onLevelsChange({ 
          ...tradeLevels, 
          takeProfit: isNaN(numValue) ? 0 : numValue 
      });
  };

  const notionalValueUSDT = quantity * currentPrice;
  const marginRequiredUSDT = notionalValueUSDT / leverage;
  const marginRequiredBRL = marginRequiredUSDT * exchangeRate;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const entryPriceBRL = tradeLevels.entry > 0 ? tradeLevels.entry : (currentPrice * exchangeRate);
  
  let riskAmountBRL = 0;
  if (entryPriceBRL > 0 && tradeLevels.stopLoss > 0) {
     const pnlPerUnit = side === 'LONG' 
        ? entryPriceBRL - tradeLevels.stopLoss 
        : tradeLevels.stopLoss - entryPriceBRL;
     riskAmountBRL = pnlPerUnit * quantity;
  }
  const showRisk = riskAmountBRL > 0;

  let rewardAmountBRL = 0;
  if (entryPriceBRL > 0 && tradeLevels.takeProfit > 0) {
      const pnlPerUnit = side === 'LONG'
        ? tradeLevels.takeProfit - entryPriceBRL
        : entryPriceBRL - tradeLevels.takeProfit;
      rewardAmountBRL = pnlPerUnit * quantity;
  }
  const showReward = rewardAmountBRL > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          type="text"
          inputMode="decimal"
          value={slInput} 
          onChange={handleSlChange}
          placeholder="0,00"
          autoComplete="off"
        />
        {showRisk && <p className={styles.riskInfo}>Risco: {formatCurrency(riskAmountBRL)}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="takeProfit">Take Profit (R$)</label>
        <input 
          id="takeProfit" 
          type="text"
          inputMode="decimal"
          value={tpInput} 
          onChange={handleTpChange}
          placeholder="0,00"
          autoComplete="off"
        />
        {showReward && <p className={styles.rewardInfo}>Ganho Potencial: {formatCurrency(rewardAmountBRL)}</p>}
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
        // Alterado para enviar positionIds (array)
        closePositionMutation.mutate({ positionIds: position.ids, exitPrice: currentPrice });
    };
    
    const formatBRL = (value: number) => {
        if (isLoadingRate || isNaN(value)) return '...';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value * exchangeRate);
    }

    // Calcula margem total baseada no valor investido
    const initialMargin = (position.entryPrice * position.quantity) / position.leverage;

    let riskValue = 0;
    if (position.stopLoss) {
        const pnl = position.side === 'LONG' 
            ? position.stopLoss - position.entryPrice 
            : position.entryPrice - position.stopLoss;
        riskValue = pnl * position.quantity * exchangeRate;
    }

    let rewardValue = 0;
    if (position.takeProfit) {
        const pnl = position.side === 'LONG'
            ? position.takeProfit - position.entryPrice
            : position.entryPrice - position.takeProfit;
        rewardValue = pnl * position.quantity * exchangeRate;
    }

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <tr>
            <td>{position.symbol}</td>
            <td className={position.side === 'LONG' ? styles.long : styles.short}>{position.side}</td>
            <td>{position.quantity}</td>
            <td>{position.leverage}x</td>
            <td>{formatBRL(initialMargin)}</td>
            <td>{formatBRL(position.entryPrice)}</td>
            <td style={{ color: '#ef5350' }}>{position.stopLoss ? formatMoney(riskValue) : '-'}</td>
            <td style={{ color: '#26a69a' }}>{position.takeProfit ? formatMoney(rewardValue) : '-'}</td>
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
                                <th>Margem</th>
                                <th>Preço Médio</th>
                                <th>Risco (SL)</th>
                                <th>Retorno (TP)</th>
                                <th>PnL (Não Realizado)</th>
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
  const [watchedSymbols, setWatchedSymbols] = useState<string[]>(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADATUSD', 'DOGEUSDT', 'SHIBUSDT', 'BNBUSDT']);
  const [newSymbol, setNewSymbol] = useState('');
  
  const defaultsAppliedRef = useRef(false);

  useEffect(() => {
    defaultsAppliedRef.current = false;
  }, [side]);

  // MOVED: Hooks de dados movidos para o topo para garantir inicialização antes do uso
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

  const { data: positions, isLoading } = useQuery<FuturesPosition[]>({
    queryKey: ['futuresPositions'],
    queryFn: fetchOpenPositions,
    refetchInterval: 10000,
  });

  const { data: alerts, isLoading: isLoadingAlerts } = useQuery<Alert[], Error>({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });

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

  const prevPositionsLengthRef = useRef(0);

  // Efeito para detectar o FECHAMENTO de posições e permitir reaplicar os defaults
  useEffect(() => {
      const currentLength = positions?.length || 0;
      // Se tínhamos posições antes (> 0) e agora não temos (0), significa que fechou tudo.
      if (prevPositionsLengthRef.current > 0 && currentLength === 0) {
          defaultsAppliedRef.current = false;
      }
      prevPositionsLengthRef.current = currentLength;
  }, [positions]);

  // Efeito para aplicar Stop Loss e Take Profit padrão (apenas se defaultsAppliedRef for false)
  useEffect(() => {
    let currentPrice = assetHeaderData.close;
    if (!symbol.endsWith('BRL') && exchangeRate > 0) {
        currentPrice = currentPrice * exchangeRate;
    }

    // Só aplica se não tiver aplicado ainda E se não tiver posições abertas
    if (currentPrice > 0 && !defaultsAppliedRef.current && (!positions || positions.length === 0)) {
        if (side === 'LONG') {
            setTradeLevels(prev => ({ 
                ...prev, 
                entry: currentPrice, 
                stopLoss: currentPrice * 0.99, 
                takeProfit: currentPrice * 1.02 
            }));
        } else {
            setTradeLevels(prev => ({ 
                ...prev, 
                entry: currentPrice,
                stopLoss: currentPrice * 1.01, 
                takeProfit: currentPrice * 0.98 
            }));
        }
        defaultsAppliedRef.current = true;
    }
  }, [assetHeaderData.close, side, symbol, exchangeRate, positions]); // 'positions' is now safe to use here

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
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['simulatorTrades'] });
      // Limpa as linhas de rascunho (prospectivas) após o sucesso da operação
      setTradeLevels({ entry: 0, stopLoss: 0, takeProfit: 0 });
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
        queryClient.invalidateQueries({ queryKey: ['trades'] });
        queryClient.invalidateQueries({ queryKey: ['simulatorTrades'] });
    },
    onError: (error: Error) => {
        toast.dismiss();
        toast.error(`Erro: ${error.message}`);
    }
  });

  const [closingPositionSymbols, setClosingPositionSymbols] = useState<Set<string>>(new Set());

  const handleAddToClosing = (symbol: string) => {
    setClosingPositionSymbols(prev => new Set(prev).add(symbol));
  };

  // Mapeamento para o Vigilante (Lógica de Backend - USDT)
  const vigilantePositions: SimulatorPosition[] = useMemo(() => {
    if (!positions) return [];
    return positions.map(pos => ({
      symbol: pos.symbol,
      totalQuantity: pos.quantity,
      averageEntryPrice: pos.entryPrice,
      stopLoss: pos.stopLoss || 0,
      takeProfit: pos.takeProfit || 0,
      tradeIds: pos.ids,
      marketType: 'futures'
    }));
  }, [positions]);

  // Mapeamento para o Gráfico (Visualização - BRL)
  const chartPositions = useMemo(() => {
    return vigilantePositions.map(pos => {
      // Se já for BRL ou exchangeRate inválido, mantém original
      if (pos.symbol.endsWith('BRL') || !exchangeRate) return pos;
      
      return {
        ...pos,
        averageEntryPrice: pos.averageEntryPrice * exchangeRate,
        stopLoss: pos.stopLoss > 0 ? pos.stopLoss * exchangeRate : 0,
        takeProfit: pos.takeProfit > 0 ? pos.takeProfit * exchangeRate : 0,
      };
    });
  }, [vigilantePositions, exchangeRate]);

  // Ativando o Vigilante com a nova lógica de fechamento
  useVigilante({
    openPositions: vigilantePositions, // Mantém dados originais (USDT) para lógica correta
    closeMutation: {
      ...closePositionMutation,
      mutate: (payload) => {
        const pos = positions?.find(p => p.symbol === payload.symbol);
        
        if (pos) {
           console.log(`[FuturesSimulator] Auto-closing ${pos.symbol} at ${payload.price}`);
           closePositionMutation.mutate({ 
               positionIds: pos.ids,
               exitPrice: payload.price 
           });
        }
      }
    } as any,
    enabled: true,
    closingPositionSymbols,
    onAddToClosingPositionSymbols: handleAddToClosing,
  });

  const handleStartCreateAlert = () => {
    const lastCloseBRL = chartDataInBRL && chartDataInBRL.length > 0 
        ? chartDataInBRL[chartDataInBRL.length - 1].close 
        : (assetHeaderData.close * exchangeRate);

    if (lastCloseBRL > 0) {
      setProspectiveAlert({ price: lastCloseBRL });
    }
  };

  const handleSaveAlert = () => {
    if (prospectiveAlert) {
      let targetPrice = prospectiveAlert.price;
      if (!symbol.endsWith('BRL')) {
          targetPrice = targetPrice / exchangeRate;
      }

      createAlertMutation.mutate({
        type: AlertType.PRICE,
        config: {
          symbol: symbol,
          targetPrice: targetPrice,
          operator: 'gt', 
        }
      });
    }
  };

  const handleCancelCreateAlert = () => {
    setProspectiveAlert(null);
  };
  
  const handleCryptoSelect = (s: string) => {
    setSymbol(s);
    setTradeLevels({ entry: 0, stopLoss: 0, takeProfit: 0 }); 
    setProspectiveAlert(null); 
    defaultsAppliedRef.current = false;
  };

  const handleDeleteSymbol = (symbolToDelete: string) => {
    setWatchedSymbols(prev => prev.filter(s => s !== symbolToDelete));
  };

  const handleAddSymbol = async () => {
    if (!newSymbol) return;
    const s = newSymbol.trim().toUpperCase();
    const formattedSymbol = s.endsWith('USDT') ? s : `${s}USDT`; 

    if (watchedSymbols.includes(formattedSymbol)) {
        toast.error('Ativo já está na lista.');
        setNewSymbol('');
        return;
    }
    try {
        const res = await fetch(`/api/binance/futures-klines?symbol=${formattedSymbol}&interval=1m&limit=1`);
        if (!res.ok) throw new Error('Ativo não encontrado no mercado de Futuros da Binance.');
        
        setWatchedSymbols(prev => [...prev, formattedSymbol]);
        toast.success(`${formattedSymbol} adicionado à lista!`);
    } catch (error) {
        if (error instanceof Error) toast.error(error.message);
        else toast.error('Ocorreu um erro ao adicionar o ativo.');
    } finally {
        setNewSymbol('');
    }
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
          openPositions={chartPositions} // Passando posições convertidas para BRL
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

      <div className={styles.formContainer} style={{ gridColumn: 'span 2' }}>
        <h3 className={styles.formTitle}>Adicionar Ativo à Lista</h3>
        <div className={styles.addSymbolForm}>
            <input 
                type="text" 
                value={newSymbol} 
                onChange={(e) => setNewSymbol(e.target.value)} 
                placeholder="Ex: XRP"
                className={styles.input}
            />
            <Button onClick={handleAddSymbol}>Adicionar</Button>
        </div>
      </div>

      <CryptoList
          watchedSymbols={watchedSymbols}
          onCryptoSelect={handleCryptoSelect}
          onDeleteSymbol={handleDeleteSymbol}
          theme="dark"
      />
    </div>
  );
};

export default FuturesSimulator;