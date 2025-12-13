"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import { Trade } from "@prisma/client";

import { SimulatorChart } from '@/components/simulator/SimulatorChart/SimulatorChart';
import AssetHeader from "@/components/dashboard/AssetHeader/AssetHeader";
import { useVigilante } from "@/hooks/useVigilante";
import { useRealtimeChartUpdate } from "@/hooks/useRealtimeChartUpdate";
import { TradeRow } from '@/components/simulator/TradeRow/TradeRow';
import { CryptoList } from "@/components/dashboard/CryptoList/CryptoList";

import styles from './Simulator.module.css';

// --- TYPE DEFINITIONS ---
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
type BinanceKlineData = [
  number, string, string, string, string, string, number,
  string, number, string, string, string
];

// --- API FETCHING FUNCTIONS ---
const fetchSimulatorProfile = async (): Promise<SimulatorProfile> => {
  const res = await fetch('/api/simulator/profile');
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Falha ao buscar dados do perfil do simulador.');
  }
  return res.json();
};

const createSimulatorTrade = async (tradeData: { symbol: string, quantity: number, type: 'BUY', entryPrice: number, stopLoss: number, takeProfit: number }) => {
  const res = await fetch('/api/simulator/trades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tradeData),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Falha ao criar operação de simulação.');
  }
  return res.json();
};

const closeSimulatorTrade = async (tradeId: string) => {
  const res = await fetch(`/api/simulator/trades/${tradeId}/close`, { method: 'POST' });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Falha ao fechar operação de simulação.');
  }
  return res.json();
};

