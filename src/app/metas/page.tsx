'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, Calendar, TrendingUp, Trash2, Plus } from 'lucide-react';
import styles from './metas.module.css';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

const MetasPage = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('financialGoals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  }, []);

  // Save to LocalStorage whenever goals change
  useEffect(() => {
    localStorage.setItem('financialGoals', JSON.stringify(goals));
  }, [goals]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal: Goal = {
      id: Date.now().toString(),
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount),
      deadline,
    };
    setGoals([...goals, newGoal]);
    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const calculateProgress = (current: number, target: number) => {
    return Math.min(100, Math.max(0, (current / target) * 100));
  };

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
          <p>Clique em "Nova Meta" para começar.</p>
        </div>
      ) : (
        <div className={styles.goalsGrid}>
          {goals.map(goal => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            return (
              <div key={goal.id} className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <div className={styles.goalName}>{goal.name}</div>
                  <button onClick={() => handleDeleteGoal(goal.id)} className={styles.deleteButton}>
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className={styles.amounts}>
                  <span className={styles.currentAmount}>{formatCurrency(goal.currentAmount)}</span>
                  <span className={styles.targetAmount}>de {formatCurrency(goal.targetAmount)}</span>
                </div>

                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBarFill} style={{ width: `${progress}%` }}></div>
                </div>

                <div className={styles.metaInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} />
                    <span>{new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: progress >= 100 ? '#22c55e' : '#a1a1aa' }}>
                    <TrendingUp size={14} />
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                </div>
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
              <div className={styles.formGroup}>
                <label className={styles.label}>Nome da Meta</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Ex: Viagem para Europa" 
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Valor Alvo (R$)</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={targetAmount} 
                  onChange={e => setTargetAmount(e.target.value)} 
                  placeholder="0.00" 
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Valor Já Guardado (R$)</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={currentAmount} 
                  onChange={e => setCurrentAmount(e.target.value)} 
                  placeholder="0.00" 
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Data Limite</label>
                <input 
                  type="date" 
                  className={styles.input} 
                  value={deadline} 
                  onChange={e => setDeadline(e.target.value)} 
                  required 
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelButton}>Cancelar</button>
                <button type="submit" className={styles.saveButton}>Criar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetasPage;
