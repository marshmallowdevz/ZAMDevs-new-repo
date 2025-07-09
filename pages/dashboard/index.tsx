import Head from "next/head";
import { useState, useEffect } from "react";
import { FaSmile, FaBook, FaTasks, FaChartBar, FaRss } from "react-icons/fa";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../lib/supabaseClient";
import MoodCalendar from "../../components/MoodCalendar";
import { useDarkMode } from "../../components/DarkModeContext";
import { useRouter } from "next/router";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';

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

  // Add mood label mapping
  const moodLabelMap: { [key: string]: string } = {
    "😊": "Happy",
    "😢": "Sad",
    "😡": "Angry",
    "😰": "Anxious",
    "😴": "Tired",
    "😌": "Calm",
    "🤔": "Thoughtful",
    "😎": "Confident"
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

  // Demo data for UI
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const calendar = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    emoji: '😊',
  }));
  // Fetch moods for the current month
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
  const daysInMonthUTC = new Date(utcYear, utcMonth + 1, 0).getUTCDate();
  const firstDayOfWeek = new Date(Date.UTC(utcYear, utcMonth, 1)).getUTCDay();
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(<div key={`empty-${i}`}></div>);
  }
  for (let day = 1; day <= daysInMonthUTC; day++) {
    const dateStr = `${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isFuture =
      utcYear < now.getFullYear() ? false :
      utcYear > now.getFullYear() ? true :
      utcMonth < now.getMonth() ? false :
      utcMonth > now.getMonth() ? true :
      day > now.getDate();
    calendarCells.push(
      <div
        key={day}
        className={`text-2xl text-center cursor-pointer select-none transition hover:scale-110 ${isFuture ? 'opacity-20 pointer-events-none' : ''}`}
        onClick={() => !isFuture && openMoodModal(dateStr)}
        title={isFuture ? '' : `Set mood for ${dateStr}`}
      >
        {!isFuture ? (
          monthlyMoods[dateStr] ? (
            <span>{monthlyMoods[dateStr]}</span>
          ) : (
            <span className="opacity-30">😊</span>
          )
        ) : (
          <span>&nbsp;</span>
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
                  {/* Only show one streak badge and one mood badge, not duplicates */}
                  <span className="bg-[#B6A6CA] text-white rounded-full px-4 py-1 text-sm font-semibold shadow flex items-center gap-2">
                    <span role="img" aria-label="streak">🔥</span> {streak} day streak
                  </span>
                  {todayMood ? (
                    <span className="bg-[#A09ABC] text-white rounded-full px-4 py-1 text-sm font-semibold shadow flex items-center gap-2">
                      <span role="img" aria-label="mood">{todayMood.emoji}</span> {todayMood.label}
                    </span>
                  ) : (
                    <span className="bg-[#A09ABC] text-white rounded-full px-4 py-1 text-sm font-semibold shadow flex items-center gap-2">
                      No mood
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              <div className="text-4xl mb-2">
                {todayMood ? (
                  <span>{todayMood.emoji}</span>
                ) : (
                  <span className="opacity-30">😊</span>
                )}
              </div>
              <div className="text-[#A09ABC] text-base font-semibold mb-4">
                {todayMood ? moodLabelMap[todayMood.emoji] || todayMood.emoji : 'No mood logged'}
              </div>
              <button onClick={handleUpdateMood} className="bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white px-5 py-2 rounded-lg font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">
                Update Mood
              </button>
            </div>
            {/* Quick Entry */}
            <div className="rounded-2xl shadow-xl p-6 flex flex-col items-center bg-gradient-to-br from-[#B6A6CA]/80 to-[#E1D8E9]/80 border border-white/40">
              <div className="flex items-center gap-2 text-lg font-semibold mb-2 text-[#6C63A6]">
                <FaBook className="text-2xl text-[#A09ABC]" /> Quick Entry
              </div>
              <p className="text-[#6C63A6] mb-4 text-center">Tap below to create a new journal entry</p>
              <button onClick={handleNewEntry} className="bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white px-5 py-2 rounded-lg font-bold shadow flex items-center gap-2 hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">
                <span className="text-xl">+</span> New Entry
              </button>
            </div>
            {/* Recent Activity */}
            <div className="rounded-2xl shadow-xl p-6 bg-gradient-to-br from-[#E1D8E9]/80 to-[#B6A6CA]/80 border border-white/40">
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
            {/* Community Feed */}
            <div className="rounded-2xl shadow-xl p-6 flex flex-col items-center bg-gradient-to-br from-[#B6A6CA]/80 to-[#E1D8E9]/80 border border-white/40">
              <div className="flex items-center gap-2 text-lg font-semibold mb-2 text-[#6C63A6]">
                <FaRss className="text-2xl text-[#A09ABC]" /> Community Feed
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
