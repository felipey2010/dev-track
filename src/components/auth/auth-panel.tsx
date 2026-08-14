'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import LoginForm from './login-form'
import RegistrationForm from './registration-form'

type Mode = 'login' | 'register'

export function AuthPanel({ googleEnabled }: { googleEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>('login')

  return (
    <Tabs
      value={mode}
      onValueChange={(value) => setMode(value as Mode)}
      className='mt-8'
    >
      <TabsList className='grid w-full grid-cols-2 min-h-10'>
        <TabsTrigger value='login'>Entrar</TabsTrigger>
        <TabsTrigger value='register'>Criar conta</TabsTrigger>
      </TabsList>
      <TabsContent value='login'>
        <LoginForm
          googleEnabled={googleEnabled}
          onRegister={() => setMode('register')}
        />
      </TabsContent>
      <TabsContent value='register'>
        <RegistrationForm
          googleEnabled={googleEnabled}
          onLogin={() => setMode('login')}
        />
      </TabsContent>
    </Tabs>
  )
}
