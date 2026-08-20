'use client'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { useState } from 'react'

const MAX_TECHNOLOGIES = 20
const MAX_TECHNOLOGY_LENGTH = 40

export function TechStackInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (value: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function addTechnologies(entries: string[]) {
    const next = [...value]
    for (const entry of entries) {
      const technology = entry.trim().slice(0, MAX_TECHNOLOGY_LENGTH)
      if (!technology) continue
      if (
        next.some(
          (current) =>
            current.toLocaleLowerCase('pt-BR') ===
            technology.toLocaleLowerCase('pt-BR')
        )
      )
        continue
      if (next.length === MAX_TECHNOLOGIES) break
      next.push(technology)
    }
    onChange(next)
    setDraft('')
  }

  return (
    <div className='grid gap-2'>
      <Input
        id='project-tech-stack'
        name='techStackDraft'
        value={draft}
        maxLength={MAX_TECHNOLOGY_LENGTH}
        placeholder='Ex.: Next.js, TypeScript, PostgreSQL'
        disabled={value.length >= MAX_TECHNOLOGIES}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => addTechnologies([draft])}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ',') return
          event.preventDefault()
          addTechnologies([draft])
        }}
        onPaste={(event) => {
          const pasted = event.clipboardData.getData('text')
          if (!pasted.includes(',')) return
          event.preventDefault()
          addTechnologies(pasted.split(','))
        }}
      />
      {value.length ? (
        <div
          className='flex flex-wrap gap-2'
          aria-label='Tecnologias selecionadas'
        >
          {value.map((technology) => (
            <Badge key={technology} variant='secondary' className='h-7 gap-1.5'>
              {technology}
              <button
                type='button'
                className='rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-2'
                aria-label={`Remover ${technology}`}
                onClick={() =>
                  onChange(value.filter((current) => current !== technology))
                }
              >
                <X className='size-3' aria-hidden='true' />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <p className='text-xs text-muted-foreground'>
        Pressione Enter ou vírgula para adicionar. {value.length}/
        {MAX_TECHNOLOGIES}
      </p>
    </div>
  )
}
