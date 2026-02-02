"use client";

import { useState, useMemo, useEffect, FormEvent, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useVigilante, SimulatorPosition } from '@/hooks/useVigilante';
import { useRealtimeChartUpdate } from '@/hooks/useRealtimeChartUpdate';
import { Alert, AlertType, Trade } from '@prisma/client';
import { UTCTimestamp } from 'lightweight-charts';

// Componentes do simulador e dashboard
import AssetHeader from '@/components/dashboard/AssetHeader/AssetHeader';
import SimulatorChart from '@/components/simulator/SimulatorChart/SimulatorChart';
import { PositionRow } from '@/components/simulator/PositionRow/PositionRow';
import { CryptoList } from '@/components/dashboard/CryptoList/CryptoList';
import { TradeJournalModal } from '@/components/trade-journal/TradeJournalModal';
import { DecimalInput } from '@/components/ui/DecimalInput'; // Importar o DecimalInput

import styles from './Simulator.module.css';

interface TradeLevels {
  entry: number;
  stopLoss: number;
  takeProfit: number;
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

interface SimulatorProfile {
  virtualBalance: number;
  openPositions: SimulatorPosition[];
}

interface CryptoData {
  symbol: string;
  price: string;
}

const fetchSimulatorProfile = async (): Promise<SimulatorProfile> => {
  const response = await fetch('/api/simulator/profile');
  if (!response.ok) throw new Error('Falha ao buscar perfil do simulador.');
  const data = await response.json();
  return {
    ...data,
    virtualBalance: Number(data.virtualBalance)
  };
};

const fetchCurrentPrice = async (symbol: string): Promise<CurrentPrice> => {
  if (!symbol) throw new Error("Símbolo é necessário");
  const response = await fetch(`/api/binance/price?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error('Falha ao buscar preço atual');
  }
  return response.json();
};

const fetchBinancePrices = async (symbols: string[]): Promise<CryptoData[]> => {
  if (symbols.length === 0) return [];
  const symbolsParam = JSON.stringify(symbols);
  const res = await fetch(`/api/binance/price?symbols=${encodeURIComponent(symbolsParam)}`);
  if (!res.ok) throw new Error("Falha ao buscar preços da Binance.");
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return [];
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

const closeSimulatorPosition = async (symbol: string) => {
    const response = await fetch('/api/simulator/positions/close', {
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
  
  const isPremiumUser = useMemo(() => {
    if (!session?.user) return false;
    
    const isTrialActive = session.user.createdAt ? 
      Math.floor((new Date().getTime() - new Date(session.user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) < 7 :
      false;

    return (
      session.user.subscriptionStatus === 'authorized' || 
      session.user.subscriptionStatus === 'lifetime' || 
      session.user.isAdmin === true ||
      isTrialActive
    );
  }, [session]);

  // --- GERENCIAMENTO DE ESTADO ---
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTCBRL');
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [interval, setInterval] = useState("1m");
  const [tradeLevels, setTradeLevels] = useState<TradeLevels>({ entry: 0, stopLoss: 0, takeProfit: 0 });
  const [quantity, setQuantity] = useState(0.01);
  const [closingPositionSymbol, setClosingPositionSymbol] = useState<string | null>(null);
  const [watchedSymbols, setWatchedSymbols] = useState(['BTCBRL', 'ETHBRL', 'SOLBRL', 'ADABRL', 'DOGEBRL', 'SHIBBRL', 'BNBBRL']);
  const [newSymbol, setNewSymbol] = useState('');
  const [prospectiveAlert, setProspectiveAlert] = useState<{ price: number } | null>(null);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false); // Estado do modal do diário
  const [journalTradeId, setJournalTradeId] = useState<string | null>(null); // ID da trade para o diário
  
  // Ref para controlar a aplicação única dos valores padrão
  const defaultsAppliedRef = useRef(false);

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

  const openPositionSymbols = useMemo(() => {
    return Array.from(new Set(simulatorProfile?.openPositions.map(p => p.symbol) || []));
  }, [simulatorProfile?.openPositions]);

  const { data: binanceTickers, isLoading: isLoadingBinanceTickers } = useQuery<CryptoData[], Error>({
    queryKey: ['simulatorBinancePrices', openPositionSymbols],
    queryFn: () => fetchBinancePrices(openPositionSymbols),
    enabled: isPremiumUser && openPositionSymbols.length > 0,
    refetchInterval: 5000,
  });

  const priceMap = useMemo(() => {
    return new Map(binanceTickers?.map(ticker => [ticker.symbol, parseFloat(ticker.price)]));
  }, [binanceTickers]);


  const { data: alerts, isLoading: isLoadingAlerts } = useQuery<Alert[], Error>({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    enabled: isPremiumUser,
  });

  const { data: tickerData, isError: isTickerError, error: tickerError } = useQuery({
    queryKey: ['spotTicker24hr', selectedCrypto],
    queryFn: async () => {
      if (!selectedCrypto) return null;

      try {
        // Tenta buscar da Binance primeiro
        const response = await fetch(`/api/binance/ticker-24hr?symbol=${selectedCrypto}`);
        if (response.ok) {
          return response.json();
        }
        console.warn('Falha ao buscar da Binance, tentando Bitget como fallback.');
      } catch (error) {
        console.error('Erro ao buscar da Binance:', error);
      }

      // Fallback para a Bitget
      try {
        const bitgetResponse = await fetch(`/api/bitget/ticker-24hr?symbol=${selectedCrypto}`);
        const bitgetData = await bitgetResponse.json();
        
        console.log('Resposta completa da Bitget:', JSON.stringify(bitgetData, null, 2));

        if (!bitgetResponse.ok || bitgetData.error) {
          throw new Error(bitgetData.error || 'Falha ao buscar dados do ticker na Bitget.');
        }

        return bitgetData;
      } catch (error) {
        console.error('Erro final ao tentar fallback para Bitget:', error);
        return null;
      }
    },
    refetchInterval: 2000,
    enabled: isPremiumUser && !!selectedCrypto,
  });



  const {
    data: chartData,
    isFetching: isChartLoading,
    isError: isErrorKlines,
    error: klinesError,
  } = useQuery({
    queryKey: ["binanceKlines", marketType, interval, selectedCrypto],
    queryFn: async () => {
      const apiPath = marketType === 'futures' ? 'futures-klines' : 'klines';
      const response = await fetch(`/api/binance/${apiPath}?symbol=${selectedCrypto}&interval=${interval}&limit=1000`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao buscar dados do gráfico.");
      }
      const data: BinanceKlineData[] = await response.json();
      // A API já retorna os dados em ordem crescente (antigo -> recente)
      return data.map(k => ({ time: Number(k[0] / 1000) as UTCTimestamp, open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]) })).filter(k => k.time > 0 && !isNaN(k.time));
    },
    staleTime: 60 * 60 * 1000, // 1 hora
    refetchOnWindowFocus: false,
    enabled: isPremiumUser && !!selectedCrypto,
  });

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
    // Retorna a trade criada com seu ID
    return response.json();
  };

  const createSimulatorTradeMutation = useMutation({
    mutationFn: createSimulatorTrade,
    onSuccess: (newTrade: Trade) => { // Receber o objeto da nova trade
      toast.success('Ordem de simulação aberta com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['simulatorProfile'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['simulatorTrades'] });
      setQuantity(0.01);
      setTradeLevels({ entry: 0, stopLoss: 0, takeProfit: 0 }); // Limpa os níveis

      // Abrir o modal do diário
      setJournalTradeId(newTrade.id);
      setIsJournalModalOpen(true);
    },
    onError: (error: any) => toast.error(`Erro ao abrir ordem: ${error.message}`),
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
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['simulatorTrades'] });
      // Invalida a query de estatísticas do usuário para forçar a atualização no dashboard
      if (session?.user?.id) {
          queryClient.invalidateQueries({ queryKey: ['userTradingStats', session.user.id] });
      }
    },
  });

  // --- HOOKS ---

  useVigilante({
    openPositions: simulatorProfile?.openPositions,
    // Wrapper para compatibilidade com a nova assinatura (payload rico)
    closeMutation: {
      ...closePositionMutation,
      mutate: (payload) => closePositionMutation.mutate(payload.symbol)
    },
    enabled: isPremiumUser && !!simulatorProfile?.openPositions,
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

  // Efeito para aplicar Stop Loss (1%) e Take Profit (2%) padrão
  useEffect(() => {
    const hasOpenPositionForSymbol = simulatorProfile?.openPositions?.some(p => p.symbol === selectedCrypto);
    const currentEntryPrice = tickerData?.lastPrice;

    if (currentEntryPrice > 0 && !defaultsAppliedRef.current && !hasOpenPositionForSymbol) {
      setTradeLevels(prev => ({
        ...prev,
        entry: currentEntryPrice,
        stopLoss: tickerData?.lastPrice * 0.99, // 1% abaixo
        takeProfit: tickerData?.lastPrice * 1.02, // 2% acima
      }));
      defaultsAppliedRef.current = true;
    }
  }, [tickerData?.lastPrice, selectedCrypto, simulatorProfile?.openPositions]);
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const riskAmount = tickerData?.lastPrice > 0 && tradeLevels.stopLoss > 0 ? (tickerData?.lastPrice - tradeLevels.stopLoss) * quantity : 0;
  const rewardAmount = tickerData?.lastPrice > 0 && tradeLevels.takeProfit > 0 ? (tradeLevels.takeProfit - tickerData?.lastPrice) * quantity : 0;

  const estimatedCostUSDT = quantity * tickerData?.lastPrice;
  const isBrlPair = selectedCrypto.endsWith('BRL');
  const estimatedCostBRL = isBrlPair 
    ? estimatedCostUSDT 
    : estimatedCostUSDT * usdtToBrlRate;
  
  // Calculate Risk and Reward in BRL correctly
  const riskAmountBRL = isBrlPair 
      ? riskAmount 
      : riskAmount * usdtToBrlRate;
      
  const rewardAmountBRL = isBrlPair 
      ? rewardAmount 
      : rewardAmount * usdtToBrlRate;


  // --- MANIPULADORES ---
  const handleCryptoSelect = (symbol: string) => {
    setSelectedCrypto(symbol);
    setTradeLevels({ entry: 0, stopLoss: 0, takeProfit: 0 });
    setProspectiveAlert(null); // Clear prospective alert when changing crypto
    defaultsAppliedRef.current = false; // Permite reaplicar os padrões
  };

  const handleSimulatorSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!tickerData?.lastPrice) {
      toast.error('Preço de entrada não disponível. Verifique sua conexão.');
      return;
    }
    createSimulatorTradeMutation.mutate({ 
      symbol: selectedCrypto, 
      quantity, 
      type: 'BUY', 
      entryPrice: tickerData?.lastPrice, 
      stopLoss: tradeLevels.stopLoss, 
      takeProfit: tradeLevels.takeProfit, 
      marketType 
    });
  };
  
  const handleStartCreateAlert = () => {
    if (tickerData?.lastPrice > 0) {
      setProspectiveAlert({ price: tickerData?.lastPrice });
    } else {
      toast.error('Aguarde o carregamento do preço para criar um alerta.');
    }
  };

  const handleSaveAlert = () => {
    if (prospectiveAlert) {
      createAlertMutation.mutate({
        type: AlertType.PRICE,
        config: {
          symbol: selectedCrypto,
          targetPrice: prospectiveAlert.price,
          operator: 'gt',
        },
      });
    }
  };

  const handleCancelCreateAlert = () => {
    setProspectiveAlert(null);
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
    } catch (error: any) {
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
            price={tickerData ? parseFloat(tickerData.lastPrice) : 0}
            open={tickerData ? parseFloat(tickerData.openPrice) : 0}
            high={tickerData ? parseFloat(tickerData.highPrice) : 0}
            low={tickerData ? parseFloat(tickerData.lowPrice) : 0}
        />
        {(isTickerError || isErrorKlines) && (
          <div className={styles.errorMessage} style={{ color: 'red', margin: '1rem' }}>
            Aviso: Falha ao carregar dados em tempo real da Binance. Tentando reconectar... 
            <br />
            {tickerError?.message || klinesError?.message}
          </div>
        )}
        <div className={styles.chartWrapper}>
            <SimulatorChart
                key={selectedCrypto}
                symbol={selectedCrypto}
                marketType={marketType}
                tradeLevels={tradeLevels}
                onLevelsChange={setTradeLevels}
                tipoOperacao="compra"
                initialChartData={chartData}
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
                        currentPrice={priceMap?.get(position.symbol) || 0}
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
                <DecimalInput 
                  id="quantity" 
                  value={quantity} 
                  onChange={setQuantity} 
                  className={styles.input} 
                  required 
                />
                {quantity > 0 && tickerData?.lastPrice > 0 && (
                  <p className={styles.riskInfo}>Custo Total: {formatCurrency(estimatedCostBRL)}</p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="stopLoss">Stop Loss</label>
                <DecimalInput 
                  id="stopLoss" 
                  value={tradeLevels.stopLoss} 
                  onChange={(val) => setTradeLevels(prev => ({...prev, stopLoss: val}))}
                  className={styles.input} 
                />
                  {riskAmount > 0 && (
                    <p className={styles.riskInfo}>Risco Estimado: {formatCurrency(riskAmountBRL)}</p>
                  )}
              </div>
                <div className={styles.formGroup}>
                <label htmlFor="takeProfit">Take Profit</label>
                <DecimalInput 
                  id="takeProfit" 
                  value={tradeLevels.takeProfit} 
                  onChange={(val) => setTradeLevels(prev => ({...prev, takeProfit: val}))}
                  className={styles.input} 
                />
                {rewardAmount > 0 && (
                  <p className={styles.rewardInfo}>Ganho Potencial: {formatCurrency(rewardAmountBRL)}</p>
                )}
              </div>
              <button type="submit" className={styles.submitButton} disabled={createSimulatorTradeMutation.isPending || !tickerData?.lastPrice}>
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
          theme="light"
      />
      
      {journalTradeId && (
        <TradeJournalModal 
          isOpen={isJournalModalOpen}
          onClose={() => {
            setIsJournalModalOpen(false);
            setJournalTradeId(null);
          }}
          tradeType="spot"
          tradeId={journalTradeId}
        />
      )}
    </div>
  );
};

export default Simulator;