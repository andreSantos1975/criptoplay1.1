"use client";

import Image from "next/image";
import React from "react";

// Statically import all the icons as React components
import BtcIcon from 'cryptocurrency-icons/svg/color/btc.svg';
import EthIcon from 'cryptocurrency-icons/svg/color/eth.svg';
import BnbIcon from 'cryptocurrency-icons/svg/color/bnb.svg';
import XrpIcon from 'cryptocurrency-icons/svg/color/xrp.svg';
import DogeIcon from 'cryptocurrency-icons/svg/color/doge.svg';
import AdaIcon from 'cryptocurrency-icons/svg/color/ada.svg';
import SolIcon from 'cryptocurrency-icons/svg/color/sol.svg';
import UsdcIcon from 'cryptocurrency-icons/svg/color/usdc.svg';
import GenericIcon from 'cryptocurrency-icons/svg/color/generic.svg';

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
  const lowerSymbol = symbol.toLowerCase().replace('brl', '').replace('usdt', '');

  const iconProps = {
    width: size,
    height: size,
    className: className,
    alt: `${symbol} icon`,
  };

  switch (lowerSymbol) {
    case 'btc':
      return <BtcIcon {...iconProps} />;
    case 'eth':
      return <EthIcon {...iconProps} />;
    case 'bnb':
      return <BnbIcon {...iconProps} />;
    case 'xrp':
      return <XrpIcon {...iconProps} />;
    case 'doge':
      return <DogeIcon {...iconProps} />;
    case 'ada':
      return <AdaIcon {...iconProps} />;
    case 'sol':
      return <SolIcon {...iconProps} />;
    case 'usdc':
      return <UsdcIcon {...iconProps} />;
    case 'shib':
        // shib icon is missing, fallback to generic
        return <GenericIcon {...iconProps} />;
    case 'fdusd':
        // fdusd icon is missing, fallback to generic
        return <GenericIcon {...iconProps} />;
    default:
      return <GenericIcon {...iconProps} />;
  }
};

export default CryptoIcon;
