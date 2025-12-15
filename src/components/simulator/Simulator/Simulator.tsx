// ... (imports)
import { useSession } from 'next-auth/react';

// ... (type definitions e api fetching functions)

const Simulator = () => {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const isPremiumUser = session?.user?.subscriptionStatus === 'authorized';

  // --- STATE MANAGEMENT ---
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTCBRL');
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [interval, setInterval] = useState("1m");
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [quantity, setQuantity] = useState(0.01);
  const [closingTradeIds, setClosingTradeIds] = useState(new Set<string>());
  const [watchedSymbols, setWatchedSymbols] = useState(['BTCBRL', 'ETHBRL', 'SOLBRL', 'ADABRL', 'DOGEBRL', 'SHIBBRL', 'BNBBRL']);
  const [newSymbol, setNewSymbol] = useState('');

  // --- DATA FETCHING & MUTATIONS ---
  const { data: simulatorProfile, isLoading: isLoadingSimulator } = useQuery<SimulatorProfile, Error>({
    queryKey: ['simulatorProfile'],
    queryFn: fetchSimulatorProfile,
    enabled: isPremiumUser,
  });

  const { data: currentPriceData } = useQuery<CurrentPrice, Error>({
      queryKey: ['currentPrice', selectedCrypto],
      queryFn: () => fetchCurrentPrice(selectedCrypto),
      refetchInterval: 5000,
      enabled: isPremiumUser && !(marketType === 'futures' && selectedCrypto.endsWith('BRL')),
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
    enabled: isPremiumUser,
    closingTradeIds,
    onAddToClosingTradeIds: (tradeId: string) => setClosingTradeIds(prev => new Set(prev).add(tradeId)),
  });

  const { realtimeChartUpdate } = useRealtimeChartUpdate({
    symbol: selectedCrypto,
    interval,
    marketType,
    enabled: isPremiumUser,
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

  useEffect(() => {
    if (!simulatorProfile?.openTrades) return;
    const hasOpenTradesForSelectedSymbol = simulatorProfile.openTrades.some(trade => trade.symbol === selectedCrypto);
    if (!hasOpenTradesForSelectedSymbol && !isConfiguring) {
      setIsConfiguring(true);
    }
    if (hasOpenTradesForSelectedSymbol && isConfiguring) {
      setIsConfiguring(false);
    }
  }, [simulatorProfile?.openTrades, selectedCrypto, isConfiguring]);

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
  
  // --- RENDER LOGIC ---
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