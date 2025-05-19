import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente Logo da empresa
 * Suporta diferentes tamanhos: sm, md, lg
 */
const Logo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="font-bold text-primary flex items-center h-full">
        <span className="mr-1 text-xl md:text-2xl lg:text-3xl">Muricion</span>
        <span className="text-muted-foreground text-lg md:text-xl lg:text-2xl">Fleet</span>
      </div>
    </div>
  );
};

export default Logo;