'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Target, Calendar, TrendingUp, Trash2, Plus } from 'lucide-react';
import styles from './metas.module.css';
import { PremiumLock } from '@/components/ui/PremiumLock';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

const MetasPage = () => {
  const { data: session, status } = useSession();
  const permissions = session?.user?.permissions;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  // Load from LocalStorage on mount, only if user is premium
  useEffect(() => {
    if (permissions?.isPremium) {
      const savedGoals = localStorage.getItem('financialGoals');
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
    }
  }, [permissions]);

  // Save to LocalStorage whenever goals change
  useEffect(() => {
    if (permissions?.isPremium) {
      localStorage.setItem('financialGoals', JSON.stringify(goals));
    }
  }, [goals, permissions]);
  
  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!permissions?.isPremium) {
    return (
      <div className={styles.container}>
        <PremiumLock 
          title="Metas Financeiras Personalizadas"
          message="Defina objetivos, acompanhe seu progresso e alcance seus sonhos financeiros mais rápido. Funcionalidade exclusiva para assinantes PRO."
        />
      </div>
    );
  }

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal: Goal = { id: Date.now().toString(), name, targetAmount: Number(targetAmount), currentAmount: Number(currentAmount), deadline };
    setGoals([...goals, newGoal]);
    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteGoal = (id: string) => { setGoals(goals.filter(g => g.id !== id)); };
  const resetForm = () => { setName(''); setTargetAmount(''); setCurrentAmount(''); setDeadline(''); };
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const calculateProgress = (current: number, target: number) => Math.min(100, Math.max(0, (current / target) * 100));

  return (
    <div className={styles.container}>
      <Link href="/dashboard?tab=pessoal" style={{ display: 'inline-block', marginBottom: '1rem', color: '#a1a1aa' }}>
        ← Voltar para Dashboard
      </Link>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Metas Financeiras</h1>
          <p className={styles.subtitle}>Defina seus sonhos e acompanhe seu progresso.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>
          <Plus size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
          Nova Meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#a1a1aa', border: '1px dashed #3f3f46', borderRadius: '0.5rem' }}>
          <Target size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>Você ainda não tem metas definidas.</p>
          <p>Clique em &quot;Nova Meta&quot; para começar.</p>
        </div>
      ) : (
        <div className={styles.goalsGrid}>
          {goals.map(goal => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            return (
              <div key={goal.id} className={styles.goalCard}>
                {/* ... card content ... */}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Nova Meta Financeira</h2>
            <form onSubmit={handleAddGoal}>
              {/* ... form content ... */}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetasPage;
