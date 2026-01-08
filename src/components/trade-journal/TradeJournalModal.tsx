'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import styles from './TradeJournalModal.module.css';

interface TradeJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeType: 'spot' | 'futures';
  tradeId: string; // ID da Trade ou FuturesPosition
  initialNotes?: string;
  initialSentiment?: string;
  initialStrategy?: string;
}

interface UpdateJournalPayload {
  notes?: string;
  sentiment?: string;
  strategy?: string;
}

const updateSpotTradeJournal = async (tradeId: string, payload: UpdateJournalPayload) => {
  const response = await fetch(`/api/simulator/trades/${tradeId}/journal`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Falha ao atualizar diário de trade Spot.');
  }
  return response.json();
};

const updateFuturesPositionJournal = async (positionId: string, payload: UpdateJournalPayload) => {
  const response = await fetch(`/api/futures/positions/${positionId}/journal`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Falha ao atualizar diário de trade Futuros.');
  }
  return response.json();
};

export const TradeJournalModal = ({
  isOpen,
  onClose,
  tradeType,
  tradeId,
  initialNotes = '',
  initialSentiment = '',
  initialStrategy = '',
}: TradeJournalModalProps) => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(initialNotes);
  const [sentiment, setSentiment] = useState(initialSentiment);
  const [strategy, setStrategy] = useState(initialStrategy);

  const mutation = useMutation({
    mutationFn: (payload: UpdateJournalPayload) => {
      if (tradeType === 'spot') {
        return updateSpotTradeJournal(tradeId, payload);
      } else {
        return updateFuturesPositionJournal(tradeId, payload);
      }
    },
    onSuccess: () => {
      toast.success('Diário de trade atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: [`${tradeType}Positions`] }); // Invalida cache para atualizar dados na UI
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar diário: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ notes, sentiment, strategy });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>Diário de Trade ({tradeType === 'spot' ? 'Spot' : 'Futuros'})</h2>
        <p>Anote o motivo da sua operação, seu sentimento e a estratégia utilizada.</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="notes">Motivo da Operação / Notas</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Ex: Entrei comprado por rompimento de resistência em X."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sentiment">Sentimento</label>
            <select
              id="sentiment"
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
            >
              <option value="">Selecione um sentimento</option>
              <option value="CONFIDENT">Confiante</option>
              <option value="FEARFUL">Com Medo</option>
              <option value="NEUTRAL">Neutro</option>
              <option value="GREED">Ganância</option>
              <option value="FOMO">FOMO (Fear Of Missing Out)</option>
              <option value="OVERCONFIDENT">Excessivamente Confiante</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="strategy">Estratégia</label>
            <input
              id="strategy"
              type="text"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="Ex: Rompimento, Reversão, Trend Following"
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={mutation.isPending}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton} disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};