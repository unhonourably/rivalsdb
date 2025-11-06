'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-white/10">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          <NavButton href="/" icon="home" label="Home" isActive={isActive('/')} />
          <NavButton href="/leaderboards" icon="trophy" label="Ranks" isActive={isActive('/leaderboards')} />
          <NavButton href="/heroes" icon="shield" label="Heroes" isActive={isActive('/heroes')} />
          <NavButton href="/players" icon="users" label="Players" isActive={isActive('/players')} />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col items-center justify-center gap-1 py-2 text-gray-400 hover:text-white transition-colors active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-white/10 max-h-[60vh] overflow-y-auto">
            <div className="px-4 py-2">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-white font-medium">Menu</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="py-2">
                <MenuLink href="/achievements" onClick={() => setMenuOpen(false)}>Achievements</MenuLink>
                <MenuLink href="/items" onClick={() => setMenuOpen(false)}>Items</MenuLink>
                <MenuLink href="/battlepass" onClick={() => setMenuOpen(false)}>Battle Pass</MenuLink>
                
                <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-wider text-gray-500 font-medium">
                  Updates
                </div>
                <MenuLink href="/patch-notes" onClick={() => setMenuOpen(false)}>Patch Notes</MenuLink>
                <MenuLink href="/balances" onClick={() => setMenuOpen(false)}>Balances</MenuLink>
                <MenuLink href="/dev-diaries" onClick={() => setMenuOpen(false)}>Dev Diaries</MenuLink>
                <MenuLink href="/game-versions" onClick={() => setMenuOpen(false)}>Game Versions</MenuLink>
                
                <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-wider text-gray-500 font-medium">
                  Info
                </div>
                <MenuLink href="/info" onClick={() => setMenuOpen(false)}>Update Schedule</MenuLink>
                <MenuLink href="/contact" onClick={() => setMenuOpen(false)}>Contact</MenuLink>
                <MenuLink href="/terms" onClick={() => setMenuOpen(false)}>Terms</MenuLink>
                <MenuLink href="/privacy" onClick={() => setMenuOpen(false)}>Privacy</MenuLink>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function NavButton({ href, icon, label, isActive }: { href: string; icon: string; label: string; isActive: boolean }) {
  const getIcon = () => {
    switch (icon) {
      case 'home':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      case 'trophy':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      case 'shield':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      case 'users':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 py-2 transition-colors active:scale-95 ${
        isActive ? 'text-white' : 'text-gray-400 hover:text-white'
      }`}
    >
      {getIcon()}
      <span className="text-xs font-medium">{label}</span>
    </Link>
  )
}

function MenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
    >
      {children}
    </Link>
  )
}

