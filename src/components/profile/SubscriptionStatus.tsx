import React from 'react';
import { CreditCard, Sparkles, Clock } from "lucide-react";
import Link from 'next/link';
import { format, differenceInDays, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './ProfileComponents.module.css';

interface SubscriptionStatusProps {
  status: string | null;
  trialEndsAt?: Date | null;
}

const SubscriptionStatus = ({ status, trialEndsAt }: SubscriptionStatusProps) => {
  const isActive = status === 'authorized' || status === 'lifetime';
  const isTrialActive = trialEndsAt && isFuture(new Date(trialEndsAt));
  
  const trialDaysDiff = trialEndsAt ? differenceInDays(new Date(trialEndsAt), new Date()) : -1;
  const trialDaysRemaining = Math.max(0, trialDaysDiff + 1);

  const getStatusText = () => {
    if (status === 'authorized') return 'Ativa';
    if (status === 'lifetime') return 'Vitalícia';
    if (isTrialActive) return 'Período de Teste';
    return status || "Nenhuma";
  };

  return (
    <div className={styles.profileCard} style={{ animationDelay: "0.4s" }}>
      <div className={`${styles.flexCenter} mb-4`} style={{ marginBottom: '1rem' }}>
        <CreditCard className={styles.iconPrimary} size={20} />
        <h2 className={styles.title} style={{ marginBottom: 0 }}>Assinatura</h2>
      </div>
      
      <div className={styles.spaceY4}>
        <div className={styles.flexCenter}>
          <span className={styles.text} style={{ fontWeight: 500 }}>Status:</span>
          <span className={isActive || isTrialActive ? styles.textSuccess : styles.mutedText}>
            {getStatusText()}
          </span>
        </div>
        
        {!isActive && !isTrialActive && (
          <>
            <p className={styles.mutedText}>
              Você não possui uma assinatura ativa. Assine agora para desbloquear recursos exclusivos!
            </p>
            
            <Link href="/precos" className={styles.btnSuccess}>
              <Sparkles size={16} />
              Assinar agora
            </Link>
          </>
        )}

        {isTrialActive && !isActive && (
           <div className={styles.trialBadge}>
             <Clock size={20} />
             <span>
                Restam <strong>{trialDaysRemaining} dia{trialDaysRemaining !== 1 && 's'}</strong> do seu período de teste.
                Aproveite os recursos Pro!
             </span>
             <Link href="/precos" className={styles.btnSuccess} style={{marginTop: '1rem', width: '100%'}}>
               Fazer Upgrade
             </Link>
           </div>
        )}
        
        {isActive && (
          <div className={styles.successBadge}>
            <Sparkles size={20} />
            <span>Sua assinatura está ativa!</span>
          </div>
        )}

        {status === 'authorized' && (
           <a 
           href="https://www.mercadopago.com.br/subscriptions/management" 
           target="_blank" 
           rel="noopener noreferrer" 
           className={styles.mutedText}
           style={{ display: 'inline-block', marginTop: '0.5rem', textDecoration: 'underline' }}
         >
           Gerenciar Assinatura no Mercado Pago
         </a>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;
