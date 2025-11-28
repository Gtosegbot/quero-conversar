import React from 'react';
import { Heart } from 'lucide-react';

interface PulsingHeartProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PulsingHeart: React.FC<PulsingHeartProps> = ({ 
  color = 'text-pink-500', 
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`relative ${className}`}>
      <Heart 
        className={`${sizeClasses[size]} ${color} fill-current animate-pulse`}
        style={{
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      />
      <Heart 
        className={`absolute inset-0 ${sizeClasses[size]} ${color} fill-current opacity-75`}
        style={{
          animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
        }}
      />
    </div>
  );
};

export default PulsingHeart;
