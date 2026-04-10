'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePiAuth } from '@/hooks/use-pi-auth'

export default function OnboardingPage() {
  const { authenticate, isLoading, isAuthenticated, user } = usePiAuth()
  const router = useRouter()
  const [hasMounted, setHasMounted] = useState(false)

  // Hydration guard
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Redirect after auth
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  if (!hasMounted) return null

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      {/* Background Layers */}
      <div className="fixed inset-0 hex-mesh"></div>
      <div className="glow-orb bg-primary-container w-[400px] h-[400px] -top-20 -left-20"></div>
      <div className="glow-orb bg-secondary-container w-[300px] h-[300px] bottom-20 -right-10"></div>

      {/* Main Content Container */}
      <main className="relative z-10 w-full max-w-[420px] px-8 flex flex-col items-center text-center">
        {/* Logo Section */}
        <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
          <div className="crystal-shield">
            <span className="material-symbols-outlined inner-gem" data-icon="verified" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        </div>

        {/* Typography Branding */}
        <div className="space-y-1 mb-12">
          <h1 className="bebas-neue text-6xl tracking-[0.15em] text-white leading-none">
            PROOFGRID
          </h1>
          <p className="ibm-plex text-xs tracking-[0.3em] text-primary font-medium opacity-80">
            DECENTRALIZED WORK MARKETPLACE
          </p>
        </div>

        {/* Bento-style Feature Bullets */}
        <div className="w-full space-y-4 mb-16">
          {/* Feature 1: Escrow Protection */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-surface-container-low/40 backdrop-blur-md outline-variant/15 border border-transparent hover:border-primary/20 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-2xl" data-icon="shield">shield</span>
            </div>
            <div className="text-left">
              <h3 className="dm-sans text-sm font-bold text-white tracking-wide">Escrow protection</h3>
              <p className="dm-sans text-[11px] text-on-surface-variant">Smart contract secured funds</p>
            </div>
          </div>

          {/* Feature 2: Instant Payments */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-surface-container-low/40 backdrop-blur-md outline-variant/15 border border-transparent hover:border-primary/20 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-2xl" data-icon="bolt">bolt</span>
            </div>
            <div className="text-left">
              <h3 className="dm-sans text-sm font-bold text-white tracking-wide">Instant payments</h3>
              <p className="dm-sans text-[11px] text-on-surface-variant">Real-time Pi Network settlement</p>
            </div>
          </div>

          {/* Feature 3: Work from Anywhere */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-surface-container-low/40 backdrop-blur-md outline-variant/15 border border-transparent hover:border-primary/20 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-2xl" data-icon="public">public</span>
            </div>
            <div className="text-left">
              <h3 className="dm-sans text-sm font-bold text-white tracking-wide">Work from anywhere</h3>
              <p className="dm-sans text-[11px] text-on-surface-variant">Global borderless opportunities</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="w-full space-y-6">
          <button
            onClick={authenticate}
            disabled={isLoading}
            className="w-full py-5 px-6 rounded-[18px] bg-gradient-to-br from-primary-container to-[#005bb8] text-white font-bold tracking-wider dm-sans flex items-center justify-center gap-3 shadow-[0_12px_40px_-12px_rgba(0,149,255,0.5)] active:scale-95 transition-all group relative overflow-hidden disabled:opacity-70"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-outlined text-xl" data-icon="rocket_launch">rocket_launch</span>
            <span>{isLoading ? 'Connecting...' : 'Connect with Pi Browser'}</span>
          </button>

          {/* Network Status */}
          <div className="flex items-center justify-center gap-2 text-on-surface-variant">
            <span className="ibm-plex text-[10px] uppercase tracking-widest">Network Status:</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/10 border border-secondary-container/20">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
              <span className="ibm-plex text-[10px] text-secondary font-bold">MAINNET LIVE</span>
            </div>
          </div>
        </div>

        {/* Footer Visual Decor */}
        <div className="mt-16 opacity-30 flex gap-4">
          <div className="w-1 h-1 rounded-full bg-primary"></div>
          <div className="w-1 h-1 rounded-full bg-primary"></div>
          <div className="w-1 h-1 rounded-full bg-primary"></div>
        </div>
      </main>

      {/* Bottom Aesthetic Accents */}
      <div className="fixed bottom-0 left-0 w-full h-[150px] bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>

      {/* Decorative Grid Image */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <img
          className="w-full h-full object-cover"
          alt="Abstract network architecture with glowing blue nodes and crystalline structures on a dark background"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwPCkyAJers_AaS39M6NMrthl_OAlxauuQLhen9dZOht25wmXjAlKiL-Kv818sLKAabl5Z_2pDmvWyekxOdoQrHFtAuMuqngyKUS7ynQpLXc7Ib_cfgsf1zho_6_JH8wtYEqJ6LXic_3e-o3ZqytHVl3fxHRO2pMAlP26Kbb3IWNby_An3O6jzavIH7YQH-uoZkelcwYMKQpDMEFP4Fg_wEUZKS1k_wpVG6U9fphU3UDvMKrh9rmTQs83T16c3qsAjw1PNavhkGNIL"
        />
      </div>
    </div>
  )
}



