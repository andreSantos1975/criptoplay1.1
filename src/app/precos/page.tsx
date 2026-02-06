"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { CheckCircle } from "lucide-react";
import styles from "./pricing.module.css";
import CpfAlertModal from '@/components/profile/CpfAlertModal'; // Importar o novo modal de alerta

type Plan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  isMostPopular?: boolean;
};

const plans: Plan[] = [
    {
        id: "started",
        name: "Started",
        description: "Para quem está começando a explorar o mundo cripto.",
        monthlyPrice: 0,
        annualPrice: 0,
        features: [
          "Acesso aos módulos introdutórios do curso",
          "Simulador com funcionalidades limitadas",
          "Participação no Ranking da comunidade",
          "20 mensagens/mês com o Chatbot IA",
        ],
      },
      {
        id: "pro",
        name: "Pro",
        description: "A melhor escolha para traders e investidores ativos.",
        monthlyPrice: 29.9,
        annualPrice: 299.9,
        features: [
          "Tudo do plano Started",
          "Acesso completo a todos os cursos e módulos",
          "Simulador PRO com trading de Futuros",
          "Criação e backtest de estratégias",
          "Relatórios de performance básicos",
          "100 mensagens/mês com o Chatbot IA",
        ],
        isMostPopular: true,
      },
      {
        id: "premium",
        name: "Premium",
        description: "Para o trader profissional que busca a máxima performance.",
        monthlyPrice: 49.9,
        annualPrice: 499.9,
        features: [
          "Tudo do plano Pro",
          "Métricas de trading avançadas e exclusivas",
          "Relatórios de performance detalhados",
          "Alertas de mercado ilimitados",
          "Suporte prioritário via WhatsApp",
          "Mensagens ilimitadas com o Chatbot IA",
        ],
      },
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [cpf, setCpf] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // Manter error para outros fins se houver
  const [showCpfAlertModal, setShowCpfAlertModal] = useState(false); // NOVO ESTADO

  const handleSubscription = async (plan: Plan) => {
    if (status === "unauthenticated") {
      signIn("google"); // Ou redirecione para sua página de login
      return;
    }
    
    if (plan.monthlyPrice === 0) {
      window.location.href = "/dashboard";
      return;
    }

    if (!cpf.trim()) {
        // setError("Por favor, informe seu CPF para continuar."); // SUBSTITUIDO PELO MODAL
        setShowCpfAlertModal(true); // Abre o modal de alerta de CPF
        return;
    }

    setLoadingPlan(plan.id);
    setError(null); // Limpar qualquer erro anterior

    const isAnnual = billingCycle === "annual";
    const amount = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    const frequency = isAnnual ? 12 : 1;

    try {
      if (!session?.user?.email) {
        throw new Error("Não foi possível obter o e-mail do usuário. Faça login novamente.");
      }

      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          planName: `${plan.name} - ${isAnnual ? "Anual" : "Mensal"}`,
          amount: amount,
          description: plan.description,
          planType: "RECURRING",
          frequency: frequency,
          payerEmail: session.user.email,
          cpf: cpf.replace(/\D/g, ''), // Envia apenas os números do CPF
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ocorreu um erro ao criar a assinatura.");
      }

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
         throw new Error("URL de pagamento não recebida do servidor.");
      }

    } catch (err: any) {
      setError(err.message); // Mantém o erro para outros tipos de falha na API
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCloseCpfAlertModal = () => {
    setShowCpfAlertModal(false);
    // Opcional: focar no campo CPF após fechar o modal
    // document.getElementById('cpf')?.focus();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Planos e Preços</h1>
        <p className={styles.subtitle}>
          Escolha o plano ideal para sua jornada no mercado cripto. Cancele
          quando quiser.
        </p>
      </header>

      <div className={styles.toggleContainer}>
        <span className={billingCycle === "monthly" ? styles.activeText : ""}>Mensal</span>
        <label className={styles.switch}>
          <input
            type="checkbox"
            onChange={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
          />
          <span className={styles.slider}></span>
        </label>
        <span className={billingCycle === "annual" ? styles.activeText : ""}>Anual (Economize 2 meses)</span>
      </div>

      <div className={styles.cpfContainer}>
        <label htmlFor="cpf" className={styles.cpfLabel}>CPF (necessário para pagamento)</label>
        <input
          id="cpf"
          type="text"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          placeholder="000.000.000-00"
          className={styles.cpfInput}
        />
        {/* {error && <p className={styles.error}>{error}</p>} // REMOVIDO */}
      </div>

      <div className={styles.pricingGrid}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`${styles.pricingCard} ${plan.isMostPopular ? styles.mostPopular : ""}`}
          >
            {plan.isMostPopular && (<div className={styles.popularBadge}>MAIS POPULAR</div>)}
            <h2 className={styles.planName}>{plan.name}</h2>
            <p className={styles.period}>{plan.description}</p>
            <div className={styles.price}>
              R${" "}
              {plan.monthlyPrice > 0
                ? (billingCycle === "monthly"
                    ? plan.monthlyPrice.toFixed(2)
                    : (plan.annualPrice / 12).toFixed(2)
                  ).replace(".", ",")
                : "0"}
              <span>
                {plan.monthlyPrice > 0
                  ? billingCycle === "monthly" ? "/mês" : "/mês no plano anual"
                  : ""}
              </span>
            </div>

            <ul className={styles.featuresList}>
              {plan.features.map((feature) => (<li key={feature}><CheckCircle className="w-5 h-5" />{feature}</li>))}
            </ul>

            <button
              onClick={() => handleSubscription(plan)}
              className={styles.subscribeButton}
              disabled={loadingPlan === plan.id || (status === 'loading')}
            >
              {loadingPlan === plan.id ? "Carregando..." : plan.monthlyPrice === 0 ? "Começar Agora" : "Assinar Agora"}
            </button>
          </div>
        ))}
      </div>

      {showCpfAlertModal && (
        <CpfAlertModal
          message="Por favor, informe seu CPF para continuar com a assinatura. Ele é necessário para processar o pagamento."
          onClose={handleCloseCpfAlertModal}
        />
      )}
    </div>
  );
}