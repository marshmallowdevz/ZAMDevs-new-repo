import Head from "next/head";
import { useState, useEffect } from "react";
import { FaSmile, FaBook, FaTasks, FaChartBar, FaRss } from "react-icons/fa";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../lib/supabaseClient";
import MoodCalendar from "../../components/MoodCalendar";
import { useDarkMode } from "../../components/DarkModeContext";
import { useRouter } from "next/router";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(true);
  type UserProfile = { first_name: string; id: string };
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Add missing state variables
  const [recentMood, setRecentMood] = useState<any>(null);
  const [recentJournal, setRecentJournal] = useState<any>(null);
  const [recentTask, setRecentTask] = useState<any>(null);
  const [todayMood, setTodayMood] = useState<any>(null);

  // Add missing state and constants for dashboard functionality
  const [streak, setStreak] = useState(0);
  const [entriesThisMonth, setEntriesThisMonth] = useState(0);
  const [mostCommonMood, setMostCommonMood] = useState("");
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [quote, setQuote] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState("");
  const [modalMood, setModalMood] = useState("");
  const [monthlyMoods, setMonthlyMoods] = useState<{ [date: string]: string }>({});

  // Add state for dashboard mood modal
  const [dashboardMoodModalOpen, setDashboardMoodModalOpen] = useState(false);
  const [dashboardSelectedMood, setDashboardSelectedMood] = useState("");

  const moodOptions = [
    "😁", "🙂", "😐", "😔", "😢",
    "😡", "😴", "😍", "😇", "😂",
    "😅", "😉", "😜", "🥳", "😎",
    "🥺", "😭", "😘", "😍", "😳"
  ];

  const motivationalQuotes = [
    "Keep going, you’re doing great!",
    "Every day is a fresh start.",
    "Progress, not perfection.",
    "You are stronger than you think.",
    "Small steps every day.",
    "Your feelings are valid.",
    "Celebrate your wins, big or small.",
    "Growth is a journey."
  ];

  const fetchMonthlyMoods = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const { data: moods } = await supabase
      .from("moods")
      .select("emoji, created_at")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString());

    const moodsMap: { [date: string]: string } = {};
    if (moods) {
      moods.forEach((mood: any) => {
        const dateStr = mood.created_at.split("T")[0];
        moodsMap[dateStr] = mood.emoji;
      });
    }
    setMonthlyMoods(moodsMap);
  };

  // Remove duplicate moodLabelMap and merge all emoji labels into one object
  const moodLabelMap: { [key: string]: string } = {
    "😁": "Very Happy",
    "🙂": "Happy",
    "😐": "Neutral",
    "😔": "Sad",
    "😢": "Crying",
    "😡": "Angry",
    "😴": "Sleepy",
    "😍": "In Love",
    "😇": "Blessed",
    "😂": "Laughing",
    "😅": "Relieved",
    "😉": "Winking",
    "😜": "Playful",
    "🥳": "Celebrating",
    "😎": "Cool",
    "🥺": "Pleading",
    "😭": "Sobbing",
    "😘": "Kissing",
    "😳": "Embarrassed"
  };

  // Add format time function
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

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

  // Move fetchRecentActivity to top-level and ensure it is available
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
    // Fetch today's mood
    const today = new Date().toISOString().split('T')[0];
    const { data: todayMoodData } = await supabase
      .from("moods")
      .select("emoji, created_at")
      .eq("user_id", user.id)
      .gte("created_at", today)
      .order("created_at", { ascending: false })
      .limit(1);
    setTodayMood(todayMoodData && todayMoodData[0]);
    // Fetch latest journal
    const { data: journals } = await supabase
      .from("journal")
      .select("title, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    setRecentJournal(journals && journals[0]);
    // Fetch latest completed task (include completed_at)
    const { data: tasks } = await supabase
      .from("tasks")
      .select("description, created_at, completed_at")
      .eq("user_id", user.id)
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(1);
    setRecentTask(tasks && tasks[0]);
  }

  // Demo data for UI
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const calendar = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    emoji: '😊',
  }));
  // Fetch moods for the current month
  useEffect(() => {
    // Set mock data for now
    setStreak(5);
    setEntriesThisMonth(12);
    setMostCommonMood("😊");
    setWeeklyCount(3);
    setQuote(
      motivationalQuotes[
        Math.floor(Math.random() * motivationalQuotes.length)
      ]
    );

    // Fetch recent activity
    fetchRecentActivity();

    if (streak && streak % 7 === 0) {
      setShowConfetti(true);
      import("canvas-confetti").then((module) => {
        module.default({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      });

      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [streak]);

  // Add dummy data for mood consistency chart
  const [moodChartData, setMoodChartData] = useState([
    { date: '6/30/2025', entries: 4, moods: 2 },
    { date: '7/1/2025', entries: 2, moods: 1 },
    { date: '7/2/2025', entries: 3, moods: 2 },
    { date: '7/3/2025', entries: 1, moods: 1 },
    { date: '7/4/2025', entries: 2, moods: 2 },
    { date: '7/5/2025', entries: 3, moods: 3 },
    { date: '7/6/2025', entries: 4, moods: 4 },
  ]);

  // Button Actions
  const handleUpdateMood = () => {
    setDashboardMoodModalOpen(true);
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
    fetchRecentActivity(); // Ensure today's mood and recent activity update
  };
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
    fetchRecentActivity(); // Ensure today's mood and recent activity update
  };

  // Add save handler for dashboard mood modal
  const handleSaveDashboardMood = async () => {
    if (!user || !dashboardSelectedMood) return;
    const todayStr = new Date().toISOString().split('T')[0];
    // Remove any existing mood for today
    await supabase
      .from("moods")
      .delete()
      .eq("user_id", user.id)
      .gte("created_at", todayStr + "T00:00:00.000Z")
      .lte("created_at", todayStr + "T23:59:59.999Z");
    // Insert new mood
    await supabase.from("moods").insert([
      { user_id: user.id, emoji: dashboardSelectedMood, created_at: new Date().toISOString() },
    ]);
    setDashboardMoodModalOpen(false);
    setDashboardSelectedMood("");
    await fetchMonthlyMoods();
    await fetchRecentActivity(); // Ensure today's mood and recent activity update
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
  const daysInMonthUTC = new Date(utcYear, utcMonth + 1, 0).getUTCDate();
  const firstDayOfWeek = new Date(Date.UTC(utcYear, utcMonth, 1)).getUTCDay();
  // Mood Calendar grid logic
  const calendarCells = [];
  for (let i = 0; i < daysInMonth; i++) {
    const day = i - firstDayOfWeek + 1;
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (i < firstDayOfWeek || day > daysInMonth) {
      calendarCells.push(<div key={`empty-${i}`}></div>);
    } else {
      const emoji = monthlyMoods[dateStr] || "😊";
      const faded = !monthlyMoods[dateStr];
      calendarCells.push(
        <div
          key={dateStr}
          className={`text-2xl text-center cursor-pointer select-none transition hover:scale-110 ${faded ? 'opacity-30' : ''}`}
          onClick={() => openMoodModal(dateStr)}
          title={`Set mood for ${dateStr}`}
        >
          <span>{emoji}</span>
        </div>
      );
    }
  }

  // Calculate mood consistency for the current month
  const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysWithMood = Object.keys(monthlyMoods).length;
  const moodConsistency = daysInCurrentMonth > 0 ? Math.round((daysWithMood / daysInCurrentMonth) * 100) : 0;

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
                  {todayMood ? (
                    <span className="bg-[#A09ABC] text-white rounded-full px-4 py-1 text-sm font-semibold shadow flex items-center gap-2">
                      <span role="img" aria-label="mood">{todayMood.emoji}</span> {moodLabelMap[todayMood.emoji] || todayMood.emoji}
                    </span>
                  ) : (
                    <span className="bg-[#A09ABC] text-white rounded-full px-4 py-1 text-sm font-semibold shadow flex items-center gap-2">
                      Happy
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Main Grid - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {/* Mood Calendar */}
              <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 backdrop-blur-md border border-white/30 dark:border-[#23234a] col-span-1">
                <h3 className="text-xl font-bold text-[#A09ABC] mb-4">Mood Calendar</h3>
                <div className="text-center text-[#6C63A6] font-semibold mb-2">{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="text-xs text-[#A09ABC] font-bold text-center">
                      {["S", "M", "T", "W", "T", "F", "S"][i]}
                    </div>
                  ))}
                  {calendarCells}
                </div>
              </div>
              {/* Today's Mood */}
              <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 flex flex-col items-center justify-center backdrop-blur-md border border-white/30 dark:border-[#23234a]">
                <div className="text-lg font-semibold text-[#6C63A6] mb-2">Today's Mood</div>
                <div className="text-5xl mb-2">
                  {todayMood ? (
                    <span>{todayMood.emoji}</span>
                  ) : (
                    <span className="opacity-30">🙂</span>
                  )}
                </div>
                <div className="text-[#A09ABC] text-base font-semibold mb-4">
                  {todayMood ? moodLabelMap[todayMood.emoji] || todayMood.emoji : 'No mood logged'}
                </div>
                <button onClick={handleUpdateMood} className="bg-[#A09ABC] text-white px-5 py-2 rounded-lg font-bold shadow hover:bg-[#B6A6CA] transition">
                  Update Mood
                </button>
              </div>
              {/* Mood Consistency with line chart */}
              <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 flex flex-col items-center justify-center backdrop-blur-md border border-white/30 dark:border-[#23234a]">
                <div className="text-lg font-semibold text-[#6C63A6] mb-2">Mood Consistency</div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={moodChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#A09ABC' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#A09ABC' }} domain={[0, 'dataMax+1']} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#fff', borderRadius: 8, border: 'none', boxShadow: '0 2px 8px #A09ABC22' }} labelStyle={{ color: '#6C63A6' }} />
                    <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ color: '#A09ABC', fontWeight: 600, fontSize: 15 }} />
                    <Line type="monotone" dataKey="entries" stroke="#6C63A6" strokeWidth={3} dot={{ r: 7, fill: '#6C63A6', stroke: '#fff', strokeWidth: 2 }} name="entries" />
                    <Line type="monotone" dataKey="moods" stroke="#B6A6CA" strokeWidth={3} dot={{ r: 7, fill: '#B6A6CA', stroke: '#fff', strokeWidth: 2 }} name="moods" />
                  </LineChart>
                </ResponsiveContainer>
                <button onClick={handleViewTrends} className="mt-4 bg-[#B6A6CA] text-white px-5 py-2 rounded-lg font-bold shadow hover:bg-[#A09ABC] transition">
                  View Trends
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <div className="rounded-2xl shadow-xl p-6 bg-gradient-to-br from-[#E1D8E9]/80 to-[#B6A6CA]/80 border border-white/40 col-span-1">
                <div className="flex items-center gap-2 text-lg font-semibold mb-2 text-[#6C63A6]">
                  <FaTasks className="text-2xl text-[#A09ABC]" /> Recent Activity
                </div>
                <ul className="text-[#6C63A6] text-sm space-y-2 w-full">
                  <li className="flex items-center gap-2">
                    <span className="text-[#A09ABC]">✔️</span>
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
                    <span className="text-[#A09ABC]">📝</span>
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
                    <span className="text-[#A09ABC]">✅</span>
                    {recentTask ? (
                      <>
                        Completed task: <span className="font-semibold">{recentTask.description}</span>
                        <span className="ml-auto text-[#A09ABC]/70">{formatTime(recentTask.completed_at || recentTask.created_at)}</span>
                      </>
                    ) : (
                      <span className="italic text-[#A09ABC]/70">No completed task yet</span>
                    )}
                  </li>
                </ul>
              </div>
              {/* Quick Entry */}
              <div className="rounded-2xl shadow-xl p-6 flex flex-col items-center bg-gradient-to-br from-[#B6A6CA]/80 to-[#E1D8E9]/80 border border-white/40 col-span-1">
                <div className="flex items-center gap-2 text-lg font-semibold mb-2 text-[#6C63A6]">
                  <FaBook className="text-2xl text-[#A09ABC]" /> Quick Entry
                </div>
                <p className="text-[#6C63A6] mb-4 text-center">Tap below to create a new journal entry</p>
                <button onClick={handleNewEntry} className="bg-[#A09ABC] text-white px-5 py-2 rounded-lg font-bold shadow flex items-center gap-2 hover:bg-[#B6A6CA] transition">
                  <span className="text-xl">+</span> New Entry
                </button>
              </div>
              {/* Community Feed */}
              <div className="rounded-2xl shadow-xl p-6 flex flex-col items-center bg-gradient-to-br from-[#B6A6CA]/80 to-[#E1D8E9]/80 border border-white/40 col-span-1">
                <div className="flex items-center gap-2 text-lg font-semibold mb-4 text-[#6C63A6]">
                  <FaRss className="text-2xl text-[#A09ABC]" /> Community Feed
                </div>
                <div className="text-[#6C63A6] text-center mb-4">Discover inspiring reflections from the community</div>
                <button
                  onClick={() => router.push('/feed')}
                  className="bg-[#A09ABC] text-white px-5 py-2 rounded-lg font-bold shadow hover:bg-[#B6A6CA] transition"
                >
                  Explore Feed
                </button>
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
      {dashboardMoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#23234a] rounded-2xl p-8 shadow-lg min-w-[320px] max-w-[90vw]">
            <h3 className="text-xl font-bold mb-4 text-center">Select Mood for {new Date().toISOString().split('T')[0]}</h3>
            <div className="grid grid-cols-5 gap-4 mb-6">
              {moodOptions.map((mood) => (
                <button
                  key={mood}
                  className={`text-3xl w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${dashboardSelectedMood === mood ? 'border-[#A09ABC] bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white' : 'border-transparent bg-white dark:bg-[#23234a] text-[#6C63A6] dark:text-[#A09ABC]'}`}
                  onClick={() => setDashboardSelectedMood(mood)}
                >
                  {mood}
                </button>
              ))}
            </div>
            <div className="flex justify-between gap-4 items-center">
              <button onClick={() => setDashboardMoodModalOpen(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-[#23234a] text-gray-700 dark:text-[#A09ABC] font-semibold">Cancel</button>
              <button
                onClick={handleSaveDashboardMood}
                disabled={!dashboardSelectedMood}
                className="px-6 py-2 rounded bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
