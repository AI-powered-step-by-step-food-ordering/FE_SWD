'use client';

import Image, { ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

type Props = Omit<ImageProps, 'src'> & {
  src: string;
  fallbackSrc?: string;
};

export default function ImageWithFallback({ src, fallbackSrc = '/icon.svg', onError, ...rest }: Props) {
  const [currentSrc, setCurrentSrc] = useState<string>(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <Image
      {...rest}
      src={currentSrc}
      onError={(e) => {
        // If a custom onError is provided, call it too
        if (onError) onError(e);
        // Swap to fallback image on error
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}