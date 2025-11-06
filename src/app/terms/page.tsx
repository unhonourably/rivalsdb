import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#05060A]">
      <Navbar />
      <main className="flex-1 pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-semibold mb-8 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-fredoka)' }}>Terms of Service</h1>
          
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Use of Service</h2>
              <p className="leading-relaxed mb-4">
                This website provides statistics, leaderboards, and information about Marvel Rivals. The service is provided "as is" 
                without any warranties, expressed or implied.
              </p>
              <p className="leading-relaxed">
                You agree not to use the service for any unlawful purpose or in any way that might harm, disable, overburden, 
                or impair the website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Data Accuracy</h2>
              <p className="leading-relaxed">
                While we strive to provide accurate and up-to-date information, we do not guarantee the accuracy, completeness, 
                or timeliness of the data displayed on this website. All statistics and information are sourced from third-party APIs 
                and may be subject to delays or inaccuracies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Intellectual Property</h2>
              <p className="leading-relaxed">
                Marvel Rivals and all related trademarks, logos, and content are the property of their respective owners. 
                This website is not affiliated with, endorsed by, or sponsored by NetEase Games or Marvel.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. User Conduct</h2>
              <p className="leading-relaxed">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Attempt to gain unauthorized access to any part of the website</li>
                <li>Use automated tools to scrape or collect data from the website</li>
                <li>Interfere with the proper functioning of the website</li>
                <li>Post or transmit any harmful, offensive, or illegal content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
              <p className="leading-relaxed">
                In no event shall the website operators be liable for any indirect, incidental, special, consequential, or punitive 
                damages arising out of your access to or use of the website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Changes to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the website after any such changes 
                constitutes your acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through our website.
              </p>
            </section>

            <div className="pt-8 border-t border-white/10">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

