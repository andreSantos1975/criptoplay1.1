import React from 'react';
import { cn } from '@/lib/utils';
import styles from './badge.module.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        styles.base, 
        styles[`variant-${variant}`], 
        className
      )} 
      {...props} 
    />
  );
}

export { Badge };
