"use client";

import Image from "next/image";
import React from "react";

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

const CryptoIcon: React.FC<CryptoIconProps> = ({
  symbol,
  size = 24,
  className = "",
}) => {
  let iconSrc: string;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    iconSrc = require(`cryptocurrency-icons/svg/color/${symbol.toLowerCase()}.svg`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    console.warn(`Icon for ${symbol} not found, using generic icon.`);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    iconSrc = require(`cryptocurrency-icons/svg/color/generic.svg`);
  }

  return (
    <Image
      src={iconSrc}
      alt={`${symbol} icon`}
      width={size}
      height={size}
      className={className}
    />
  );
};

export default CryptoIcon;
