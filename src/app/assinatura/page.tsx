// src/app/assinatura/page.tsx
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './assinatura.module.css'; // Assume this CSS module exists

interface Plan {
  id: string;
  name: string;
  amount: number;
  frequency: number; // 1 for monthly
  description: string;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'premium_mensal',
    name: 'Plano Premium Mensal',
    amount: 29.90,
    frequency: 1,
    description: 'Acesso completo a todas as ferramentas de análise e simulação.',
    features: [
      'Acesso ilimitado ao simulador de trading',
      'Relatórios financeiros avançados',
      'Alertas de mercado em tempo real',
      'Suporte prioritário',
    ],
  },
  // Add more plans here if needed
];

const AssinaturaPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan: Plan) => {
    if (status === 'unauthenticated') {
      router.push('/login'); // Redirect to login if not authenticated
      return;
    }

    setLoading(true);
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
          frequency: plan.frequency,
          description: plan.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao iniciar assinatura.');
      }

      if (data.init_point) {
        router.push(data.init_point); // Redirect to Mercado Pago checkout
      } else {
        toast.error('Não foi possível obter o link de pagamento.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Escolha seu Plano</h1>
      <p className={styles.subtitle}>Desbloqueie todas as funcionalidades da CriptoPlay</p>

      <div className={styles.plansGrid}>
        {plans.map((plan) => (
          <div key={plan.id} className={styles.planCard}>
            <h2 className={styles.planName}>{plan.name}</h2>
            <p className={styles.planAmount}>R$ {plan.amount.toFixed(2)} / mês</p>
            <p className={styles.planDescription}>{plan.description}</p>
            <ul className={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
            <button
              className={styles.subscribeButton}
              onClick={() => handleSubscribe(plan)}
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Assinar Agora'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssinaturaPage;