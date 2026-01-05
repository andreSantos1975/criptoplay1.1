"use client";

import { BookOpen, CheckCircle2, Trophy } from "lucide-react";
import styles from "./ProgressBar.module.css";
import clsx from "clsx";

interface ProgressBarProps {
  completedChapters: number;
  totalChapters: number;
}

export function ProgressBar({
  completedChapters,
  totalChapters,
}: ProgressBarProps) {
  const percentage = Math.round((completedChapters / totalChapters) * 100);

  return (
    <section className={styles.progressBarSection}>
      <div className={styles.container}>
        <div className={styles.innerWrapper}>
          <div className={styles.flexWrapper}>
            {/* Progress info */}
            <div className={styles.infoGroup}>
              <div className={styles.iconWrapper}>
                <Trophy className={styles.icon} />
              </div>
              <div>
                <p className={styles.infoTextLabel}>
                  Seu progresso na trilha
                </p>
                <p className={styles.infoTextValue}>
                  {completedChapters} de {totalChapters} capítulos concluídos
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGroup}>
              <div className={styles.statItem}>
                <BookOpen className={clsx(styles.statIcon, styles.statTextMuted)} />
                <span className={styles.statTextMuted}>
                  {totalChapters - completedChapters} restantes
                </span>
              </div>
              <div className={styles.statItem}>
                <CheckCircle2 className={clsx(styles.statIcon, styles.statTextSuccess)} />
                <span className={styles.statTextSuccess}>{percentage}%</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className={styles.progressContainer}>
            <div 
              className={styles.progressIndicator} 
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
