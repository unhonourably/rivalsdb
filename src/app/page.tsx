'use client'

import { useState } from 'react'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import rivalsLogo from '@/components/rivalslogo.png'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-40 pb-32 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            {/* Logo */}
            <div className="mb-16 flex justify-center">
              <div className="relative w-auto h-32 sm:h-40 md:h-48 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <Image
                  src={rivalsLogo}
                  alt="Marvel Rivals Logo"
                  height={192}
                  width={576}
                  className="h-full w-auto object-contain"
                  priority
                />
              </div>
            </div>

            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl md:text-6xl mb-6 tracking-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <span className="bubble-text red-glint" data-text="RivalsDB">RivalsDB</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up relative z-10" style={{ animationDelay: '0.3s' }}>
                Track your stats, analyze your performance, and compete on the global leaderboards
              </p>
            </div>

            {/* Modern Search Bar */}
            <div className="max-w-2xl mx-auto mb-20 animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-2xl blur-xl opacity-0 transition-opacity duration-300" style={{ opacity: isFocused ? 1 : 0 }}></div>
                <div className="relative bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20" style={{ borderColor: isFocused ? 'rgba(255, 255, 255, 0.3)' : undefined }}>
                  <div className="flex items-center px-6 py-4">
                    <svg className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search for a player, hero, or match..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
                    />
                    <button className="ml-4 px-6 py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-200 whitespace-nowrap">
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
              <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                <div className="text-3xl sm:text-4xl font-light mb-2 text-white">10K+</div>
                <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">Players</div>
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <div className="text-3xl sm:text-4xl font-light mb-2 text-white">500K+</div>
                <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">Matches</div>
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                <div className="text-3xl sm:text-4xl font-light mb-2 text-white">50+</div>
                <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">Heroes</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <h2 className="text-2xl sm:text-3xl font-light mb-4 text-white">
                Track Everything
              </h2>
              <p className="text-gray-500 text-sm max-w-xl mx-auto">
                Comprehensive statistics and analytics for Marvel Rivals players
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-white/5 p-8 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-3 text-white">Statistics</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Detailed performance metrics including K/D ratio, win rate, and match history
                </p>
              </div>

              <div className="border border-white/5 p-8 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1s' }}>
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-3 text-white">Leaderboards</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  See how you rank against players worldwide across different categories
                </p>
              </div>

              <div className="border border-white/5 p-8 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1.1s' }}>
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-3 text-white">Hero Data</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Build guides, statistics, and meta analysis for every hero
                </p>
              </div>
            </div>
          </div>
        </section>
    </main>

      <Footer />
    </div>
  )
} 