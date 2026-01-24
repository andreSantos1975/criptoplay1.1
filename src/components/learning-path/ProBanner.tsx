"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  CheckCircle2,
  Sparkles,
  Bot,
  BarChart3,
  Trophy,
} from "lucide-react";
import styles from "./ProBanner.module.css";
import clsx from "clsx";

export function ProBanner() {
  const benefits = [
    { icon: CheckCircle2, text: "Acesso total aos módulos" },
    { icon: Trophy, text: "Ranking e gamificação" },
    { icon: BarChart3, text: "Simulador e gestão financeira" },
    // { icon: Bot, text: "IA como tutor pessoal" },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <Card className={styles.card}>
          {/* Decorative elements */}
          <div className={styles.decorationOne} />
          <div className={styles.decorationTwo} />

          <CardContent className={styles.contentWrapper}>
            <div className={styles.grid}>
              {/* Left content */}
              <div>
                <Badge className={styles.badgePro}>
                  <Crown className="mr-1 h-3 w-3" />
                  CriptoPlay PRO
                </Badge>

                <h2 className={styles.title}>
                  Desbloqueie a Trilha Completa da{" "}
                  <span className={styles.textGradient}>CriptoPlay</span>
                </h2>

                {/* <p className={styles.description}>
                  Acesse todos os módulos, ferramentas exclusivas e tenha um
                  tutor de IA pessoal para acelerar seu aprendizado.
                </p> */}

                <Button size="lg" className={styles.buttonPro}>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Tornar-se PRO
                </Button>
              </div>

              {/* Right content - Benefits */}
              <div className={styles.benefitsGrid}>
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={index}
                      className={styles.benefitItem}
                    >
                      <div className={styles.benefitIconWrapper}>
                        <Icon className={styles.benefitIcon} />
                      </div>
                      <span className={styles.benefitText}>
                        {benefit.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
