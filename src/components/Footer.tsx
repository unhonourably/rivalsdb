import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-6 sm:flex-row justify-between items-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} RivalsDB. Not affiliated with Marvel or NetEase Games.
          </p>
          <nav className="flex gap-6">
            <Link className="text-xs text-gray-500 hover:text-gray-300 transition-colors" href="/terms">
              Terms
            </Link>
            <Link className="text-xs text-gray-500 hover:text-gray-300 transition-colors" href="/privacy">
              Privacy
            </Link>
            <Link className="text-xs text-gray-500 hover:text-gray-300 transition-colors" href="/info">
              Info
            </Link>
            <Link className="text-xs text-gray-500 hover:text-gray-300 transition-colors" href="/contact">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
