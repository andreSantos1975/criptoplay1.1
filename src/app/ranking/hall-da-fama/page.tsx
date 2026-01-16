import React from 'react';
import Image from 'next/image';
import styles from './hall-da-fama.module.css';

// Define the type for the ranking data we expect
interface RankingData {
  id: string;
  userId: string;
  month: number;
  year: number;
  finalBalance: number;
  roiPercentage: number;
  rankPosition: number;
  user: {
    username: string;
    image?: string | null;
  };
}

async function getHallOfFameData(): Promise<RankingData[]> {
  // Use NEXT_PUBLIC_BASE_URL which should be set in your environment variables
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  console.log(`Fetching Hall of Fame data from: ${baseUrl}/api/ranking/hall-da-fama`);

  const response = await fetch(`${baseUrl}/api/ranking/hall-da-fama`, {
    cache: 'no-store', // Always fetch fresh data
  });

  if (!response.ok) {
    // This will be caught by the nearest error.js / error.tsx
    throw new Error('Falha ao carregar os dados do Hall da Fama.');
  }

  return response.json();
}

// Group data by month and year
function groupRankings(rankings: RankingData[]) {
  return rankings.reduce((acc, rank) => {
    const key = `${rank.month}/${rank.year}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(rank);
    return acc;
  }, {} as Record<string, RankingData[]>);
}

export default async function HallOfFamePage() {
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
                      src={rank.user.image || `https://api.dicebear.com/7.x/adventurer/png?seed=${rank.userId}`}
                      alt={rank.user.username}
                      width={40}
                      height={40}
                      className={styles.avatar}
                    />
                    <span>{rank.user.username}</span>
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
