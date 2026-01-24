import { Metadata } from 'next';
import styles from './termos.module.css';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Uso | CriptoPlay',
  description: 'Leia os termos e condições de uso da plataforma CriptoPlay.',
};

const TermosDeUsoPage = () => {
  return (
    <>
      <Navbar />
      <main className={styles.mainContainer}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>TERMOS DE USO</h1>
          <p className={styles.lastUpdated}>Última atualização: 24 de janeiro de 2026</p>

          <section className={styles.section}>
            <p>
              O presente instrumento regula as condições de acesso e utilização da plataforma CriptoPlay, disponibilizada ao usuário na forma de ambiente digital de caráter informativo e educacional.
            </p>
            <p>
              Ao acessar, navegar ou utilizar qualquer funcionalidade da plataforma, o usuário declara ter lido, compreendido e aceitado integralmente os presentes Termos de Uso e nossa{' '}
              <Link href="/politica-de-privacidade" className={styles.link}>
                Política de Privacidade
              </Link>.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Definições</h2>
            <p>Para os fins destes Termos, os seguintes termos terão os seguintes significados:</p>
            <ul>
              <li><strong>&quot;Plataforma&quot;</strong>: Refere-se ao site e a todos os serviços digitais oferecidos pela CriptoPlay.</li>
              <li><strong>&quot;Usuário&quot;</strong>: Qualquer pessoa física ou jurídica que acesse ou utilize a Plataforma.</li>
              <li><strong>&quot;Conteúdo&quot;</strong>: Todos os cursos, textos, vídeos, gráficos, dados e materiais disponibilizados na Plataforma.</li>
              <li><strong>&quot;Acesso Vitalício&quot;</strong>: Modalidade de acesso que perdura enquanto a Plataforma estiver ativa e operacional.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Natureza e Finalidade da Plataforma</h2>
            <p>
              A CriptoPlay possui finalidade exclusivamente educacional e informativa, não se caracterizando, em nenhuma hipótese, como:
            </p>
            <ul>
              <li>Consultoria financeira, de investimentos, jurídica ou tributária</li>
              <li>Oferta pública de investimento</li>
              <li>Recomendação personalizada de compra, venda ou manutenção de ativos</li>
            </ul>
            <p>
              Todo o conteúdo disponibilizado tem caráter meramente educativo, cabendo ao usuário a análise crítica e a tomada de decisão de forma independente.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Inexistência de Garantia ou Promessa de Resultados</h2>
            <p>
              A CriptoPlay não garante, promete ou assegura qualquer tipo de resultado financeiro, rentabilidade, lucro ou performance.
            </p>
            <p>O usuário reconhece expressamente que:</p>
            <ul>
              <li>Resultados passados não constituem garantia de resultados futuros</li>
              <li>Exemplos, simulações ou projeções possuem caráter ilustrativo</li>
              <li>Não há compromisso de retorno financeiro sob nenhuma circunstância</li>
            </ul>
            <p>Qualquer expectativa de ganho é de responsabilidade exclusiva do usuário.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Reconhecimento dos Riscos do Mercado de Criptomoedas</h2>
            <p>
              O usuário declara estar plenamente ciente de que o mercado de criptomoedas envolve riscos elevados, incluindo, mas não se limitando a:
            </p>
            <ul>
              <li>Alta volatilidade de preços</li>
              <li>Possibilidade de perda total do capital</li>
              <li>Riscos tecnológicos, operacionais e regulatórios</li>
              <li>Mudanças legais ou fiscais que afetem o mercado</li>
            </ul>
            <p>
              Ao utilizar a plataforma, o usuário assume integralmente tais riscos, isentando a CriptoPlay de qualquer responsabilidade por prejuízos financeiros.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Propriedade Intelectual</h2>
            <p>
              Todo o Conteúdo disponibilizado na Plataforma, incluindo, mas não se limitando a, textos, gráficos, logos, vídeos e software, é de propriedade exclusiva da CriptoPlay ou de seus parceiros e é protegido pelas leis de direitos autorais. É proibida a cópia, reprodução, distribuição ou criação de obras derivadas sem a autorização expressa da CriptoPlay.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Regras de Conduta e Uso Aceitável</h2>
            <p>O usuário concorda em não usar a Plataforma para qualquer finalidade ilegal ou proibida. Fica expressamente vedado:</p>
            <ul>
              <li>Compartilhar o acesso de sua conta com terceiros.</li>
              <li>Utilizar robôs, spiders ou qualquer dispositivo automatizado para acessar ou extrair conteúdo da Plataforma.</li>
              <li>Realizar engenharia reversa do software ou dos componentes da Plataforma.</li>
              <li>Usar a Plataforma para disseminar spam, malware, ou qualquer conteúdo ofensivo, difamatório ou ilegal.</li>
              <li>Tentar obter acesso não autorizado a sistemas ou redes conectadas à Plataforma.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Modalidades de Acesso e Assinaturas</h2>
            <p>O acesso à plataforma poderá ocorrer por diferentes modalidades, conforme ofertado:</p>
            <ul>
              <li><strong>Assinatura Recorrente</strong>: Cobrada mensal ou anualmente, válida enquanto os pagamentos estiverem ativos.</li>
              <li><strong>Acesso Vitalício</strong>: Concedido como bônus promocional ou condição específica, refere-se exclusivamente ao período em que a plataforma CriptoPlay estiver ativa e operacional.</li>
            </ul>
            <p>O usuário reconhece que o termo “vitalício” não implica perpetuidade absoluta e não gera direito a indenização em caso de descontinuidade da plataforma.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Cancelamento, Reembolso e Encerramento de Conta</h2>
            <p>
              <strong>Cancelamento pelo Usuário</strong>: O usuário pode cancelar sua assinatura a qualquer momento através do painel de usuário. O cancelamento cessará as cobranças futuras, mas não haverá reembolso por períodos já pagos. O acesso permanecerá ativo até o final do ciclo de faturamento vigente.
            </p>
            <p>
              <strong>Política de Reembolso</strong>: Oferecemos uma garantia de reembolso de 7 (sete) dias para a primeira assinatura. Se, dentro deste período, o usuário não estiver satisfeito, poderá solicitar o reembolso total do valor pago.
            </p>
            <p>
              <strong>Encerramento pela CriptoPlay</strong>: Reservamo-nos o direito de suspender ou encerrar a conta de qualquer usuário que violar estes Termos de Uso, sem direito a reembolso.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. Alterações, Atualizações e Descontinuidade</h2>
            <p>A CriptoPlay reserva-se o direito de, a seu exclusivo critério e a qualquer tempo, alterar, suspender, remover funcionalidades ou encerrar parcial ou totalmente a plataforma, sem aviso prévio.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. Limitação de Responsabilidade</h2>
            <p>A CriptoPlay não se responsabiliza por decisões financeiras tomadas pelo usuário, perdas diretas ou indiretas, ou falhas de mercado e de terceiros. O uso da plataforma ocorre por conta e risco exclusivo do usuário.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>11. Legislação Aplicável e Foro</h2>
            <p>
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil, ficando eleito o foro da comarca do domicílio do titular da plataforma para dirimir eventuais controvérsias.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TermosDeUsoPage;