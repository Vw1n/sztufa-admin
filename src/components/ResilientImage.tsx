import React, { useState } from 'react';

interface Props extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  src?: string | null;
  fallback: React.ReactNode;
}

export function ResilientImage({ src, fallback, ...props }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return src && failedSrc !== src
    ? <img {...props} src={src} onError={() => setFailedSrc(src)} />
    : <>{fallback}</>;
}

export function TeamLogo({ src, name, size = 32 }: { src?: string | null; name: string; size?: number }) {
  const style: React.CSSProperties = {
    width: size, height: size, flexShrink: 0, borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    verticalAlign: 'middle', marginRight: 8, objectFit: 'cover',
  };
  return <ResilientImage key={src || ''} src={src} alt={`${name}队徽`} style={style}
    fallback={<span role="img" aria-label={`${name}队徽`} style={{ ...style, background: '#1a56db', color: '#fff', fontSize: Math.max(12, size / 2.5), fontWeight: 700 }}>
      {Array.from(name.trim() || '球队').slice(0, 2).join('')}
    </span>} />;
}
