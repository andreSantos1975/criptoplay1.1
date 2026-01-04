"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import styles from "./ranking.module.css";

// Mock data - simulating different user states
const MOCK_USER = {
  isLoggedIn: true, // Change to false to test not-logged state
  plan: "pro" as const, // Change to "free" | "starter" | "pro" | "premium"
  id: "user-5",
};

const MOCK_TRADERS = [
  {
    id: "user-1",
    position: 1,
    nickname: "CryptoMaster",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoMaster",
    roi: 245.67,
    profit: 24567.89,
    trades: 342,
    winRate: 78.5,
    drawdown: 12.3,
    plan: "premium" as const,
    badges: ["top10", "proTrader", "streak"],
  },
  {
    id: "user-2",
    position: 2,
    nickname: "TradingPro",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TradingPro",
    roi: 189.34,
    profit: 18934.12,
    trades: 256,
    winRate: 72.1,
    drawdown: 15.8,
    plan: "pro" as const,
    badges: ["top10", "proTrader"],
  },
  {
    id: "user-3",
    position: 3,
    nickname: "BullRunner",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=BullRunner",
    roi: 156.78,
    profit: 15678.45,
    trades: 198,
    winRate: 69.8,
    drawdown: 18.2,
    plan: "pro" as const,
    badges: ["top10", "streak"],
  },
  {
    id: "user-4",
    position: 4,
    nickname: "DiamondHands",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DiamondHands",
    roi: 134.56,
    profit: 13456.78,
    trades: 167,
    winRate: 66.4,
    drawdown: 20.1,
    plan: "premium" as const,
    badges: ["proTrader"],
  },
  {
    id: "user-5",
    position: 5,
    nickname: "MoonShot",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MoonShot",
    roi: 112.89,
    profit: 11289.34,
    trades: 145,
    winRate: 64.2,
    drawdown: 22.5,
    plan: "pro" as const,
    badges: [],
    isCurrentUser: true,
  },
  {
    id: "user-6",
    position: 6,
    nickname: "AltcoinKing",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AltcoinKing",
    roi: 98.45,
    profit: 9845.67,
    trades: 132,
    winRate: 61.8,
    drawdown: 24.3,
    plan: "pro" as const,
    badges: [],
  },
  {
    id: "user-7",
    position: 7,
    nickname: "SwingTrader",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SwingTrader",
    roi: 87.23,
    profit: 8723.45,
    trades: 118,
    winRate: 59.5,
    drawdown: 26.8,
    plan: "premium" as const,
    badges: ["proTrader"],
  },
  {
    id: "user-8",
    position: 8,
    nickname: "LeverageKing",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=LeverageKing",
    roi: 76.89,
    profit: 7689.12,
    trades: 256,
    winRate: 55.2,
    drawdown: 35.4,
    plan: "pro" as const,
    badges: ["streak"],
  },
  {
    id: "user-9",
    position: 9,
    nickname: "PatientBear",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PatientBear",
    roi: 65.34,
    profit: 6534.89,
    trades: 89,
    winRate: 70.8,
    drawdown: 14.2,
    plan: "pro" as const,
    badges: [],
  },
  {
    id: "user-10",
    position: 10,
    nickname: "ScalpMaster",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ScalpMaster",
    roi: 54.67,
    profit: 5467.23,
    trades: 512,
    winRate: 58.3,
    drawdown: 28.9,
    plan: "premium" as const,
    badges: ["top10"],
  },
];

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Histórico" },
];

const MARKET_OPTIONS = [
  { value: "spot", label: "Spot" },
  { value: "futures", label: "Futuros" },
];

const SORT_OPTIONS = [
  { value: "roi", label: "ROI" },
  { value: "profit", label: "Lucro" },
  { value: "consistency", label: "Consistência" },
];

export default function RankingPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedMarket, setSelectedMarket] = useState("spot");
  const [selectedSort, setSelectedSort] = useState("roi");
  const [isPublicProfile, setIsPublicProfile] = useState(true);

  const isPro = MOCK_USER.plan === "pro" || MOCK_USER.plan === "premium";
  const isLoggedIn = MOCK_USER.isLoggedIn;

  const currentUserData = MOCK_TRADERS.find(t => t.isCurrentUser);

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
        {/* Metric Cards */}
        <section className={styles.metricsGrid}>
          <MetricCard
            icon={Trophy}
            label="Traders Ranqueados"
            value="2,847"
            subtext="+156 este mês"
            trend="up"
          />
          <MetricCard
            icon={TrendingUp}
            label="Retorno Médio"
            value="+42.5%"
            subtext="Últimos 30 dias"
            trend="up"
          />
          <MetricCard
            icon={Target}
            label="Taxa Média de Acerto"
            value="62.3%"
            subtext="Performance geral"
            trend="neutral"
          />
          <MetricCard
            icon={Flame}
            label="Trader Destaque"
            value="CryptoMaster"
            subtext="+245.67% ROI"
            trend="up"
          />
        </section>

        {/* User Position Card (for logged users) */}
        {isLoggedIn && currentUserData && (
          <section>
            <UserPositionCard
              position={currentUserData.position}
              totalTraders={2847}
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
              type={!isLoggedIn ? "not-logged" : (MOCK_USER.plan as string) === "free" ? "free" : "starter"} 
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
            traders={MOCK_TRADERS}
            currentUserId={MOCK_USER.id}
            userPlan={MOCK_USER.plan}
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