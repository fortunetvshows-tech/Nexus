'use client'

import React, { createContext, useContext, useState } from 'react'

export type ScreenName = 'onboard' | 'dashboard' | 'discover' | 'slot' | 'proof' | 'wallet' | 'profile'

interface AppContextType {
  currentScreen: ScreenName
  navigate: (screen: ScreenName) => void
  onboardingStep: number
  setOnboardingStep: (step: number) => void
  selectedRole: string
  setSelectedRole: (role: string) => void
  selectedKyc: number
  setSelectedKyc: (kyc: number) => void
  selectedSkills: string[]
  setSelectedSkills: (skills: string[]) => void
  toastMessage: string | null
  toastType: 'ok' | 'err' | 'inf' | null
  showToast: (message: string, type: 'ok' | 'err' | 'inf') => void
  slotClaimed: boolean
  setSlotClaimed: (claimed: boolean) => void
  fileUploaded: boolean
  setFileUploaded: (uploaded: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('onboard')
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState('worker')
  const [selectedKyc, setSelectedKyc] = useState(1)
  const [selectedSkills, setSelectedSkills] = useState(['🌐 Web Research', '📊 Data Entry'])
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'ok' | 'err' | 'inf' | null>(null)
  const [slotClaimed, setSlotClaimed] = useState(false)
  const [fileUploaded, setFileUploaded] = useState(false)

  const navigate = (screen: ScreenName) => {
    setCurrentScreen(screen)
  }

  const showToast = (message: string, type: 'ok' | 'err' | 'inf') => {
    setToastMessage(message)
    setToastType(type)
    setTimeout(() => {
      setToastMessage(null)
      setToastType(null)
    }, 2800)
  }

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        navigate,
        onboardingStep,
        setOnboardingStep,
        selectedRole,
        setSelectedRole,
        selectedKyc,
        setSelectedKyc,
        selectedSkills,
        setSelectedSkills,
        toastMessage,
        toastType,
        showToast,
        slotClaimed,
        setSlotClaimed,
        fileUploaded,
        setFileUploaded,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

