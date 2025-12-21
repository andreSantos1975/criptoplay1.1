"use client";

import { useState, useMemo, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useVigilante, SimulatorPosition } from '@/hooks/useVigilante';
import { useRealtimeChartUpdate } from '@/hooks/useRealtimeChartUpdate';
import { Alert } from '@prisma/client';

// Componentes do simulador e dashboard
import AssetHeader from '@/components/dashboard/AssetHeader/AssetHeader';
import SimulatorChart from '@/components/simulator/SimulatorChart/SimulatorChart';
import { PositionRow } from '@/components/simulator/PositionRow/PositionRow';
import { CryptoList } from '@/components/dashboard/CryptoList/CryptoList';

import styles from './Simulator.module.css';

// --- DEFINIÇÕES DE TIPO ---
interface Trade {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  openDate: string;
  closeDate?: string;
  status: 'OPEN' | 'CLOSED';
  marketType?: 'spot' | 'futures';
}

interface SimulatorProfile {
  balance: number;
  openPositions: SimulatorPosition[]; 
}

interface CurrentPrice {
  price: string;
}

interface BinanceKlineData {
  0: number; // Open time
  1: string; // Open
  2: string; // High
  3: string; // Low
  4: string; // Close
}

interface TradeLevels {
  entry: number;
  stopLoss: number;
  takeProfit: number;
}


// --- FUNÇÕES DE BUSCA DE API ---
const fetchSimulatorProfile = async (): Promise<SimulatorProfile> => {
  const response = await fetch('/api/simulator/profile');
  if (!response.ok) {
    throw new Error('Falha ao buscar perfil do simulador');
  }
  return response.json();
};

