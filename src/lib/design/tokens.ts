/**
 * ProofGrid Design System — Void Black Palette
 *
 * Color Philosophy: Dark Mode First (void black #080A0F baseline)
 * Accent Energy: Sapphire Blue (#0096FF) + Status Colors
 * Typography: Space Grotesk (UI) + Barlow Condensed (Display) + JetBrains Mono (Data)
 * 
 * Design Pattern: Glass morphism, hex mesh backgrounds, drop-shadow glows
 * Reference: ProofGrid prototype HTML design system
 */

export const COLORS = {
  // ── BACKGROUND HIERARCHY ────────────────────────────────
  bg: {
    void: "#080A0F",           // Main app background
    base: "#0A0C10",           // Secondary background
    surface: "#0E1118",        // Content surface
    card: "#121620",           // Card background
    cardHover: "#161B26",      // Card hover state
    raised: "#1A2030",         // Raised/elevated elements
    glass: "rgba(14,17,24,0.85)", // Glass morphism
  },

  // ── PRIMARY ACCENT - SAPPHIRE BLUE ──────────────────────
  accent: {
    primary: "#0096FF",        // Main accent color
    bright: "#3DB8FF",         // Bright/highlighted version
    dim: "rgba(0,150,255,0.15)", // Dimmed background
    glow: "rgba(0,150,255,0.08)", // Subtle glow
  },

  // ── STATUS COLORS ───────────────────────────────────────
  status: {
    green: "#00D68F",          // Success, approved
    greenDim: "rgba(0,214,143,0.12)",
    amber: "#FFB020",          // Pending, hot, warning
    amberDim: "rgba(255,176,32,0.12)",
    red: "#FF4757",            // Error, rejected, danger
    redDim: "rgba(255,71,87,0.12)",
    purple: "#A78BFA",         // Governance, elite
    purpleDim: "rgba(167,139,250,0.12)",
    cyan: "#00E5E5",           // Accent cyan
  },

  // ── TEXT HIERARCHY ──────────────────────────────────────
  text: {
    primary: "#F0F4FF",        // Main text
    secondary: "#8892A4",      // Secondary text
    tertiary: "#4A5568",       // Tertiary/muted text
    muted: "#2D3748",          // Disabled/very muted
  },

  // ── BORDERS & SEPARATORS ────────────────────────────────
  border: "rgba(255,255,255,0.06)",       // Default border
  borderAccent: "rgba(0,150,255,0.25)",   // Accent border
  borderStrong: "rgba(255,255,255,0.12)", // Strong border

  // ── LEGACY COMPATIBILITY ────────────────────────────────
  bgBase: "#080A0F",
  bgSurface: "#0E1118",
  bgElevated: "#1A2030",
  bgCard: "#121620",
  textPrimary: "#F0F4FF",
  textSecondary: "#8892A4",
  textTertiary: "#4A5568",
  textMuted: "#2D3748",
  sapphire: "#0096FF",
  sapphireDark: "#0077CC",
  sapphireLight: "#3DB8FF",
  sapphireDim: "rgba(0,150,255,0.15)",
  emerald: "#00D68F",
  emeraldDark: "#00B37E",
  emeraldDim: "rgba(0,214,143,0.12)",
  amber: "#FFB020",
  amberDim: "rgba(255,176,32,0.12)",
  red: "#FF4757",
  redDim: "rgba(255,71,87,0.12)",
  cyan: "#00E5E5",
  // Legacy indigo → Sapphire blue mappings
  indigo: "#0096FF",
  indigoDim: "rgba(0,150,255,0.15)",
  indigoDark: "#0077CC",
  indigoLight: "#3DB8FF",
} as const

export const FONTS = {
  // Space Grotesk for UI (clean, modern)
  ui: "'Space Grotesk', system-ui, sans-serif",
  // Barlow Condensed for display (bold, impactful)
  display: "'Barlow Condensed', system-ui, sans-serif",
  // JetBrains Mono for data (monospaced)
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  // Fallback
  sans: "'Space Grotesk', system-ui, sans-serif",
} as const

