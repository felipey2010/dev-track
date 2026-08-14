import { useActiveRouteCheck } from '@/hooks/useActiveRouteCheck'
import { LucideProps } from 'lucide-react'
import Link from 'next/link'
import { ForwardRefExoticComponent, RefAttributes } from 'react'

interface SidebarLinkType {
  title: string
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >
  route: string
}

type Props = {
  item: SidebarLinkType
}

function SidebarItem({ item }: Props) {
  const { title, icon: Icon, route } = item
  const [isActive] = useActiveRouteCheck(route)

  return (
    <Link
      className={`flex h-9 items-center gap-3 rounded-sm border-l-2 px-3 text-xs font-medium transition-colors ${isActive ? 'border-cyan-500 bg-cyan-500/10 text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
      href={route}
    >
      <Icon className='size-4' />
      {title}
    </Link>
  )
}

export default SidebarItem
