import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "@/app/ranking/ranking.module.css";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  trend,
  className 
}: MetricCardProps) {
  return (
    <div className={cn(styles.metricCard, className)}>
      <div className={styles.metricContent}>
        <p className={styles.metricLabel}>{label}</p>
        <p className={styles.metricValue}>{value}</p>
        {subtext && (
          <p className={cn(
            styles.metricSubtext,
            trend === "up" && styles.trendUp,
            trend === "down" && styles.trendDown,
            trend === "neutral" && styles.trendNeutral
          )}>
            {trend === "up" && "↑ "}
            {trend === "down" && "↓ "}
            {subtext}
          </p>
        )}
      </div>
      <div className={styles.metricIconWrapper}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
