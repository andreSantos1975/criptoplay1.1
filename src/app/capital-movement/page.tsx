import CapitalMovementForm from '@/components/CapitalMovementForm/CapitalMovementForm';
import styles from './page.module.css';

const Index = () => {
  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={`${styles.textCenter} ${styles.marginBottom12}`}>
          <h1 className={`${styles.heading} ${styles.marginBottom4}`}>
            Dashboard Financeiro
          </h1>
          <p className={styles.subheading}>
            Gerencie seus movimentos de capital de forma simples e eficiente
          </p>
        </div>
        
        <CapitalMovementForm />
        
        <div className={`${styles.marginTop8} ${styles.textCenter}`}>
          <p className={styles.smallText}>
            Registre seus aportes e retiradas para manter o controle financeiro
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
