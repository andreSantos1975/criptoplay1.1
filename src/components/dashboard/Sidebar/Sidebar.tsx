import Link from 'next/link';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <aside className={styles.topNav}>
      <h2 className={styles.title}>SeuFluxo</h2>
      <nav className={styles.nav}>
        {/* <Link href="/contas" className={styles.link}>Contas/Cartões</Link> */}
        <Link href="/relatorios" className={styles.link}>Relatórios</Link>
        <Link href="/alertas" className={styles.link}>Alertas</Link>
        <Link href="/orcamento-anual" className={styles.link}>Orçamento Anual</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
