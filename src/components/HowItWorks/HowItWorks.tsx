import { UserPlus, Search, TrendingUp, Shield } from "lucide-react";
import styles from './HowItWorks.module.css';

const steps = [
  {
    icon: UserPlus,
    title: "Cadastre-se",
    description: "Crie sua conta em poucos minutos com nosso processo simplificado."
  },
  {
    icon: Search,
    title: "Analise o Mercado",
    description: "Análise de tendências pela inteligência artificial para identificar e sugerir oportunidades."
  },

  {
    icon: TrendingUp,
    title: "Execute Trades no Simulador",
    description: "Faça negociações inteligentes com nossa interface intuitiva e execução rápida no simulador."
  },
  {
    icon: Shield,
    title: "Acompanhe Resultados",
    description: "Monitore seu portfólio, e otimize suas estratégias de investimento."
  }
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className={styles.howItWorksSection}>
      <div className={styles.container}>
        <div className={`${styles.textCenter} ${styles.marginBottom16}`}>
          <h2 className={styles.heading}>
            Como Funciona
          </h2>
          <p className={styles.subheading}>
            Comece a investir em criptomoedas em 4 passos simples e seguros
          </p>
        </div>

        <div className={styles.grid}>
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                className={styles.cardWrapper}
              >
                <div className={styles.stepNumber}>
                  {index + 1}
                </div>

                <div className={styles.gradientCard}>
                  <div className={styles.iconContainer}>
                    <IconComponent className={styles.icon} />
                  </div>
                  
                  <h3 className={styles.title}>
                    {step.title}
                  </h3>
                  
                  <p className={styles.description}>
                    {step.description}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className={styles.connector} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
