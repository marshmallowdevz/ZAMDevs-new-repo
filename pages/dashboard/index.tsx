import Head from "next/head";
import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../lib/supabaseClient";
import { useDarkMode } from "../../components/DarkModeContext";
import { useRouter } from "next/router";

const moodOptions = ["😄", "🙂", "😐", "😔", "😢", "😡", "😱", "😴", "🤩", "😇", "😂", "🥲", "😏", "😬", "😭", "😤", "😳", "🥳", "😎", "🥺"];

const moodLabelMap: { [emoji: string]: string } = {
  "😄": "Happy", "🙂": "Content", "😐": "Neutral", "😔": "Sad", "😢": "Crying",
  "😡": "Angry", "😱": "Surprised", "😴": "Sleepy", "🤩": "Excited", "😇": "Blessed",
  "😂": "Laughing", "🥲": "Bittersweet", "😏": "Smirking", "😬": "Awkward", "😭": "Crying",
  "😤": "Frustrated", "😳": "Embarrassed", "🥳": "Celebrating", "😎": "Cool", "🥺": "Pleading"
};

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (diff < oneDay && date.getDate() === now.getDate()) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diff < 2 * oneDay && date.getDate() === now.getDate() - 1) {
    return "Yesterday";
  } else {
    const daysAgo = Math.floor(diff / oneDay);
    return `${daysAgo} days ago`;
  }
}

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(true);
  type UserProfile = { first_name: string; id: string };
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [monthlyMoods, setMonthlyMoods] = useState<{ [date: string]: string }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string>("");
  const [modalMood, setModalMood] = useState<string>("");
  const [recentMood, setRecentMood] = useState<any>(null);
  const [recentJournal, setRecentJournal] = useState<any>(null);
  const [recentTask, setRecentTask] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [todayMood, setTodayMood] = useState<{ emoji: string; label: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      let firstName = "";
      if (profile && profile.full_name && profile.full_name.trim() !== "") {
        firstName = profile.full_name.split(" ")[0];
      }
      setUser({ first_name: firstName, id: user.id });
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  // Fetch moods for the current month
  useEffect(() => {
    fetchMonthlyMoods();
    // eslint-disable-next-line
  }, []);

  async function fetchMonthlyMoods() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from("moods")
      .select("emoji, created_at")
      .eq("user_id", user.id)
      .gte("created_at", start)
      .lte("created_at", end);
    const moodsByDate: { [date: string]: string } = {};
    (data || []).forEach((mood: { emoji: string; created_at: string }) => {
      const dateStr = new Date(mood.created_at).toISOString().slice(0, 10);
      moodsByDate[dateStr] = mood.emoji;
    });
    setMonthlyMoods(moodsByDate);
    // Calculate streak and today's mood
    const now = new Date();
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth();
    const utcDate = now.getUTCDate();
    const daysInMonth = new Date(utcYear, utcMonth + 1, 0).getUTCDate();
    let currentStreak = 0;
    let foundGap = false;
    for (let i = 0; i < daysInMonth; i++) {
      const day = daysInMonth - i;
      const dateStr = `${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (moodsByDate[dateStr]) {
        if (!foundGap) {
          currentStreak++;
        }
      } else {
        // Only break streak if it's before today
        if (day < utcDate) {
          foundGap = true;
        } else if (day === utcDate) {
          // If today has no mood, streak is 0
          break;
        }
      }
    }
    setStreak(currentStreak);
    // Set today's mood
    const todayStr = `${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(utcDate).padStart(2, '0')}`;
    if (moodsByDate[todayStr]) {
      setTodayMood({ emoji: moodsByDate[todayStr], label: moodLabelMap[moodsByDate[todayStr]] || moodsByDate[todayStr] });
    } else {
      setTodayMood(null);
    }
  }

  // Fetch recent activity
  useEffect(() => {
    async function fetchRecentActivity() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Fetch latest mood
      const { data: moods } = await supabase
        .from("moods")
        .select("emoji, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      setRecentMood(moods && moods[0]);
      // Fetch latest journal
      const { data: journals } = await supabase
        .from("journal")
        .select("title, content, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      setRecentJournal(journals && journals[0]);
      // Fetch latest completed task
      const { data: tasks } = await supabase
        .from("tasks")
        .select("description, created_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("created_at", { ascending: false })
        .limit(1);
      setRecentTask(tasks && tasks[0]);
    }
    fetchRecentActivity();
  }, []);

  // Button Actions
  const handleUpdateMood = () => {
    router.push("/dashboard/mood");
  };
  const handleViewTrends = () => {
    router.push("/dashboard/analytics");
  };
  const handleNewEntry = () => {
    router.push("/dashboard/journal");
  };

  // Modal handlers
  const openMoodModal = (dateStr: string) => {
    setModalDate(dateStr);
    setModalMood(monthlyMoods[dateStr] || "");
    setModalOpen(true);
  };
  const closeMoodModal = () => {
    setModalOpen(false);
    setModalDate("");
    setModalMood("");
  };
  const saveMoodForDate = async () => {
    if (!user || !modalDate || !modalMood) return;
    // Remove any existing mood for this date
    const start = modalDate + "T00:00:00.000Z";
    const end = modalDate + "T23:59:59.999Z";
    await supabase
      .from("moods")
      .delete()
      .eq("user_id", user.id)
      .gte("created_at", start)
      .lte("created_at", end);
    // Insert new mood
    await supabase.from("moods").insert([
      { user_id: user.id, emoji: modalMood, created_at: new Date(modalDate).toISOString() },
    ]);
    closeMoodModal();
    fetchMonthlyMoods();
  };

  // Add delete handler for a mood on a specific date
  const deleteMoodForDate = async () => {
    if (!user || !modalDate) return;
    const start = modalDate + "T00:00:00.000Z";
    const end = modalDate + "T23:59:59.999Z";
    await supabase
      .from("moods")
      .delete()
      .eq("user_id", user.id)
      .gte("created_at", start)
      .lte("created_at", end);
    closeMoodModal();
    fetchMonthlyMoods();
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#A09ABC]"></div>
      </div>
    );
  }

  // Calendar logic
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();
  const daysInMonth = new Date(utcYear, utcMonth + 1, 0).getUTCDate();
  const firstDayOfWeek = new Date(Date.UTC(utcYear, utcMonth, 1)).getUTCDay();
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(<div key={`empty-${i}`}></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push(
      <div
        key={day}
        className="text-2xl text-center cursor-pointer select-none transition hover:scale-110"
        onClick={() => openMoodModal(dateStr)}
        title={`Set mood for ${dateStr}`}
      >
        {monthlyMoods[dateStr] ? (
          <span>{monthlyMoods[dateStr]}</span>
        ) : (
          <span className="opacity-30">😊</span>
        )}
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Reflectly Dashboard</title>
        <meta
          name="description"
          content="Reflectly minimalist journaling dashboard"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={`flex min-h-screen ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className={`flex-1 p-6 md:p-10 min-h-screen transition-all duration-300 ${collapsed ? 'ml-0' : 'ml-64'}`}>
          <div className="max-w-7xl mx-auto">
            {/* Welcome Card */}
            <div className="rounded-3xl bg-white/60 dark:bg-[#23234a] shadow-lg p-8 mb-8 backdrop-blur-md border border-white/30 dark:border-[#23234a]">
              <h2 className="text-2xl md:text-3xl font-bold text-[#A09ABC] mb-2">Welcome back, {user?.first_name || 'User'}!</h2>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-[#6C63A6] text-lg">How are you feeling today?</div>
                <div className="flex items-center gap-4">
                  <span className="bg-[#B6A6CA] text-white rounded-full px-4 py-1 text-sm font-semibold shadow flex items-center gap-2">
                    <span role="img" aria-label="streak">🔥</span> {streak} day streak
                  </span>
                  <span className="bg-[#A09ABC] text-white rounded-full px-4 py-1 text-sm font-semibold shadow flex items-center gap-2">
                    {todayMood ? <><span role="img" aria-label="mood">{todayMood.emoji}</span> {todayMood.label}</> : <>No mood</>}
                  </span>
                </div>
              </div>
            </div>
            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Mood Calendar */}
              <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 backdrop-blur-md border border-white/30 dark:border-[#23234a] col-span-1">
                <h3 className="text-xl font-bold text-[#A09ABC] mb-4">Mood Calendar</h3>
                <div className="text-center text-[#6C63A6] font-semibold mb-2">{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="text-xs text-[#A09ABC] font-bold text-center">
                      {["S","M","T","W","T","F","S"][i]}
                    </div>
                  ))}
                  {calendarCells}
                </div>
              </div>
              {/* Right Cards Grid */}
              <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Today's Mood */}
                <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 flex flex-col items-center justify-center backdrop-blur-md border border-white/30 dark:border-[#23234a]">
                  <div className="text-[#A09ABC] text-lg font-semibold mb-2">Today&apos;s Mood</div>
                  <div className="text-4xl mb-2">
                    {todayMood ? (
                      <span>{todayMood.emoji}</span>
                    ) : (
                      <span className="opacity-30">😊</span>
                    )}
                  </div>
                  <div className="text-[#A09ABC] text-base font-semibold mb-4">
                    {todayMood ? todayMood.label : 'No mood logged'}
                  </div>
                  <button onClick={handleUpdateMood} className="px-6 py-2 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">Update Mood</button>
                </div>
                {/* Mood Consistency */}
                <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 flex flex-col items-center justify-center backdrop-blur-md border border-white/30 dark:border-[#23234a]">
                  <div className="text-[#A09ABC] text-lg font-semibold mb-4">Mood Consistency</div>
                  <div className="relative flex flex-col items-center justify-center mb-6">
                    {/* Circular progress bar */}
                    <svg width="110" height="110" viewBox="0 0 110 110" className="drop-shadow-lg">
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#A09ABC" />
                          <stop offset="100%" stopColor="#B6A6CA" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="55" cy="55" r="48"
                        fill="#ede9fe"
                        stroke="#e0d7f3"
                        strokeWidth="8"
                      />
                      <circle
                        cx="55" cy="55" r="48"
                        fill="none"
                        stroke="url(#moodGradient)"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - 0.8)} // 80% consistency
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,2,.6,1)' }}
                      />
                    </svg>
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-extrabold text-[#A09ABC]" style={{ fontFamily: 'serif' }}>80%</span>
                  </div>
                  <button onClick={handleViewTrends} className="px-6 py-2 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">View Trends</button>
                </div>
                {/* Quick Entry */}
                <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 flex flex-col items-center justify-center backdrop-blur-md border border-white/30 dark:border-[#23234a]">
                  <div className="text-[#A09ABC] text-lg font-semibold mb-2">Quick Entry</div>
                  <div className="text-[#6C63A6] text-sm mb-4">Tap below to create a new journal entry</div>
                  <button onClick={handleNewEntry} className="px-6 py-2 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">+ New Entry</button>
                </div>
                {/* Recent Activity */}
                <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 flex flex-col backdrop-blur-md border border-white/30 dark:border-[#23234a]">
                  <div className="text-[#A09ABC] text-lg font-semibold mb-2">Recent Activity</div>
                  <ul className="text-[#6C63A6] text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <span>✔️</span>
                      {recentMood ? (
                        <>
                          Logged mood: <span className="font-semibold">{moodLabelMap[recentMood.emoji] || recentMood.emoji}</span>
                          <span className="ml-auto text-[#A09ABC]/70">{formatTime(recentMood.created_at)}</span>
                        </>
                      ) : (
                        <span className="italic text-[#A09ABC]/70">No mood logged yet</span>
                      )}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>📝</span>
                      {recentJournal ? (
                        <>
                          Created journal entry{recentJournal.title ? `: ${recentJournal.title}` : ""}
                          <span className="ml-auto text-[#A09ABC]/70">{formatTime(recentJournal.created_at)}</span>
                        </>
                      ) : (
                        <span className="italic text-[#A09ABC]/70">No journal entry yet</span>
                      )}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>✅</span>
                      {recentTask ? (
                        <>
                          Completed task: <span className="font-semibold">{recentTask.description}</span>
                          <span className="ml-auto text-[#A09ABC]/70">{formatTime(recentTask.created_at)}</span>
                        </>
                      ) : (
                        <span className="italic text-[#A09ABC]/70">No completed task yet</span>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Mood Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#23234a] rounded-2xl p-8 shadow-lg min-w-[320px] max-w-[90vw]">
            <h3 className="text-xl font-bold mb-4 text-center">Select Mood for {modalDate}</h3>
            <div className="grid grid-cols-5 gap-4 mb-6">
              {moodOptions.map((mood) => (
                <button
                  key={mood}
                  className={`text-3xl w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${modalMood === mood ? 'border-[#A09ABC] bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white' : 'border-transparent bg-white dark:bg-[#23234a] text-[#6C63A6] dark:text-[#A09ABC]'}`}
                  onClick={() => setModalMood(mood)}
                >
                  {mood}
                </button>
              ))}
            </div>
            <div className="flex justify-between gap-4 items-center">
              <div>
                {monthlyMoods[modalDate] && (
                  <button
                    onClick={deleteMoodForDate}
                    className="px-4 py-2 rounded bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 font-semibold mr-2"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <button onClick={closeMoodModal} className="px-4 py-2 rounded bg-gray-200 dark:bg-[#23234a] text-gray-700 dark:text-[#A09ABC] font-semibold">Cancel</button>
                <button
                  onClick={saveMoodForDate}
                  disabled={!modalMood}
                  className="px-6 py-2 rounded bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}