import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp } from "lucide-react";
// import heroImage from "@/assets/hero-crypto.jpg"; // This path will need to be verified/adjusted

import styles from "./Hero.module.css"; // Added import

const Hero = () => {

  return (
    <section className={styles.heroSection}>
      {/* Background Image */}
      <div className={styles.heroBackground}>
        {/* <img
          src={heroImage}
          alt="Plataforma de trading de criptomoedas"
          className={styles.heroImage}
        /> */}
        <div className={styles.heroGradientOverlay} />
      </div>

      {/* Content */}
      <div className={styles.heroContentWrapper}>
        <div className={styles.headlineContainer}>
          {/* Badge */}
          <div className={styles.badge}>
            <Shield className={styles.badgeIcon} />
            <span className={styles.badgeText}>
              Plataforma 100% Gameficada
            </span>
          </div>

          {/* Main Headline */}
          <h1 className={styles.mainHeadline}>
            Trade Criptomoedas com{" "}
            <span className={styles.headlineGradientText}>
              Confiança e Simplicidade
            </span>
          </h1>

          {/* Subtitle */}
          <p className={styles.subtitle}>
            Descubra a plataforma que combina análise profissional, interface intuitiva e gameficação no aprendizado, para 
            potencializar seus investimentos em criptomoedas.
          </p>

          {/* CTA Buttons */}
          <div className={styles.ctaButtonsContainer}>
            <Button variant="cta" size="xl" className={styles.ctaButtonPrimary}>
              Começar Agora
              <ArrowRight className={styles.ctaButtonIcon} />
            </Button>
            <Button variant="outline" size="xl" className={styles.ctaButtonSecondary}>
              Ver Demonstração
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className={styles.trustIndicatorsContainer}>
            <div className={styles.trustIndicatorItem}>
              <TrendingUp className={styles.trustIndicatorIcon} />
              <span className={styles.trustIndicatorText}>+500k Traders</span>
            </div>
            <div className={styles.trustIndicatorItem}>
              <Shield className={styles.trustIndicatorIcon} />
              <span className={styles.trustIndicatorText}>Plataforma Gameficada</span>
            </div>
            <div className={styles.trustIndicatorItem}>
              <TrendingUp className={styles.trustIndicatorIcon} />
              <span className={styles.trustIndicatorText}>Suporte 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className={styles.floatingElementOne} />
      <div className={styles.floatingElementTwo} style={{ animationDelay: '1s' }} />
      <div className={styles.floatingElementThree} style={{ animationDelay: '2s' }} />
    </section>
  );
};

export default Hero;
