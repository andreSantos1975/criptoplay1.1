import React from 'react';
import Image from 'next/image';
import styles from './hall-da-fama.module.css';
import { getHallOfFameData, HallOfFameEntry } from '@/lib/ranking';


// Group data by month and year
function groupRankings(rankings: HallOfFameEntry[]) {
  return rankings.reduce((acc, rank) => {
    const key = `${rank.month}/${rank.year}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(rank);
    return acc;
  }, {} as Record<string, HallOfFameEntry[]>);
}

export default async function HallOfFamePage() {
  // Fetch data directly from the database
  const data = await getHallOfFameData();
  const groupedData = groupRankings(data);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🏆 Hall da Fama 🏆</h1>
      <p className={styles.subtitle}>
        O registro histórico dos melhores competidores da plataforma.
      </p>

      {Object.keys(groupedData).length === 0 ? (
        <p>Ainda não há dados no Hall da Fama. O primeiro ranking será fechado no início do próximo mês!</p>
      ) : (
        Object.entries(groupedData).map(([period, ranks]) => (
          <div key={period} className={styles.periodContainer}>
            <h2 className={styles.periodTitle}>Ranking de {period}</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Posição</div>
                <div>Usuário</div>
                <div>ROI Final</div>
              </div>
              {ranks.map((rank) => (
                <div key={rank.id} className={styles.tableRow}>
                  <div className={styles.rankPosition}>
                    <span>{rank.rankPosition}º</span>
                  </div>
                  <div className={styles.userCell}>
                    <Image
                      src={rank.user.image || `https://api.dicebear.com/7.x/adventurer/png?seed=${rank.user.id}`}
                      alt={rank.user.username || 'Usuário anônimo'}
                      width={40}
                      height={40}
                      className={styles.avatar}
                    />
                    <span>{rank.user.username || 'Usuário Anônimo'}</span>
                  </div>
                  <div className={`${styles.roi} ${rank.roiPercentage >= 0 ? styles.positive : styles.negative}`}>
                    {rank.roiPercentage.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
