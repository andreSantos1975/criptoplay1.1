'use client';

import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import styles from './PremiumLock.module.css';

interface PremiumLockProps {
  title?: string;
  message?: string;
}

export const PremiumLock = ({ 
  title = "Funcionalidade Exclusiva para Assinantes PRO",
  message = "Esta área contém ferramentas avançadas e relatórios disponíveis apenas para assinantes. Faça o upgrade para desbloquear todo o potencial da CriptoPlay." 
}: PremiumLockProps) => {
  return (
    <div className={styles.lockContainer}>
      <div className={styles.lockIconWrapper}>
        <Lock size={40} />
      </div>
      <h2 className={styles.lockTitle}>{title}</h2>
      <p className={styles.lockMessage}>{message}</p>
      <Link href="/precos" className={styles.upgradeButton}>
        <Sparkles size={20} className={styles.sparkleIcon} />
        Tornar-se PRO
      </Link>
    </div>
  );
};

// CSS Module para o componente
// src/components/ui/PremiumLock.module.css
/*
.lockContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  background-color: hsl(var(--card));
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border));
  margin-top: 2rem;
}

.lockIconWrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: hsl(var(--muted));
  margin-bottom: 1.5rem;
  color: hsl(var(--muted-foreground));
}

.lockTitle {
  font-size: 1.5rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin-bottom: 0.5rem;
}

.lockMessage {
  font-size: 1rem;
  color: hsl(var(--muted-foreground));
  max-width: 500px;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.upgradeButton {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary-gradient)));
  color: hsl(var(--primary-foreground));
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  text-decoration: none;
  font-weight: 500;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: var(--shadow-medium);
}

.upgradeButton:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-large);
}

.sparkleIcon {
  opacity: 0.9;
}
*/
