import 'server-only'

import nodemailer from 'nodemailer'
import { APP_IDENTITY } from '@/lib/app-identity'

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required email setting: ${name}`)
  return value
}

function createEmailTransport() {
  const port = Number(requiredEnvironmentVariable('SMTP_PORT'))
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('SMTP_PORT must be a valid port number')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: requiredEnvironmentVariable('SMTP_HOST'),
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465,
    auth: {
      user: requiredEnvironmentVariable('SMTP_USERNAME'),
      pass: requiredEnvironmentVariable('SMTP_PASSWORD'),
    },
  })
}

let transport: ReturnType<typeof nodemailer.createTransport> | undefined

export async function sendMail(to: string, subject: string, html: string) {
  transport ??= createEmailTransport()

  return transport.sendMail({
    from: `${APP_IDENTITY.name} <${requiredEnvironmentVariable('EMAIL_FROM')}>`,
    to,
    subject,
    html,
  })
}
