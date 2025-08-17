"use client";

import { useState, useEffect } from "react";
import { KPICard } from "@/components/dashboard/KPICard/KPICard";
import { NavigationTabs } from "@/components/dashboard/NavigationTabs/NavigationTabs";
import { PersonalFinanceTable } from "@/components/dashboard/PersonalFinanceTable/PersonalFinanceTable";
import { RecentOperationsTable } from "@/components/dashboard/RecentOperationsTable/RecentOperationsTable"; // Importando o novo componente
import dynamic from "next/dynamic";
import TradeJournal from "@/components/dashboard/TradeJournal/TradeJournal";
import AssetHeader from "@/components/dashboard/AssetHeader/AssetHeader";

const TechnicalAnalysisChart = dynamic(
  () =>
    import("@/components/dashboard/TechnicalAnalysisChart/TechnicalAnalysisChart").then(
      (mod) => mod.TechnicalAnalysisChart
    ),
  { ssr: false }
);
import { ReportsSection } from "@/components/dashboard/ReportsSection/ReportsSection";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview/DashboardOverview";
import styles from "./dashboard.module.css";

type BinanceKline = [
  number, // Open time
  string, // Open
  string, // High
  string, // Low
  string, // Close
  string, // Volume
  number, // Close time
  string, // Quote asset volume
  number, // Number of trades
  string, // Taker buy base asset volume
  string, // Taker buy quote asset volume
  string, // Ignore
];

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("painel");
  const [klines, setKlines] = useState<BinanceKline[]>([]);
  
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTCUSDT');
  const [tradeLevels, setTradeLevels] = useState(() => {
    const savedLevels = typeof window !== 'undefined' ? localStorage.getItem('tradeLevels') : null;
    return savedLevels ? JSON.parse(savedLevels) : {
      entry: 65500,
      takeProfit: 68000,
      stopLoss: 64000,
    };
  });

  useEffect(() => {
    const fetchAndSetInitialLevels = async () => {
      try {
        const response = await fetch(`/api/binance/klines?symbol=${selectedCrypto}&interval=1d`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setKlines(data);
        if (data && data.length > 0) {
          const lastPrice = parseFloat(data[data.length - 1][4]);
          const newLevels = {
            entry: lastPrice,
            takeProfit: lastPrice * 1.02,
            stopLoss: lastPrice * 0.98,
          };
          setTradeLevels(newLevels);
        }
      } catch (error) {
        console.error("Failed to fetch initial crypto price:", error);
      }
    };

    fetchAndSetInitialLevels();
  }, [selectedCrypto]);

  useEffect(() => {
    localStorage.setItem('tradeLevels', JSON.stringify(tradeLevels));
  }, [tradeLevels]);

  const handleCryptoSelect = (symbol: string) => {
    setSelectedCrypto(symbol);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "painel":
        return (
          <>
            <DashboardOverview />
            <div style={{ marginTop: '2rem' }}>
              <RecentOperationsTable />
            </div>
          </>
        );
      case "pessoal":
        return <PersonalFinanceTable />;
      case "analise":
        const latestKline = klines && klines.length > 0 ? klines[klines.length - 1] : null;
        return (
          <>
            {latestKline && (
              <AssetHeader
                symbol={selectedCrypto}
                price={parseFloat(latestKline[4])}
                open={parseFloat(latestKline[1])}
                high={parseFloat(latestKline[2])}
                low={parseFloat(latestKline[3])}
              />
            )}
            <TechnicalAnalysisChart
              tradeLevels={tradeLevels}
              onLevelsChange={setTradeLevels}
              selectedCrypto={selectedCrypto}
              onCryptoSelect={handleCryptoSelect}
            >
              <TradeJournal tradeLevels={tradeLevels} selectedCrypto={selectedCrypto} />
            </TechnicalAnalysisChart>
          </>
        );
      case "relatorios":
        return <ReportsSection />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            Bem-vindo à sua plataforma de gestão de trades
          </h1>
          <p className={styles.subtitle}>
            Acompanhe seus resultados, operações e aportes em tempo real
          </p>
        </header>

        <section className={styles.kpiGrid}>
          {/* ... KPICards ... */}
        </section>

        <div className={styles.tabs}>
          <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <section className={styles.tabContent}>
          {renderTabContent()}
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;