import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function InfoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#05060A]">
      <Navbar />
      <main className="flex-1 pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Data Update Schedule</h1>
            <p className="text-gray-400 text-lg">
              Our database automatically syncs with the latest Marvel Rivals data on the following schedule. All times are in Central Standard Time (CST).
            </p>
          </div>
          
          <div className="space-y-6">
            <ScheduleSection
              title="Frequent Updates"
              description="Data that updates multiple times per day"
              items={[
                {
                  name: "Global Leaderboards",
                  schedule: "Every hour at :00",
                  example: "12:00, 1:00, 2:00, etc.",
                  color: "emerald"
                },
                {
                  name: "Hero Leaderboards",
                  schedule: "Every hour at :30",
                  example: "12:30, 1:30, 2:30, etc.",
                  color: "emerald"
                }
              ]}
            />

            <ScheduleSection
              title="Daily Updates"
              description="Data that refreshes once per day"
              items={[
                {
                  name: "Hero Statistics",
                  schedule: "12:00 PM CST",
                  example: "Updated daily at noon",
                  color: "blue"
                },
                {
                  name: "Player Stats (Auto-Sync)",
                  schedule: "1:30 PM CST",
                  example: "Processed in batches of 5 players, 5 minutes between batches",
                  color: "blue"
                }
              ]}
            />

            <ScheduleSection
              title="Weekly Updates"
              description="Data that refreshes once per week"
              items={[
                {
                  name: "Hero List",
                  schedule: "Monday at 8:00 AM CST",
                  example: "New heroes and roster changes",
                  color: "purple"
                },
                {
                  name: "Hero Costumes",
                  schedule: "Tuesday at 8:00 AM CST",
                  example: "New skins and cosmetic items",
                  color: "purple"
                },
                {
                  name: "Hero Details & Abilities",
                  schedule: "Wednesday at 8:00 AM CST",
                  example: "Ability descriptions and hero information",
                  color: "purple"
                }
              ]}
            />

            <ScheduleSection
              title="Monthly Updates"
              description="Data that refreshes at the start of each month"
              items={[
                {
                  name: "Achievements",
                  schedule: "1st of month at 8:00 AM CST",
                  example: "New achievements and challenges",
                  color: "orange"
                },
                {
                  name: "Battle Pass",
                  schedule: "1st of month at 8:30 AM CST",
                  example: "New season rewards and tiers",
                  color: "orange"
                },
                {
                  name: "Patch Notes",
                  schedule: "1st of month at 9:00 AM CST",
                  example: "Latest game updates and changes",
                  color: "orange"
                },
                {
                  name: "Balance Changes",
                  schedule: "1st of month at 9:30 AM CST",
                  example: "Hero buffs and nerfs",
                  color: "orange"
                },
                {
                  name: "Dev Diaries",
                  schedule: "1st of month at 10:00 AM CST",
                  example: "Developer insights and updates",
                  color: "orange"
                },
                {
                  name: "Game Versions",
                  schedule: "1st of month at 10:30 AM CST",
                  example: "Version history and releases",
                  color: "orange"
                }
              ]}
            />
          </div>

          <div className="mt-12 p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
            <h3 className="text-xl font-semibold text-white mb-3">About These Updates</h3>
            <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
              <p>
                • All data is sourced from the unofficial Marvel Rivals API and cached in our MySQL database for optimal performance
              </p>
              <p>
                • Update times may vary slightly depending on API availability and response times
              </p>
              <p>
                • Some updates may be delayed during maintenance periods or high server load
              </p>
              <p>
                • Player stats updates respect private profile settings and will skip unavailable profiles
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

interface ScheduleItem {
  name: string
  schedule: string
  example: string
  color: 'emerald' | 'blue' | 'purple' | 'orange'
}

interface ScheduleSectionProps {
  title: string
  description: string
  items: ScheduleItem[]
}

function ScheduleSection({ title, description, items }: ScheduleSectionProps) {
  return (
    <div className="border border-white/10 rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-semibold text-white mb-2">{title}</h2>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      <div className="divide-y divide-white/5">
        {items.map((item, index) => (
          <ScheduleItem key={index} {...item} />
        ))}
      </div>
    </div>
  )
}

function ScheduleItem({ name, schedule, example, color }: ScheduleItem) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  }

  return (
    <div className="p-6 hover:bg-white/[0.02] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white mb-1">{name}</h3>
          <p className="text-gray-400 text-sm">{example}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap ${colorClasses[color]}`}>
          {schedule}
        </div>
      </div>
    </div>
  )
}

