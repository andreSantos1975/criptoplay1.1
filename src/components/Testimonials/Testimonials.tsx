import { Star, Quote } from "lucide-react";
import styles from './Testimonials.module.css';

const testimonials = [
  {
    name: "Maria Santos",
    role: "Investidora Iniciante",
    avatar: "MS",
    content: "Comecei do zero e em 3 meses já estou vendo resultados consistentes. A plataforma é muito intuitiva e o suporte é excepcional.",
    rating: 5
  },
  {
    name: "Carlos Roberto",
    role: "Trader Profissional",
    avatar: "CR",
    content: "Migrei para esta plataforma após testar várias outras. As ferramentas de análise são profissionais e a execução é muito rápida.",
    rating: 5
  },
  {
    name: "Ana Paula Silva",
    role: "Empresária",
    avatar: "AS",
    content: "Finalmente encontrei uma plataforma confiável para diversificar meus investimentos. Segurança e simplicidade em primeiro lugar.",
    rating: 5
  }
];

const Testimonials = () => {
  return (
    <section id="depoimentos" className={styles.testimonialsSection}>
      <div className={styles.container}>
        <div className={`${styles.textCenter} ${styles.marginBottom16}`}>
          <h2 className={styles.heading}>
            O Que Nossos Clientes Dizem
          </h2>
          <p className={styles.subheading}>
            Histórias reais de pessoas que transformaram seus investimentos conosco
          </p>
        </div>

        <div className={styles.grid}>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={styles.gradientCard}
            >
              <div className={styles.quoteIcon}>
                <Quote />
              </div>

              <div className={styles.rating}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} />
                ))}
              </div>

              <p className={styles.content}>
                "{testimonial.content}"
              </p>

              <div className={styles.author}>
                <div className={styles.avatar}>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className={styles.authorName}>
                    {testimonial.name}
                  </p>
                  <p className={styles.authorRole}>
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <h3 className={styles.ctaHeading}>
              Seja o Próximo Caso de Sucesso
            </h3>
            <p className={styles.ctaDescription}>
              Junte-se a milhares de investidores que já transformaram seu futuro financeiro
            </p>
            <div className={styles.statsContainer}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>500k+</div>
                <div className={styles.statLabel}>Usuários Ativos</div>
              </div>
              <div className={styles.divider} />
              <div className={styles.statItem}>
                <div className={styles.statValue}>R$ 2.5B+</div>
                <div className={styles.statLabel}>Volume Negociado</div>
              </div>
              <div className={styles.divider} />
              <div className={styles.statItem}>
                <div className={styles.statValue}>99.9%</div>
                <div className={styles.statLabel}>Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
