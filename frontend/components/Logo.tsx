// ===========================================
// WARIZMY EDUCATION - Logo Component
// ===========================================

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { logo: 32, text: 'text-lg' },
  md: { logo: 40, text: 'text-xl' },
  lg: { logo: 48, text: 'text-2xl' },
  xl: { logo: 64, text: 'text-3xl' },
};

export default function Logo({ 
  size = 'md', 
  showText = true, 
  href = '/',
  className = ''
}: LogoProps) {
  const dimensions = sizeMap[size];
  
  const LogoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="relative overflow-hidden rounded-xl shadow-sm"
        style={{ width: dimensions.logo, height: dimensions.logo }}
      >
        <Image
          src="/images/Logo/full (1).jpg"
          alt="WARIZMY Logo"
          fill
          className="object-cover"
          priority
        />
      </div>
      {showText && (
        <span className={`font-heading font-bold text-gray-900 ${dimensions.text}`}>
          WARIZMY
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}

// Weißes Logo für dunkle Hintergründe
export function LogoWhite({ 
  size = 'md', 
  showText = true, 
  href = '/',
  className = ''
}: LogoProps) {
  const dimensions = sizeMap[size];
  
  const LogoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="relative overflow-hidden rounded-xl shadow-sm"
        style={{ width: dimensions.logo, height: dimensions.logo }}
      >
        <Image
          src="/images/Logo/full (1).jpg"
          alt="WARIZMY Logo"
          fill
          className="object-cover"
          priority
        />
      </div>
      {showText && (
        <span className={`font-heading font-bold text-white ${dimensions.text}`}>
          WARIZMY
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}

// Nur Logo ohne Text (für kleine Bereiche)
export function LogoIcon({ 
  size = 'md',
  href,
  className = ''
}: Omit<LogoProps, 'showText'>) {
  return <Logo size={size} showText={false} href={href} className={className} />;
}

