"use client";

import * as React from "react";
import styles from "./input.module.css";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { _dummy?: never; }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    // A className passada como prop pode ser usada para adicionar estilos específicos se necessário
    const combinedClassName = `${styles.input} ${className || ''}`.trim();
    
    return (
      <input
        type={type}
        className={combinedClassName}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
