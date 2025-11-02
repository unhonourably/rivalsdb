'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import rivalsLogo from '@/components/rivalslogo.png'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

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