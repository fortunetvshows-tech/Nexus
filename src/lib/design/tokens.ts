/**
 * Nexus Design System — High-Trust Minimalism
 *
 * Stripe meets Pi Network.
 * Consumer-grade. Trustworthy. Effortless.
 */

export const COLORS = {
  // Backgrounds — deep navy slate, not cold black
  bgBase:      '#0F172A',
  bgSurface:   '#1E293B',
  bgElevated:  '#263348',
  bgOverlay:   '#2D3D56',

  // Borders — soft, not harsh
  border:      'rgba(148, 163, 184, 0.1)',
  borderAccent: 'rgba(148, 163, 184, 0.2)',
  borderFocus: '#6366F1',

  // Primary accent — Electric Indigo (Stripe-adjacent)
  indigo:      '#6366F1',
  indigoDark:  '#4F46E5',
  indigoLight: '#818CF8',
  indigoDim:   'rgba(99, 102, 241, 0.15)',

  // Secondary accent — Soft Emerald (earned Pi)
  emerald:     '#10B981',
  emeraldDark: '#059669',
  emeraldDim:  'rgba(16, 185, 129, 0.15)',

  // Status
  amber:       '#F59E0B',
  amberDim:    'rgba(245, 158, 11, 0.15)',
  red:         '#EF4444',
  redDim:      'rgba(239, 68, 68, 0.15)',
  blue:        '#3B82F6',
  blueDim:     'rgba(59, 130, 246, 0.15)',

  // Text — warm slate, not cold white
  textPrimary:   '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted:     '#64748B',
  textInverse:   '#0F172A',
} as const

export const FONTS = {
  // Geist Sans — clean, architectural, consumer-grade
  sans: "'Inter', system-ui, sans-serif",
  // Keep mono only for Pi amounts and data values
  mono: "'Fira Code', 'JetBrains Mono', monospace",
} as const

export const RADII = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '18px',
  xxl:  '24px',
  full: '9999px',
} as const

export const SHADOWS = {
  // Floating card — the core of the layer rule
  card:     '0 4px 24px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  cardHover: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)',
  // Elevated elements
  elevated: '0 8px 40px rgba(0, 0, 0, 0.35)',
  // Glow effects for key CTAs
  indigoGlow: '0 0 24px rgba(99, 102, 241, 0.4)',
  emeraldGlow: '0 0 20px rgba(16, 185, 129, 0.3)',
  // Subtle inner highlight
  inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
} as const

export const GRADIENTS = {
  // Micro-gradients for buttons — the pressable rule
  indigo:  'linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)',
  emerald: 'linear-gradient(180deg, #10B981 0%, #059669 100%)',
  danger:  'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',

  // Card backgrounds — adds depth
  card:    'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
  surface: 'linear-gradient(180deg, #1E293B 0%, #1A2536 100%)',

  // Hero mesh gradient for landing page
  hero:    `
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.3) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 80%, rgba(16,185,129,0.15) 0%, transparent 50%)
  `,
} as const

export const SPACING = {
  xs:   '4px',
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  xl:   '24px',
  xxl:  '32px',
  xxxl: '48px',
} as const

// Status helpers — returns consistent colors across all status types
export function statusStyle(status: string): {
  color:      string
  background: string
  border:     string
} {
  switch (status) {
    case 'APPROVED':
    case 'confirmed':
    case 'resolved_worker':
      return {
        color:      COLORS.emerald,
        background: COLORS.emeraldDim,
        border:     `1px solid rgba(16, 185, 129, 0.3)`,
      }
    case 'REJECTED':
    case 'failed':
    case 'resolved_employer':
      return {
        color:      COLORS.red,
        background: COLORS.redDim,
        border:     `1px solid rgba(239, 68, 68, 0.3)`,
      }
    case 'SUBMITTED':
    case 'pending':
    case 'tier2_review':
      return {
        color:      COLORS.amber,
        background: COLORS.amberDim,
        border:     `1px solid rgba(245, 158, 11, 0.3)`,
      }
    case 'DISPUTED':
    case 'raised':
      return {
        color:      COLORS.blue,
        background: COLORS.blueDim,
        border:     `1px solid rgba(59, 130, 246, 0.3)`,
      }
    case 'escrowed':
      return {
        color:      COLORS.indigoLight,
        background: COLORS.indigoDim,
        border:     `1px solid rgba(99, 102, 241, 0.3)`,
      }
    default:
      return {
        color:      COLORS.textSecondary,
        background: 'rgba(148, 163, 184, 0.08)',
        border:     `1px solid ${COLORS.border}`,
      }
  }
}

// Reusable component styles — use these for consistency
export const COMPONENT_STYLES = {

  // Floating card — the foundational UI element
  card: {
    background:   `${GRADIENTS.card}, ${COLORS.bgSurface}`,
    border:       `1px solid ${COLORS.border}`,
    borderRadius: RADII.lg,
    boxShadow:    `${SHADOWS.card}, ${SHADOWS.inset}`,
    padding:      SPACING.xl,
  } as React.CSSProperties,

  // Primary CTA button
  buttonPrimary: {
    background:   GRADIENTS.indigo,
    color:        '#ffffff',
    border:       'none',
    borderRadius: RADII.md,
    padding:      `${SPACING.md} ${SPACING.xl}`,
    fontSize:     '0.9rem',
    fontWeight:   '600',
    fontFamily:   FONTS.sans,
    cursor:       'pointer',
    boxShadow:    SHADOWS.indigoGlow,
    transition:   'all 0.15s ease',
  } as React.CSSProperties,

  // Secondary button
  buttonSecondary: {
    background:   'transparent',
    color:        COLORS.textSecondary,
    border:       `1px solid ${COLORS.borderAccent}`,
    borderRadius: RADII.md,
    padding:      `${SPACING.md} ${SPACING.xl}`,
    fontSize:     '0.875rem',
    fontWeight:   '500',
    fontFamily:   FONTS.sans,
    cursor:       'pointer',
    transition:   'all 0.15s ease',
  } as React.CSSProperties,

  // Text input
  input: {
    background:   COLORS.bgElevated,
    border:       `1px solid ${COLORS.border}`,
    borderRadius: RADII.md,
    padding:      `${SPACING.md} ${SPACING.lg}`,
    color:        COLORS.textPrimary,
    fontSize:     '0.9rem',
    fontFamily:   FONTS.sans,
    outline:      'none',
    width:        '100%',
    boxSizing:    'border-box' as const,
    transition:   'border-color 0.15s ease',
  } as React.CSSProperties,

  // Section heading
  sectionLabel: {
    fontSize:      '0.72rem',
    fontWeight:    '600',
    color:         COLORS.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin:        `0 0 ${SPACING.md}`,
  } as React.CSSProperties,

  // Page wrapper
  pageWrapper: {
    minHeight:  '100vh',
    background: COLORS.bgBase,
    fontFamily: FONTS.sans,
    color:      COLORS.textPrimary,
  } as React.CSSProperties,

  // Main content area
  mainContent: {
    maxWidth: '720px',
    margin:   '0 auto',
    padding:  '72px 1rem 4rem',
  } as React.CSSProperties,
}
