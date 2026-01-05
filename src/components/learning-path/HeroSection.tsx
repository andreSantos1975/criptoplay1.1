"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";
import styles from "./HeroSection.module.css";
import clsx from "clsx";

interface HeroSectionProps {
  isLoggedIn?: boolean;
}

export function HeroSection({ isLoggedIn = false }: HeroSectionProps) {
  return (
    <section className={styles.heroSection}>
      {/* Background decorations */}
      <div className={styles.decorationWrapper}>
        <div className={clsx(styles.decoration, styles.decorationTopRight)} />
        <div className={clsx(styles.decoration, styles.decorationBottomLeft)} />
        <div className={clsx(styles.decoration, styles.decorationCenter)} />
      </div>

      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Badge */}
          <div className={styles.badge}>
            <Sparkles className="h-4 w-4" />
            <span>Plataforma educacional completa</span>
          </div>

          {/* Title */}
          <h1 className={styles.title}>
            Academia{" "}
            <span className={styles.titleHighlight}>
              CriptoPlay
              <span className={styles.titleUnderline} />
            </span>
          </h1>

          {/* Subtitle */}
          <p className={styles.subtitle}>
            Aprenda criptomoedas do zero à estratégia avançada, com prática,
            segurança e método.
          </p>

          {/* CTAs */}
          <div className={styles.ctaWrapper}>
            <Button size="xl" className={styles.primaryButton}>
              Começar minha jornada
            </Button>
            {isLoggedIn && (
              <Button
                variant="outline"
                size="xl"
                className={styles.secondaryButton}
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                Ver meu progresso
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className={styles.waveWrapper}>
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.waveSvg}
        >
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className={styles.wavePath}
          />
        </svg>
      </div>
    </section>
  );
}
