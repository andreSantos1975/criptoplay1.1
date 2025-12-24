import Link from "next/link";
import { CheckCircle } from "lucide-react";
import styles from "./pricing.module.css";

export default function PricingPage() {
  const price = "19,90"; // O valor da assinatura

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nossos Planos</h1>
        <p className={styles.subtitle}>
          Comece sua jornada no mundo das criptomoedas com o melhor custo-benefício.
        </p>
      </header>

      <div className={styles.pricingCard}>
        <h2 className={styles.planName}>Plano Premium</h2>
        <div className={styles.price}>
          R$ {price}<span>/mês</span>
        </div>
        <p className={styles.period}>Pagamento mensal, cancele quando quiser.</p>

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

        {/* Link para a página de assinatura. Ajuste conforme sua rota de assinatura. */}
        <Link href="/assinatura" className={styles.subscribeButton}>
          Assinar Agora
        </Link>
      </div>
    </div>
  );
}
