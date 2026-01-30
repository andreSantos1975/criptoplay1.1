import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "@/app/ranking/ranking.module.css";

interface UserPositionCardProps {
  position: number;
  totalTraders: number;
  roi: number;
  profit: number;
  winRate: number;
  isAnonymous?: boolean;
  nickname?: string;
  period: string;
  market: string; // Adicionado para clareza do mercado
}

export function UserPositionCard({
  position,
  totalTraders,
  roi,
  profit,
  winRate,
  isAnonymous = false,
  nickname,
  period,
  market,
}: UserPositionCardProps) {
  const percentile = Math.round(((totalTraders - position + 1) / totalTraders) * 100);

  const periodLabels: { [key: string]: string } = {
    '7d': '7d',
    '30d': '30d',
    '90d': '90d',
    'all': 'Total',
  };
  const periodLabel = periodLabels[period] || period;

  const marketLabels: { [key: string]: string } = {
    'spot': 'Spot',
    'futures': 'Futuros',
    'all': 'Todos',
  };
  const marketLabel = marketLabels[market] || market;


  return (
    <div className={styles.positionCard}>
      <div className={styles.positionHeader}>
        <div className={styles.positionUserInfo}>
          <div className={styles.positionIconBox}>
            {isAnonymous ? (
              <Lock className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sua Posição ({marketLabel} | {periodLabel})</p>
            <p className="font-semibold text-foreground">
              {isAnonymous ? "Trader Anônimo" : nickname}
            </p>
          </div>
        </div>
        <Badge variant="outline">
          Top {percentile}%
        </Badge>
      </div>

      <div className={styles.positionStatsGrid}>
        <div className={styles.statBox}>
          <p className={styles.statValue}>#{position}</p>
          <p className={styles.statLabel}>de {totalTraders}</p>
        </div>
        
        <div className={styles.statBox}>
          <div className="flex items-center justify-center gap-1">
            {roi >= 0 ? (
              <TrendingUp className="h-3 w-3 text-emerald-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <p className={cn(
              styles.statValue,
              roi >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {roi >= 0 ? "+" : ""}{roi.toFixed(2)}%
            </p>
          </div>
          <p className={styles.statLabel}>ROI</p>
        </div>
        
        <div className={styles.statBox}>
          <p className={cn(
            styles.statValue,
            profit >= 0 ? "text-emerald-600" : "text-red-600"
          )}>
            {profit >= 0 ? "+" : ""}{profit.toLocaleString("pt-BR")}
          </p>
          <p className={styles.statLabel}>Lucro USDT</p>
        </div>
        
        <div className={styles.statBox}>
          <p className={cn(
            styles.statValue,
            winRate >= 60 ? "text-emerald-600" : 
            winRate >= 50 ? "text-gray-900" : "text-red-600"
          )}>
            {winRate.toFixed(1)}%
          </p>
          <p className={styles.statLabel}>Win Rate</p>
        </div>
      </div>
    </div>
  );
}
