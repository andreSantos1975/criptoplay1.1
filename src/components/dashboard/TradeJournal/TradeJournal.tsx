import { useState, useEffect } from 'react';
import styles from './TradeJournal.module.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TradeData {
  ativo: string;
  tipoOperacao: 'compra' | 'venda' | 'long' | 'short' | '';
  dataEntrada: string;
  dataSaida: string;
  precoEntrada: string;
  precoSaida: string;
  quantidade: string;
  stopLoss: string;
  takeProfit: string;
  estrategia: string;
  observacoes: string;
  taxas: string;
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
  const [activeTab, setActiveTab] = useState('operacao');
  const [tradeData, setTradeData] = useState<TradeData>({
    ativo: selectedCrypto || '',
    tipoOperacao: '',
    dataEntrada: '',
    dataSaida: '',
    precoEntrada: '',
    precoSaida: '',
    quantidade: '',
    stopLoss: '',
    takeProfit: '',
    estrategia: '',
    observacoes: '',
    taxas: '',
  });

  const [calculations, setCalculations] = useState({
    percentualVariacao: 0,
    rrr: 0,
    lucroOuPrejuizo: 0,
    saldoConta: 10000, // Saldo inicial fictício
  });

  const formatNumber = (num: number): string => {
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2,
    };
    if (num >= 1000) {
      options.maximumFractionDigits = 2;
    } else if (num >= 1) {
      options.maximumFractionDigits = 4;
    } else if (num >= 0.01) {
      options.maximumFractionDigits = 6;
    } else {
      options.maximumFractionDigits = 8;
    }
    return num.toLocaleString('pt-BR', options);
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

  useEffect(() => {
    const precoEntrada = parseFloat(tradeData.precoEntrada) || 0;
    const precoSaida = parseFloat(tradeData.precoSaida) || 0;
    const quantidade = parseFloat(tradeData.quantidade) || 0;
    const taxas = parseFloat(tradeData.taxas) || 0;

    let lucroOuPrejuizo = 0;
    let percentualVariacao = 0;

    if (precoEntrada > 0 && quantidade > 0 && precoSaida > 0) {
      if (tradeData.tipoOperacao === 'compra' || tradeData.tipoOperacao === 'long') {
        lucroOuPrejuizo = (precoSaida - precoEntrada) * quantidade - taxas;
        percentualVariacao = (lucroOuPrejuizo / (precoEntrada * quantidade)) * 100;
      } else if (tradeData.tipoOperacao === 'venda' || tradeData.tipoOperacao === 'short') {
        lucroOuPrejuizo = (precoEntrada - precoSaida) * quantidade - taxas;
        percentualVariacao = (lucroOuPrejuizo / (precoEntrada * quantidade)) * 100;
      }
    }

    const stopLoss = parseFloat(tradeData.stopLoss) || 0;
    const takeProfit = parseFloat(tradeData.takeProfit) || 0;
    let rrr = 0;

    if (stopLoss > 0 && takeProfit > 0 && precoEntrada > 0) {
      const risco = Math.abs(precoEntrada - stopLoss);
      const retorno = Math.abs(takeProfit - precoEntrada);
      rrr = risco > 0 ? retorno / risco : 0;
    }

    setCalculations({
      percentualVariacao,
      rrr,
      lucroOuPrejuizo,
      saldoConta: 10000 + lucroOuPrejuizo,
    });
  }, [tradeData]);

  const updateTradeData = (field: keyof TradeData, value: any) => {
    setTradeData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumericInputChange = (field: keyof TradeData, value: string) => {
    const cleanedValue = value.replace(/\./g, '').replace(/,/g, '.');
    const parsedValue = parseFloat(cleanedValue);
    updateTradeData(field, isNaN(parsedValue) ? '' : parsedValue.toString());
  };

  const handleSaveOperation = async () => {
    console.log(`Buscando preço de fechamento para ${selectedCrypto}...`);
    try {
      const response = await fetch(`/api/binance/klines?symbol=${selectedCrypto}&interval=1m&limit=1`);
      if (!response.ok) {
        throw new Error("Falha ao buscar o preço atual do ativo.");
      }
      const data = await response.json();
      if (data && data.length > 0) {
        const currentPrice = parseFloat(data[0][4]);
        const currentDate = new Date().toISOString().split('T')[0];

        const updatedData = {
          ...tradeData,
          precoSaida: formatNumber(currentPrice),
          dataSaida: currentDate,
        };
        
        setTradeData(updatedData);
        console.log("Operação atualizada com preço de saída. Pronta para salvar:", updatedData);
        alert(`Operação para ${selectedCrypto} atualizada com preço de saída: ${formatNumber(currentPrice)}`);
      } else {
        throw new Error("API não retornou dados para o ativo.");
      }
    } catch (error) {
      console.error("Erro ao salvar operação:", error);
      alert(error instanceof Error ? error.message : "Ocorreu um erro desconhecido.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Diário de Trading</h1>
          <p>Registre e acompanhe suas operações</p>
        </div>
        <div className={styles.headerActions}>
            <Button className={`${styles.button} ${styles.buttonOutline}`}>Duplicar Última</Button>
            <Button className={`${styles.button} ${styles.buttonPrimary}`}>Novo Trade</Button>
        </div>
      </div>

      <div className={styles.gridContainer}>
        <div className={styles.formSection}>
            <div className={styles.tabs}>
                <div className={`${styles.tab} ${activeTab === 'operacao' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('operacao')}>Dados da Operação</div>
                <div className={`${styles.tab} ${activeTab === 'analise' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('analise')}>Análise Profissional</div>
            </div>

            {activeTab === 'operacao' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                    <Card>
                        <CardHeader>
                            <CardTitle className={styles.cardTitle}>Dados da Operação</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={styles.gridTwoCols}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label} htmlFor="ativo">Ativo / Par</label>
                                    <input id="ativo" className={styles.input} placeholder="Ex: BTC/USDT, PETR4" value={tradeData.ativo} onChange={(e) => updateTradeData('ativo', e.target.value)} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label} htmlFor="tipo">Tipo da Operação</label>
                                    <select id="tipo" className={styles.select} value={tradeData.tipoOperacao} onChange={(e) => updateTradeData('tipoOperacao', e.target.value)}>
                                        <option value="">Selecione o tipo</option>
                                        <option value="compra">Compra</option>
                                        <option value="venda">Venda</option>
                                        <option value="long">Long</option>
                                        <option value="short">Short</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.gridTwoCols}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label} htmlFor="dataEntrada">Data de Entrada</label>
                                    <input id="dataEntrada" type="date" className={styles.input} value={tradeData.dataEntrada} onChange={(e) => updateTradeData('dataEntrada', e.target.value)} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label} htmlFor="dataSaida">Data de Saída</label>
                                    <input id="dataSaida" type="date" className={styles.input} value={tradeData.dataSaida} onChange={(e) => updateTradeData('dataSaida', e.target.value)} />
                                </div>
                            </div>
                            <div className={styles.gridThreeCols}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label} htmlFor="precoEntrada">Preço de Entrada</label>
                                    <input id="precoEntrada" type="text" className={styles.input} placeholder="0.00" value={tradeData.precoEntrada} onChange={(e) => handleNumericInputChange('precoEntrada', e.target.value)} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label} htmlFor="precoSaida">Preço de Saída</label>
                                    <input id="precoSaida" type="text" className={styles.input} placeholder="0.00" value={tradeData.precoSaida} onChange={(e) => handleNumericInputChange('precoSaida', e.target.value)} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label} htmlFor="quantidade">Quantidade</label>
                                    <input id="quantidade" type="text" className={styles.input} placeholder="0" value={tradeData.quantidade} onChange={(e) => handleNumericInputChange('quantidade', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className={styles.cardTitle}>Gestão de Risco</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={styles.gridTwoCols}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label} htmlFor="stopLoss">Stop Loss</label>
                                    <input id="stopLoss" type="text" className={styles.input} placeholder="0.00" value={tradeData.stopLoss} onChange={(e) => handleNumericInputChange('stopLoss', e.target.value)} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label} htmlFor="takeProfit">Take Profit</label>
                                    <input id="takeProfit" type="text" className={styles.input} placeholder="0.00" value={tradeData.takeProfit} onChange={(e) => handleNumericInputChange('takeProfit', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'analise' && (
                <Card>
                    <CardHeader>
                        <CardTitle className={styles.cardTitle}>Análise Profissional</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="estrategia">Estratégia Utilizada</label>
                            <select id="estrategia" className={styles.select} value={tradeData.estrategia} onChange={(e) => updateTradeData('estrategia', e.target.value)}>
                                <option value="">Selecione a estratégia</option>
                                <option value="price-action">Price Action</option>
                                <option value="rsi">RSI</option>
                                <option value="suporte-resistencia">Suporte/Resistência</option>
                                <option value="medias-moveis">Médias Móveis</option>
                            </select>
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="observacoes">Observações</label>
                            <textarea id="observacoes" rows={4} className={styles.textarea} placeholder="Descreva suas observações..." value={tradeData.observacoes} onChange={(e) => updateTradeData('observacoes', e.target.value)}></textarea>
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="taxas">Taxas / Corretagem</label>
                            <input id="taxas" type="number" className={styles.input} placeholder="R$ 0.00" value={tradeData.taxas} onChange={(e) => updateTradeData('taxas', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

        <div className={styles.summarySection}>
            <Card>
                <CardHeader>
                    <CardTitle className={styles.cardTitle}>Cálculos Automáticos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={styles.summaryItem}>
                        <span>% de Variação</span>
                        <span className={`${styles.badge} ${calculations.percentualVariacao >= 0 ? styles.badgeProfit : styles.badgeLoss}`}>
                            {calculations.percentualVariacao.toFixed(2)}%
                        </span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span>RRR</span>
                        <span>{calculations.rrr > 0 ? `1:${calculations.rrr.toFixed(2)}` : 'N/A'}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span>Lucro/Prejuízo</span>
                        <span className={calculations.lucroOuPrejuizo >= 0 ? styles.textProfit : styles.textLoss}>
                            R$ {calculations.lucroOuPrejuizo.toFixed(2)}
                        </span>
                    </div>
                    <div className={`${styles.summaryItem} ${styles.borderTop}`}>
                        <span>Saldo da Conta</span>
                        <span>R$ {calculations.saldoConta.toFixed(2)}</span>
                    </div>
                </CardContent>
            </Card>
            <Button onClick={handleSaveOperation} className={`${styles.button} ${styles.buttonPrimary}`} style={{width: '100%', padding: '12px'}}>
                Salvar Operação
            </Button>
        </div>
      </div>
    </div>
  );
};

export default TradeJournal;
