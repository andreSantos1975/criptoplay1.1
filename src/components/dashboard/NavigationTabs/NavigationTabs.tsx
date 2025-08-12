import styles from "./NavigationTabs.module.css";

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: "painel", label: "Painel Geral" },
  { id: "pessoal", label: "Finanças Pessoais" },
  { id: "analise", label: "Gráfico de Análise Técnica" },
  { id: "relatorios", label: "Relatórios" },
];

export const NavigationTabs = ({ activeTab, onTabChange }: NavigationTabsProps) => {
  return (
    <nav className={styles.tabsContainer}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tabButton} ${
            activeTab === tab.id ? styles.activeTab : ""
          }`}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};
