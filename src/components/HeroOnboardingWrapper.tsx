'use client'

import { useState, useEffect } from 'react'
import { hasOnboarded, markOnboarded } from './HeroOnboarding'
import HeroOnboarding from './HeroOnboarding'

interface HeroOnboardingWrapperProps {
  children: React.ReactNode
  totalMoments?: number
}

export default function HeroOnboardingWrapper({ children, totalMoments }: HeroOnboardingWrapperProps) {
  const [showHero, setShowHero] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setShowHero(!hasOnboarded())
    setChecked(true)
  }, [])

  const dismiss = () => {
    markOnboarded()
    setShowHero(false)
  }

  if (!checked) return null // Prevent flash on SSR

  if (showHero) {
    return (
      <main className="min-h-dvh bg-bg">
        <HeroOnboarding totalMoments={totalMoments} onDismiss={dismiss} />
      </main>
    )
  }

  return <>{children}</>
}
