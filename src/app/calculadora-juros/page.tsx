'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from './calculadora.module.css';

const CalculadoraJurosPage = () => {
  const [initialAmount, setInitialAmount] = useState(1000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [interestRate, setInterestRate] = useState(10); // Anual
  const [years, setYears] = useState(10);

  const projectionData = useMemo(() => {
    // Sanitização para garantir números válidos
    const principal = isNaN(initialAmount) ? 0 : initialAmount;
    const contribution = isNaN(monthlyContribution) ? 0 : monthlyContribution;
    const rate = isNaN(interestRate) ? 0 : interestRate;
    const period = isNaN(years) ? 0 : years;

    const data = [];
    let currentBalance = principal;
    let totalInvested = principal;
    const monthlyRate = rate / 100 / 12;
    const totalMonths = period * 12;

    for (let month = 0; month <= totalMonths; month++) {
      if (month > 0) {
        currentBalance = (currentBalance + contribution) * (1 + monthlyRate);
        totalInvested += contribution;
      }

      // Adicionar ponto no gráfico a cada ano (ou mês 0) e no último mês
      if (month % 12 === 0 || month === totalMonths) {
        // Evita duplicar o último ponto se ele cair exatamente num múltiplo de 12 (exceto mês 0)
        const isDuplicate = month === totalMonths && month % 12 === 0 && month !== 0;
        
        if (!isDuplicate) {
          data.push({
            year: `Ano ${(month / 12).toFixed(1).replace('.0', '')}`,
            investido: Math.round(totalInvested),
            juros: Math.round(currentBalance - totalInvested),
            total: Math.round(currentBalance),
          });
        }
      }
    }
    return data;
  }, [initialAmount, monthlyContribution, interestRate, years]);

  const summary = useMemo(() => {
    if (projectionData.length === 0) return { total: 0, invested: 0, interest: 0 };
    const lastPoint = projectionData[projectionData.length - 1];
    return {
      total: lastPoint.total,
      invested: lastPoint.investido, // Corrigido: 'invested' -> 'investido'
      interest: lastPoint.juros,
    };
  }, [projectionData]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className={styles.container}>
      <Link href="/dashboard?tab=pessoal" className={styles.backLink}>← Voltar para Dashboard</Link>
      
      <header className={styles.header}>
        <h1 className={styles.title}>Calculadora de Juros Compostos</h1>
        <p className={styles.subtitle}>Simule o crescimento do seu patrimônio ao longo do tempo.</p>
      </header>

      <div className={styles.contentGrid}>
        {/* Formulário */}
        <div className={styles.formCard}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Aporte Inicial (R$)</label>
            <input 
              type="number" 
              className={styles.input} 
              value={initialAmount} 
              onChange={(e) => setInitialAmount(Number(e.target.value))} 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Aporte Mensal (R$)</label>
            <input 
              type="number" 
              className={styles.input} 
              value={monthlyContribution} 
              onChange={(e) => setMonthlyContribution(Number(e.target.value))} 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Taxa de Juros Anual (%)</label>
            <input 
              type="number" 
              className={styles.input} 
              value={interestRate} 
              onChange={(e) => setInterestRate(Number(e.target.value))} 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Período (Anos)</label>
            <input 
              type="number" 
              className={styles.input} 
              value={years} 
              onChange={(e) => setYears(Number(e.target.value))} 
            />
          </div>
        </div>

        {/* Resultados */}
        <div className={styles.resultsSection}>
          <div className={styles.cardsGrid}>
            <div className={styles.resultCard}>
              <div className={styles.cardLabel}>Valor Total Final</div>
              <div className={`${styles.cardValue} ${styles.highlightGreen}`}>
                {formatCurrency(summary.total)}
              </div>
            </div>
            <div className={styles.resultCard}>
              <div className={styles.cardLabel}>Total Investido</div>
              <div className={styles.cardValue}>
                {formatCurrency(summary.invested)}
              </div>
            </div>
            <div className={styles.resultCard}>
              <div className={styles.cardLabel}>Total em Juros</div>
              <div className={`${styles.cardValue} ${styles.highlightBlue}`}>
                {formatCurrency(summary.interest)}
              </div>
            </div>
          </div>

          <div className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#71717a" />
                <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} stroke="#71717a" />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Patrimônio Total" 
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="investido" 
                  name="Valor Investido" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorInvestido)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraJurosPage;
