// src/app/assinatura/page.tsx
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './assinatura.module.css';

interface Plan {
  id: string;
  name: string;
  amount: number;
  description: string;
  features: string[];
  highlight?: boolean;
  type: 'LIFETIME' | 'RECURRING';
  frequency?: number;
}

const plans: Plan[] = [
  {
    id: 'starter_mensal',
    name: 'Starter (Early Access)',
    amount: 19.90,
    description: 'Para quem está começando a jornada no mundo cripto.',
    features: [
      'Acesso ao Dashboard Básico',
      'Gráfico de Análise Técnica (Básico)',
      'Relatórios de Trades (Simples)',
      'Chatbot Assistente (Limitado)',
      'Suporte via Email'
    ],
    type: 'RECURRING',
    frequency: 1
  },
  {
    id: 'pro_mensal',
    name: 'Pro',
    amount: 39.90,
    description: 'A escolha principal para traders que buscam evolução.',
    features: [
      'Todas as funcionalidades do Starter',
      'Gráficos Futuros e Spot Completos',
      'Alertas Personalizados Ilimitados',
      'Relatórios Avançados de Performance',
      'Chatbot Ilimitado',
      'Prioridade no Suporte'
    ],
    highlight: true,
    type: 'RECURRING',
    frequency: 1
  },
  {
    id: 'premium_mensal',
    name: 'Premium',
    amount: 59.90,
    description: 'Experiência exclusiva e máxima potência.',
    features: [
      'Todas as funcionalidades do Pro',
      'Acesso Antecipado a Novas Features',
      'Mentoria Mensal em Grupo (Exclusivo)',
      'Análise de Carteira Personalizada',
      'Badge de Membro Fundador'
    ],
    type: 'RECURRING',
    frequency: 1
  }
];

const AssinaturaPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    setLoading(plan.id);
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: plan.amount,
          planType: plan.type,
          description: plan.description,
          frequency: plan.frequency
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
    <div className={styles.container}>
      <h1 className={styles.title}>Escolha seu Plano</h1>
      <p className={styles.subtitle}>Evolua seu trading com as melhores ferramentas</p>

      <div className={styles.plansGrid}>
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`${styles.planCard} ${plan.highlight ? styles.highlighted : ''}`}
          >
            {plan.highlight && <div className={styles.badge}>Recomendado</div>}
            <h2 className={styles.planName}>{plan.name}</h2>
            <div className={styles.priceContainer}>
              <span className={styles.currency}>R$</span>
              <span className={styles.amount}>{plan.amount.toFixed(2).replace('.', ',')}</span>
              <span className={styles.period}>/mês</span>
            </div>
            <p className={styles.planDescription}>{plan.description}</p>
            <ul className={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <li key={index} className={styles.featureItem}>
                  <svg className={styles.checkIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={`${styles.subscribeButton} ${plan.highlight ? styles.primaryButton : styles.secondaryButton}`}
              onClick={() => handleSubscribe(plan)}
              disabled={loading === plan.id || !!loading}
            >
              {loading === plan.id ? 'Processando...' : 'Assinar Agora'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssinaturaPage;