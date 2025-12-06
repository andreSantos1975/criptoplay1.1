"use client";

import Image from "next/image";
import React from "react";

// Statically import all the icons we know we'll need
import btc from 'cryptocurrency-icons/svg/color/btc.svg';
import eth from 'cryptocurrency-icons/svg/color/eth.svg';
import bnb from 'cryptocurrency-icons/svg/color/bnb.svg';
import xrp from 'cryptocurrency-icons/svg/color/xrp.svg';
import doge from 'cryptocurrency-icons/svg/color/doge.svg';
import ada from 'cryptocurrency-icons/svg/color/ada.svg';
import sol from 'cryptocurrency-icons/svg/color/sol.svg';
import usdc from 'cryptocurrency-icons/svg/color/usdc.svg';
import generic from 'cryptocurrency-icons/svg/color/generic.svg';

// Create a map from symbol to imported icon
const iconMap: { [key: string]: any } = {
  btc,
  eth,
  bnb,
  xrp,
  doge,
  ada,
  sol,
  usdc,
  generic,
};

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
  const lowerSymbol = symbol.toLowerCase();
  const iconSrc = iconMap[lowerSymbol] || iconMap.generic;

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