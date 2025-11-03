'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import rivalsLogo from '@/components/rivalslogo.png'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [updatesOpen, setUpdatesOpen] = useState(false)
  const closeTimeout = useRef<NodeJS.Timeout | null>(null)

  const openUpdates = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current)
      closeTimeout.current = null
    }
    setUpdatesOpen(true)
  }

  const scheduleCloseUpdates = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current)
    }
    closeTimeout.current = setTimeout(() => {
      setUpdatesOpen(false)
      closeTimeout.current = null
    }, 120)
  }

  const closeImmediately = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current)
      closeTimeout.current = null
    }
    setUpdatesOpen(false)
  }

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 20
          if (isScrolled !== scrolled) {
            setScrolled(isScrolled)
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrolled])

  useEffect(() => {
    return () => {
      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current)
      }
    }
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/95 backdrop-blur-sm border-b border-white/5' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div 
              className={`
                relative transition-all duration-300
                ${scrolled ? 'h-12 w-auto' : 'h-14 w-auto'}
              `}
            >
              <Image
                src={rivalsLogo}
                alt="Marvel Rivals Logo"
                height={scrolled ? 56 : 64}
                width={scrolled ? 160 : 192}
                className="h-full w-auto object-contain"
                priority
              />
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/leaderboards">Leaderboards</NavLink>
            <NavLink href="/players">Players</NavLink>
            <NavLink href="/heroes">Heroes</NavLink>
            <NavLink href="/achievements">Achievements</NavLink>
            <NavLink href="/items">Items</NavLink>
            <NavLink href="/battlepass">Battle Pass</NavLink>
            <div
              className="relative"
              onMouseEnter={openUpdates}
              onMouseLeave={scheduleCloseUpdates}
            >
              <button
                type="button"
                onClick={() => (updatesOpen ? closeImmediately() : openUpdates())}
                className="flex items-center gap-1 text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Updates
                <svg
                  className={`w-3 h-3 transition-transform ${updatesOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {updatesOpen && (
                <div
                  className="absolute right-0 mt-3 w-48 rounded-xl border border-white/10 bg-black/90 backdrop-blur-sm shadow-xl"
                  onMouseEnter={openUpdates}
                  onMouseLeave={scheduleCloseUpdates}
                >
                  <DropdownItem href="/patch-notes" onNavigate={closeImmediately}>Patch Notes</DropdownItem>
                  <DropdownItem href="/balances" onNavigate={closeImmediately}>Balances</DropdownItem>
                  <DropdownItem href="/dev-diaries" onNavigate={closeImmediately}>Dev Diaries</DropdownItem>
                  <DropdownItem href="/game-versions" onNavigate={closeImmediately}>Game Versions</DropdownItem>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-gray-400 hover:text-white text-sm font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all hover:after:w-full"
    >
      {children}
    </Link>
  )
}

function DropdownItem({ href, children, onNavigate }: { href: string; children: React.ReactNode; onNavigate: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
    >
      {children}
    </Link>
  )
} 