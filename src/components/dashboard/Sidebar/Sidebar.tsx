'use client';

import Link from 'next/link';
import styles from './Sidebar.module.css';
import { useAlertNotification } from '@/hooks/useAlertNotification';
import { useSession } from 'next-auth/react';
import { Lock, Sparkles } from 'lucide-react';

// 1. Links definidos como dados para facilitar a manutenção e o mapeamento
const navLinks = [
  { href: '/contas', label: 'Contas/Cartões', premium: true },
  { href: '/relatorios', label: 'Relatórios', premium: true },
  { href: '/alertas', label: 'Alertas', premium: true },
  { href: '/orcamento-anual', label: 'Orçamento Anual', premium: true },
  { href: '/calculadora-juros', label: 'Calculadora de Juros', premium: false }, // Exemplo de link não-premium
  { href: '/metas', label: 'Metas Financeiras', premium: true },
];

const Sidebar = () => {
  const { data: session, status } = useSession();
  const { notificationCount } = useAlertNotification();
  
  const permissions = session?.user?.permissions;
  const isLoading = status === 'loading';

  // O card de upgrade só aparece se o usuário não for premium E não tiver acesso Hotmart
  // (ou seja, um usuário completamente novo, sem bônus)
  const showUpgradeCard = !permissions?.isPremium && !permissions?.hasHotmartAccess;

  if (isLoading) {
    return (
      <aside className={styles.topNav}>
        <h2 className={styles.title}>SeuFluxo</h2>
        <div className={styles.loadingState}>
          <p>Carregando...</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.topNav}>
      <h2 className={styles.title}>SeuFluxo</h2>
      <nav className={styles.nav}>
        {navLinks.map((link) => {
          const isLocked = link.premium && !permissions?.isPremium;

          // 2. Renderização condicional para cada link
          if (isLocked) {
            return (
              <div
                key={link.href}
                className={`${styles.link} ${styles.disabledLink}`}
                title="Funcionalidade disponível no plano PRO."
              >
                <span>{link.label}</span>
                <Lock size={16} className={styles.lockIcon} />
              </div>
            );
          }

          return (
            <Link key={link.href} href={link.href} className={styles.link}>
              {link.label}
              {link.href === '/alertas' && notificationCount > 0 && (
                <span className={styles.notificationDot}></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 3. Card de upgrade exibido condicionalmente */}
      {showUpgradeCard && (
         <div className={styles.upgradeCard}>
           <Sparkles className="h-6 w-6" style={{ color: 'yellow' }} />
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
