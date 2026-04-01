/**
 * Nexus Design System — ProofGrid Color Palette
 *
 * Logo Energy: Sapphire & Electric Cyan
 * Layout Philosophy: Bento Grid (20px radius masterpiece)
 * Color Rule: 60% Dark Neutrals, 30% Sapphire, 10% Cyan Accents
 *
 * Stripe meets Pi Network meets 2026 design standards.
 */

export const COLORS = {
  // ── 60% Dark Neutrals (Backgrounds) ──────────────────────
  // Obsidian Blue — Main app background
  bgBase:      '#081A33',
  // Glass Navy — Dashboard cards and containers
  bgSurface:   '#122647',
  bgElevated:  '#1A3352',
  bgOverlay:   '#2D3D56',

  // ── Text Colors ──────────────────────────────────────────
  // Snow White — Main headings and body text
  textPrimary:   '#F4F6FA',
  // Steel Gray — Secondary info and labels
  textSecondary: '#A7B8C7',
  textMuted:     '#7A8FA3',
  textInverse:   '#081A33',

  // ── 30% Sapphire (Primary Brand) ────────────────────────
  // Sapphire Deep — Buttons, Active States, Headers
  sapphire:      '#0F52BA',
  sapphireDark:  '#0D3B87',
  sapphireLight: '#1E6FE8',
  sapphireDim:   'rgba(15, 82, 186, 0.12)',

  // Aliases for existing code compatibility
  indigo:      '#0F52BA',      // Sapphire replaces indigo
  indigoDark:  '#0D3B87',      // Sapphire Dark
  indigoLight: '#1E6FE8',      // Sapphire Light
  indigoDim:   'rgba(15, 82, 186, 0.12)',

  // ── 10% Cyan Accents (Highlights & Verification) ─────────
  // Electric Cyan — Progress bars, Verified badges, Glows
  cyan:        '#00E5E5',
  cyanDark:    '#00B8B8',
  cyanLight:   '#1FFFFF',
  cyanDim:     'rgba(0, 229, 229, 0.15)',

  // ── Status Colors ───────────────────────────────────────
  emerald:     '#10B981',      // Success (earned Pi)
  emeraldDark: '#059669',
  emeraldDim:  'rgba(16, 185, 129, 0.15)',

  amber:       '#F59E0B',      // Pending
  amberDim:    'rgba(245, 158, 11, 0.15)',

  red:         '#EF4444',      // Error/Rejected
  redDim:      'rgba(239, 68, 68, 0.15)',

  blue:        '#0F52BA',      // Info (use sapphire)
  blueDim:     'rgba(15, 82, 186, 0.12)',

  // ── Borders ──────────────────────────────────────────────
  border:      'rgba(167, 184, 199, 0.08)',     // Steel Gray @ 8%
  borderAccent: 'rgba(167, 184, 199, 0.15)',    // Steel Gray @ 15%
  borderFocus: '#0F52BA',                       // Sapphire focus
  borderCyan:  'rgba(0, 229, 229, 0.2)',        // Cyan for highlights
} as const

export const FONTS = {
  // Geist Sans — clean, architectural, consumer-grade
  sans: "'Inter', system-ui, sans-serif",
  // Keep mono only for Pi amounts and data values
  mono: "'Fira Code', 'JetBrains Mono', monospace",
} as const

export const RADII = {
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  xl:   '20px',     // The "Masterpiece" Bento Grid curve
  xxl:  '24px',
  bento: '20px',    // Explicit Bento Grid radius
  full: '9999px',
} as const

export const SHADOWS = {
  // ── Bento Grid Cards (Glassmorphism) ─────────────────────
  // Subtle cyan glow for active tasks
  card:     '0 4px 24px rgba(8, 26, 51, 0.4), 0 0 20px rgba(0, 229, 229, 0.08)',
  cardHover: '0 8px 40px rgba(8, 26, 51, 0.5), 0 0 30px rgba(0, 229, 229, 0.12)',
  
  // ── Elevated Elements ────────────────────────────────────
  elevated: '0 8px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 229, 229, 0.08)',
  
  // ── Glow Effects (Cyan Accents) ──────────────────────────
  // Luminous Hexagon — Cyan outer glow on primary button
  cyanGlow: '0 0 20px rgba(0, 229, 229, 0.25), 0 0 40px rgba(0, 229, 229, 0.12)',
  cyanGlowSubtle: '0 0 12px rgba(0, 229, 229, 0.15)',
  
  // Legacy name for compatibility
  indigoGlow: '0 0 24px rgba(15, 82, 186, 0.3)',
  emeraldGlow: '0 0 20px rgba(16, 185, 129, 0.3)',
  
  // ── Glassmorphism (Digital Crystal) ──────────────────────
  // Subtle inner highlight on cards
  inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  insetGlass: 'inset 0 1px 2px rgba(0, 229, 229, 0.1)',
} as const

