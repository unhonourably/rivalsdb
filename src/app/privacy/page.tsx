import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#05060A]">
      <Navbar />
      <main className="flex-1 pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p className="leading-relaxed mb-4">
                We collect publicly available information from Marvel Rivals game data, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Player statistics and leaderboard rankings</li>
                <li>Hero statistics and performance metrics</li>
                <li>Match history and game data</li>
                <li>Public profile information</li>
              </ul>
              <p className="leading-relaxed mt-4">
                We do not collect any personal information that is not publicly available in the game.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Information</h2>
              <p className="leading-relaxed mb-3">
                The information we collect is used to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Display player statistics and leaderboards</li>
                <li>Provide hero performance analytics</li>
                <li>Generate aggregated statistics and trends</li>
                <li>Improve our service and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Data Storage</h2>
              <p className="leading-relaxed">
                All data displayed on this website is cached from public APIs and stored temporarily for performance purposes. 
                We do not store any sensitive or private user information beyond what is publicly available in the game.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Cookies and Local Storage</h2>
              <p className="leading-relaxed">
                We use local storage to save user preferences and improve your browsing experience. No tracking cookies 
                are used for advertising purposes. Any data stored locally remains on your device and is not transmitted to our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Third-Party Services</h2>
              <p className="leading-relaxed">
                This website uses third-party APIs to retrieve game data. We are not responsible for the privacy practices 
                of these third-party services. We recommend reviewing their privacy policies:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Marvel Rivals API</li>
                <li>Vercel (hosting provider)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Data Sharing</h2>
              <p className="leading-relaxed">
                We do not sell, trade, or otherwise transfer your information to third parties. All data displayed is already 
                publicly available through the game's official channels.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Private Profiles</h2>
              <p className="leading-relaxed">
                Players with private profiles in Marvel Rivals will not have their detailed statistics displayed on this website. 
                We respect player privacy settings as configured in the game.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Data Security</h2>
              <p className="leading-relaxed">
                We implement reasonable security measures to protect the data we cache. However, no method of electronic 
                storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Children's Privacy</h2>
              <p className="leading-relaxed">
                This website does not knowingly collect information from children under 13. If you believe we have 
                inadvertently collected such information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Privacy Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify users of any material changes by 
                posting the new policy on this page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Your Rights</h2>
              <p className="leading-relaxed">
                Since all data we display is publicly available from the game, we cannot remove or modify your statistics 
                unless they are removed from the game itself. For privacy concerns, please adjust your privacy settings 
                within Marvel Rivals.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us through our website.
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

