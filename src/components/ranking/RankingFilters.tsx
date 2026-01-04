import { cn } from "@/lib/utils";
import styles from "@/app/ranking/ranking.module.css";

interface FilterOption {
  value: string;
  label: string;
}

interface RankingFiltersProps {
  periodOptions: FilterOption[];
  marketOptions: FilterOption[];
  sortOptions: FilterOption[];
  selectedPeriod: string;
  selectedMarket: string;
  selectedSort: string;
  onPeriodChange: (value: string) => void;
  onMarketChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

function FilterGroup({ 
  label, 
  options, 
  selected, 
  onChange 
}: { 
  label: string; 
  options: FilterOption[]; 
  selected: string; 
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.filterGroup}>
      <span className={styles.filterLabel}>{label}</span>
      <div className={styles.filterOptions}>
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              styles.filterBtn,
              selected === option.value
                ? styles.filterBtnActive
                : styles.filterBtnInactive
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RankingFilters({
  periodOptions,
  marketOptions,
  sortOptions,
  selectedPeriod,
  selectedMarket,
  selectedSort,
  onPeriodChange,
  onMarketChange,
  onSortChange,
}: RankingFiltersProps) {
  return (
    <div className={styles.filtersCard}>
      <div className={styles.filtersWrapper}>
        <FilterGroup 
          label="Período" 
          options={periodOptions} 
          selected={selectedPeriod} 
          onChange={onPeriodChange} 
        />
        <FilterGroup 
          label="Mercado" 
          options={marketOptions} 
          selected={selectedMarket} 
          onChange={onMarketChange} 
        />
        <FilterGroup 
          label="Ordenar por" 
          options={sortOptions} 
          selected={selectedSort} 
          onChange={onSortChange} 
        />
      </div>
    </div>
  );
}
