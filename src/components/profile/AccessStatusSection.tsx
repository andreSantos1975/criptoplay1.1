import React, { useState } from 'react';
import { Sparkles, Clock, XCircle } from "lucide-react";
import Link from 'next/link';
import { format, differenceInDays, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './ProfileComponents.module.css';
import { UserPermissions } from '@/types/next-auth.d'; // Importar a interface de permissões
import toast from 'react-hot-toast';

interface AccessStatusSectionProps {
  permissions: UserPermissions | undefined;
  trialEndsAt?: Date | null;
  userEmail?: string | null;
  subscriptionType?: string | null;
  planName?: string | null;
}

const AccessStatusSection = ({ permissions, trialEndsAt, userEmail, subscriptionType, planName }: AccessStatusSectionProps) => {
  const [isCancelling, setIsCancelling] = useState(false);

  const isPaidSubscriber = permissions?.hasActiveSubscription && !permissions?.isInTrial;
  const isHotmartPurchaser = permissions?.hasCourseAccess && !isPaidSubscriber && !permissions?.isInTrial;
  const isTrial = permissions?.isInTrial;
  const hasAnyPremiumAccess = permissions?.hasActiveSubscription || permissions?.hasCourseAccess;

  const trialDaysDiff = trialEndsAt ? differenceInDays(new Date(trialEndsAt), new Date()) : -1;
  const trialDaysRemaining = Math.max(0, trialDaysDiff + 1);
  const formattedTrialEndDate = trialEndsAt ? format(new Date(trialEndsAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : '';

  const handleCancelSubscription = async () => {
    if (!window.confirm("Tem certeza que deseja cancelar sua assinatura? Você perderá o acesso aos benefícios ao final do ciclo de faturamento atual.")) {
      return;
    }

    setIsCancelling(true);
    toast.dismiss();

    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao cancelar assinatura.');

      toast.success('Assinatura cancelada com sucesso!');
      // TODO: Forçar um refresh da sessão ou redirecionar para que as permissões sejam atualizadas
      window.location.reload(); 

    } catch (error: any) {
      toast.error(error.message || 'Erro inesperado ao cancelar.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className={styles.profileCard} style={{ animationDelay: "0.4s" }}>
      <div className={`${styles.flexCenter} mb-4`} style={{ marginBottom: '1rem' }}>
        <Sparkles className={styles.iconPrimary} size={20} />
        <h2 className={styles.title} style={{ marginBottom: 0 }}>Meu Acesso</h2>
      </div>
      
      <div className={styles.spaceY4}>
        {!hasAnyPremiumAccess && (
          <>
            <p className={styles.mutedText}>
              Você não possui nenhum acesso premium ativo.
            </p>
            <Link href="/precos" className={styles.btnSuccess}>
              <Sparkles size={16} />
              Assinar agora
            </Link>
          </>
        )}

        {isTrial && (
           <div className={styles.trialBadge}>
             <Clock size={20} />
             <span>
                Período de Teste: Restam <strong>{trialDaysRemaining} dia{trialDaysRemaining !== 1 && 's'}</strong>.
                Seu acesso termina em {formattedTrialEndDate}.
             </span>
             <Link href="/precos" className={styles.btnSuccess} style={{marginTop: '1rem', width: '100%'}}>
               Fazer Upgrade
             </Link>
           </div>
        )}

        {isPaidSubscriber && (
          <div className={styles.successBadge}>
            <Sparkles size={20} />
            <span>Você é um assinante CriptoPlay! Seu acesso {planName || (subscriptionType === 'PREMIUM' ? 'Premium' : subscriptionType?.charAt(0).toUpperCase() + subscriptionType?.slice(1).toLowerCase() || '')} está ativo</span>
            <button 
              onClick={handleCancelSubscription} 
              disabled={isCancelling}
              className={styles.btnDanger} 
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar Assinatura'}
            </button>
          </div>
        )}

        {isHotmartPurchaser && (
          <div className={styles.infoBadge}>
            <Sparkles size={20} />
            <span>Você possui um **Acesso Bônus** vitalício à **Jornada Cripto**!</span>
            <p className={styles.mutedText} style={{ marginTop: '0.5rem' }}>
              Desbloqueie todo o potencial da plataforma com recursos exclusivos e avançados.
            </p>
            <Link href="/precos" className={styles.btnSuccess} style={{marginTop: '1rem', width: '100%'}}>
               Tornar-se Assinante PRO
             </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessStatusSection;