export const RADII = {
  sm: "6px",      // Small elements
  md: "10px",     // Medium elements
  lg: "16px",     // Large elements
  xl: "22px",     // Extra large (headers, modals)
  full: "9999px", // Fully rounded (badges)
} as const

export const SHADOWS = {
  // ── CARD SHADOWS (Glass Morphism) ─────────────────────────
  card: "0 4px 24px rgba(0,0,0,0.3), 0 0 20px rgba(0,150,255,0.1)",
  cardHover: "0 8px 40px rgba(0,0,0,0.4), 0 0 30px rgba(0,150,255,0.15)",
  elevated: "0 8px 40px rgba(0,0,0,0.4), 0 0 30px rgba(0,150,255,0.15)",
  
  // ── GLOW EFFECTS ────────────────────────────────────────
  accentGlow: "0 0 20px rgba(0,150,255,0.4)",
  accentGlowSubtle: "0 0 12px rgba(0,150,255,0.2)",
  greenGlow: "0 0 20px rgba(0,214,143,0.3)",
  amberGlow: "0 0 20px rgba(255,176,32,0.3)",
  redGlow: "0 0 20px rgba(255,71,87,0.3)",
  cyanGlow: "0 0 20px rgba(0,229,229,0.3)",
  purpleGlow: "0 0 20px rgba(167,139,250,0.3)",
  indigoGlow: "0 0 20px rgba(0,150,255,0.4)",
  
  // ── INSET EFFECTS (Glassmorphism) ──────────────────────
  inset: "inset 0 1px 0 rgba(255,255,255,0.04)",
} as const

export const GRADIENTS = {
  // ── PRIMARY BUTTON ──────────────────────────────────────
  primary: "linear-gradient(90deg, #0096FF, #3DB8FF)",
  
  // ── STATUS GRADIENTS ────────────────────────────────────
  success: "linear-gradient(90deg, #00D68F, #00B37E)",
  warning: "linear-gradient(90deg, #FFB020, #FF9500)",
  danger: "linear-gradient(90deg, #FF4757, #CC3A47)",
  
  // ── LEGACY GRADIENTS ──────────────────────────────────────
  indigo: "linear-gradient(135deg, #0096FF, #3DB8FF)",
  
  // ── CARD GRADIENTS (Glassmorphism) ──────────────────────
  card: "linear-gradient(135deg, rgba(0,150,255,0.08), rgba(167,139,250,0.05))",
  
  // ── BACKGROUND PATTERNS ────────────────────────────────
  hexMesh: `
    radial-gradient(circle at 20% 20%, rgba(0,150,255,0.04) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(0,150,255,0.03) 0%, transparent 50%)
  `,
} as const

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  xxl: "32px",
  xxxl: "48px",
} as const

