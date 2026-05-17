'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Target, LayoutDashboard, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Goals', path: '/dashboard/goals', icon: <Target size={20} /> },
    { name: 'Check-ins', path: '/dashboard/check-ins', icon: <CheckSquare size={20} /> },
    { name: 'Admin Hub', path: '/dashboard/admin', icon: <Target size={20} /> }, // Using Target icon as placeholder for Shield
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ 
        width: '280px', 
        borderLeft: 'none', 
        borderTop: 'none', 
        borderBottom: 'none',
        borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', paddingLeft: '0.5rem' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            A
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '0.5px' }}>AtomQuest</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link href={item.path} key={item.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'white' : 'var(--text-muted)',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s'
              }}>
                <span style={{ color: isActive ? 'var(--primary-color)' : 'inherit' }}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            )
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="btn-secondary" 
          style={{ width: '100%', justifyContent: 'flex-start', border: 'none', color: 'var(--accent-color)' }}
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
