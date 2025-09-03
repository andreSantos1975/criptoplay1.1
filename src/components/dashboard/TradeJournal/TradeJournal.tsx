"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import styles from './TradeJournal.module.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Interface para os dados do formulário (simplificada)
interface TradeFormData {
  ativo: string;
  precoEntrada: string;
  quantidade: string;
  stopLoss: string;
  takeProfit: string;
  observacoes: string;
}

// Interface para os dados enviados para a API (Payload para abrir trade)
interface OpenTradePayload {
  symbol: string;
  type: string;
  entryDate: string; // Agora capturada no momento do clique
  entryPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  notes?: string;
}

interface TradeJournalProps {
  tradeLevels: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
  };
  selectedCrypto: string;
  tipoOperacao: 'compra' | 'venda' | '';
  onTipoOperacaoChange: (value: 'compra' | 'venda' | '') => void;
}

const TradeJournal = ({ 
  tradeLevels, 
  selectedCrypto,
  tipoOperacao,
  onTipoOperacaoChange,
}: TradeJournalProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('operacao');
  const [tradeData, setTradeData] = useState<Omit<TradeFormData, 'tipoOperacao'>>({
    ativo: selectedCrypto || '',
    precoEntrada: '',
    quantidade: '',
    stopLoss: '',
    takeProfit: '',
    observacoes: '',
  });

  const [tradeCostInBRL, setTradeCostInBRL] = useState<number | null>(null);
  const [potentialLoss, setPotentialLoss] = useState<number | null>(null);
  const [potentialProfit, setPotentialProfit] = useState<number | null>(null);

  const formatNumber = (num: number) => {
    if (isNaN(num)) return '';
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    return num.toLocaleString('pt-BR', options);
  };

  const formatCurrencyBRL = (num: number): string => {
    if (isNaN(num) || num === null) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const { data: usdtToBrlData, isLoading: usdtToBrlLoading, error: usdtToBrlError } = useQuery({
    queryKey: ['usdtToBrlRate'],
    queryFn: async () => {
      const response = await fetch('/api/exchange-rate');
      if (!response.ok) {
        throw new Error('Failed to fetch USDT to BRL rate');
      }
      const data = await response.json();
      return data.usdtToBrl;
    },
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes
    refetchOnWindowFocus: false, // Do not refetch on window focus
  });

  useEffect(() => {
    if (tradeLevels && usdtToBrlData) {
      const brlRate = usdtToBrlData || 1;
      setTradeData(prev => ({
        ...prev,
        ativo: selectedCrypto,
        precoEntrada: tradeLevels.entry > 0 ? formatNumber(tradeLevels.entry * brlRate) : '',
        takeProfit: tradeLevels.takeProfit > 0 ? formatNumber(tradeLevels.takeProfit * brlRate) : '',
        stopLoss: tradeLevels.stopLoss > 0 ? formatNumber(tradeLevels.stopLoss * brlRate) : '',
      }));
    }
  }, [tradeLevels, selectedCrypto, usdtToBrlData]);

  useEffect(() => {
    const entryPrice = parseNumericValue(tradeData.precoEntrada);
    const quantity = parseQuantity(tradeData.quantidade);

    if (entryPrice > 0 && quantity > 0) {
      const cost = entryPrice * quantity;
      setTradeCostInBRL(cost);
    } else {
      setTradeCostInBRL(null);
    }
  }, [tradeData.precoEntrada, tradeData.quantidade]);

  useEffect(() => {
    const entryPrice = parseNumericValue(tradeData.precoEntrada);
    const quantity = parseQuantity(tradeData.quantidade);
    const stopLossPrice = parseNumericValue(tradeData.stopLoss);
    const takeProfitPrice = parseNumericValue(tradeData.takeProfit);

    if (tipoOperacao === 'compra' && entryPrice > 0 && quantity > 0 && stopLossPrice > 0) {
      const loss = (stopLossPrice - entryPrice) * quantity;
      setPotentialLoss(loss);
    } else {
      setPotentialLoss(null);
    }

    if (tipoOperacao === 'compra' && entryPrice > 0 && quantity > 0 && takeProfitPrice > 0) {
      const profit = (takeProfitPrice - entryPrice) * quantity;
      setPotentialProfit(profit);
    } else {
      setPotentialProfit(null);
    }
  }, [tradeData.precoEntrada, tradeData.quantidade, tradeData.stopLoss, tradeData.takeProfit, tipoOperacao]);

  const parseQuantity = (value: string): number => {
    if (!value) return 0;
    const cleanedValue = value.replace(',', '.');
    return parseFloat(cleanedValue) || 0;
  };

  const parseNumericValue = (value: string): number => {
    if (!value) return 0;
    // Remove thousand separators (.) and replace decimal separator (,) with a dot.
    const cleanedValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanedValue) || 0;
  };

  const createTradeMutation = useMutation({
    mutationFn: async (newTrade: OpenTradePayload) => {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrade),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao abrir a operação.');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Operação aberta com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['trades'] }); 
      // Opcional: Limpar o formulário aqui
    },
    onError: (error: Error) => {
      console.error("Erro ao abrir operação:", error);
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleOpenOperation = () => {
    if (!tradeData.ativo || !tipoOperacao || !tradeData.precoEntrada || !tradeData.quantidade) {
        toast.error("Preencha os campos obrigatórios: Ativo, Tipo, Preço e Quantidade.");
        return;
    }

    const brlRate = usdtToBrlData || 1;

    const payload: OpenTradePayload = {
      symbol: tradeData.ativo,
      type: tipoOperacao,
      entryDate: new Date().toISOString(),
      entryPrice: parseNumericValue(tradeData.precoEntrada) / brlRate,
      quantity: parseQuantity(tradeData.quantidade),
      stopLoss: parseNumericValue(tradeData.stopLoss) / brlRate,
      takeProfit: parseNumericValue(tradeData.takeProfit) / brlRate,
      notes: tradeData.observacoes,
    };
    
    createTradeMutation.mutate(payload);
  };

  const updateTradeData = (field: keyof TradeFormData, value: string) => {
    setTradeData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.container}>
        <div className={styles.header}>
            <div>
                <h1 className={styles.h1}>Diário de Trading</h1>
                <p>Registre uma nova operação</p>
            </div>
            <div className={styles.headerActions}>
                <Button onClick={handleOpenOperation} disabled={createTradeMutation.isPending} className={`${styles.button} ${styles.buttonPrimary}`}>
                    {createTradeMutation.isPending ? 'Abrindo...' : 'Abrir Operação'}
                </Button>
            </div>
        </div>

        <div className={styles.gridContainer}>
            <div className={styles.formSection}>
                <div className={styles.tabs}>
                    <div className={`${styles.tab} ${activeTab === 'operacao' ? styles.tabActive : ''}`} onClick={() => setActiveTab('operacao')}>Dados da Operação</div>
                    <div className={`${styles.tab} ${activeTab === 'analise' ? styles.tabActive : ''}`} onClick={() => setActiveTab('analise')}>Análise</div>
                </div>

                {activeTab === 'operacao' && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                        <Card>
                            <CardHeader><CardTitle className={styles.cardTitle}>Dados da Operação</CardTitle></CardHeader>
                            <CardContent>
                                <div className={styles.gridTwoCols}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label} htmlFor="ativo">Ativo / Par</label>
                                        <input id="ativo" className={styles.input} placeholder="Ex: BTC/USDT" value={tradeData.ativo} onChange={(e) => updateTradeData('ativo', e.target.value)} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label} htmlFor="tipo">Tipo da Operação</label>
                                        <select id="tipo" className={styles.select} value={tipoOperacao} onChange={(e) => onTipoOperacaoChange(e.target.value as 'compra' | 'venda' | '')}>
                                            <option value="">Selecione o tipo</option>
                                            <option value="compra">Compra</option>
                                            <option value="venda">Venda</option>
                                        </select>
                                    </div>
                                </div>
                                {/* Removido o campo Data de Entrada */}
                                <div className={styles.gridThreeCols}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label} htmlFor="precoEntrada">Preço de Entrada</label>
                                        <input id="precoEntrada" type="text" className={styles.input} placeholder="0,00" value={tradeData.precoEntrada} onChange={(e) => updateTradeData('precoEntrada', e.target.value)} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label} htmlFor="quantidade">Quantidade</label>
                                        <input id="quantidade" type="text" className={styles.input} placeholder="0" value={tradeData.quantidade} onChange={(e) => updateTradeData('quantidade', e.target.value)} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Custo Total (BRL)</label>
                                        <input type="text" className={styles.input} value={usdtToBrlLoading ? 'Carregando...' : usdtToBrlError ? 'Erro ao carregar taxa' : (tradeCostInBRL !== null ? formatCurrencyBRL(tradeCostInBRL) : 'R$ 0,00')} readOnly />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {tradeData.tipoOperacao === 'compra' && (
                        <Card>
                            <CardHeader><CardTitle className={styles.cardTitle}>Gestão de Risco</CardTitle></CardHeader>
                            <CardContent>
                                <div className={styles.gridTwoCols}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label} htmlFor="stopLoss">Stop Loss (Preço)</label>
                                        <input id="stopLoss" type="text" className={styles.input} placeholder="0,00" value={tradeData.stopLoss} onChange={(e) => updateTradeData('stopLoss', e.target.value)} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label} htmlFor="takeProfit">Take Profit (Preço)</label>
                                        <input id="takeProfit" type="text" className={styles.input} placeholder="0,00" value={tradeData.takeProfit} onChange={(e) => updateTradeData('takeProfit', e.target.value)} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Perda Potencial (BRL)</label>
                                        <input type="text" className={`${styles.input} ${potentialLoss !== null && potentialLoss < 0 ? styles.textLoss : ''}`} value={potentialLoss !== null ? formatCurrencyBRL(potentialLoss) : 'R$ 0,00'} readOnly />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Lucro Potencial (BRL)</label>
                                        <input type="text" className={`${styles.input} ${potentialProfit !== null && potentialProfit > 0 ? styles.textProfit : ''}`} value={potentialProfit !== null ? formatCurrencyBRL(potentialProfit) : 'R$ 0,00'} readOnly />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        )}
                    </div>
                )}

                {activeTab === 'analise' && (
                    <Card>
                        <CardHeader><CardTitle className={styles.cardTitle}>Análise e Observações</CardTitle></CardHeader>
                        <CardContent>
                            <div className={styles.inputGroup}>
                                <label className={styles.label} htmlFor="observacoes">Observações</label>
                                <textarea id="observacoes" rows={4} className={styles.textarea} placeholder="Descreva a estratégia, motivos da entrada, etc..." value={tradeData.observacoes} onChange={(e) => updateTradeData('observacoes', e.target.value)}></textarea>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className={styles.summarySection}>
                {/* A seção de resumo pode ser simplificada ou removida, pois os cálculos de P&L só fazem sentido após o fechamento */}
                <Card>
                    <CardHeader>
                        <CardTitle className={styles.cardTitle}>Resumo da Entrada</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        </div>
    </div>
  );
};

export default TradeJournal;