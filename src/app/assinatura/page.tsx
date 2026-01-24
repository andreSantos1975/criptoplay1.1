"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Check, Sparkles, Crown, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from './assinatura.module.css';

// Tipos para os planos
interface PricingFeature {
  text: string;
}

interface PlanConfig {
  id: string; // ID base
  name: string;
  badge?: string;
  badgeType?: "default" | "recommended" | "premium";
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: PricingFeature[];
  isPopular?: boolean;
  isPremium?: boolean;
  type: 'LIFETIME' | 'RECURRING';
}

const plans: PlanConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Early Access',
    badgeType: "default",
    monthlyPrice: 29.90,
    annualPrice: 299.00,
    description: "Para quem está começando a jornada no mundo cripto.",
    features: [
      { text: "Acesso ao Dashboard Básico" },
      { text: "Gráfico de Análise Técnica (Básico)" },
      { text: "Relatórios de Trades (Simples)" },

      { text: "Suporte via Email" },
    ],
    type: 'RECURRING'
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Recomendado',
    badgeType: "recommended",
    monthlyPrice: 59.90,
    annualPrice: 599.00,
    description: "A escolha principal para traders que buscam evolução.",
    features: [
      { text: "Todas as funcionalidades do Starter" },
      { text: "Gráficos Futuros e Spot Completos" },
      { text: "Alertas Personalizados Ilimitados" },
      { text: "Relatórios Avançados de Performance" },
      // { text: "Chatbot Ilimitado" },
      { text: "Prioridade no Suporte" },
    ],
    isPopular: true,
    type: 'RECURRING'
  },
  {
    id: 'premium',
    name: 'Premium',
    badge: 'Exclusivo',
    badgeType: "premium",
    monthlyPrice: 129.90,
    annualPrice: 1299.00,
    description: "Experiência exclusiva e máxima potência.",
    features: [
      { text: "Todas as funcionalidades do Pro" },
      { text: "Acesso Antecipado a Novas Features" },
      { text: "Mentoria Mensal em Grupo (Exclusivo)" },
      { text: "Análise de Carteira Personalizada" },
      { text: "Badge de Membro Fundador" },
    ],
    isPremium: true,
    type: 'RECURRING'
  },
];

export default function AssinaturaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(true);

  const handleSubscribe = async (plan: PlanConfig) => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const frequency = isAnnual ? 12 : 1;
    const finalPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    // O ID do plano pode precisar de ajuste dependendo de como o backend espera (ex: 'pro_anual' vs 'pro_mensal')
    // Aqui estou construindo um ID composto
    const planIdToSend = `${plan.id}_${isAnnual ? 'anual' : 'mensal'}`;
    const planNameToSend = `${plan.name} (${isAnnual ? 'Anual' : 'Mensal'})`;

    setLoading(plan.id);
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planIdToSend,
          planName: planNameToSend,
          amount: finalPrice,
          planType: plan.type,
          description: plan.description,
          frequency: frequency
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao iniciar assinatura.');
      }

      if (data.init_point) {
        router.push(data.init_point);
      } else {
        toast.error('Não foi possível obter o link de pagamento.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className={styles.container}>
      <div className="max-w-7xl mx-auto">
        
        {/* --- Hero Section --- */}
        <div className={styles.hero}>
          <div className={styles.heroTag}>
            <TrendingUp className="w-4 h-4 text-[#8b5cf6]" />
            <span className={styles.heroTagText}>CriptoPlay</span>
          </div>
          
          <h1 className={styles.heroTitle}>
            Escolha seu{" "}
            <span className={styles.textGradientPrimary}>Plano</span>
          </h1>
          
          <p className={styles.heroSubtitle}>
            Evolua seu trading com as melhores ferramentas do mercado
          </p>
        </div>

        {/* --- Toggle Section --- */}
        <div className={styles.toggleContainer}>
          <div className={styles.toggleWrapper}>
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(styles.toggleButton, !isAnnual && styles.toggleButtonActive)}
            >
              Mensal
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(styles.toggleButton, isAnnual && styles.toggleButtonActive)}
            >
              Anual
              <span className={styles.discountBadge}>-20%</span>
            </button>
            
            {/* Animated Pill Background */}
            <div
              className={styles.togglePill}
              style={{
                left: isAnnual ? '50%' : '0.25rem',
                width: isAnnual ? 'calc(50% - 0.25rem)' : 'calc(50% - 0.5rem)',
              }}
            />
          </div>
          
          <p className={styles.toggleLabel}>
            Economize assinando o plano anual
          </p>
        </div>

        {/* --- Pricing Cards Grid --- */}
        <div className={styles.grid}>
          {plans.map((plan, index) => {
            const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const period = isAnnual ? "/ano" : "/mês";
            const BadgeIcon = plan.isPremium ? Crown : plan.isPopular ? Sparkles : Zap;
            
            return (
              <div
                key={plan.id}
                className={cn(
                  styles.card,
                  plan.isPopular && styles.popularCard,
                  plan.isPremium && styles.premiumCard
                )}
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className={cn(
                      styles.badge,
                      plan.badgeType === "recommended" && styles.badgeRecommended,
                      plan.badgeType === "premium" && styles.badgePremium,
                      plan.badgeType === "default" && styles.badgeDefault
                    )}
                  >
                    <BadgeIcon className="w-3.5 h-3.5" />
                    {plan.badge}
                  </div>
                )}

                {/* Header */}
                <div className={styles.cardHeader}>
                  <h3 className={cn(
                    styles.planName,
                    plan.isPremium ? styles.textGradientPremium : (plan.isPopular ? styles.textGradientPrimary : '')
                  )}>
                    {plan.name}
                  </h3>
                  <p className={styles.planDescription}>{plan.description}</p>
                </div>

                {/* Price */}
                <div className={styles.priceWrapper}>
                  <div className={styles.priceContainer}>
                    <span className={styles.currency}>R$</span>
                    <span className={cn(
                      styles.priceValue,
                      plan.isPopular && styles.textGradientPrimary,
                      plan.isPremium && styles.textGradientPremium
                    )}>
                      {currentPrice.toFixed(2).replace(".", ",")}
                    </span>
                    <span className={styles.period}>{period}</span>
                  </div>
                  {isAnnual && (
                    <p className={styles.savingsText}>
                      Economize 2 meses
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className={styles.featuresList}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className={styles.featureItem}>
                      <div className={cn(
                        styles.checkIconWrapper,
                        plan.isPopular && styles.success,
                        plan.isPremium && styles.warning
                      )}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={styles.featureText}>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id || !!loading}
                  className={cn(
                    styles.ctaButton,
                    plan.isPopular ? styles.ctaGradientSuccess : (plan.isPremium ? styles.ctaGradientPremium : styles.ctaGradient)
                  )}
                >
                  {loading === plan.id ? 'Processando...' : 'Assinar Agora'}
                </button>

                <p className={styles.microcopy}>
                  Cancele quando quiser • Sem taxas ocultas
                </p>
              </div>
            );
          })}
        </div>

        {/* --- Trust Indicators --- */}
        <div className={styles.trustContainer}>
          <p className={styles.trustText}>
            Junte-se a milhares de traders que confiam na CriptoPlay
          </p>
          <div className={styles.trustBadges}>
            <div className={styles.trustBadge}>
              <div className={styles.trustDot} />
              <span>Criptografia de ponta</span>
            </div>
            <div className={styles.trustBadge}>
              <div className={styles.trustDot} />
              <span>Suporte 24/7</span>
            </div>
            <div className={styles.trustBadge}>
              <div className={styles.trustDot} />
              <span>Garantia de 7 dias</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
