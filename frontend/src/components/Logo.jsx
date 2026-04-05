import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ size = 'medium', className = '' }) {
  const isSmall = size === 'small';

  return (
    <Link to="/" className={`flex items-center gap-3 group cursor-pointer ${className}`}>
      {/* Icon Container */}
      <div className={`relative flex items-center justify-center bg-[#0f172a] border border-white/10 shadow-lg shadow-cyan-500/20 group-hover:scale-105 group-hover:shadow-cyan-400/30 transition-all duration-300 ${isSmall ? 'w-10 h-10 rounded-xl' : 'w-14 h-14 rounded-2xl'}`}>
        
        {/* Glow effect behind SVG */}
        <div className={`absolute inset-0 bg-gradient-to-tr from-blue-500 to-cyan-400 opacity-20 blur-md ${isSmall ? 'rounded-xl' : 'rounded-2xl'}`}></div>

        {/* Custom SVG: Stylized "S" / Upward Growth Line */}
        <svg 
          width={isSmall ? "24" : "32"} 
          height={isSmall ? "24" : "32"} 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Defs for Gradients */}
          <defs>
            <linearGradient id="logoGradient" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" /> {/* blue-500 */}
              <stop offset="1" stopColor="#22D3EE" /> {/* cyan-400 */}
            </linearGradient>
            <linearGradient id="fadeGradient" x1="0" y1="16" x2="32" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" stopOpacity="0.2" />
              <stop offset="1" stopColor="#22D3EE" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Upward abstract arrow base / grid lines */}
          <path d="M4 28V24H8" stroke="url(#fadeGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 28V20H16" stroke="url(#fadeGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

          {/* Main S-curve & swooping growth arrow */}
          <path 
            d="M5 16C5 9.5 12 5 16 11C20 17 26 14 28 8M28 8V14M28 8H22" 
            stroke="url(#logoGradient)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>

        {/* AI Sparkle */}
        <div className="absolute -top-1.5 -right-1.5">
          <Sparkles className={`${isSmall ? 'w-3 h-3' : 'w-5 h-5'} text-cyan-400 animate-pulse`} />
        </div>
      </div>

      {/* Brand Name */}
      <h2 className={`${isSmall ? 'text-xl' : 'text-3xl'} font-extrabold tracking-tight whitespace-nowrap`}>
        Smart<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">Spend</span>
      </h2>
    </Link>
  );
}
