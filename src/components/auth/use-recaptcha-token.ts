'use client'

import { useCallback } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import type { RecaptchaAction } from '@/lib/recaptcha/constants'

export function useRecaptchaToken() {
  const { executeRecaptcha } = useGoogleReCaptcha()

  return useCallback(
    async (action: RecaptchaAction) => {
      if (!executeRecaptcha) throw new Error('RECAPTCHA_NOT_READY')
      return executeRecaptcha(action)
    },
    [executeRecaptcha]
  )
}
