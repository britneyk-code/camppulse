'use client'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

const BUBBLE_COLORS = [
  'bg-pink-500/20 text-pink-300',
  'bg-purple-500/20 text-purple-300',
  'bg-blue-500/20 text-blue-300',
  'bg-teal-500/20 text-teal-300',
  'bg-orange-500/20 text-orange-300',
  'bg-lime-500/20 text-lime-300',
  'bg-fuchsia-500/20 text-fuchsia-300',
]

const colorFor = (seed) => BUBBLE_COLORS[seed % BUBBLE_COLORS.length]

export default function Home() {
  const [view, setView] = useState('sessions')
  const [sessions, setSessions] = useState([])
  const [sessionName, setSessionName] = useState('')
  const [selectedSession, setSelectedSession] = useState(null)
  const [camperName, setCamperName] = useState('')
  const [campers, setCampers] = useState([])
  const [activities, setActivities] = useState([])
  const [activityName, setActivityName] = useState('')
  const [activityCategory, setActivityCategory] = useState('creative')
  const [selectedCamper, setSelectedCamper] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [engagement, setEngagement] = useState(null)
  const [mood, setMood] = useState(null)
  const [logNote, setLogNote] = useState('')
  const [insights, setInsights] = useState(null)

  useEffect(() => {
    fetchSessions()
    fetchActivities()
    fetchInsights()
  }, [])

  const fetchSessions = async () => {
    const { data } = await supabase.from('sessions').select('*').order('created_at', { ascending: false })
    if (data) setSessions(data)
  }

  const fetchActivities = async () => {
    const { data } = await supabase.from('activities').select('*').order('created_at', { ascending: false })
    if (data) setActivities(data)
  }

  const fetchInsights = async () => {
    const { data: logs } = await supabase.from('logs').select('*')
    if (!logs || logs.length === 0) { setInsights({ sessionGroups: {}, totalLogs: 0 }); return }

    const { data: allCampers } = await supabase.from('campers').select('*')
    const { data: allActivities } = await supabase.from('activities').select('*')
    const { data: allSessions } = await supabase.from('sessions').select('*')

    if (!allCampers || !allActivities || !allSessions) return

    // camper id -> { name, sessionLabel }
    const sessionNameById = {}
    allSessions.forEach(s => sessionNameById[s.id] = s.name)

    const camperMap = {}
    allCampers.forEach(c => {
      camperMap[c.id] = {
        name: c.name,
        sessionLabel: sessionNameById[c.session_id] || 'No session',
      }
    })

    const activityMap2 = {}
    allActivities.forEach(a => activityMap2[a.id] = { name: a.name, category: a.category })

    // Group everything by session
    const sessionGroups = {}

    logs.forEach(log => {
      const activityInfo = activityMap2[log.activity_id]
      const camperInfo = camperMap[log.camper_id]
      if (!activityInfo || !camperInfo) return

      const sessionLabel = camperInfo.sessionLabel
      if (!sessionGroups[sessionLabel]) {
        sessionGroups[sessionLabel] = {
          logCount: 0,
          activityMap: {},      // activityName -> { total, count, category, campers: { camperName -> {total, count} } }
          camperCategoryMap: {}, // "camper__category" -> { camper, category, total, count }
        }
      }
      const group = sessionGroups[sessionLabel]
      group.logCount += 1

      // Activity averages (within this session)
      const aName = activityInfo.name
      if (!group.activityMap[aName]) group.activityMap[aName] = { total: 0, count: 0, category: activityInfo.category, campers: {} }
      group.activityMap[aName].total += log.engagement
      group.activityMap[aName].count += 1
      if (!group.activityMap[aName].campers[camperInfo.name]) group.activityMap[aName].campers[camperInfo.name] = { total: 0, count: 0 }
      group.activityMap[aName].campers[camperInfo.name].total += log.engagement
      group.activityMap[aName].campers[camperInfo.name].count += 1

      // Camper + category averages (within this session)
      const key = `${camperInfo.name}__${activityInfo.category}`
      if (!group.camperCategoryMap[key]) group.camperCategoryMap[key] = { camper: camperInfo.name, category: activityInfo.category, total: 0, count: 0 }
      group.camperCategoryMap[key].total += log.engagement
      group.camperCategoryMap[key].count += 1
    })

    setInsights({ sessionGroups, totalLogs: logs.length })
  }

  const addSession = async () => {
    if (!sessionName) return
    const { error } = await supabase.from('sessions').insert([{ name: sessionName }])
    if (!error) { setSessionName(''); fetchSessions() }
  }

  const selectSession = async (session) => {
    setSelectedSession(session)
    setView('campers')
    const { data } = await supabase.from('campers').select('*').eq('session_id', session.id)
    if (data) setCampers(data)
  }

  const addCamper = async () => {
    if (!camperName || !selectedSession) return
    const { error } = await supabase.from('campers').insert([{ name: camperName, session_id: selectedSession.id }])
    if (!error) { setCamperName(''); selectSession(selectedSession) }
  }

  const addActivity = async () => {
    if (!activityName) return
    const { error } = await supabase.from('activities').insert([{ name: activityName, category: activityCategory }])
    if (!error) { setActivityName(''); fetchActivities() }
  }

  const loadCampersForLog = async (sessionId) => {
    const session = sessions.find(s => s.id === parseInt(sessionId))
    if (!session) return
    setSelectedSession(session)
    const { data } = await supabase.from('campers').select('*').eq('session_id', session.id)
    if (data) setCampers(data)
  }

  const submitLog = async () => {
    if (!selectedCamper || !selectedActivity || !engagement) return
    const entry = {
      camper_id: selectedCamper.id,
      activity_id: selectedActivity.id,
      engagement,
      mood,
      notes: logNote,
      logged_at: new Date().toISOString().split('T')[0]
    }
    console.log('submitting:', entry)
    const { data, error } = await supabase.from('logs').insert([entry])
    console.log('error:', error)
    if (!error) {
      setSelectedCamper(null)
      setSelectedActivity(null)
      setEngagement(null)
      setMood(null)
      setLogNote('')
      fetchInsights()
      alert('Log saved!')
    }
  }

  const categoryStyles = {
    creative: { bg: 'bg-purple-500/20', text: 'text-purple-300', emoji: '🎨' },
    competitive: { bg: 'bg-red-500/20', text: 'text-red-300', emoji: '🏆' },
    physical: { bg: 'bg-orange-500/20', text: 'text-orange-300', emoji: '⚡' },
    social: { bg: 'bg-blue-500/20', text: 'text-blue-300', emoji: '💬' },
  }

  const engagementColors = {
    1: 'bg-red-500 text-white',
    2: 'bg-orange-500 text-white',
    3: 'bg-yellow-500 text-gray-950',
    4: 'bg-lime-500 text-gray-950',
    5: 'bg-green-500 text-white',
  }

  const engagementBg = (avg) => {
    if (avg >= 4.5) return 'bg-green-500/20 text-green-300'
    if (avg >= 3.5) return 'bg-lime-500/20 text-lime-300'
    if (avg >= 2.5) return 'bg-yellow-500/20 text-yellow-300'
    if (avg >= 1.5) return 'bg-orange-500/20 text-orange-300'
    return 'bg-red-500/20 text-red-300'
  }

  const navItems = [
    { id: 'sessions', label: 'Sessions', icon: '🏕️' },
    { id: 'log', label: 'Log', icon: '✏️' },
    { id: 'activities', label: 'Activities', icon: '🎯' },
    { id: 'insights', label: 'Insights', icon: '📊' },
  ]

  const BubbleName = ({ name, seed = 0, size = 'w-8 h-8 text-sm' }) => {
    const words = name.split(' ')
    let letterIndex = 0
    return (
      <div className="flex gap-2 flex-wrap">
        {words.map((word, w) => (
          <div key={w} className="flex gap-[3px] shrink-0">
            {word.split('').map((letter, i) => {
              const bubble = (
                <span
                  key={i}
                  className={`${size} rounded-full flex items-center justify-center font-extrabold ${colorFor(seed + letterIndex)}`}
                >
                  {letter.toUpperCase()}
                </span>
              )
              letterIndex++
              return bubble
            })}
          </div>
        ))}
      </div>
    )
  }

  // Generate insight cards ("thrives in X, disengages in Y") from a camperCategoryMap
  const generateInsightCards = (camperCategoryMap) => {
    if (!camperCategoryMap) return []
    const cards = []
    const camperGroups = {}

    Object.values(camperCategoryMap).forEach(entry => {
      if (!camperGroups[entry.camper]) camperGroups[entry.camper] = []
      camperGroups[entry.camper].push({ ...entry, avg: entry.total / entry.count })
    })

    Object.entries(camperGroups).forEach(([camper, cats]) => {
      if (cats.length < 2) return
      const sorted = [...cats].sort((a, b) => b.avg - a.avg)
      const best = sorted[0]
      const worst = sorted[sorted.length - 1]
      if (best.category !== worst.category) {
        cards.push({
          camper,
          text: `${camper} thrives in ${best.category} activities (${best.avg.toFixed(1)}/5) but disengages during ${worst.category} ones (${worst.avg.toFixed(1)}/5)`,
        })
      }
    })
    return cards
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white max-w-md mx-auto flex flex-col">

      <div className="px-6 pt-10 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">CampPulse</h1>
        <p className="text-gray-500 text-sm mt-1">Track engagement. Spot patterns.</p>
      </div>

      <div className="flex px-6 gap-2 mb-8">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all ${
              view === item.id
                ? 'bg-white text-gray-950 shadow-lg'
                : 'bg-white/5 text-gray-500 hover:text-white'
            }`}
          >
            <div className="text-lg">{item.icon}</div>
            <div>{item.label}</div>
          </button>
        ))}
      </div>

      <div className="px-6 flex-1">

        {/* SESSIONS VIEW */}
        {view === 'sessions' && (
          <div>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSession()}
                placeholder="e.g. Week 1 DC1 or Week 1 ON1"
                className="flex-1 bg-white/5 rounded-full px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:bg-white/10"
              />
              <button onClick={addSession} className="bg-white text-gray-950 rounded-full px-5 font-bold text-sm">
                Add
              </button>
            </div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Your sessions</p>
            <div className="space-y-3">
              {sessions.map((session, i) => (
                <div
                  key={session.id}
                  onClick={() => selectSession(session)}
                  className={`cursor-pointer rounded-3xl px-5 py-4 transition-all hover:scale-[1.01] ${colorFor(i).split(' ')[0]}`}
                >
                  <p className={`font-bold text-sm ${colorFor(i).split(' ')[1]}`}>{session.name}</p>
                  <p className="text-xs text-gray-400 mt-1">Tap to manage campers →</p>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-10">No sessions yet.</p>
              )}
            </div>
          </div>
        )}

        {/* CAMPERS VIEW */}
        {view === 'campers' && selectedSession && (
          <div>
            <button onClick={() => setView('sessions')} className="text-gray-500 text-sm mb-6 hover:text-white transition-colors">
              ← Back to sessions
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold">{selectedSession.name}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{campers.length} camper{campers.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={camperName}
                onChange={(e) => setCamperName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCamper()}
                placeholder="Camper name"
                className="flex-1 bg-white/5 rounded-full px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:bg-white/10"
              />
              <button onClick={addCamper} className="bg-white text-gray-950 rounded-full px-5 font-bold text-sm">
                Add
              </button>
            </div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Campers</p>
            <div className="space-y-3">
              {campers.map((camper, i) => (
                <div key={camper.id} className="rounded-3xl px-5 py-3.5 bg-white/5 flex items-center">
                  <BubbleName name={camper.name} seed={i * 3} />
                </div>
              ))}
              {campers.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-10">No campers yet.</p>
              )}
            </div>
          </div>
        )}

        {/* LOG VIEW */}
        {view === 'log' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Session</p>
              <select
                onChange={(e) => loadCampersForLog(e.target.value)}
                className="w-full bg-white/5 rounded-full px-4 py-3.5 text-sm text-white focus:outline-none"
              >
                <option value="">Select a session</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {campers.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Camper</p>
                <div className="flex flex-wrap gap-2">
                  {campers.map((camper, i) => (
                    <button
                      key={camper.id}
                      onClick={() => setSelectedCamper(camper)}
                      className={`rounded-full px-4 py-2.5 transition-all ${
                        selectedCamper?.id === camper.id ? 'bg-white' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <BubbleName name={camper.name} seed={i * 3} size="w-6 h-6 text-xs" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Activity</p>
              <div className="flex flex-wrap gap-2">
                {activities.map(a => {
                  const s = categoryStyles[a.category] || { bg: 'bg-white/5', text: 'text-gray-300', emoji: '•' }
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedActivity(a)}
                      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                        selectedActivity?.id === a.id ? 'bg-white text-gray-950' : `${s.bg} ${s.text}`
                      }`}
                    >
                      {s.emoji} {a.name}
                    </button>
                  )
                })}
                {activities.length === 0 && (
                  <p className="text-gray-600 text-sm">No activities yet — add some in the Activities tab.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Engagement</p>
              <div className="flex gap-3">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onClick={() => setEngagement(n)}
                    className={`flex-1 aspect-square rounded-full font-bold text-xl transition-all ${
                      engagement === n ? engagementColors[n] : 'bg-white/5 text-gray-500 hover:bg-white/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Mood</p>
              <div className="flex gap-3">
                {[
                  { emoji: '😊', label: 'Happy' },
                  { emoji: '😐', label: 'Neutral' },
                  { emoji: '😤', label: 'Frustrated' },
                ].map(m => (
                  <button
                    key={m.emoji}
                    onClick={() => setMood(m.emoji)}
                    className={`flex-1 py-4 rounded-3xl flex flex-col items-center gap-1 transition-all ${
                      mood === m.emoji ? 'bg-white' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className={`text-xs font-medium ${mood === m.emoji ? 'text-gray-950' : 'text-gray-500'}`}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Note (optional)</p>
              <input
                type="text"
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder="Any observations..."
                className="w-full bg-white/5 rounded-full px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:bg-white/10"
              />
            </div>

            <button
              onClick={submitLog}
              className="w-full bg-white text-gray-950 rounded-full py-4 font-bold text-sm tracking-wide"
            >
              Save log
            </button>
          </div>
        )}

        {/* ACTIVITIES VIEW */}
        {view === 'activities' && (
          <div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addActivity()}
                placeholder="Activity name"
                className="flex-1 bg-white/5 rounded-full px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:bg-white/10"
              />
              <button onClick={addActivity} className="bg-white text-gray-950 rounded-full px-5 font-bold text-sm">
                Add
              </button>
            </div>
            <div className="flex gap-2 mb-6 flex-wrap">
              {Object.entries(categoryStyles).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => setActivityCategory(key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    activityCategory === key ? 'bg-white text-gray-950' : `${s.bg} ${s.text}`
                  }`}
                >
                  {s.emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Activities</p>
            <div className="space-y-3">
              {activities.map(a => {
                const s = categoryStyles[a.category] || { bg: 'bg-white/5', text: 'text-gray-400', emoji: '•' }
                return (
                  <div key={a.id} className={`rounded-3xl px-5 py-4 ${s.bg}`}>
                    <span className={`text-xs font-bold ${s.text}`}>{s.emoji} {a.category}</span>
                    <p className="text-base font-semibold mt-1">{a.name}</p>
                  </div>
                )
              })}
              {activities.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-10">No activities yet.</p>
              )}
            </div>
          </div>
        )}

        {/* INSIGHTS VIEW — grouped by session */}
        {view === 'insights' && (
          <div className="space-y-6">
            {!insights || insights.totalLogs === 0 ? (
              <p className="text-gray-600 text-sm text-center py-10">No logs yet. Start logging to see insights.</p>
            ) : (
              <>
                <div className="bg-white/5 rounded-2xl px-5 py-4 flex justify-between items-center">
                  <p className="text-sm text-gray-400">Total logs recorded</p>
                  <p className="text-xl font-bold">{insights.totalLogs}</p>
                </div>

                {Object.entries(insights.sessionGroups).map(([sessionLabel, group], si) => {
                  const cards = generateInsightCards(group.camperCategoryMap)
                  const sortedActivities = Object.entries(group.activityMap)
                    .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))

                  return (
                    <div key={sessionLabel} className={`rounded-3xl px-5 py-5 ${colorFor(si).split(' ')[0]}`}>
                      <div className="flex items-center justify-between mb-4">
                        <p className={`font-bold text-base ${colorFor(si).split(' ')[1]}`}>{sessionLabel}</p>
                        <span className="text-xs text-gray-400">{group.logCount} log{group.logCount !== 1 ? 's' : ''}</span>
                      </div>

                      {cards.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {cards.map((card, ci) => (
                            <div key={ci} className="bg-gray-950/40 rounded-2xl px-4 py-3">
                              <p className="text-xs text-gray-400 mb-1">💡 Insight</p>
                              <p className="text-sm font-medium leading-relaxed">{card.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Engagement by activity</p>
                      <div className="space-y-2">
                        {sortedActivities.map(([name, data]) => {
                          const avg = (data.total / data.count).toFixed(1)
                          const s = categoryStyles[data.category] || { emoji: '•', text: 'text-gray-400' }
                          const camperRows = Object.entries(data.campers)
                            .map(([camper, c]) => ({ camper, avg: c.total / c.count, count: c.count }))
                            .sort((a, b) => b.avg - a.avg)
                          return (
                            <div key={name} className="bg-gray-950/40 rounded-2xl px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold">{name}</p>
                                  <p className={`text-xs ${s.text}`}>{s.emoji} {data.category} · {data.count} log{data.count !== 1 ? 's' : ''}</p>
                                </div>
                                <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${engagementBg(parseFloat(avg))}`}>
                                  {avg}/5
                                </span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                                {camperRows.map(row => (
                                  <div key={row.camper} className="flex items-center justify-between">
                                    <span className="text-xs text-gray-300">{row.camper}</span>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${engagementBg(row.avg)}`}>
                                      {row.avg.toFixed(1)}/5{row.count > 1 ? ` (${row.count})` : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>

      <div className="h-10" />
    </main>
  )
}