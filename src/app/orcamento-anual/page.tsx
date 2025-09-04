import Link from 'next/link';
import styles from './orcamento-anual.module.css';

const OrcamentoAnualPage = () => {
  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backLink}>
        &larr; Voltar para Finanças
      </Link>
      <h1 className={styles.title}>Orçamento Anual</h1>
      <p>Página em construção.</p>
    </div>
  );
};

export default OrcamentoAnualPage;
