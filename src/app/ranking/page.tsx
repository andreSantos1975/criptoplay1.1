"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import useSWR, { mutate } from 'swr'; // Import mutate
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
import { RankingPodium } from "@/components/RankingList/RankingPodium";
import { RankingRules } from "@/components/ranking/RankingRules";
import { Button } from "@/components/ui/button";
import styles from "./ranking.module.css";
import toast from 'react-hot-toast'; // Import toast

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

// Definindo a interface do Trader para garantir a tipagem
interface Trader {
  id: string;
  position: number;
  nickname: string;
  avatar: string;
  roi: number;
  profit: number;
  trades: number;
  winRate: number;
  drawdown: number;
  plan: "free" | "starter" | "pro" | "premium";
  isCurrentUser?: boolean;
  badges?: string[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function RankingPage() {
  const { data: session } = useSession();
  
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedMarket, setSelectedMarket] = useState("spot");
  const [selectedSort, setSelectedSort] = useState("roi");
  
  const rankingApiUrl = `/api/ranking?period=${selectedPeriod}&market=${selectedMarket}&sort=${selectedSort}`;
  const { data, error, isLoading, mutate: mutateRanking } = useSWR(rankingApiUrl, fetcher);

  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(
    data?.currentUser?.isPublicProfile ?? true // Initialize from data, default to true
  );

  useEffect(() => {
    if (data?.currentUser !== undefined) {
      setIsPublicProfile(data.currentUser.isPublicProfile);
    }
  }, [data?.currentUser]);

  const handleTogglePublicProfile = async (newValue: boolean) => {
    if (!session?.user?.id) {
      toast.error("Você precisa estar logado para alterar esta configuração.");
      return;
    }

    setIsPublicProfile(newValue); // Optimistic update

    try {
      const response = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublicProfile: newValue }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar a visibilidade do perfil.');
      }

      toast.success("Visibilidade do perfil atualizada!");
      mutateRanking(); // Revalidate ranking data
      // No need to mutate a separate /api/user/me endpoint here if it's not directly used by SWR elsewhere,
      // as rankingApiUrl fetches currentUser directly.
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar visibilidade.");
      setIsPublicProfile(!newValue); // Revert optimistic update on error
    }
  };

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

  const traders: Trader[] = data?.traders || [];
  const top3Traders: Trader[] = traders.slice(0, 3);
  const currentUserData = data?.currentUser || null;
  const metrics = data?.metrics || {};

  const isLoggedIn = !!session?.user?.id;

  // Derive the user's plan *directly* from the traders list for UI consistency.
  const currentUserInTraders = traders.find((t: Trader) => t.id === session?.user?.id);
  const userPlan = currentUserInTraders?.plan || 'free';
  const isSubscriber = userPlan !== 'free';

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

          <div className="mt-8 flex justify-center">
            <Link href="/ranking/hall-da-fama" passHref>
              <Button 
                size="lg" 
                className="text-white border-0 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}
              >
                <Trophy className="w-5 h-5 mr-2" />
                Ver Hall da Fama
              </Button>
            </Link>
          </div>

        </div>
      </section>

      <main className={styles.mainContent}>
        {/* Podium Section */}
        <section className="mb-4">
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
              isAnonymous={!isSubscriber || !currentUserData.isPublicProfile} // isAnonymous if not subscriber OR not public
              nickname={currentUserData.isPublicProfile ? currentUserData.nickname : undefined}
            />
          </section>
        )}

        {/* Visibility Toggle (Subscribers only) */}
        {isLoggedIn && (
          <section>
            <VisibilityToggle
              isPublic={isPublicProfile}
              onToggle={handleTogglePublicProfile} // Use the new handler
              isSubscriber={isSubscriber}
            />
          </section>
        )}

        {/* CTA Banner for non-subscribers */}
        {(!isLoggedIn || !isSubscriber) && (
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

        {/* Regras do Ranking */}
        <section>
          <RankingRules />
        </section>

        {/* Bottom CTA */}
        {!isSubscriber && isLoggedIn && (
          <section className="text-center py-8 mt-8">
            <p className="text-gray-500 mb-4">
              Quer aparecer no ranking público e ganhar reconhecimento?
            </p>
            <Button 
              size="lg" 
              className="text-white border-0 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Seja um Assinante
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