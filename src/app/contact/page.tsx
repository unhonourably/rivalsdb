import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#05060A]">
      <Navbar />
      <main className="flex-1 pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
            <p className="text-gray-400 text-lg">
              Have questions or feedback? Feel free to reach out!
            </p>
          </div>
          
          <div className="space-y-4">
            <ContactMethod
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              }
              platform="Discord"
              handle="unhonourably"
              color="indigo"
            />
            
            <ContactMethod
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              platform="Email"
              handle="unhonourably@gmail.com"
              link="mailto:unhonourably@gmail.com"
              color="emerald"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

interface ContactMethodProps {
  icon: React.ReactNode
  platform: string
  handle: string
  link?: string
  color: 'indigo' | 'emerald'
}

function ContactMethod({ icon, platform, handle, link, color }: ContactMethodProps) {
  const colorClasses = {
    indigo: {
      bg: 'from-indigo-500/5 to-indigo-500/[0.02]',
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      icon: 'text-indigo-400',
      text: 'text-indigo-300 hover:text-indigo-200'
    },
    emerald: {
      bg: 'from-emerald-500/5 to-emerald-500/[0.02]',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      icon: 'text-emerald-400',
      text: 'text-emerald-300 hover:text-emerald-200'
    }
  }

  const classes = colorClasses[color]
  const Component = link ? 'a' : 'div'
  const props = link ? { href: link, target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <Component
      {...props}
      className={`block p-8 rounded-2xl border bg-gradient-to-br transition-all ${classes.border} ${classes.bg} ${link ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      <div className="flex items-center gap-6">
        <div className={`${classes.icon}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-400 mb-1">{platform}</div>
          <div className={`text-xl font-semibold ${classes.text} transition-colors`}>
            {handle}
          </div>
        </div>
        {link && (
          <svg className={`w-6 h-6 ${classes.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </div>
    </Component>
  )
}

