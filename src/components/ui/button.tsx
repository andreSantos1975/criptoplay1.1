import React from 'react';
import styles from './button.module.css'; // Import CSS Module

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'cta';
  size?: 'default' | 'sm' | 'lg' | 'xl';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'default', size = 'default', className, ...props }) => {
  const buttonClasses = `${styles.base || ''} ${styles[`variant-${variant}`] || ''} ${styles[`size-${size}`] || ''} ${className || ''}`.trim();
  console.log(`Button variant: ${variant}, size: ${size}, generated classes: "${buttonClasses}"`);

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
};

export { Button };