export const GRADIENTS = {
  // ── Button Gradients (Sapphire Dominant) ────────────────
  sapphire:  'linear-gradient(180deg, #0F52BA 0%, #0D3B87 100%)',
  // Legacy compatibility
  indigo:    'linear-gradient(180deg, #0F52BA 0%, #0D3B87 100%)',
  
  emerald:   'linear-gradient(180deg, #10B981 0%, #059669 100%)',
  danger:    'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',

  // ── Bento Grid Card Backgrounds (Glassmorphism) ─────────
  // Subtle glass effect with cyan hint
  card:      'linear-gradient(180deg, rgba(0,229,229,0.04) 0%, rgba(255,255,255,0.02) 100%)',
  surface:   'linear-gradient(180deg, #122647 0%, #0F3D53 100%)',
  
  // ── Hero & Accent Gradients ────────────────────────────
  // Sapphire & Cyan mesh for landing page
  hero:      `
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(15, 82, 186, 0.25) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0, 229, 229, 0.15) 0%, transparent 50%)
  `,
  
  // Cyan-accented for verified/active states
  cyanAccent: 'linear-gradient(135deg, rgba(0,229,229,0.1) 0%, rgba(0,229,229,0.05) 100%)',
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

  // ── The signature Stripe-grade glass card ──────────────────────
  // Use this for EVERY card, container, and surface in the app.
  // Never write raw card styles — always use COMPONENT_STYLES.cardGlass
  cardGlass: {
    background:   'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%), #1E293B',
    border:       '1px solid rgba(148, 163, 184, 0.1)',
    borderTop:    '0.5px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    boxShadow:    '0 4px 24px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
    padding:      '20px 24px',
  } as React.CSSProperties,

  // Legacy floating card (deprecated — use cardGlass)
  card: {
    background:   `${GRADIENTS.card}, ${COLORS.bgSurface}`,
    border:       `1px solid ${COLORS.border}`,
    borderRadius: RADII.lg,
    boxShadow:    `${SHADOWS.card}, ${SHADOWS.inset}`,
    padding:      SPACING.xl,
  } as React.CSSProperties,

  // ── Primary CTA button ────────────────────────────────────────
  buttonPrimary: {
    background:    'linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)',
    color:         '#ffffff',
    border:        'none',
    borderRadius:  '10px',
    padding:       '12px 24px',
    fontSize:      '0.9rem',
    fontWeight:    '600',
    fontFamily:    "'Inter', system-ui, sans-serif",
    cursor:        'pointer',
    boxShadow:     '0 0 24px rgba(99,102,241,0.4)',
    letterSpacing: '-0.01em',
  } as React.CSSProperties,

  // ── Secondary button ──────────────────────────────────────────
  buttonSecondary: {
    background:   'transparent',
    color:        '#94A3B8',
    border:       '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '10px',
    padding:      '12px 24px',
    fontSize:     '0.875rem',
    fontWeight:   '500',
    fontFamily:   "'Inter', system-ui, sans-serif",
    cursor:       'pointer',
  } as React.CSSProperties,

  // ── Danger button ─────────────────────────────────────────────
  buttonDanger: {
    background:   'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',
    color:        '#ffffff',
    border:       'none',
    borderRadius: '10px',
    padding:      '12px 24px',
    fontSize:     '0.875rem',
    fontWeight:   '600',
    fontFamily:   "'Inter', system-ui, sans-serif",
    cursor:       'pointer',
  } as React.CSSProperties,

  // ── Text input ────────────────────────────────────────────────
  input: {
    background:   '#263348',
    border:       '1px solid rgba(148, 163, 184, 0.1)',
    borderRadius: '10px',
    padding:      '12px 16px',
    color:        '#F1F5F9',
    fontSize:     '0.9rem',
    fontFamily:   "'Inter', system-ui, sans-serif",
    outline:      'none',
    width:        '100%',
    boxSizing:    'border-box' as const,
  } as React.CSSProperties,

  // ── Section label ─────────────────────────────────────────────
  sectionLabel: {
    fontSize:      '0.72rem',
    fontWeight:    '600',
    color:         '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin:        '0 0 12px',
    fontFamily:    "'Inter', system-ui, sans-serif",
  } as React.CSSProperties,

  // ── Pi amount display (always monospaced) ─────────────────────
  piAmount: {
    fontFamily:   "'Fira Code', monospace",
    fontWeight:   '600',
    color:        '#10B981',
    letterSpacing: '-0.02em',
  } as React.CSSProperties,

  // ── Status badge ──────────────────────────────────────────────
  badge: {
    padding:       '3px 10px',
    borderRadius:  '9999px',
    fontSize:      '0.7rem',
    fontWeight:    '600',
    fontFamily:    "'Inter', system-ui, sans-serif",
    letterSpacing: '0.02em',
    display:       'inline-block',
  } as React.CSSProperties,

  // ── Page wrapper ──────────────────────────────────────────────
  pageWrapper: {
    minHeight:  '100vh',
    background: '#0F172A',
    fontFamily: "'Inter', system-ui, sans-serif",
    color:      '#F1F5F9',
  } as React.CSSProperties,

  // ── Main content area ─────────────────────────────────────────
  mainContent: {
    maxWidth: '720px',
    margin:   '0 auto',
    padding:  '72px 1rem 4rem',
  } as React.CSSProperties,

  // ── Page heading ──────────────────────────────────────────────
  pageHeading: {
    margin:        '0 0 8px',
    fontSize:      '1.5rem',
    fontWeight:    '700',
    color:         '#F1F5F9',
    letterSpacing: '-0.02em',
    fontFamily:    "'Inter', system-ui, sans-serif",
  } as React.CSSProperties,

  // ── Divider ───────────────────────────────────────────────────
  divider: {
    height:     '1px',
    background: 'rgba(148, 163, 184, 0.1)',
    border:     'none',
    margin:     '16px 0',
  } as React.CSSProperties,

} as const
