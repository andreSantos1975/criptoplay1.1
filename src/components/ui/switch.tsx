import React from 'react';
import { cn } from '@/lib/utils';
import styles from './switch.module.css';

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        className={cn(styles.root, className)}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        ref={ref}
        {...props}
      >
        <span className={styles.thumb} data-state={checked ? "checked" : "unchecked"} />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
