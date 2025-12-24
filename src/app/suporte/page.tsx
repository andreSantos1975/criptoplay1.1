import Link from "next/link";
import { Ticket, FileText, Activity } from "lucide-react";
import styles from "./support.module.css";

export default function SupportPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Suporte Técnico</h1>
        <p className={styles.subtitle}>
          Encontrou um problema ou precisa de ajuda técnica? Selecione a melhor opção abaixo para resolvermos isso rapidamente.
        </p>
      </header>

      <div className={styles.grid}>
        {/* Abrir Ticket */}
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <Ticket className="w-6 h-6" />
          </div>
          <h2 className={styles.cardTitle}>Abrir Chamado</h2>
          <p className={styles.cardDescription}>
            Relate bugs, erros na plataforma ou problemas com pagamentos. Nossa equipe técnica responderá em até 24h.
          </p>
          <Link href="/contato?subject=Suporte+Tecnico" className={styles.button}>
            Abrir Ticket
          </Link>
        </div>

        {/* Chat Automático - Comentado para uso futuro
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className={styles.cardTitle}>Chat Inteligente</h2>
          <p className={styles.cardDescription}>
            Tire dúvidas instantâneas com nosso assistente de IA. Ele pode ajudar com configurações e navegação.
          </p>
          <Link href="/central-ajuda" className={`${styles.button} ${styles.secondaryButton}`}>
            Ir para Central de Ajuda
          </Link>
        </div>
        */}

        {/* Documentação - REMOVIDO */}
      </div>

      <div className={styles.statusSection}>
        <div className={styles.statusInfo}>
          <div className={styles.statusIndicator}></div>
          <span className={styles.statusText}>Todos os sistemas operacionais</span>
        </div>
        <div className="text-gray-400 text-sm">
          Última atualização: Hoje, 09:45
        </div>
      </div>
    </div>
  );
}
