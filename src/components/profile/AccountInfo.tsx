import React from 'react';
import { Mail } from "lucide-react";
import styles from './ProfileComponents.module.css';

interface AccountInfoProps {
  email: string;
}

const AccountInfo = ({ email }: AccountInfoProps) => {
  return (
    <div className={styles.profileCard} style={{ animationDelay: "0.1s" }}>
      <h2 className={styles.title}>Informações da Conta</h2>
      
      <div className={styles.flexCenter}>
        <Mail className={`${styles.mutedText}`} size={20} />
        <span className={styles.text}>{email}</span>
      </div>
    </div>
  );
};

export default AccountInfo;
