import React from 'react';
import styles from './ProfileComponents.module.css'; // Reutilizar estilos existentes

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean; // Para desabilitar botões durante a ação
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  message,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <p className={styles.modalMessage}>{message}</p>
        <div className={styles.modalActions}>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={styles.btnDanger} // Confirmar pode ser uma ação perigosa (cancelamento)
          >
            {isLoading ? 'Confirmando...' : 'Confirmar'}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={styles.btnSecondary} // Cancelar como uma ação secundária
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
