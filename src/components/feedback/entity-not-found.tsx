import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

type EntityNotFoundProps = {
  entity: string
  description: string
  backHref: string
  backLabel: string
}

function EntityNotFound({
  entity,
  description,
  backHref,
  backLabel,
}: EntityNotFoundProps) {
  return (
    <div className='mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center'>
      <Card className='w-full border-dashed'>
        <CardContent className='flex flex-col items-center px-6 py-12 text-center'>
          <div className='mb-5 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground'>
            <FileQuestion className='size-8' aria-hidden='true' />
          </div>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground'>
            {entity} não encontrado
          </p>
          <h1 className='mt-3 font-heading text-3xl font-semibold'>
            Não encontramos este {entity.toLocaleLowerCase('pt-BR')}
          </h1>
          <p className='mt-3 max-w-md text-sm leading-6 text-muted-foreground'>
            {description}
          </p>
          <Link
            href={backHref}
            className={buttonVariants({ className: 'mt-7' })}
          >
            {backLabel}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export function ProjectNotFound() {
  return (
    <EntityNotFound
      entity='Projeto'
      description='O endereço pode estar incorreto ou o projeto pode ter sido removido.'
      backHref='/projects'
      backLabel='Voltar aos projetos'
    />
  )
}

export function RequirementNotFound({ projectId }: { projectId?: string }) {
  return (
    <EntityNotFound
      entity='Requisito'
      description='O endereço pode estar incorreto ou o requisito pode ter sido removido.'
      backHref={projectId ? `/projects/${projectId}` : '/projects'}
      backLabel={projectId ? 'Voltar ao projeto' : 'Voltar aos projetos'}
    />
  )
}

export function TeamNotFound() {
  return (
    <EntityNotFound
      entity='Equipe'
      description='O endereço pode estar incorreto ou a equipe pode ter sido removida.'
      backHref='/teams'
      backLabel='Voltar às equipes'
    />
  )
}
