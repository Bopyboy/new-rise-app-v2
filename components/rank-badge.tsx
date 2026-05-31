// components/rank-badge.tsx
// SVG rank badge icons for each tier

interface RankBadgeProps {
    symbol: string
    size?: number
  }
  
  export function RankBadge({ symbol, size = 32 }: RankBadgeProps) {
    const s = size
  
    switch (symbol) {
      case 'iron':
        return (
          <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
            <polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="#6b7280" stroke="#9ca3af" strokeWidth="1.5"/>
            <polygon points="16,7 19,14 26,14 21,18 23,26 16,21 9,26 11,18 6,14 13,14" fill="#4b5563"/>
            <text x="16" y="20" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#d1d5db">Fe</text>
          </svg>
        )
      case 'bronze':
        return (
          <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
            <polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="#92400e" stroke="#cd7f32" strokeWidth="1.5"/>
            <polygon points="16,7 19,14 26,14 21,18 23,26 16,21 9,26 11,18 6,14 13,14" fill="#78350f"/>
            <circle cx="16" cy="17" r="4" fill="#cd7f32" opacity="0.8"/>
          </svg>
        )
      case 'silver':
        return (
          <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
            <polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="#6b7280" stroke="#e5e7eb" strokeWidth="1.5"/>
            <polygon points="16,7 19,14 26,14 21,18 23,26 16,21 9,26 11,18 6,14 13,14" fill="#9ca3af"/>
            <circle cx="16" cy="17" r="4" fill="#e5e7eb" opacity="0.9"/>
            <circle cx="16" cy="17" r="2" fill="#f9fafb"/>
          </svg>
        )
      case 'gold':
        return (
          <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
            <polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="#92400e" stroke="#fbbf24" strokeWidth="1.5"/>
            <polygon points="16,7 19,14 26,14 21,18 23,26 16,21 9,26 11,18 6,14 13,14" fill="#b45309"/>
            <circle cx="16" cy="17" r="5" fill="#fbbf24"/>
            <circle cx="16" cy="17" r="3" fill="#fde68a"/>
            <circle cx="16" cy="17" r="1.5" fill="#fffbeb"/>
          </svg>
        )
      case 'platinum':
        return (
          <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="platGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#67e8f9"/>
                <stop offset="100%" stopColor="#a5f3fc"/>
              </linearGradient>
            </defs>
            <polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="#164e63" stroke="url(#platGrad)" strokeWidth="1.5"/>
            <polygon points="16,7 19,14 26,14 21,18 23,26 16,21 9,26 11,18 6,14 13,14" fill="#0e7490"/>
            <polygon points="16,10 18,15 23,15 19,18 21,24 16,20 11,24 13,18 9,15 14,15" fill="url(#platGrad)" opacity="0.9"/>
          </svg>
        )
      case 'diamond':
        return (
          <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="diaGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#bae6fd"/>
                <stop offset="50%" stopColor="#38bdf8"/>
                <stop offset="100%" stopColor="#0ea5e9"/>
              </linearGradient>
            </defs>
            <polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.5"/>
            <polygon points="16,8 22,15 16,24 10,15" fill="url(#diaGrad)"/>
            <polygon points="16,8 22,15 16,13" fill="#bae6fd" opacity="0.6"/>
            <line x1="10" y1="15" x2="22" y2="15" stroke="#bae6fd" strokeWidth="0.5" opacity="0.5"/>
          </svg>
        )
      case 'master':
        return (
          <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="masterGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fca5a5"/>
                <stop offset="100%" stopColor="#ef4444"/>
              </linearGradient>
            </defs>
            <polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="#7f1d1d" stroke="#f87171" strokeWidth="1.5"/>
            <polygon points="16,7 19,14 26,14 21,18 23,26 16,21 9,26 11,18 6,14 13,14" fill="#991b1b"/>
            <path d="M11 19 L16 8 L21 19" stroke="url(#masterGrad)" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <circle cx="16" cy="20" r="2" fill="#f87171"/>
          </svg>
        )
      case 'grandmaster':
        return (
          <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="gmGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e879f9"/>
                <stop offset="100%" stopColor="#a855f7"/>
              </linearGradient>
            </defs>
            <polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="#3b0764" stroke="#c084fc" strokeWidth="1.5"/>
            <polygon points="16,7 19,14 26,14 21,18 23,26 16,21 9,26 11,18 6,14 13,14" fill="#581c87"/>
            <circle cx="16" cy="16" r="5" fill="url(#gmGrad)" opacity="0.9"/>
            <path d="M13 14 L16 10 L19 14 L22 16 L19 18 L16 22 L13 18 L10 16 Z" fill="#f0abfc" opacity="0.5"/>
            <circle cx="16" cy="16" r="2" fill="#fae8ff"/>
          </svg>
        )
      case 'elite':
        return (
          <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="eliteGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fde68a"/>
                <stop offset="50%" stopColor="#f59e0b"/>
                <stop offset="100%" stopColor="#d97706"/>
              </linearGradient>
              <radialGradient id="eliteGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="url(#eliteGlow)"/>
            <polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="#78350f" stroke="url(#eliteGrad)" strokeWidth="2"/>
            <polygon points="16,6 19,13 27,13 21,18 23,27 16,21 9,27 11,18 5,13 13,13" fill="#92400e"/>
            <path d="M16 10 L17.5 14.5 L22 14.5 L18.5 17.5 L20 22 L16 19 L12 22 L13.5 17.5 L10 14.5 L14.5 14.5 Z" fill="url(#eliteGrad)"/>
            <circle cx="16" cy="16" r="2" fill="#fffbeb"/>
          </svg>
        )
      default:
        return <span style={{ fontSize: size * 0.7 }}>⭐</span>
    }
  }