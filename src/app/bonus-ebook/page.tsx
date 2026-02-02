import Link from "next/link";
import { CheckCircle, Gift } from "lucide-react";
import styles from "./bonus.module.css";

export default function BonusEbookPage() {
  const annualPrice = "99,90"; // O valor da assinatura anual especial

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Gift className="w-12 h-12 text-yellow-400" />
        <h1 className={styles.title}>Seu Bônus Exclusivo Está Aqui!</h1>
        <p className={styles.subtitle}>
          Parabéns por adquirir o e-book! Desbloqueie agora seu acesso completo à plataforma CriptoPlay com uma oferta única.
        </p>
      </header>

      <div className={styles.pricingCard}>
        <h2 className={styles.planName}>Plano Anual Premium</h2>
        <p className={styles.originalPrice}>De <span className={styles.strikethrough}>R$ 238,80</span> por</p>
        <div className={styles.price}>
          R$ {annualPrice}<span>/ano</span>
        </div>
        <p className={styles.period}>Acesso completo por 12 meses.</p>

        <ul className={styles.featuresList}>
          <li>
            <CheckCircle className="w-5 h-5" />
            Acesso ilimitado ao Simulador Pro
          </li>
          <li>
            <CheckCircle className="w-5 h-5" />
            Todos os cursos e módulos avançados
          </li>
          <li>
            <CheckCircle className="w-5 h-5" />
            Métricas de trading exclusivas
          </li>
          <li>
            <CheckCircle className="w-5 h-5" />
            Alertas de mercado personalizáveis
          </li>
          <li>
            <CheckCircle className="w-5 h-5" />
            Suporte prioritário
          </li>
        </ul>

        {/* Link para a página de assinatura com o plano especial */}
        <Link href="/assinatura?oferta=anual_promo" className={styles.subscribeButton}>
          Quero Meu Acesso Anual!
        </Link>
        <p className={styles.guarantee}>Garantia de 7 dias. Cancele quando quiser.</p>
      </div>
    </div>
  );
}
