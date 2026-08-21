export function RecaptchaConsent() {
  return (
    <p className='text-center text-[11px] leading-[1.6] text-muted-foreground'>
      Este site é protegido pelo reCAPTCHA. Aplicam-se a{' '}
      <a
        className='underline hover:text-foreground'
        href='https://policies.google.com/privacy'
        target='_blank'
        rel='noreferrer'
      >
        Política de Privacidade
      </a>{' '}
      e os{' '}
      <a
        className='underline hover:text-foreground'
        href='https://policies.google.com/terms'
        target='_blank'
        rel='noreferrer'
      >
        Termos de Serviço
      </a>{' '}
      do Google.
    </p>
  )
}
