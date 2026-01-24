import { Metadata } from 'next';
import styles from '../termos/termos.module.css'; // Reutilizando os estilos dos Termos
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade | CriptoPlay',
  description: 'Entenda como a CriptoPlay coleta, usa e protege seus dados.',
};

const PoliticaDePrivacidadePage = () => {
  return (
    <>
      <Navbar />
      <main className={styles.mainContainer}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>Política de Privacidade</h1>
          <p className={styles.lastUpdated}>Última atualização: 24 de janeiro de 2026</p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Introdução</h2>
            <p>
              A sua privacidade é fundamental para a CriptoPlay (&quot;nós&quot;, &quot;nosso&quot;). Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações pessoais quando você utiliza nossa Plataforma. Ao usar a CriptoPlay, você concorda com as práticas descritas aqui.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Informações que Coletamos</h2>
            <p>Coletamos diferentes tipos de informações para fornecer e melhorar nossos serviços:</p>
            <ul>
              <li>
                <strong>Informações de Cadastro:</strong> Ao criar uma conta, coletamos seu nome, endereço de e-mail e senha. Se você assinar um plano pago, nosso processador de pagamentos (Mercado Pago) coletará suas informações de pagamento. Nós não armazenamos os detalhes do seu cartão de crédito.
              </li>
              <li>
                <strong>Informações de Uso da Plataforma:</strong> Registramos sua atividade, como os cursos que você acessa, seu progresso, trades realizados no simulador e interações com nossas ferramentas.
              </li>
              <li>
                <strong>Cookies e Tecnologias Semelhantes:</strong> Usamos cookies para manter sua sessão ativa, personalizar sua experiência e analisar o tráfego do site. Você pode gerenciar os cookies através das configurações do seu navegador.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Como Usamos Suas Informações</h2>
            <p>Utilizamos suas informações para as seguintes finalidades:</p>
            <ul>
              <li>Para operar e manter a Plataforma, incluindo autenticação de usuários e processamento de assinaturas.</li>
              <li>Para personalizar sua experiência de aprendizado e exibir seu progresso.</li>
              <li>Para nos comunicarmos com você sobre sua conta, atualizações da plataforma e ofertas promocionais (das quais você pode optar por sair).</li>
              <li>Para monitorar e analisar o uso da plataforma, visando melhorar nossos serviços e desenvolver novas funcionalidades.</li>
              <li>Para garantir a segurança da plataforma e prevenir fraudes.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Compartilhamento de Informações</h2>
            <p>Nós não vendemos suas informações pessoais. Podemos compartilhar suas informações com terceiros apenas nas seguintes circunstâncias:</p>
            <ul>
              <li>
                <strong>Provedores de Serviço:</strong> Trabalhamos com empresas terceirizadas que nos auxiliam na operação da plataforma (ex: provedores de nuvem, processadores de pagamento). Eles têm acesso limitado às suas informações e são contratualmente obrigados a protegê-las.
              </li>
              <li>
                <strong>Obrigações Legais:</strong> Podemos divulgar suas informações se formos obrigados por lei, ou para proteger nossos direitos, propriedade ou segurança, ou os de outros.
              </li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso, alteração, divulgação ou destruição não autorizada. No entanto, nenhum sistema é 100% seguro, e não podemos garantir a segurança absoluta de seus dados.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Seus Direitos (LGPD)</h2>
            <p>
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de:
            </p>
            <ul>
              <li>Confirmar a existência de tratamento de seus dados.</li>
              <li>Acessar seus dados pessoais.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei.</li>
              <li>Solicitar a portabilidade dos dados a outro fornecedor de serviço.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
            </ul>
            <p>Para exercer seus direitos, entre em contato conosco através do e-mail listado abaixo.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações publicando a nova política nesta página e atualizando a data da &quot;última atualização&quot;.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Contato</h2>
            <p>
              Se você tiver alguma dúvida sobre esta Política de Privacidade ou sobre nossas práticas, entre em contato conosco em:{' '}
              <a href="mailto:contato@cryptoplay.com.br">contato@cryptoplay.com.br</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PoliticaDePrivacidadePage;
