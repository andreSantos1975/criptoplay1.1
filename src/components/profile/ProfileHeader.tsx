import React from 'react';
import styles from './ProfileComponents.module.css';

interface ProfileHeaderProps {
  name: string;
  memberSince: string;
}

const ProfileHeader = ({ name, memberSince }: ProfileHeaderProps) => {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={styles.profileCard}>
      <h2 className={styles.title}>Meu Perfil</h2>
      
      <div className={styles.flexCenter}>
        <div className={styles.avatarCircle}>
          {initial}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className={styles.text} style={{ fontSize: '1.125rem', fontWeight: 600 }}>{name}</h3>
          <p className={styles.mutedText}>Membro desde {memberSince}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
