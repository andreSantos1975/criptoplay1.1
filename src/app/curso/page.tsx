import styles from './CoursePage.module.css';

export default function CoursePage() {
  return (
    <div className={styles.welcomeContainer}>
      <h1 className={styles.welcomeTitle}>Bem-vindo à Jornada Cripto</h1>
      <p className={styles.welcomeText}>
        Selecione um capítulo na barra lateral para começar seus estudos.
      </p>
    </div>
  );
}
