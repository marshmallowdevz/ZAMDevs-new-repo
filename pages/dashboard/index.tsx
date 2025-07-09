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

  const isNewUser = !user?.first_name;
  const [streak, setStreak] = useState(0);
  const [entriesThisMonth, setEntriesThisMonth] = useState(0);
  const [mostCommonMood, setMostCommonMood] = useState("");
  const [weeklyGoal] = useState(5);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const motivationalQuotes = [
    "Every day is a fresh start.",
    "Small steps every day.",
    "Your story matters.",
    "Reflect, grow, repeat.",
    "You are your best investment.",
    "Progress, not perfection.",
  ];
  const [quote, setQuote] = useState(motivationalQuotes[0]);

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
    router.push("/dashboard/mood-tracker");
  };
  
  const handleViewTrends = () => {
    router.push("/dashboard/analytics");
  };
  
  const handleNewEntry = () => {
    router.push("/dashboard/journal");
  };

  const handleViewFeed = () => {
    router.push("/feed");
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#A09ABC]"></div>
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
        <main className={`flex-1 p-10 bg-transparent min-h-screen transition-all duration-300 ${collapsed ? "ml-16" : "ml-64"}`}>
          <div className="rounded-2xl mb-8 p-8 bg-[#E1D8E9] border border-[#D5CFE1] shadow-lg flex flex-col md:flex-row md:items-center md:justify-between" style={{ boxShadow: "0 4px 24px #D5CFE1" }}>
            <div>
              <h2 className="text-4xl font-extrabold text-[#A09ABC] mb-1 tracking-wide" style={{ fontFamily: "serif", letterSpacing: 1 }}>
                Welcome back, <span className="text-[#B6A6CA]">{user?.first_name}</span>!
              </h2>
              <p className="text-[#6C63A6] text-lg font-medium mt-2">How are you feeling today?</p>
              <div className="mt-3 flex gap-4 items-center">
                <span className="bg-[#B6A6CA] text-white rounded-full px-4 py-1 text-sm font-semibold shadow">🔥 {isNewUser ? 0 : streak} day streak</span>
                <span className="bg-[#D5CFE1] text-[#A09ABC] rounded-full px-4 py-1 text-sm font-semibold shadow">Entries this month: {isNewUser ? 0 : entriesThisMonth}</span>
                <span className="bg-[#E1D8E9] text-[#A09ABC] rounded-full px-4 py-1 text-sm font-semibold shadow">Most common mood: {isNewUser ? "—" : mostCommonMood}</span>
              </div>
              <div className="mt-4 text-[#B6A6CA] italic text-base">"{isNewUser ? "Start your first entry today!" : quote}"</div>
              <div className="mt-4 w-full max-w-xs">
                <div className="flex justify-between text-xs text-[#A09ABC] font-semibold mb-1">
                  <span>Weekly Goal</span>
                  <span>{isNewUser ? 0 : weeklyCount}/{weeklyGoal}</span>
                </div>
                <div className="w-full h-3 bg-[#D5CFE1] rounded-full overflow-hidden">
                  <div style={{ width: `${isNewUser ? 0 : Math.min((weeklyCount / weeklyGoal) * 100, 100)}%`, background: "#A09ABC" }} className="h-3 rounded-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="64" height="64" rx="16" fill="#B6A6CA" />
                <path d="M20 24h24v16H20z" fill="#E1D8E9" />
                <path d="M24 28h16v8H24z" fill="#A09ABC" />
              </svg>
            </div>
          </div>
          {/* Confetti Canvas */}
          {showConfetti && (
            <div id="confetti-canvas" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 9999 }} />
          )}
          {/* Mood Calendar */}
          <div className="mb-10">
            <div className="text-xl font-bold text-[#A09ABC] mb-4" style={{ fontFamily: "serif", letterSpacing: 1 }}>
              Mood Calendar
            </div>
            <MoodCalendar />
          </div>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Today's Mood */}
            <div className="rounded-2xl shadow-xl p-6 flex flex-col items-center bg-gradient-to-br from-[#B6A6CA]/80 to-[#E1D8E9]/80 border border-white/40">
              <div className="flex items-center gap-2 text-lg font-semibold mb-2 text-[#6C63A6]">
                <FaSmile className="text-2xl text-[#A09ABC]" /> Today's Mood
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
              <div className="text-4xl mb-4">🌍</div>
              <p className="text-[#6C63A6] mb-4 text-center">Discover inspiring reflections from the community</p>
              <button onClick={handleViewFeed} className="bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white px-5 py-2 rounded-lg font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">
                Explore Feed
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
