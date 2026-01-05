"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import styles from "./ChapterCard.module.css";
import { Chapter, ChapterStatus } from "./chaptersData";
import clsx from "clsx";

interface ChapterCardProps {
  chapter: Chapter;
  index: number;
}

export function ChapterCard({ chapter, index }: ChapterCardProps) {
  const isInteractive =
    chapter.status === "completed" || chapter.status === "available";

  const getStatusConfig = (status: ChapterStatus) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          badgeText: "Concluído",
          badgeClass: styles.badgeSuccess,
          buttonText: "Revisar",
          buttonClass: styles.buttonSuccess,
          cardClass: styles.cardCompleted,
          numberBadgeClass: styles.numberBadgeCompleted,
        };
      case "available":
        return {
          icon: PlayCircle,
          badgeText: "Disponível",
          badgeClass: "", // Default badge style
          buttonText: "Acessar módulo",
          buttonClass: "", // Default button style
          cardClass: styles.cardAvailable,
          numberBadgeClass: styles.numberBadgeAvailable,
        };
      case "locked":
        return {
          icon: Lock,
          badgeText: "Bloqueado",
          badgeClass: "", // Secondary usually
          buttonText: "Desbloqueie",
          buttonClass: "",
          cardClass: styles.cardLocked,
          numberBadgeClass: styles.numberBadgeDefault,
        };
      case "coming":
        return {
          icon: Clock,
          badgeText: "Em breve",
          badgeClass: styles.badgeComing,
          buttonText: "Em produção",
          buttonClass: "",
          cardClass: styles.cardComing,
          numberBadgeClass: styles.numberBadgeDefault,
        };
    }
  };

  const config = getStatusConfig(chapter.status);
  const StatusIcon = config.icon;

  return (
    <div
      className={clsx(
        styles.card,
        config.cardClass,
        isInteractive && styles.cardInteractive
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Module number indicator */}
      <div className={clsx(styles.numberBadge, config.numberBadgeClass)}>
        {chapter.id}
      </div>

      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{chapter.title}</h3>
        <Badge 
          className={clsx("shrink-0", config.badgeClass)}
          variant={chapter.status === "locked" || chapter.status === "coming" ? "secondary" : "default"}
        >
          <StatusIcon className="mr-1 h-3 w-3" />
          {config.badgeText}
        </Badge>
      </div>

      <div className={styles.cardContent}>
        <p className={styles.cardDescription}>
          {chapter.description}
        </p>

        {isInteractive ? (
          chapter.slug ? (
            <Link href={`/academia-criptoplay/${chapter.slug}`} className="w-full">
              <Button
                size="sm"
                className={clsx("w-full", config.buttonClass)}
              >
                {config.buttonText}
                <ArrowRight className={styles.arrowIcon} />
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              className={clsx("w-full", config.buttonClass)}
            >
              {config.buttonText}
              <ArrowRight className={styles.arrowIcon} />
            </Button>
          )
        ) : (
          <div className={styles.statusContainer}>
            <StatusIcon className="h-4 w-4" />
            <span>{chapter.status === "coming" ? "Conteúdo em produção" : "Complete os módulos anteriores"}</span>
          </div>
        )}
      </div>
    </div>
  );
}