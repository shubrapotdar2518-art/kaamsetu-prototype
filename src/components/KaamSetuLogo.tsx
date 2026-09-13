import React from 'react';
import { Link } from 'react-router-dom';

interface KaamSetuLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  clickable?: boolean;
}

export const KaamSetuLogo: React.FC<KaamSetuLogoProps> = ({
  size = 'md',
  showTagline = false,
  clickable = true,
}) => {
  const sizeClasses = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', sub: 'text-[10px]' },
    md: { icon: 'w-9 h-9', text: 'text-2xl', sub: 'text-xs' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl', sub: 'text-sm' },
    xl: { icon: 'w-16 h-16', text: 'text-4xl', sub: 'text-base' },
  };

  const currentSize = sizeClasses[size];

  const content = (
    <div className="flex items-center gap-3 select-none">
      {/* Icon: Bridge connecting hands symbol in green & orange */}
      <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#15803D] to-[#166534] shadow-sm text-white ${currentSize.icon} p-1.5`}>
        <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
          {/* Bridge arch */}
          <path
            d="M4 26C8 16 16 11 28 11"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Pillars */}
          <path
            d="M10 26V20M18 26V16M26 26V14"
            stroke="#86EFAC"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Orange sun / connection node */}
          <circle cx="28" cy="11" r="4.5" fill="#F97316" stroke="#FFFFFF" strokeWidth="1.5" />
          <path
            d="M4 27H32"
            stroke="#FDBA74"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-center tracking-tight font-extrabold">
          <span className={`text-[#15803D] ${currentSize.text}`}>Kaam</span>
          <span className={`text-[#F97316] ${currentSize.text}`}>Setu</span>
          <span className="ml-1 inline-block w-2 h-2 rounded-full bg-[#F97316] animate-pulse"></span>
        </div>
        {showTagline && (
          <span className={`text-[#166534] font-medium tracking-wide ${currentSize.sub}`}>
            Connecting Hands, Building Futures
          </span>
        )}
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link to="/welcome" className="inline-block transition-transform hover:scale-[1.02] focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};
