'use client';

import Image from 'next/image';

interface ZedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: { w: 80, h: 32 },
  md: { w: 120, h: 48 },
  lg: { w: 160, h: 64 },
  xl: { w: 200, h: 80 },
};

export function ZedLogo({ size = 'xl', className = '' }: ZedLogoProps) {
  const dimensions = sizes[size];
  
  return (
    <Image
      src="/esg-logo.png"
      alt="ZED България"
      width={dimensions.w}
      height={dimensions.h}
      className={`object-contain ${className}`}
      priority
    />
  );
}
