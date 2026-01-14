import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import styles from './ProfileComponents.module.css';

interface ChangePasswordProps {
  onUpdate: (currentPassword: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
}

const ChangePassword = ({ onUpdate, isLoading }: ChangePasswordProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(currentPassword, newPassword);
  };

  return (
    <div className={styles.profileCard} style={{ animationDelay: "0.3s" }}>
      <div className={`${styles.flexCenter} mb-4`} style={{ marginBottom: '1rem' }}>
        <Lock className={styles.iconPrimary} size={20} />
        <h2 className={styles.title} style={{ marginBottom: 0 }}>Alterar Senha</h2>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.spaceY4}>
        <div className={styles.spaceY2}>
          <label htmlFor="current-password" className={styles.label}>
            Senha Atual
          </label>
          <div className={styles.relative}>
            <input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className={`${styles.inputField}`}
              style={{ paddingRight: '3rem' }}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className={styles.eyeButton}
            >
              {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        
        <div className={styles.spaceY2}>
          <label htmlFor="new-password" className={styles.label}>
            Nova Senha
          </label>
          <div className={styles.relative}>
            <input
              id="new-password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={`${styles.inputField}`}
              style={{ paddingRight: '3rem' }}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className={styles.eyeButton}
            >
              {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        
        <button type="submit" className={styles.btnPrimary} disabled={isLoading}>
          {isLoading ? 'Atualizando...' : 'Atualizar Senha'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
