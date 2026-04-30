'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { usePiAuth } from '@/hooks/use-pi-auth'

export default function OnboardingPage() {
  const { authenticate, isLoading, isAuthenticated, user, error, isSdkReady } = usePiAuth()
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
    <div className="relative min-h-screen overflow-hidden bg-[#060b17] text-white">
      <div className="pointer-events-none absolute inset-0 hex-mesh opacity-50" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-14 pt-10 md:px-10">
        <header className="mb-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="ProofGrid logo"
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl object-contain"
              priority
              unoptimized
            />
            <div>
              <h1 className="dm-sans text-lg font-semibold tracking-wide">ProofGrid</h1>
              <p className="text-xs text-slate-300">Decentralized Work Marketplace</p>
            </div>
          </div>
          <div className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
            Mainnet Live
          </div>
        </header>

        <section className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Trusted escrow + instant payout
            </p>
            <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
              Post tasks, verify proofs, and pay workers in seconds.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
              ProofGrid is a polished marketplace for micro-work on Pi Network. Employers get
              quality submissions with transparent controls, and workers earn with fast approvals.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={authenticate}
                disabled={isLoading || !isSdkReady}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_35px_-12px_rgba(14,165,233,0.6)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                {isLoading ? 'Connecting...' : !isSdkReady ? 'Open in Pi Browser' : 'Connect with Pi Browser'}
              </button>
              <button
                onClick={() => router.push('/feed')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-[18px]">explore</span>
                Explore Tasks
              </button>
            </div>
            {error && (
              <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-xs text-rose-100">
                {error}
              </p>
            )}
            {!isSdkReady && (
              <p className="mt-3 text-xs text-slate-300">
                Login requires Pi Browser. If the button fails, open this app inside Pi Browser and retry.
              </p>
            )}

            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xl font-semibold text-cyan-200">5k+</p>
                <p className="text-xs text-slate-300">Active Workers</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xl font-semibold text-cyan-200">50k+</p>
                <p className="text-xs text-slate-300">Tasks Completed</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xl font-semibold text-cyan-200">1-2s</p>
                <p className="text-xs text-slate-300">Payout Speed</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Platform Highlights</h3>
              <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-[10px] text-cyan-100">
                Proof-first Workflow
              </span>
            </div>

            <div className="space-y-3">
              <article className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-cyan-200">
                  <span className="material-symbols-outlined text-[18px]">shield</span>
                  <span className="text-sm font-medium">Atomic Escrow</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Funds are locked before work starts, protecting workers and employers.
                </p>
              </article>

              <article className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-cyan-200">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span className="text-sm font-medium">Proof Verification</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Submit text, image, file, or video proofs with transparent review states.
                </p>
              </article>

              <article className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-cyan-200">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span className="text-sm font-medium">Instant Settlement</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Approved work triggers fast Pi Network payouts with platform fee tracking.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}



