import React, { useState } from "react";
import { Trophy } from "lucide-react";
import styles from './ProfileComponents.module.css';

interface ChangeNicknameProps {
  currentNickname: string;
  onSave: (newNickname: string) => Promise<void>;
  isLoading: boolean;
}

const ChangeNickname = ({ currentNickname, onSave, isLoading }: ChangeNicknameProps) => {
  const [nickname, setNickname] = useState(currentNickname);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(nickname);
  };

  return (
    <div className={styles.profileCard} style={{ animationDelay: "0.2s" }}>
      <div className={`${styles.flexCenter} mb-4`} style={{ marginBottom: '1rem' }}>
        <Trophy className={styles.iconPrimary} size={20} />
        <h2 className={styles.title} style={{ marginBottom: 0 }}>Alterar Apelido (Ranking)</h2>
      </div>
      
      <form onSubmit={handleSave} className={styles.spaceY4}>
        <div className={styles.spaceY2}>
          <label htmlFor="nickname" className={styles.label}>
            Novo Apelido
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Trader007"
            className={styles.inputField}
            disabled={isLoading}
          />
        </div>
        
        <button type="submit" className={styles.btnPrimary} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Apelido'}
        </button>
      </form>
    </div>
  );
};

export default ChangeNickname;
