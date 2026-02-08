'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export function MobileNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild className="md:hidden ml-auto">
        <Button variant="ghost" size="icon" className="text-slate-400">
          <Menu className="h-5 w-5" />
          <span className="sr-only">메뉴 열기</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] bg-slate-950 border-slate-800">
        <nav className="flex flex-col gap-4 mt-8">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </SheetClose>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
