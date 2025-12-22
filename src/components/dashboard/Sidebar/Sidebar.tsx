'use client';

import Link from 'next/link';
import styles from './Sidebar.module.css';
import { useAlertNotification } from '@/hooks/useAlertNotification';

const Sidebar = () => {
  const { notificationCount } = useAlertNotification();

  return (
    <aside className={styles.topNav}>
      <h2 className={styles.title}>SeuFluxo</h2>
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
    </aside>
  );
};

export default Sidebar;
