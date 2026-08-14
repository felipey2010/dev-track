'use client'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import React from 'react'

export default function GoogleRecaptchaWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={recaptchaKey ?? 'NOT_CONFIGURED'}
      language='pt-br'
      scriptProps={{ async: true, defer: true, appendTo: 'body' }}
    >
      {children}
    </GoogleReCaptchaProvider>
  )
}
