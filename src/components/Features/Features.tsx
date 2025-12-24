import { BarChart3, Shield, Clock, Headphones } from "lucide-react";
import styles from './Features.module.css';

const features = [
  {
    icon: BarChart3,
    title: "Análise em Tempo Real",
    description: "Acesse dados de mercado atualizados constantemente com gráficos avançados.",
    benefits: ["Gráficos interativos", "linhas marcadoras, stop loss e take profit", "Análise de tendências", "linha de alertas"]
  },
  {
    icon: Shield,
    title: "Rastreamento de Portfólio",
    description: "Monitore todos os seus investimentos em um só lugar com análises detalhadas de performance e diversificação e Finanças Pessoais.",
    benefits: ["Dashboard unificado", "Análise de risco", "Relatórios detalhados"]
  },
  {
    icon: Clock,
    title: "Operações Seguras",
    description: "Execute operações com total segurança através de nosso simulador avançada.",
    benefits: ["Saldo Virtual de 10 mil", "Aprendizado Operacional", "Diario de Trader"]
  },
  {
    icon: Headphones,
    title: "Suporte 24/7",
    description: "Nossa equipe especializada está sempre disponível para ajudar você a maximizar seus resultados no mercado.",
    benefits: ["Suporte pelo Whatsapp", "Consultoria especializada", "Tutoriais exclusivos"]
  }
];

const Features = () => {
  return (
    <section id="recursos" className={styles.featuresSection}>
      <div className={styles.container}>
        <div className={`${styles.textCenter} ${styles.marginBottom16}`}>
          <h2 className={styles.heading}>
            Recursos Principais
          </h2>
          <p className={styles.subheading}>
            Tudo que você precisa para ter sucesso no mercado de criptomoedas
          </p>
        </div>

        <div className={styles.grid}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className={styles.gradientCard}
              >
                <div className={styles.flexContainer}>
                  <div className={styles.iconContainer}>
                    <IconComponent className={styles.icon} />
                  </div>

                  <div className={styles.content}>
                    <h3 className={styles.title}>
                      {feature.title}
                    </h3>
                    
                    <p className={styles.description}>
                      {feature.description}
                    </p>

                    <ul className={styles.benefitsList}>
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className={styles.benefitItem}>
                          <div className={styles.benefitDot} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
