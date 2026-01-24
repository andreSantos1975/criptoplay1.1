import { Metadata } from 'next';
import styles from '../termos/termos.module.css'; // Reutilizando os estilos dos Termos
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';

export const metadata: Metadata = {
  title: 'Disclaimer Legal | CriptoPlay',
  description: 'Aviso legal sobre os riscos do mercado de criptomoedas e o uso da plataforma CriptoPlay.',
};

const DisclaimerPage = () => {
  return (
    <>
      <Navbar />
      <main className={styles.mainContainer}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>Disclaimer Legal</h1>
          <p className={styles.lastUpdated}>Última atualização: 24 de janeiro de 2026</p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Finalidade Educacional</h2>
            <p>
              A plataforma CriptoPlay e todo o seu conteúdo têm finalidade exclusivamente educacional e informativa. As ferramentas, cursos e simulações são projetados para fins de aprendizado e desenvolvimento de habilidades em um ambiente controlado.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Não é Aconselhamento Financeiro</h2>
            <p>
              A CriptoPlay não é uma consultoria de investimentos, corretora ou instituição financeira. <strong>Não oferecemos consultoria financeira, de investimentos, jurídica ou tributária.</strong> Nenhuma informação contida na plataforma deve ser interpretada como uma recomendação de compra, venda ou manutenção de qualquer ativo.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Inexistência de Garantia de Resultados</h2>
            <p>
              A CriptoPlay isenta-se expressamente de qualquer garantia ou promessa de rentabilidade, lucro ou resultados financeiros. O desempenho passado, seja real ou simulado, não é garantia de resultados futuros. Todas as projeções e exemplos são puramente ilustrativos.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Risco do Mercado de Criptomoedas</h2>
            <p>
              O mercado de criptomoedas é inerentemente volátil e envolve riscos elevados, que podem resultar na <strong>perda total do capital investido</strong>. Ao utilizar nossa plataforma, você reconhece e assume integralmente todos os riscos associados a este mercado.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Responsabilidade do Usuário</h2>
            <p>
              As decisões de investimento e as estratégias financeiras são de <strong>responsabilidade exclusiva do usuário</strong>. A CriptoPlay não se responsabiliza por quaisquer perdas ou danos, diretos ou indiretos, decorrentes do uso das informações ou ferramentas disponibilizadas.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Busque Aconselhamento Profissional</h2>
            <p>
              Recomendamos fortemente que você busque o aconselhamento de um profissional financeiro qualificado antes de tomar qualquer decisão de investimento. Não baseie suas decisões financeiras unicamente no conteúdo apresentado na CriptoPlay.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default DisclaimerPage;
