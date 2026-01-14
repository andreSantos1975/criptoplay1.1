import React from 'react';
import { CreditCard, Sparkles } from "lucide-react";
import Link from 'next/link';
import styles from './ProfileComponents.module.css';

interface SubscriptionStatusProps {
  status: string | null;
}

const SubscriptionStatus = ({ status }: SubscriptionStatusProps) => {
  const isActive = status === 'authorized' || status === 'lifetime';

  return (
    <div className={styles.profileCard} style={{ animationDelay: "0.4s" }}>
      <div className={`${styles.flexCenter} mb-4`} style={{ marginBottom: '1rem' }}>
        <CreditCard className={styles.iconPrimary} size={20} />
        <h2 className={styles.title} style={{ marginBottom: 0 }}>Assinatura</h2>
      </div>
      
      <div className={styles.spaceY4}>
        <div className={styles.flexCenter}>
          <span className={styles.text} style={{ fontWeight: 500 }}>Status:</span>
          <span className={isActive ? styles.textSuccess : styles.mutedText}>
            {status === 'authorized' ? 'Ativa' : (status || "Nenhuma")}
          </span>
        </div>
        
        {!isActive && (
          <>
            <p className={styles.mutedText}>
              Você não possui uma assinatura ativa. Assine agora para desbloquear recursos exclusivos!
            </p>
            
            <Link href="/assinatura" className={styles.btnSuccess}>
              <Sparkles size={16} />
              Assinar agora
            </Link>
          </>
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
