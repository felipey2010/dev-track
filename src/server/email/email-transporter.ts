import 'server-only'

import nodemailer from 'nodemailer'

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'test') {
      transport
        .verify()
        .then(() => console.log('Email prepared to send'))
        .catch(() =>
          console.log(
            'Unable to connect to email server. Make sure you have configured the SMTP options in .env'
          )
        )
    }
    const sender = `MentoringHub App <${process.env.EMAIL_FROM}>`

    await transport.sendMail({
      from: sender,
      to,
      subject,
      html,
    })
  } catch (error: any) {
    console.log('Erro ao enviar email')
  }
}
