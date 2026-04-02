'use client'

import { AppProvider, useApp } from '@/context/AppContext'
import { ScreenOnboarding } from './screens/ScreenOnboarding'
import { ScreenDashboard } from './screens/ScreenDashboard'
import { ScreenDiscover } from './screens/ScreenDiscover'
import { ScreenSlot } from './screens/ScreenSlot'
import { ScreenProof } from './screens/ScreenProof'
import { ScreenWallet } from './screens/ScreenWallet'
import { ScreenProfile } from './screens/ScreenProfile'
import { BottomNav } from './BottomNav'
import { Toast } from './Toast'
import type { ScreenName } from '@/context/AppContext'

function WorkerAppCore() {
  const { currentScreen, onboardingStep } = useApp()
  const isOnboarding = currentScreen === 'onboard'

  const renderScreen = (screen: ScreenName) => {
    switch (screen) {
      case 'onboard':
        return <ScreenOnboarding />
      case 'dashboard':
        return <ScreenDashboard />
      case 'discover':
        return <ScreenDiscover />
      case 'slot':
        return <ScreenSlot />
      case 'proof':
        return <ScreenProof />
      case 'wallet':
        return <ScreenWallet />
      case 'profile':
        return <ScreenProfile />
      default:
        return <ScreenOnboarding />
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-void">
      {/* Main Screen */}
      <div
        className={`w-full h-full transition-opacity duration-200 ${
          isOnboarding ? 'opacity-100' : 'opacity-100'
        }`}
      >
        {renderScreen(currentScreen)}
      </div>

      {/* Bottom Navigation - Hidden during onboarding, shown after */}
      {!isOnboarding && <BottomNav />}

      {/* Toast Notifications - Always visible */}
      <Toast />
    </div>
  )
}

export function WorkerApp() {
  return (
    <AppProvider>
      <WorkerAppCore />
    </AppProvider>
  )
}