const fetchCurrentPrice = async (symbol: string): Promise<CurrentPrice> => {
    const res = await fetch(`/api/binance/price?symbol=${symbol}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Falha ao buscar preço atual.');
    }
    return res.json();
};

// --- MAIN SIMULATOR COMPONENT ---
const Simulator = () => {
  const queryClient = useQueryClient();

  // --- STATE MANAGEMENT ---
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTCBRL');
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [interval, setInterval] = useState("1m");
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [quantity, setQuantity] = useState(0.01);
  const [closingTradeIds, setClosingTradeIds] = useState(new Set<string>());

  // --- DATA FETCHING & MUTATIONS ---
  const { data: simulatorProfile, isLoading: isLoadingSimulator } = useQuery<SimulatorProfile, Error>({
    queryKey: ['simulatorProfile'],
    queryFn: fetchSimulatorProfile,
  });

  const { data: currentPriceData } = useQuery<CurrentPrice, Error>({
      queryKey: ['currentPrice', selectedCrypto],
      queryFn: () => fetchCurrentPrice(selectedCrypto),
      refetchInterval: 5000,
      enabled: !(marketType === 'futures' && selectedCrypto.endsWith('BRL')),
  });

   const { data: initialChartData, isFetching: isChartLoading } = useQuery({
    queryKey: ["binanceKlines", marketType, interval, selectedCrypto],
    queryFn: async () => {
      const apiPath = marketType === 'futures' ? 'futures-klines' : 'klines';
      const response = await fetch(`/api/binance/${apiPath}?symbol=${selectedCrypto}&interval=${interval}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data: BinanceKlineData[] = await response.json();
      return data.map(k => ({ time: (k[0] / 1000) as any, open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]) }));
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    enabled: !!selectedCrypto,
  });

  const createSimulatorTradeMutation = useMutation({
    mutationFn: createSimulatorTrade,
    onSuccess: () => {
      toast.success('Ordem de simulação aberta com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['simulatorProfile'] });
      setQuantity(0.01);
      setStopLoss(0);
      setTakeProfit(0);
      setIsConfiguring(false);
    },
    onError: (error) => toast.error(`Erro ao abrir ordem: ${error.message}`),
  });

  const closeSimulatorTradeMutation = useMutation<Trade, Error, string>({
    mutationFn: closeSimulatorTrade,
    onMutate: (tradeId) => setClosingTradeIds(prev => new Set(prev).add(tradeId)),
    onSuccess: (data) => toast.success(`Ordem simulada para ${data.symbol} fechada!`),
    onError: (error) => toast.error(`Erro ao fechar ordem: ${error.message}`),
    onSettled: (data, error, tradeId) => {
      setClosingTradeIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tradeId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['simulatorProfile'] });
    },
  });

  // --- HOOKS ---
  useVigilante({
    openTrades: simulatorProfile?.openTrades,
    closeMutation: closeSimulatorTradeMutation,
    enabled: true, // Always enabled within the simulator component
    closingTradeIds,
    onAddToClosingTradeIds: (tradeId: string) => setClosingTradeIds(prev => new Set(prev).add(tradeId)),
  });

  const { realtimeChartUpdate } = useRealtimeChartUpdate({
    symbol: selectedCrypto,
    interval,
    marketType,
    enabled: true, // Always enabled
  });

  // --- MEMOIZED CALCULATIONS & EFFECTS ---
  const entryPrice = currentPriceData ? parseFloat(currentPriceData.price) : 0;
  const tradeLevelsForChart: TradeLevels = isConfiguring ? { entry: entryPrice, stopLoss, takeProfit } : { entry: 0, stopLoss: 0, takeProfit: 0 };
  
  const assetHeaderData = useMemo(() => {
    if (!initialChartData || initialChartData.length === 0) return { open: 0, high: 0, low: 0, close: 0, time: 0 };
    const lastCandle = initialChartData[initialChartData.length - 1];
    return {
        ...lastCandle,
        close: realtimeChartUpdate?.close || lastCandle.close,
    };
  }, [initialChartData, realtimeChartUpdate]);

  useEffect(() => {
    if (isConfiguring && entryPrice > 0 && stopLoss === 0 && takeProfit === 0) {
      const defaultStopLoss = entryPrice * 0.99;
      const defaultTakeProfit = entryPrice * 1.02;
      setStopLoss(defaultStopLoss);
      setTakeProfit(defaultTakeProfit);
    }
  }, [isConfiguring, entryPrice, stopLoss, takeProfit]);

  // --- HANDLERS ---
  const handleCryptoSelect = (symbol: string) => {
    setSelectedCrypto(symbol);
    setStopLoss(0);
    setTakeProfit(0);
    setIsConfiguring(true);
  };

  const handleLevelsChange = (newLevels: TradeLevels) => {
    setStopLoss(newLevels.stopLoss);
    setTakeProfit(newLevels.takeProfit);
    setIsConfiguring(true);
  };
  
  const handleSimulatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryPrice) return;
    createSimulatorTradeMutation.mutate({ symbol: selectedCrypto, quantity, type: 'BUY', entryPrice, stopLoss, takeProfit });
  };
  
  // --- RENDER LOGIC ---
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const riskAmount = entryPrice > 0 && stopLoss > 0 ? (entryPrice - stopLoss) * quantity : 0;
  const rewardAmount = entryPrice > 0 && takeProfit > 0 ? (takeProfit - entryPrice) * quantity : 0;

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
                openTrades={simulatorProfile?.openTrades}
            />
        </div>
      </div>

      <div className={styles.tradesContainer}>
          <h2 className={styles.tradesTitle}>Operações Abertas (Simulador)</h2>
          {isLoadingSimulator ? <p>Carregando...</p> : simulatorProfile && simulatorProfile.openTrades.length > 0 ? (
              <div className={styles.tableWrapper}>
              <table className={styles.table}>
                  <thead><tr><th>Ativo</th><th>Qtd.</th><th>Preço Entrada</th><th>Valor</th><th>Lucro/Prejuízo</th><th>Data</th><th>Ações</th></tr></thead>
                  <tbody>
                  {simulatorProfile.openTrades.map((trade) => (
                      <TradeRow key={trade.id} trade={trade} closeMutation={closeSimulatorTradeMutation} isClosing={closingTradeIds.has(trade.id)} />
                  ))}
                  </tbody>
              </table>
              </div>
          ) : (
              <p>Nenhuma operação aberta no simulador.</p>
          )}
      </div>

      <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Abrir Nova Operação</h2>
          <form onSubmit={handleSimulatorSubmit} className={styles.form}>
              <div className={styles.formGroup}><label>Ativo: {selectedCrypto}</label></div>
              <div className={styles.formGroup}>
                <label htmlFor="quantity">Quantidade</label>
                <input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={styles.input} step="0.001" min="0.001" required />
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
              {createSimulatorTradeMutation.isError && <p style={{ color: 'red', marginTop: '1rem' }}>Erro: {createSimulatorTradeMutation.error.message}</p>}
          </form>
      </div>

      <CryptoList
          watchedSymbols={['BTCBRL', 'ETHBRL', 'SOLBRL', 'ADABRL', 'DOGEBRL', 'SHIBBRL', 'BNBBRL']}
          onCryptoSelect={handleCryptoSelect}
      />
    </div>
  );
};

export default Simulator;