'use client';

import Link from 'next/link';
import styles from './Sidebar.module.css';
import { useAlertNotification } from '@/hooks/useAlertNotification';
import { useSession } from 'next-auth/react';
import { Sparkles } from 'lucide-react';
import { hasPremiumAccess } from '@/lib/permissions'; // Import hasPremiumAccess

const Sidebar = () => {
  const { data: session, status } = useSession();
  const { notificationCount } = useAlertNotification();

  // Use hasPremiumAccess to check if the user is a subscriber or in trial
  const hasAccess = hasPremiumAccess(session);
  const isLoading = status === 'loading';

  return (
    <aside className={styles.topNav}>
      <h2 className={styles.title}>SeuFluxo</h2>
      
      {isLoading ? (
        <div className={styles.loadingState}>
          <p>Carregando...</p>
        </div>
      ) : hasAccess ? (
        <nav className={styles.nav}>
          <Link href="/contas" className={styles.link}>Contas/Cartões</Link>
          <Link href="/relatorios" className={styles.link}>Relatórios</Link>
          <Link href="/alertas" className={styles.link}>
            Alertas
            {notificationCount > 0 && (
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'red',
                marginLeft: '8px',
              }}></span>
            )}
          </Link>
          <Link href="/orcamento-anual" className={styles.link}>Orçamento Anual</Link>
          <Link href="/calculadora-juros" className={styles.link}>Calculadora de Juros</Link>
          <Link href="/metas" className={styles.link}>Metas Financeiras</Link>
        </nav>
      ) : (
        <div className={styles.upgradeCard}>
          <Sparkles className="h-6 w-6 text-yellow-400" />
          <h3 className={styles.upgradeTitle}>Acesso PRO</h3>
          <p className={styles.upgradeDescription}>
            Desbloqueie todas as ferramentas de gestão financeira.
          </p>
          <Link href="/assinatura" className={styles.upgradeButton}>
            Tornar-se PRO
          </Link>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
