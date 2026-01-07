"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import styles from './TrialReminderBanner.module.css';

export const TrialReminderBanner: React.FC = () => {
  const { data: session } = useSession();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user?.trialEndsAt) {
      const trialEndDate = new Date(session.user.trialEndsAt);
      const today = new Date();
      const diff = differenceInDays(trialEndDate, today);
      setDaysRemaining(diff);
    } else {
      setDaysRemaining(null); // Not in trial or trialEndsAt is null
    }
  }, [session?.user?.trialEndsAt]);

  const isTrialActive = daysRemaining !== null && daysRemaining >= 0;
  
  if (!isTrialActive || session?.user?.subscriptionStatus === 'authorized' || session?.user?.subscriptionStatus === 'lifetime') {
    return null; // Don't show if not in trial or already subscribed
  }

  const formattedEndDate = session?.user?.trialEndsAt ? format(new Date(session.user.trialEndsAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '';

  return (
    <div className={styles.banner}>
      <p className={styles.message}>
        Você está desfrutando de um acesso Premium gratuito! Faltam{' '}
        <strong className={styles.daysHighlight}>{daysRemaining! + 1} {daysRemaining! + 1 === 1 ? 'dia' : 'dias'}</strong>{' '}
        para seu período de teste terminar em {formattedEndDate}.
        Não perca acesso às funcionalidades avançadas.
      </p>
      <Link href="/assinatura" className={styles.upgradeButton}>
        Ver Planos
      </Link>
    </div>
  );
};
