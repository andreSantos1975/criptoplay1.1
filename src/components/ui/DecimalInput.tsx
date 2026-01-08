'use client';

import React, { useState, useEffect } from 'react';

interface DecimalInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  id?: string;
  required?: boolean;
  placeholder?: string;
}

export const DecimalInput = ({
  value,
  onChange,
  className,
  id,
  required = false,
  placeholder = ''
}: DecimalInputProps) => {
  const [displayValue, setDisplayValue] = useState(value === 0 ? '' : value.toString().replace('.', ','));

  useEffect(() => {
    const currentNum = parseFloat(displayValue.replace(',', '.'));
    const epsilon = 0.00000001; 
    if (Math.abs(value - (isNaN(currentNum) ? 0 : currentNum)) > epsilon) {
      setDisplayValue(value === 0 ? '' : value.toString().replace('.', ','));
    }
  }, [value, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    
    if (!/^[0-9.,]*$/.test(newVal)) {
      return; 
    }

    setDisplayValue(newVal);

    const normalized = newVal.replace(',', '.');
    const parsed = parseFloat(normalized);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      className={className}
      required={required}
      autoComplete="off"
      placeholder={placeholder}
    />
  );
};