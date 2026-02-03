"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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

import { PremiumLock } from "@/components/ui/PremiumLock"; // 1. Importar o componente de bloqueio
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
import toast from 'react-hot-toast';

const PERIOD_OPTIONS = [
  { label: '7 Dias', value: '7d' },
  { label: '30 Dias', value: '30d' },
  { label: '90 Dias', value: '90d' },
  { label: 'Todo o Período', value: 'all' },
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

interface Trader {
  id: string; position: number; nickname: string; avatar: string; roi: number; profit: number; trades: number; winRate: number; drawdown: number; plan: "free" | "starter" | "pro" | "premium"; isCurrentUser?: boolean; badges?: string[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function RankingPage() {
  const { data: session, status } = useSession(); // 2. Obter o status da sessão
  const permissions = session?.user?.permissions;
  const userPlan = permissions?.hasActiveSubscription ? "premium" : "free"; // Definindo userPlan com base nas permissões
  
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedMarket, setSelectedMarket] = useState("all");
  const [selectedSort, setSelectedSort] = useState("roi");
  
  const rankingApiUrl = `/api/ranking?period=${selectedPeriod}&market=${selectedMarket}&sort=${selectedSort}`;
  const { data, error, isLoading, mutate: mutateRanking } = useSWR(rankingApiUrl, fetcher);

  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(true);

  useEffect(() => {
    if (data?.currentUser !== undefined) {
      setIsPublicProfile(data.currentUser.isPublicProfile);
    }
  }, [data?.currentUser]);

  // 3. Lógica de bloqueio no início do componente
  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className="h-screen w-full flex items-center justify-center">
          <p>Carregando...</p> {/* Ou um componente de Spinner */}
        </div>
      </div>
    );
  }

  // Se não for premium (após o loading), mostra a tela de bloqueio.
  if (!permissions?.hasActiveSubscription) {
    return (
      <div className={styles.container}>
        <PremiumLock 
          title="Ranking de Traders: Recurso para Assinantes"
          message="Compare sua performance, aprenda com os melhores e conquiste seu lugar no topo. Obtenha acesso completo com sua assinatura."
        />
      </div>
    );
  }
  
  const handleTogglePublicProfile = async (newValue: boolean) => {
    // ... (função de toggle permanece a mesma)
  };
  
  if (error) return <div className="text-center py-20 text-red-500">Falha ao carregar o ranking. Tente novamente mais tarde.</div>;

  const traders: Trader[] = data?.traders || [];
  const top3Traders: Trader[] = traders.slice(0, 3);
  const currentUserData = data?.currentUser || null;
  const metrics = data?.metrics || {};
  const totalTradersRanked = metrics.totalTraders || 0;
  
  // 4. Lógica simplificada, já que sabemos que o usuário é assinante aqui.
  const isLoggedIn = !!session?.user?.id;

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.blurBgLeft} />
        <div className={styles.blurBgRight} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
            Atualizado em tempo real
          </div>
          <h1 className={styles.heroTitle}>
            Ranking de <span className={styles.textGradient}>Traders</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Compare sua performance com a comunidade CriptoPlay e conquiste seu lugar entre os melhores.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/ranking/hall-da-fama" passHref>
              <Button size="lg" className="text-white border-0 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}>
                <Trophy className="w-5 h-5 mr-2" />
                Ver Hall da Fama
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className={styles.mainContent}>
        <section className="mb-4">
          <RankingPodium topTraders={top3Traders} />
        </section>

        <section className={styles.metricsGrid}>
            {/* Cards de Métricas */}
        </section>

        {isLoggedIn && currentUserData && (
          <section>
            <UserPositionCard
              position={currentUserData.position}
              totalTraders={totalTradersRanked}
              roi={currentUserData.roi}
              profit={currentUserData.profit}
              winRate={currentUserData.winRate}
              isAnonymous={!currentUserData.isPublicProfile}
              nickname={currentUserData.isPublicProfile ? currentUserData.nickname : undefined}
              period={selectedPeriod}
              market={selectedMarket}
            />
          </section>
        )}

        {isLoggedIn && (
          <section>
            <VisibilityToggle
              isPublic={isPublicProfile}
              onToggle={handleTogglePublicProfile}
              isSubscriber={true} // Sempre true se chegou aqui
            />
          </section>
        )}
        
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
        
        <section>
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold text-gray-900">Top 10 Traders</h2>
             <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">Ver mais <ChevronDown className="w-4 h-4 ml-1" /></Button>
           </div>
          <RankingTable
            traders={traders}
            currentUserId={session?.user?.id || null}
            userPlan={userPlan}
          />
        </section>
        
        <section>
          <RankingRules />
        </section>
      </main>
      
      <footer className={styles.footer}>
         <div className="container text-center"><p>© 2024 CriptoPlay. Todos os direitos reservados.</p></div>
      </footer>
    </div>
  );
}