import React from 'react';

export const WorkerIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 200" fill="none" className="w-full h-full drop-shadow-sm">
        {/* Soft background glow */}
        <circle cx="100" cy="100" r="88" fill="#ECFDF5" />
        <circle cx="100" cy="100" r="74" fill="#DCFCE7" />
        
        {/* Decorative elements */}
        <circle cx="35" cy="45" r="5" fill="#F97316" opacity="0.6" />
        <circle cx="165" cy="55" r="7" fill="#15803D" opacity="0.3" />
        <path d="M25 130L35 140M35 130L25 140" stroke="#15803D" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        
        {/* Worker Body */}
        {/* Yellow/Orange Safety Helmet */}
        <ellipse cx="100" cy="58" rx="34" ry="20" fill="#F97316" />
        <path d="M68 62C68 45 80 34 100 34C120 34 132 45 132 62H68Z" fill="#EA580C" />
        <rect x="64" y="58" width="72" height="7" rx="3.5" fill="#C2410C" />
        <rect x="94" y="32" width="12" height="12" rx="2" fill="#FDBA74" />
        <path d="M88 45H112" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

        {/* Worker Face */}
        <circle cx="100" cy="78" r="23" fill="#FBCFE8" />
        {/* Hair sideburns */}
        <path d="M78 68C78 78 80 82 82 85" stroke="#374151" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M122 68C122 78 120 82 118 85" stroke="#374151" strokeWidth="3.5" strokeLinecap="round" />
        
        {/* Eyes & Warm Smile */}
        <circle cx="92" cy="76" r="2.5" fill="#1F2937" />
        <circle cx="108" cy="76" r="2.5" fill="#1F2937" />
        <path d="M93 86C97 90 103 90 107 86" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" />
        {/* Cheerful blush */}
        <circle cx="87" cy="83" r="3" fill="#F43F5E" opacity="0.3" />
        <circle cx="113" cy="83" r="3" fill="#F43F5E" opacity="0.3" />

        {/* Neck */}
        <rect x="94" y="97" width="12" height="10" fill="#FBCFE8" />

        {/* Shirt & Green Overalls */}
        <path d="M66 112L76 98H124L134 112L148 165H52L66 112Z" fill="#15803D" />
        <path d="M82 104V165M118 104V165" stroke="#166534" strokeWidth="4" />
        
        {/* White Inner Shirt */}
        <path d="M88 98L100 115L112 98H88Z" fill="#FFFFFF" />

        {/* Tool Belt & Tools */}
        <rect x="60" y="142" width="80" height="10" rx="3" fill="#9A3412" />
        <rect x="94" y="141" width="12" height="12" rx="2" fill="#FCD34D" stroke="#78350F" strokeWidth="1.5" />
        
        {/* Hammer in pocket */}
        <rect x="124" y="130" width="6" height="28" rx="2" fill="#78350F" />
        <rect x="119" y="125" width="16" height="8" rx="2" fill="#64748B" />

        {/* Thumbs up hand */}
        <circle cx="56" cy="128" r="9" fill="#FBCFE8" />
        <path d="M54 122C54 118 57 116 60 118C62 119 62 124 60 126" stroke="#FBCFE8" strokeWidth="4" strokeLinecap="round" />
        
        {/* Star Badge for Skill */}
        <g transform="translate(140, 95)">
          <circle cx="12" cy="12" r="14" fill="#F97316" />
          <path d="M12 5L14 9.5L19 10.2L15.5 13.5L16.5 18.5L12 16L7.5 18.5L8.5 13.5L5 10.2L10 9.5L12 5Z" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};

export const EmployerIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 200" fill="none" className="w-full h-full drop-shadow-sm">
        {/* Background glow */}
        <circle cx="100" cy="100" r="88" fill="#FFF7ED" />
        <circle cx="100" cy="100" r="74" fill="#FFEDD5" />

        {/* Decorative sparkles */}
        <circle cx="35" cy="55" r="6" fill="#15803D" opacity="0.4" />
        <circle cx="168" cy="45" r="5" fill="#F97316" opacity="0.6" />

        {/* Contractor / Employer Figure */}
        {/* Hair */}
        <path d="M72 65C72 45 84 38 100 38C116 38 128 45 128 65C128 67 126 73 124 75H76L72 65Z" fill="#1F2937" />
        
        {/* Face */}
        <circle cx="100" cy="74" r="22" fill="#FED7AA" />
        
        {/* Glasses */}
        <rect x="85" y="69" width="12" height="9" rx="2" fill="none" stroke="#15803D" strokeWidth="2" />
        <rect x="103" y="69" width="12" height="9" rx="2" fill="none" stroke="#15803D" strokeWidth="2" />
        <path d="M97 73H103" stroke="#15803D" strokeWidth="2" />
        
        {/* Eyes & Friendly Smile */}
        <circle cx="91" cy="73" r="1.5" fill="#1F2937" />
        <circle cx="109" cy="73" r="1.5" fill="#1F2937" />
        <path d="M94 84C98 87 102 87 106 84" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />

        {/* Crisp Collared Shirt & Blazer */}
        <path d="M64 112L76 96H124L136 112L146 165H54L64 112Z" fill="#1E293B" />
        <path d="M84 96L100 128L116 96H84Z" fill="#FFFFFF" />
        {/* Orange Silk Tie */}
        <path d="M97 108L100 142L103 108H97Z" fill="#F97316" />
        <polygon points="97,108 103,108 102,103 98,103" fill="#EA580C" />

        {/* Blueprint / Tablet in Hand */}
        <rect x="125" y="115" width="28" height="38" rx="4" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
        <path d="M130 123H147M130 129H142M130 135H145" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        <circle cx="139" cy="147" r="2" fill="#BAE6FD" />

        {/* Hand holding tablet */}
        <circle cx="126" cy="138" r="7" fill="#FED7AA" />

        {/* Construction Site / Building Backdrop Icon */}
        <g transform="translate(24, 98)">
          <rect x="0" y="15" width="18" height="35" fill="#94A3B8" rx="2" />
          <rect x="4" y="20" width="3" height="4" fill="#FFFFFF" />
          <rect x="11" y="20" width="3" height="4" fill="#FFFFFF" />
          <rect x="4" y="28" width="3" height="4" fill="#FFFFFF" />
          <rect x="11" y="28" width="3" height="4" fill="#FFFFFF" />
          <rect x="4" y="36" width="3" height="4" fill="#FFFFFF" />
          <rect x="11" y="36" width="3" height="4" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};

