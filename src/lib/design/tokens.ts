export const COLORS = {
  // Backgrounds
  bgVoid:    '#07090E',
  bgBase:    '#0B0D14',
  bgSurface: '#0F1119',
  bgCard:    '#131720',
  bgCardH:   '#171C28',
  bgRaised:  '#1C2130',
  bgGlass:   'rgba(11,13,20,0.92)',

  // Worker — Blue
  pi:      '#0095FF',
  piLt:    '#38B2FF',
  piDim:   'rgba(0,149,255,0.13)',
  piGlow:  'rgba(0,149,255,0.22)',

  // Employer — Teal
  em:      '#00C9A7',
  emLt:    '#33D9BC',
  emDim:   'rgba(0,201,167,0.13)',
  emGlow:  'rgba(0,201,167,0.20)',

  // Admin — Orange
  ad:      '#FF6B35',
  adLt:    '#FF8C5A',
  adDim:   'rgba(255,107,53,0.13)',
  adGlow:  'rgba(255,107,53,0.20)',

  // Semantic
  go:       '#00D68F',
  goDim:    'rgba(0,214,143,0.13)',
  warn:     '#FFB020',
  warnDim:  'rgba(255,176,32,0.13)',
  stop:     '#FF4757',
  stopDim:  'rgba(255,71,87,0.13)',
  pulse:    '#A78BFA',
  pulseDim: 'rgba(167,139,250,0.13)',

  // Backward compat aliases
  accent:        '#0095FF',
  accentBright:  '#38B2FF',
  accentDim:     'rgba(0,149,255,0.13)',
  sapphire:     '#0095FF',
  sapphireDark: '#0077CC',
  sapphireLight: '#38B2FF',
  sapphireDim:  'rgba(0,149,255,0.13)',
  emerald:       '#00D68F',
  emeraldDark:  '#00B870',
  emeraldLight: '#33D9BC',
  emeraldDim:    'rgba(0,214,143,0.13)',
  red:           '#FF4757',
  redDim:        'rgba(255,71,87,0.13)',
  amber:         '#FFB020',
  amberDim:      'rgba(255,176,32,0.13)',
  cyan:          '#00E5E5',
  cyanDim:       'rgba(0,229,229,0.13)',

  // Text
  textPrimary:   '#EEF2FF',
  textSecondary: '#8892A8',
  textMuted:     '#454F64',
  textTertiary:  '#252C3D',

  // Borders
  border:       'rgba(255,255,255,0.07)',
  borderMd:     'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.18)',
  borderAccent: 'rgba(0,149,255,0.25)',
} as const

export const FONTS = {
  ui:      "'DM Sans', sans-serif",
  display: "'Bebas Neue', sans-serif",
  mono:    "'IBM Plex Mono', monospace",
  sans:    "'DM Sans', sans-serif",
} as const

export const RADII = {
  sm:   '8px',
  md:   '12px',
  lg:   '18px',
  xl:   '24px',
  full: '100px',
} as const

export const SPACING = {
  xs:  '4px',
  sm:  '8px',
  md:  '16px',
  lg:  '24px',
  xl:  '32px',
  xxl: '48px',
  xxxl: '64px',
} as const

export const SHADOWS = {
  card:     '0 1px 3px rgba(0,0,0,0.5)',
  accent:   '0 0 24px rgba(0,149,255,0.28)',
  accentLg: '0 0 36px rgba(0,149,255,0.4)',
  glow:     '0 0 7px rgba(0,149,255,0.5)',
  em:       '0 0 24px rgba(0,201,167,0.25)',
  ad:       '0 0 24px rgba(255,107,53,0.25)',
  cyanGlow: '0 0 20px rgba(0,229,229,0.4)',
  indigoGlow: '0 0 20px rgba(0,149,255,0.4)',
} as const

export const GRADIENTS = {
  primary:   'linear-gradient(90deg, #0095FF, #38B2FF)',
  success:   'linear-gradient(90deg, #00D68F, #00D68F)',
  warning:   'linear-gradient(90deg, #FFB020, #FFB020)',
  danger:    'linear-gradient(90deg, #FF4757, #FF4757)',
  card:      'linear-gradient(135deg, rgba(0,149,255,0.08), rgba(167,139,250,0.05))',
  indigo:    'linear-gradient(90deg, #0095FF, #38B2FF)',
  emerald:   'linear-gradient(90deg, #00D68F, #00D68F)',
} as const

export function statusStyle(status: string): {
  color: string
  background: string
  border: string
} {
  switch (status?.toUpperCase?.()) {
    case 'APPROVED':
    case 'CONFIRMED':
    case 'RESOLVED_WORKER':
      return {
        color: COLORS.go,
        background: COLORS.goDim,
        border: `1px solid rgba(0,214,143,0.3)`,
      }
    case 'REJECTED':
    case 'FAILED':
    case 'RESOLVED_EMPLOYER':
      return {
        color: COLORS.stop,
        background: COLORS.stopDim,
        border: `1px solid rgba(255,71,87,0.3)`,
      }
    case 'SUBMITTED':
    case 'PENDING':
    case 'TIER2_REVIEW':
      return {
        color: COLORS.warn,
        background: COLORS.warnDim,
        border: `1px solid rgba(255,176,32,0.3)`,
      }
    case 'DISPUTED':
    case 'RAISED':
    case 'IN_REVIEW':
      return {
        color: COLORS.pi,
        background: COLORS.piDim,
        border: `1px solid ${COLORS.borderAccent}`,
      }
    case 'ESCROWED':
      return {
        color: COLORS.piLt,
        background: COLORS.piDim,
        border: `1px solid ${COLORS.borderAccent}`,
      }
    default:
      return {
        color: COLORS.textSecondary,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${COLORS.border}`,
      }
  }
}

export const COMPONENT_STYLES = {
  cardGlass: {
    background: COLORS.bgCard,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADII.lg,
    boxShadow: SHADOWS.card,
    padding: SPACING.lg,
  } as React.CSSProperties,
  buttonPrimary: {
    background: COLORS.pi,
    color: '#fff',
    border: 'none',
    borderRadius: RADII.md,
    padding: `${SPACING.sm} ${SPACING.lg}`,
    fontWeight: '600',
    cursor: 'pointer',
  } as React.CSSProperties,
}
