"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './TradeJournal.module.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Interface para os dados do formulário (simplificada)
interface TradeFormData {
  ativo: string;
  tipoOperacao: 'compra' | 'venda' | '';
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
}

const TradeJournal = ({ tradeLevels, selectedCrypto }: TradeJournalProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('operacao');
  const [tradeData, setTradeData] = useState<TradeFormData>({
    ativo: selectedCrypto || '',
    tipoOperacao: '',
    precoEntrada: '',
    quantidade: '',
    stopLoss: '',
    takeProfit: '',
    observacoes: '',
  });

  const formatNumber = (num: number): string => {
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  useEffect(() => {
    if (tradeLevels) {
      setTradeData(prev => ({
        ...prev,
        ativo: selectedCrypto,
        precoEntrada: formatNumber(tradeLevels.entry),
        takeProfit: formatNumber(tradeLevels.takeProfit),
        stopLoss: formatNumber(tradeLevels.stopLoss),
      }));
    }
  }, [tradeLevels, selectedCrypto]);

  const parseNumericValue = (value: string): number => {
    if (!value) return 0;
    const cleanedValue = value.replace(/\./g, '').replace(/,/g, '.');
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
      alert('Operação aberta com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['trades'] }); 
      // Opcional: Limpar o formulário aqui
    },
    onError: (error: Error) => {
      console.error("Erro ao abrir operação:", error);
      alert(`Erro: ${error.message}`);
    },
  });

  const handleOpenOperation = () => {
    if (!tradeData.ativo || !tradeData.tipoOperacao || !tradeData.precoEntrada || !tradeData.quantidade) {
        alert("Preencha os campos obrigatórios: Ativo, Tipo, Preço e Quantidade.");
        return;
    }

    const payload: OpenTradePayload = {
      symbol: tradeData.ativo,
      type: tradeData.tipoOperacao,
      entryDate: new Date().toISOString(), // Captura a data e hora exatas do clique
      entryPrice: parseNumericValue(tradeData.precoEntrada),
      quantity: parseNumericValue(tradeData.quantidade),
      stopLoss: parseNumericValue(tradeData.stopLoss),
      takeProfit: parseNumericValue(tradeData.takeProfit),
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
                                        <select id="tipo" className={styles.select} value={tradeData.tipoOperacao} onChange={(e) => updateTradeData('tipoOperacao', e.target.value as TradeFormData['tipoOperacao'])}>
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
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className={styles.cardTitle}>Gestão de Risco</CardTitle></CardHeader>
                            <CardContent>
                                <div className={styles.gridTwoCols}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label} htmlFor="stopLoss">Stop Loss</label>
                                        <input id="stopLoss" type="text" className={styles.input} placeholder="0,00" value={tradeData.stopLoss} onChange={(e) => updateTradeData('stopLoss', e.target.value)} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label} htmlFor="takeProfit">Take Profit</label>
                                        <input id="takeProfit" type="text" className={styles.input} placeholder="0,00" value={tradeData.takeProfit} onChange={(e) => updateTradeData('takeProfit', e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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