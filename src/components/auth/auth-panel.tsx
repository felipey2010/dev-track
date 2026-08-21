'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import LoginForm from './login-form'
import RegistrationForm from './registration-form'
import { AuthCard } from './auth-card'

type Mode = 'login' | 'register'

export function AuthPanel({ googleEnabled }: { googleEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>('login')

  return (
    <AuthCard>
      <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
        <TabsList className='grid min-h-11 w-full grid-cols-2 rounded-[10px] border border-border/60 bg-secondary p-1'>
          <TabsTrigger value='login' className='rounded-lg'>
            Entrar
          </TabsTrigger>
          <TabsTrigger value='register' className='rounded-lg'>
            Criar conta
          </TabsTrigger>
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
    </AuthCard>
  )
}
