import { useEffect, useState, type ReactNode } from 'react'

import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils'

export interface DashboardLayoutProps {
  readonly children: ReactNode
}

/**
 * Desktop-first shell: a fixed sidebar from `lg` up, and an overlay drawer
 * below it. The main column scrolls independently of the sidebar.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-dvh bg-plane">
      {/* Persistent sidebar — desktop and large tablet */}
      <aside className="hairline-r fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar />
      </aside>

      {/* Drawer — tablet and mobile */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          navOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!navOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/40 transition-opacity duration-200',
            navOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setNavOpen(false)}
        />
        <div
          className={cn(
            'hairline-r absolute inset-y-0 left-0 transition-transform duration-250 ease-out',
            navOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar onClose={() => setNavOpen(false)} />
        </div>
      </div>

      <div className="lg:pl-[248px]">
        <Header onOpenNav={() => setNavOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 lg:px-6 lg:py-6">{children}</main>
      </div>
    </div>
  )
}
