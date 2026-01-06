"use client";

import { useState } from "react";
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Flame,
  ChevronDown,
  BarChart3
} from "lucide-react";
import { MetricCard } from "@/components/ranking/MetricCard";
import { RankingFilters } from "@/components/ranking/RankingFilters";
import { RankingTable } from "@/components/ranking/RankingTable";
import { VisibilityToggle } from "@/components/ranking/VisibilityToggle";
import { CTABanner } from "@/components/ranking/CTABanner";
import { UserPositionCard } from "@/components/ranking/UserPositionCard";
import { RankingPodium } from "@/components/RankingList/RankingPodium"; // Importado
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import styles from "./ranking.module.css";

const PERIOD_OPTIONS = [
  { label: '7 Dias', value: '7d' },
  { label: '30 Dias', value: '30d' },
  { label: '90 Dias', value: '90d' },
  { label: 'Tudo', value: 'all' },
];

const MARKET_OPTIONS = [
  { label: 'Spot', value: 'spot' },
  { label: 'Futuros', value: 'futures' },
  { label: 'Todos', value: 'all' },
];

const SORT_OPTIONS = [
  { label: 'Maior ROI', value: 'roi' },
  { label: 'Maior Lucro', value: 'profit' },
  { label: 'Consistência', value: 'consistency' },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function RankingPage() {
  const { data: session } = useSession();
  
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedMarket, setSelectedMarket] = useState("spot");
  const [selectedSort, setSelectedSort] = useState("roi");
  const [isPublicProfile, setIsPublicProfile] = useState(true);

  // Fetch com parâmetros dinâmicos
  const { data, error, isLoading } = useSWR(
    `/api/ranking?period=${selectedPeriod}&market=${selectedMarket}&sort=${selectedSort}`, 
    fetcher
  );

  // Skeleton Loading Component
  if (isLoading) {
    return (
      <div className={styles.container}>
        <section className={styles.heroSection}>
           <div className="h-48 animate-pulse bg-gray-800/20 rounded-xl mb-8" />
        </section>
        <main className={styles.mainContent}>
          {/* Metrics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
          {/* Filters Skeleton */}
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg mb-8 animate-pulse" />
          {/* Table Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) return <div className="text-center py-20 text-red-500">Falha ao carregar o ranking. Tente novamente mais tarde.</div>;

  const traders = data?.traders || [];
  const top3Traders = traders.slice(0, 3); // Extrair Top 3 para o Pódio
  const currentUserData = data?.currentUser || null;
  const metrics = data?.metrics || {};

  const isLoggedIn = !!session?.user?.id;
  const userPlan = currentUserData?.plan || "free";
  const isPro = userPlan === "pro" || userPlan === "premium";

  const totalTradersRanked = metrics.totalTraders || 0;

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        {/* Background decorations */}
        <div className={styles.blurBgLeft} />
        <div className={styles.blurBgRight} />
        
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
            Atualizado em tempo real
          </div>
          
          <h1 className={styles.heroTitle}>
            Ranking de{" "}
            <span className={styles.textGradient}>Traders</span>
          </h1>
          
          <p className={styles.heroSubtitle}>
            Compare sua performance com a comunidade CriptoPlay e conquiste seu lugar entre os melhores.
          </p>
        </div>
      </section>

      <main className={styles.mainContent}>
        {/* Podium Section */}
        <section className="mb-12">
          <RankingPodium topTraders={top3Traders} />
        </section>

        {/* Metric Cards */}
        <section className={styles.metricsGrid}>
          <MetricCard
            icon={Trophy}
            label="Traders Ranqueados"
            value={totalTradersRanked.toLocaleString('pt-BR')}
            subtext="" // A API não retorna esse dado no momento
            trend="neutral" // A API não retorna esse dado no momento
          />
          <MetricCard
            icon={TrendingUp}
            label="Retorno Médio"
            value={`${metrics.avgRoi?.toFixed(2)}%`}
            subtext="Mês atual"
            trend="neutral" // A API não retorna esse dado no momento
          />
          <MetricCard
            icon={Target}
            label="Taxa Média de Acerto"
            value={`${metrics.avgWinRate?.toFixed(2)}%`}
            subtext="Mês atual"
            trend="neutral" // A API não retorna esse dado no momento
          />
          <MetricCard
            icon={Flame}
            label="Trader Destaque"
            value={metrics.topTraderName || "-"}
            subtext={`${metrics.topTraderRoi?.toFixed(2)}% ROI`}
            trend="neutral" // A API não retorna esse dado no momento
          />
        </section>

        {/* User Position Card (for logged users) */}
        {isLoggedIn && currentUserData && (
          <section>
            <UserPositionCard
              position={currentUserData.position}
              totalTraders={totalTradersRanked}
              roi={currentUserData.roi}
              profit={currentUserData.profit}
              winRate={currentUserData.winRate}
              isAnonymous={!isPro}
              nickname={isPro ? currentUserData.nickname : undefined}
            />
          </section>
        )}

        {/* Visibility Toggle (PRO only) */}
        {isLoggedIn && (
          <section>
            <VisibilityToggle
              isPublic={isPublicProfile}
              onToggle={setIsPublicProfile}
              isPro={isPro}
            />
          </section>
        )}

        {/* CTA Banner for non-pro users */}
        {(!isLoggedIn || !isPro) && (
          <section>
            <CTABanner 
              type={!isLoggedIn ? "not-logged" : userPlan === "free" ? "free" : "starter"} 
            />
          </section>
        )}

        {/* Filters */}
        <section>
          <RankingFilters
            periodOptions={PERIOD_OPTIONS}
            marketOptions={MARKET_OPTIONS}
            sortOptions={SORT_OPTIONS}
            selectedPeriod={selectedPeriod}
            selectedMarket={selectedMarket}
            selectedSort={selectedSort}
            onPeriodChange={setSelectedPeriod}
            onMarketChange={setSelectedMarket}
            onSortChange={setSelectedSort}
          />
        </section>

        {/* Ranking Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Top 10 Traders
            </h2>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
              Ver mais
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <RankingTable
            traders={traders}
            currentUserId={session?.user?.id || null}
            userPlan={userPlan}
          />
        </section>

        {/* Bottom CTA */}
        {!isPro && isLoggedIn && (
          <section className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Quer aparecer no ranking público e ganhar reconhecimento?
            </p>
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white">
              <Trophy className="w-5 h-5 mr-2" />
              Upgrade para Pro
            </Button>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container text-center">
          <p>
            © 2024 CriptoPlay. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}