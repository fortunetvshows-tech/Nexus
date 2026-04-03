'use client'

import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'

export function ScreenOnboarding() {
  const {
    onboardingStep,
    setOnboardingStep,
    selectedRole,
    setSelectedRole,
    selectedKyc,
    setSelectedKyc,
    selectedSkills,
    setSelectedSkills,
    navigate,
    showToast,
  } = useApp()

  const toggleSkill = (skill: string) => {
    setSelectedSkills(
      selectedSkills.includes(skill)
        ? selectedSkills.filter(s => s !== skill)
        : [...selectedSkills, skill]
    )
  }

  const enterApp = () => {
    navigate('dashboard')
    showToast('Welcome to ProofGrid! 🎉', 'ok')
  }

  const SKILLS = [
    '🌐 Web Research',
    '📊 Data Entry',
    '✍️ Writing',
    '🎨 Design',
    '📸 Photography',
    '💻 Tech',
    '🗺️ Local Tasks',
    '🔊 Audio / Video',
    '🤖 AI & Labeling',
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-void overflow-hidden">
      {/* Animated glow backgrounds */}
      <div className="absolute w-[480px] h-[480px] rounded-full bg-gradient-to-br from-pi-glow to-transparent top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-3/4 pointer-events-none animate-pulse opacity-70" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-br from-pulse-dim to-transparent bottom-5 -right-10 pointer-events-none animate-pulse opacity-50 animation-delay-7s" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-7 w-full max-w-sm">
        {/*Logo */}
        <div className="mb-7 animate-in fade-in zoom-in duration-500 delay-100">
          <svg width="74" height="74" viewBox="0 0 74 74" fill="none" className="mx-auto mb-3">
            <defs>
              <radialGradient id="gg" cx="50%" cy="25%" r="75%">
                <stop offset="0%" stopColor="#60C8FF" />
                <stop offset="60%" stopColor="#0095FF" />
                <stop offset="100%" stopColor="#0060CC" />
              </radialGradient>
            </defs>
            <polygon points="37,3 69,19 69,55 37,71 5,55 5,19" fill="url(#gg)" opacity="0.9" />
            <path d="M26 37L33 44L48 29" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </svg>
          <div className="text-center">
            <div className="font-display text-4xl tracking-widest text-t1 uppercase">
              PROOF<span className="text-pi-lt">GRID</span>
            </div>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex gap-1.5 justify-center mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded transition-all ${
                i === onboardingStep ? 'w-5 bg-pi' : 'w-1.5 bg-line-md'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: ROLE SELECTION */}
        {onboardingStep === 1 && (
          <div className="w-full animate-in fade-in duration-300">
            <h2 className="text-center font-display text-2xl tracking-widest text-t1 uppercase mb-1.5">
              I want to...
            </h2>
            <p className="text-center text-sm text-t2 mb-5">
              Choose how you'll use ProofGrid
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <button
                onClick={() => setSelectedRole('worker')}
                className={`p-4.5 border rounded-lg text-center transition-all  ${
                  selectedRole === 'worker'
                    ? 'border-pi-lt bg-pi-dim'
                    : 'border-line bg-card hover:bg-card-h'
                }`}
              >
                <div className="text-2xl mb-2">⛏️</div>
                <div className="font-bold text-t1">Earn Pi</div>
                <div className="text-xs text-t2 mt-0.5">Complete tasks</div>
              </button>
              <button
                onClick={() => setSelectedRole('employer')}
                className={`p-4.5 border rounded-lg text-center transition-all ${
                  selectedRole === 'employer'
                    ? 'border-pi-lt bg-pi-dim'
                    : 'border-line bg-card hover:bg-card-h'
                }`}
              >
                <div className="text-2xl mb-2">🏗️</div>
                <div className="font-bold text-t1">Post Work</div>
                <div className="text-xs text-t2 mt-0.5">Hire workers</div>
              </button>
            </div>

            <Button variant="primary" full onClick={() => setOnboardingStep(2)}>
              Continue →
            </Button>
          </div>
        )}

        {/* STEP 2: KYC SELECTION */}
        {onboardingStep === 2 && (
          <div className="w-full animate-in fade-in duration-300">
            <h2 className="text-center font-display text-2xl tracking-widest text-t1 uppercase mb-1.5">
              Verify Identity
            </h2>
            <p className="text-center text-sm text-t2 mb-5">
              Higher KYC = higher earning limits
            </p>

            <div className="space-y-2.5 mb-5">
              {[
                { level: 0, icon: '👤', title: 'Basic — No KYC', desc: 'Pi wallet only', perk: 'Up to 5π per task', badge: 'Free' },
                {
                  level: 1,
                  icon: '🪪',
                  title: 'Level 1 — ID Verified',
                  desc: 'Government ID scan',
                  perk: 'Up to 25π per task',
                  badge: 'Recommended',
                },
                {
                  level: 2,
                  icon: '🏛️',
                  title: 'Level 2 — Full KYC',
                  desc: 'ID + Biometric + Address',
                  perk: 'Unlimited earnings',
                  badge: 'Elite',
                },
              ].map(({ level, icon, title, desc, perk, badge }) => (
                <button
                  key={level}
                  onClick={() => setSelectedKyc(level)}
                  className={`w-full p-3.5 border rounded-lg transition-all text-left flex items-center gap-3.5 ${
                    selectedKyc === level
                      ? 'border-pi bg-pi-dim'
                      : 'border-line bg-card hover:bg-card-h'
                  }`}
                >
                  <div className="text-2xl flex-shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-t1 text-sm">{title}</div>
                    <div className="text-xs text-t2">{desc}</div>
                    <div className="text-xs text-pi-lt font-bold mt-1">{perk}</div>
                  </div>
                  <Chip variant={badge === 'Free' ? 'grey' : badge === 'Recommended' ? 'blue' : 'amber'}>
                    {badge}
                  </Chip>
                </button>
              ))}
            </div>

            <Button variant="primary" full onClick={() => setOnboardingStep(3)}>
              Continue →
            </Button>
          </div>
        )}

        {/* STEP 3: SKILL SELECTION */}
        {onboardingStep === 3 && (
          <div className="w-full animate-in fade-in duration-300">
            <h2 className="text-center font-display text-2xl tracking-widest text-t1 uppercase mb-1.5">
              Pick Your Skills
            </h2>
            <p className="text-center text-sm text-t2 mb-5">
              We'll show you relevant tasks first
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3.5 py-2 rounded-pill border text-xs font-bold transition-all ${
                    selectedSkills.includes(skill)
                      ? 'bg-pi-dim border-pi text-pi-lt'
                      : 'bg-card border-line text-t2 hover:bg-card-h'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>

            <Button variant="primary" full onClick={enterApp}>
              Start Earning →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