/** Status color helper — returns consistent colors for status badges */
export function statusStyle(status: string): {
  color: string
  background: string
  border: string
} {
  switch (status) {
    case 'APPROVED':
    case 'confirmed':
    case 'resolved_worker':
      return {
        color: COLORS.status.green,
        background: COLORS.status.greenDim,
        border: `1px solid rgba(0,214,143,0.3)`,
      }
    case 'REJECTED':
    case 'failed':
    case 'resolved_employer':
      return {
        color: COLORS.status.red,
        background: COLORS.status.redDim,
        border: `1px solid rgba(255,71,87,0.3)`,
      }
    case 'SUBMITTED':
    case 'pending':
    case 'tier2_review':
      return {
        color: COLORS.status.amber,
        background: COLORS.status.amberDim,
        border: `1px solid rgba(255,176,32,0.3)`,
      }
    case 'DISPUTED':
    case 'raised':
    case 'in_review':
      return {
        color: COLORS.accent.bright,
        background: COLORS.accent.dim,
        border: `1px solid ${COLORS.borderAccent}`,
      }
    case 'escrowed':
      return {
        color: COLORS.accent.bright,
        background: COLORS.accent.dim,
        border: `1px solid ${COLORS.borderAccent}`,
      }
    default:
      return {
        color: COLORS.text.secondary,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${COLORS.border}`,
      }
  }
}

// Reusable component styles — use these for consistency across the app
export const COMPONENT_STYLES = {
  // ── GLASS MORPHISM CARD ─────────────────────────────────────
  cardGlass: {
    background: COLORS.bg.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADII.lg,
    boxShadow: SHADOWS.card,
    padding: SPACING.lg,
  } as React.CSSProperties,

  // ── PRIMARY BUTTON ──────────────────────────────────────────
  buttonPrimary: {
    background: GRADIENTS.primary,
    color: "#ffffff",
    border: "none",
    borderRadius: RADII.md,
    padding: `${SPACING.md} ${SPACING.lg}`,
    fontSize: "0.9rem",
    fontWeight: "600",
    fontFamily: FONTS.ui,
    cursor: "pointer",
    boxShadow: SHADOWS.accentGlow,
    letterSpacing: "-0.01em",
    transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
  } as React.CSSProperties,

  // ── SECONDARY BUTTON ────────────────────────────────────────
  buttonSecondary: {
    background: "transparent",
    color: COLORS.text.secondary,
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: RADII.md,
    padding: `${SPACING.md} ${SPACING.lg}`,
    fontSize: "0.875rem",
    fontWeight: "500",
    fontFamily: FONTS.ui,
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
  } as React.CSSProperties,

  // ── DANGER BUTTON ───────────────────────────────────────────
  buttonDanger: {
    background: GRADIENTS.danger,
    color: "#ffffff",
    border: "none",
    borderRadius: RADII.md,
    padding: `${SPACING.md} ${SPACING.lg}`,
    fontSize: "0.875rem",
    fontWeight: "600",
    fontFamily: FONTS.ui,
    cursor: "pointer",
    boxShadow: SHADOWS.redGlow,
  } as React.CSSProperties,

  // ── TEXT INPUT ──────────────────────────────────────────────
  input: {
    background: COLORS.bg.card,
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: RADII.md,
    padding: `${SPACING.md} ${SPACING.lg}`,
    color: COLORS.text.primary,
    fontSize: "0.9rem",
    fontFamily: FONTS.ui,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
  } as React.CSSProperties,

  // ── SECTION LABEL ───────────────────────────────────────────
  sectionLabel: {
    fontSize: "0.72rem",
    fontWeight: "600",
    color: COLORS.text.secondary,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    margin: "0 0 12px",
    fontFamily: FONTS.display,
  } as React.CSSProperties,

  // ── PI AMOUNT DISPLAY ───────────────────────────────────────
  piAmount: {
    fontFamily: FONTS.mono,
    fontWeight: "600",
    color: COLORS.status.green,
    letterSpacing: "-0.02em",
  } as React.CSSProperties,

  // ── STATUS BADGE ────────────────────────────────────────────
  badge: {
    padding: "3px 10px",
    borderRadius: RADII.full,
    fontSize: "0.7rem",
    fontWeight: "600",
    fontFamily: FONTS.ui,
    letterSpacing: "0.02em",
    display: "inline-block",
  } as React.CSSProperties,

  // ── PAGE WRAPPER ────────────────────────────────────────────
  pageWrapper: {
    minHeight: "100vh",
    background: COLORS.bg.void,
    fontFamily: FONTS.ui,
    color: COLORS.text.primary,
  } as React.CSSProperties,

  // ── MAIN CONTENT AREA ───────────────────────────────────────
  mainContent: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "72px 1rem 4rem",
  } as React.CSSProperties,

  // ── PAGE HEADING ────────────────────────────────────────────
  pageHeading: {
    margin: "0 0 8px",
    fontSize: "1.5rem",
    fontWeight: "700",
    color: COLORS.text.primary,
    letterSpacing: "-0.02em",
    fontFamily: FONTS.display,
  } as React.CSSProperties,

  // ── DIVIDER ─────────────────────────────────────────────────
  divider: {
    height: "1px",
    background: COLORS.border,
    border: "none",
    margin: "16px 0",
  } as React.CSSProperties,

} as const