const fetchAlerts = async (): Promise<Alert[]> => {
    const response = await fetch('/api/alerts');
    if (!response.ok) {
        throw new Error('Falha ao buscar alertas');
    }
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


const fetchCurrentPrice = async (symbol: string): Promise<CurrentPrice> => {
  if (!symbol) throw new Error("Símbolo é necessário");
  const response = await fetch(`/api/binance/price?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error('Falha ao buscar preço atual');
  }
  return response.json();
};

const createSimulatorTrade = async (tradeData: { symbol: string, quantity: number, type: 'BUY' | 'SELL', entryPrice: number, stopLoss?: number, takeProfit?: number, marketType: 'spot' | 'futures' }): Promise<Trade> => {
    const response = await fetch('/api/simulator/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao criar ordem de simulação');
    }
    return response.json();
};

const closeSimulatorPosition = async (symbol: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/simulator/positions/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao fechar posição');
    }
    return response.json();
};


const Simulator = () => {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const isPremiumUser = session?.user?.subscriptionStatus === 'authorized';

  // --- GERENCIAMENTO DE ESTADO ---
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTCBRL');
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [interval, setInterval] = useState("1m");
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [quantity, setQuantity] = useState(0.01);
  const [closingPositionSymbol, setClosingPositionSymbol] = useState<string | null>(null);
  const [watchedSymbols, setWatchedSymbols] = useState(['BTCBRL', 'ETHBRL', 'SOLBRL', 'ADABRL', 'DOGEBRL', 'SHIBBRL', 'BNBBRL']);
  const [newSymbol, setNewSymbol] = useState('');
  const [prospectiveAlert, setProspectiveAlert] = useState<{ price: number } | null>(null);

  // Fetch exchange rate USDT/BRL
  const { data: exchangeRateData, isLoading: isLoadingExchangeRate } = useQuery({
    queryKey: ['usdtToBrlRate'],
    queryFn: async () => {
      const response = await fetch('/api/exchange-rate');
      if (!response.ok) throw new Error('Falha ao buscar taxa de câmbio.');
      return response.json();
    },
    staleTime: 60000,
    enabled: isPremiumUser,
  });
  const usdtToBrlRate = exchangeRateData?.usdtToBrl || 1;

  // --- BUSCA DE DADOS E MUTAÇÕES ---
  const { data: simulatorProfile, isLoading: isLoadingSimulator } = useQuery<SimulatorProfile, Error>({
    queryKey: ['simulatorProfile'],
    queryFn: fetchSimulatorProfile,
    enabled: isPremiumUser,
  });

  const { data: alerts, isLoading: isLoadingAlerts } = useQuery<Alert[], Error>({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    enabled: isPremiumUser,
  });

  const { data: currentPriceData } = useQuery<CurrentPrice, Error>({
      queryKey: ['currentPrice', selectedCrypto],
      queryFn: () => fetchCurrentPrice(selectedCrypto),
      refetchInterval: 5000,
      enabled: isPremiumUser && !!selectedCrypto,
  });

  const { data: initialChartData, isFetching: isChartLoading } = useQuery({
    queryKey: ["binanceKlines", marketType, interval, selectedCrypto],
    queryFn: async () => {
      const apiPath = marketType === 'futures' ? 'futures-klines' : 'klines';
      const response = await fetch(`/api/binance/${apiPath}?symbol=${selectedCrypto}&interval=${interval}`);
      if (!response.ok) throw new Error("A resposta da rede não foi ok");
      const data: BinanceKlineData[] = await response.json();
      return data.map(k => ({ time: (k[0] / 1000) as any, open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]) }));
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    enabled: isPremiumUser && !!selectedCrypto,
  });

  const createSimulatorTradeMutation = useMutation({
    mutationFn: createSimulatorTrade,
    onSuccess: () => {
      toast.success('Ordem de simulação aberta com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['simulatorProfile'] });
      setQuantity(0.01);
      setStopLoss(0);
      setTakeProfit(0);
    },
    onError: (error) => toast.error(`Erro ao abrir ordem: ${error.message}`),
  });

  const createAlertMutation = useMutation<Alert, Error, Partial<Alert>>({
    mutationFn: createAlert,
    onSuccess: () => {
        toast.success('Alerta criado com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        setProspectiveAlert(null); // Clear prospective alert on success
    },
    onError: (error) => toast.error(`Erro ao criar alerta: ${error.message}`),
    });

  // Nova mutation para fechar uma posição inteira
  const closePositionMutation = useMutation({
    mutationFn: closeSimulatorPosition,
    onMutate: (symbol: string) => {
      setClosingPositionSymbol(symbol);
    },
    onSuccess: (data, symbol) => {
      toast.success(`Posição em ${symbol} fechada com sucesso!`);
    },
    onError: (error: Error, symbol) => {
      toast.error(`Erro ao fechar ${symbol}: ${error.message}`);
    },
    onSettled: () => {
      setClosingPositionSymbol(null);
      queryClient.invalidateQueries({ queryKey: ['simulatorProfile'] });
    },
  });

  // --- HOOKS ---
  const [closingPositionSymbols, setClosingPositionSymbols] = useState<Set<string>>(new Set());

  const handleAddToClosingPositionSymbols = (symbol: string) => {
    setClosingPositionSymbols((prev) => {
      const newSet = new Set(prev);
      newSet.add(symbol);
      return newSet;
    });
  };

  useVigilante({
    openPositions: simulatorProfile?.openPositions,
    closeMutation: closePositionMutation,
    enabled: isPremiumUser && !!simulatorProfile?.openPositions,
    closingPositionSymbols,
    onAddToClosingPositionSymbols: handleAddToClosingPositionSymbols,
  });

  const { realtimeChartUpdate } = useRealtimeChartUpdate({
    symbol: selectedCrypto,
    interval,
    marketType,
    enabled: isPremiumUser,
  });

  // Temporarily keeping this for debugging purposes, will remove after confirming fix
  useEffect(() => {
    if (simulatorProfile?.openPositions) {
      console.log('Simulator: openPositions passed to SimulatorChart:', simulatorProfile?.openPositions);
    }
  }, [simulatorProfile?.openPositions]);


  // --- CÁLCULOS MEMOIZADOS E EFEITOS ---
  const entryPrice = currentPriceData ? parseFloat(currentPriceData.price) : 0;
  const tradeLevelsForChart: TradeLevels = { entry: entryPrice, stopLoss, takeProfit };
  
  const assetHeaderData = useMemo(() => {
    if (!initialChartData || initialChartData.length === 0) return { open: 0, high: 0, low: 0, close: 0, time: 0 };
    const lastCandle = initialChartData[initialChartData.length - 1];
    return {
        ...lastCandle,
        close: realtimeChartUpdate?.close || lastCandle.close,
    };
  }, [initialChartData, realtimeChartUpdate]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const riskAmount = entryPrice > 0 && stopLoss > 0 ? (entryPrice - stopLoss) * quantity : 0;
  const rewardAmount = entryPrice > 0 && takeProfit > 0 ? (takeProfit - entryPrice) * quantity : 0;

  const estimatedCostUSDT = quantity * entryPrice;
  const estimatedCostBRL = selectedCrypto.endsWith('BRL') 
    ? estimatedCostUSDT 
    : estimatedCostUSDT * usdtToBrlRate;


  // --- MANIPULADORES ---
  const handleCryptoSelect = (symbol: string) => {
    setSelectedCrypto(symbol);
    setStopLoss(0);
    setTakeProfit(0);
    setProspectiveAlert(null); // Clear prospective alert when changing crypto
  };

  const handleLevelsChange = (newLevels: TradeLevels) => {
    setStopLoss(newLevels.stopLoss);
    setTakeProfit(newLevels.takeProfit);
  };

  const handleStartCreateAlert = () => {
    if (entryPrice > 0) {
      setProspectiveAlert({ price: entryPrice });
    }
  };

  const handleSaveAlert = () => {
    if (prospectiveAlert) {
      createAlertMutation.mutate({
        symbol: selectedCrypto,
        price: prospectiveAlert.price,
        condition: 'above', // Or determine condition based on price difference
      });
    }
  };

  const handleCancelCreateAlert = () => {
    setProspectiveAlert(null);
  };
  
  const handleSimulatorSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!entryPrice) return;
    createSimulatorTradeMutation.mutate({ symbol: selectedCrypto, quantity, type: 'BUY', entryPrice, stopLoss, takeProfit, marketType });
  };

  const handleAddSymbol = async () => {
    if (!newSymbol) return;
    const symbol = newSymbol.trim().toUpperCase();
    const formattedSymbol = symbol.endsWith('BRL') ? symbol : `${symbol}BRL`;
    if (watchedSymbols.includes(formattedSymbol)) {
        toast.error('Ativo já está na lista.');
        setNewSymbol('');
        return;
    }
    try {
        const res = await fetch(`/api/binance/price?symbol=${formattedSymbol}`);
        if (!res.ok) throw new Error('Ativo não encontrado na Binance.');
        setWatchedSymbols(prev => [...prev, formattedSymbol]);
        toast.success(`${formattedSymbol} adicionado à lista!`);
    } catch (error) {
        if (error instanceof Error) toast.error(error.message);
        else toast.error('Ocorreu um erro ao adicionar o ativo.');
    } finally {
        setNewSymbol('');
    }
  };

  const handleDeleteSymbol = (symbolToDelete: string) => {
    setWatchedSymbols(prev => prev.filter(symbol => symbol !== symbolToDelete));
  };
  
  // --- LÓGICA DE RENDERIZAÇÃO ---
  if (status === 'loading') {
    return <p>Carregando simulador...</p>;
  }

  if (!isPremiumUser) {
    return (
      <div className={styles.premiumRequiredContainer}>
        <h2>Simulador é um recurso Premium</h2>
        <p>Para ter acesso ao simulador de trading, por favor, assine um de nossos planos Premium.</p>
        <a href="/assinatura" className={styles.premiumSubscribeButton}>Assinar Agora</a>
      </div>
    );
  }

  return (
    <div className={styles.simulatorContainer}>
      <div className={styles.chartContainer}>
        <AssetHeader
            symbol={selectedCrypto}
            price={assetHeaderData.close}
            open={assetHeaderData.open}
            high={assetHeaderData.high}
            low={assetHeaderData.low}
        />
        <div className={styles.chartWrapper}>
            <SimulatorChart
                symbol={selectedCrypto}
                tradeLevels={tradeLevelsForChart}
                onLevelsChange={handleLevelsChange}
                tipoOperacao="compra"
                initialChartData={initialChartData}
                isChartLoading={isChartLoading}
                interval={interval}
                onIntervalChange={setInterval}
                realtimeChartUpdate={realtimeChartUpdate}
                openPositions={simulatorProfile?.openPositions}
                alerts={alerts}
                prospectiveAlert={prospectiveAlert}
                onProspectiveAlertChange={setProspectiveAlert}
                onStartCreateAlert={handleStartCreateAlert}
                onSaveAlert={handleSaveAlert}
                onCancelCreateAlert={handleCancelCreateAlert}
            />
        </div>
      </div>

      <div className={styles.tradesContainer}>
          <h2 className={styles.tradesTitle}>Posições Abertas (Simulador)</h2>
          {isLoadingSimulator ? <p>Carregando...</p> : simulatorProfile && simulatorProfile.openPositions.length > 0 ? (
              <div className={styles.tableWrapper}>
              <table className={styles.table}>
                  <thead><tr><th>Ativo</th><th>Qtd. Total</th><th>Preço Médio</th><th>Valor Investido</th><th>Risco (SL / TP)</th><th>Valor Atual</th><th>Lucro/Prejuízo</th><th>Ações</th></tr></thead>
                  <tbody>
                  {simulatorProfile.openPositions.map((position) => (
                      <PositionRow 
                        key={position.symbol} 
                        position={position} 
                        closePositionMutation={() => closePositionMutation.mutate(position.symbol)} 
                        isClosing={closingPositionSymbol === position.symbol} 
                      />
                  ))}
                  </tbody>
              </table>
              </div>
          ) : (
              <p>Nenhuma posição aberta no simulador.</p>
          )}
      </div>

      <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Abrir Nova Operação</h2>
          <form onSubmit={handleSimulatorSubmit} className={styles.form}>
              <div className={styles.formGroup}><label>Ativo: {selectedCrypto}</label></div>
              <div className={styles.formGroup}>
                <label htmlFor="quantity">Quantidade</label>
                <input 
                  id="quantity" 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))} 
                  className={styles.input} 
                  step="any" // Allow any decimal precision
                  min="0" // Minimum quantity of 0
                  required 
                />
                {quantity > 0 && entryPrice > 0 && (
                  <p className={styles.riskInfo}>Custo Total: {formatCurrency(estimatedCostBRL)}</p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="stopLoss">Stop Loss</label>
                <input id="stopLoss" type="number" value={stopLoss === 0 ? '' : stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))} className={styles.input} step="0.01" />
                  {riskAmount > 0 && <p className={styles.riskInfo}>Risco: {formatCurrency(riskAmount)}</p>}
              </div>
                <div className={styles.formGroup}>
                <label htmlFor="takeProfit">Take Profit</label>
                <input id="takeProfit" type="number" value={takeProfit === 0 ? '' : takeProfit} onChange={(e) => setTakeProfit(Number(e.target.value))} className={styles.input} step="0.01" />
                {rewardAmount > 0 && <p className={styles.rewardInfo}>Ganho Potencial: {formatCurrency(rewardAmount)}</p>}
              </div>
              <button type="submit" className={styles.submitButton} disabled={createSimulatorTradeMutation.isPending || !entryPrice}>
                  {createSimulatorTradeMutation.isPending ? 'Enviando...' : 'Comprar'}
              </button>
              {createSimulatorTradeMutation.isError && <p style={{ color: 'red', marginTop: '1rem' }}>Erro: ${createSimulatorTradeMutation.error.message}</p>}
          </form>
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
            <Button onClick={handleAddSymbol} className={styles.submitButton}>Adicionar</Button>
        </div>

      </div>

      <CryptoList
          watchedSymbols={watchedSymbols}
          onCryptoSelect={handleCryptoSelect}
          onDeleteSymbol={handleDeleteSymbol}
      />
    </div>
  );
};

export default Simulator;