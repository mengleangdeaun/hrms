import React from 'react';
import emptyDataSvg from '@/assets/illustrations/NoData.svg';
import emptyDataSmallSvg from '@/assets/illustrations/NoDataSmall.svg';

type IllustrationProps = {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  paddingY?: string;
};

const Illustration: React.FC<IllustrationProps> = ({
  src,
  alt,
  size = 120,
  className = '',
  paddingY = 'py-4',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${paddingY}`}
    >
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        loading="lazy"
      />
    </div>
  );
};

// Specific variants
export const EmptyDataIllustration = () => (
  <Illustration
    src={emptyDataSvg}
    alt="No data available"
    size={120}
    paddingY="py-4"
  />
);

export const EmptyDataSmallIllustration = () => (
  <Illustration
    src={emptyDataSmallSvg}
    alt="No data available"
    size={80}
    paddingY="py-2"
  />
);
