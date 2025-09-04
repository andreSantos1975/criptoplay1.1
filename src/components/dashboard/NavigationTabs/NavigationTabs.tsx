import Link from "next/link";
import styles from "./NavigationTabs.module.css";

interface NavigationTabsProps {
  activeTab: string;
}

const TABS = [
  { id: "painel", label: "Painel Geral" },
  { id: "pessoal", label: "Finanças Pessoais" },
  { id: "analise", label: "Gráfico de Análise Técnica" },
  { id: "relatorios", label: "Relatórios" },
];

export const NavigationTabs = ({ activeTab }: NavigationTabsProps) => {
  return (
    <nav className={styles.tabsContainer}>
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/dashboard?tab=${tab.id}`}
          className={`${styles.tabButton} ${
            activeTab === tab.id ? styles.activeTab : ""
          }`}
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
};
