import React from 'react';
import styles from './ProfileComponents.module.css'; // Reutilizar estilos existentes

interface CpfAlertModalProps {
  message: string;
  onClose: () => void;
}

const CpfAlertModal: React.FC<CpfAlertModalProps> = ({ message, onClose }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <p className={styles.modalMessage}>{message}</p>
        <div className={styles.modalActions}>
          <button
            onClick={onClose}
            className={styles.btnPrimary} // Botão primário para fechar o alerta
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  );
};

export default CpfAlertModal;