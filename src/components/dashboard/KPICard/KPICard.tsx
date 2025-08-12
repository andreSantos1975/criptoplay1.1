import { Card } from "@/components/ui/card";
import styles from "./KPICard.module.css";

interface KPICardProps {
  title: string;
  value: string;
  isPositive?: boolean;
}

export const KPICard = ({ title, value, isPositive }: KPICardProps) => {
  return (
    <Card>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={`${styles.value} ${isPositive ? styles.positiveValue : ""}`}>
          {value}
        </p>
      </div>
    </Card>
  );
};