export const WelcomeBannerIllustration: React.FC<{ className?: string }> = ({ className = 'w-full max-w-md h-60' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 400 240" fill="none" className="w-full h-full drop-shadow-md">
        {/* Soft Background Pill */}
        <rect x="10" y="10" width="380" height="220" rx="32" fill="url(#welcomeBg)" />
        
        <defs>
          <linearGradient id="welcomeBg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F0FDF4" />
            <stop offset="0.6" stopColor="#ECFDF5" />
            <stop offset="1" stopColor="#FFF7ED" />
          </linearGradient>
          <linearGradient id="bridgeGrad" x1="50" y1="120" x2="350" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#15803D" />
            <stop offset="0.5" stopColor="#16A34A" />
            <stop offset="1" stopColor="#F97316" />
          </linearGradient>
        </defs>

        {/* Bridge Arc */}
        <path
          d="M40 180C100 90 300 90 360 180"
          stroke="url(#bridgeGrad)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Suspension Cables */}
        <path d="M100 140V180M150 110V180M200 100V180M250 110V180M300 140V180" stroke="#86EFAC" strokeWidth="3" strokeDasharray="4 3" />

        {/* Left Side: Worker Figure */}
        <g transform="translate(60, 90)">
          <circle cx="30" cy="30" r="16" fill="#FBCFE8" />
          {/* Yellow Hat */}
          <path d="M16 26C16 16 22 10 30 10C38 10 44 16 44 26H16Z" fill="#F97316" />
          <rect x="12" y="26" width="36" height="4" rx="2" fill="#EA580C" />
          <path d="M14 55C14 42 22 38 30 38C38 38 46 42 46 55V75H14V55Z" fill="#15803D" />
          {/* Tool */}
          <path d="M46 48L58 36" stroke="#9A3412" strokeWidth="4" strokeLinecap="round" />
          <rect x="54" y="32" width="10" height="6" rx="1" fill="#64748B" />
        </g>

        {/* Center: Handshake Trust Badge */}
        <g transform="translate(170, 45)">
          <circle cx="30" cy="30" r="26" fill="#FFFFFF" stroke="#F97316" strokeWidth="3" className="drop-shadow" />
          {/* Handshake vector */}
          <path d="M18 34L26 26L34 30L42 24" stroke="#15803D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M26 34L32 40L38 34" stroke="#F97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {/* Heart / Sparkle */}
          <circle cx="30" cy="16" r="3" fill="#EF4444" />
        </g>

        {/* Right Side: Employer Figure */}
        <g transform="translate(270, 90)">
          <circle cx="30" cy="30" r="16" fill="#FED7AA" />
          {/* Hair */}
          <path d="M18 24C18 16 23 12 30 12C37 12 42 16 42 24H18Z" fill="#1E293B" />
          <path d="M14 55C14 42 22 38 30 38C38 38 46 42 46 55V75H14V55Z" fill="#1E293B" />
          {/* Orange Tie */}
          <path d="M28 42L30 58L32 42H28Z" fill="#F97316" />
          {/* Mobile / Tablet */}
          <rect x="4" y="44" width="10" height="16" rx="2" fill="#0284C7" />
        </g>

        {/* Floating Trust Pills */}
        <g transform="translate(30, 25)">
          <rect width="110" height="24" rx="12" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="1" />
          <text x="55" y="16" textAnchor="middle" fill="#166534" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
            ✓ 100% Verified
          </text>
        </g>

        <g transform="translate(255, 25)">
          <rect width="115" height="24" rx="12" fill="#FFEDD5" stroke="#FDBA74" strokeWidth="1" />
          <text x="57" y="16" textAnchor="middle" fill="#9A3412" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
            ⚡ Daily Payout
          </text>
        </g>
      </svg>
    </div>
  );
};
