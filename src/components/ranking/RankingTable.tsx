import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Flame, Diamond } from "lucide-react";
import styles from "@/app/ranking/ranking.module.css";

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

interface RankingTableProps {
  traders: Trader[];
  currentUserId?: string;
  userPlan?: "free" | "starter" | "pro" | "premium" | null;
}

function PositionBadge({ position }: { position: number }) {
  if (position === 1) {
    return (
      <div className={cn(styles.posBadge, styles.gold)}>
        <Trophy className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (position === 2) {
    return (
      <div className={cn(styles.posBadge, styles.silver)}>
        <Trophy className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (position === 3) {
    return (
      <div className={cn(styles.posBadge, styles.bronze)}>
        <Trophy className="w-4 h-4 text-white" />
      </div>
    );
  }
  return (
    <div className={cn(styles.posBadge, styles.defaultPos)}>
      {position}
    </div>
  );
}

function TraderBadges({ badges }: { badges: string[] }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {badges.includes("top10") && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500 text-yellow-600 bg-yellow-50">
          <Trophy className="w-3 h-3 mr-0.5" />
          Top 10
        </Badge>
      )}
      {badges.includes("proTrader") && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-500 text-violet-600 bg-violet-50">
          <Diamond className="w-3 h-3 mr-0.5" />
          Pro Trader
        </Badge>
      )}
      {badges.includes("streak") && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-500 text-orange-600 bg-orange-50">
          <Flame className="w-3 h-3 mr-0.5" />
          Sequência
        </Badge>
      )}
    </div>
  );
}

function PlanBadge({ plan }: { plan: Trader["plan"] }) {
  const variants = {
    free: "secondary",
    starter: "outline",
    pro: "default", // Using default for Pro to stand out
    premium: "default", // Using default (primary color)
  } as const;

  const labels = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    premium: "Premium",
  };
  
  // Custom styles for badges since 'variant' might not cover all colors we want
  const customClass = 
    plan === 'premium' ? "bg-amber-500 hover:bg-amber-600 text-white border-none" :
    plan === 'pro' ? "bg-violet-600 hover:bg-violet-700 text-white border-none" :
    "";

  return <Badge variant={variants[plan]} className={customClass}>{labels[plan]}</Badge>;
}

export function RankingTable({ traders, currentUserId, userPlan }: RankingTableProps) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tr}>
              <th className={styles.th}>#</th>
              <th className={styles.th}>Trader</th>
              <th className={cn(styles.th, "text-right")}>ROI</th>
              <th className={cn(styles.th, "text-right hidden sm:table-cell")}>Lucro (USDT)</th>
              <th className={cn(styles.th, "text-right hidden md:table-cell")}>Trades</th>
              <th className={cn(styles.th, "text-right hidden lg:table-cell")}>Win Rate</th>
              <th className={cn(styles.th, "text-right hidden xl:table-cell")}>Drawdown</th>
              <th className={cn(styles.th, "text-center")}>Plano</th>
            </tr>
          </thead>
          <tbody>
            {traders.map((trader) => (
              <tr
                key={trader.id}
                className={cn(
                  styles.tr,
                  trader.isCurrentUser && styles.trCurrentUser
                )}
              >
                <td className={styles.td}>
                  <PositionBadge position={trader.position} />
                </td>
                <td className={styles.td}>
                  <div className={styles.userCell}>
                    <Avatar className={styles.avatar}>
                      <AvatarImage src={trader.avatar} alt={trader.nickname} />
                      <AvatarFallback>{trader.nickname.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={styles.userMeta}>
                      <p className={styles.nickname}>
                        {trader.nickname}
                        {trader.isCurrentUser && (
                          <span className="text-xs text-violet-600 font-medium">(Você)</span>
                        )}
                      </p>
                      {trader.badges && trader.badges.length > 0 && (
                        <TraderBadges badges={trader.badges} />
                      )}
                    </div>
                  </div>
                </td>
                <td className={cn(styles.td, "text-right")}>
                  <div className="flex items-center justify-end gap-1.5">
                    {trader.roi >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={cn(
                      "font-mono font-semibold",
                      trader.roi >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {trader.roi >= 0 ? "+" : ""}{trader.roi.toFixed(2)}%
                    </span>
                  </div>
                </td>
                <td className={cn(styles.td, "text-right hidden sm:table-cell")}>
                  <span className={cn(
                    "font-mono font-medium",
                    trader.profit >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {trader.profit >= 0 ? "+" : ""}{trader.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className={cn(styles.td, "text-right hidden md:table-cell")}>
                  <span className="font-mono text-gray-900">{trader.trades}</span>
                </td>
                <td className={cn(styles.td, "text-right hidden lg:table-cell")}>
                  <span className={cn(
                    "font-mono font-medium",
                    trader.winRate >= 60 ? "text-emerald-600" : 
                    trader.winRate >= 50 ? "text-gray-900" : "text-red-600"
                  )}>
                    {trader.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className={cn(styles.td, "text-right hidden xl:table-cell")}>
                  <span className="font-mono text-red-600">
                    -{trader.drawdown.toFixed(1)}%
                  </span>
                </td>
                <td className={cn(styles.td, "text-center")}>
                  <PlanBadge plan={trader.plan} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
