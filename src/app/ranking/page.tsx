// src/app/ranking/page.tsx
import { RankingList } from '@/components/RankingList/RankingList';
import React from 'react';

export const metadata = {
  title: 'Ranking de Traders - CriptoGame',
  description: 'Veja os traders mais bem-sucedidos do simulador da CriptoGame.',
};

export default function RankingPage() {
  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}> {/* 4rem for Navbar padding */}
      <RankingList />
    </div>
  );
}
