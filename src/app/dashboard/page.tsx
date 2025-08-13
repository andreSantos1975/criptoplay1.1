"use client";

import { useState } from "react";
import { KPICard } from "@/components/dashboard/KPICard/KPICard";
import { NavigationTabs } from "@/components/dashboard/NavigationTabs/NavigationTabs";
import { PersonalFinanceTable } from "@/components/dashboard/PersonalFinanceTable/PersonalFinanceTable";
import dynamic from "next/dynamic";

const TechnicalAnalysisChart = dynamic(
  () => import("@/components/dashboard/TechnicalAnalysisChart/TechnicalAnalysisChart").then(mod => mod.TechnicalAnalysisChart),
  { ssr: false }
);
import { ReportsSection } from "@/components/dashboard/ReportsSection/ReportsSection";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview/DashboardOverview";
import styles from "./dashboard.module.css";

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("painel");

  const renderTabContent = () => {
    switch (activeTab) {
      case "painel":
        return <DashboardOverview />;
      case "pessoal":
        return <PersonalFinanceTable />;
      case "analise":
        return <TechnicalAnalysisChart />;
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
          <KPICard
            title="Quantidade de Operações"
            value="152"
          />
          <KPICard
            title="Lucro/Prejuízo Total"
            value="+R$ 12.530,00"
            isPositive
          />
          <KPICard
            title="Aportes Realizados"
            value="R$ 25.000,00"
          />
          <KPICard
            title="Saldo Atual"
            value="R$ 37.530,00"
            isPositive
          />
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
