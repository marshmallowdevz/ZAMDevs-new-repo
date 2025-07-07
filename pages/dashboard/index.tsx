import Head from "next/head";
import { useState, useEffect } from "react";
import { FaSmile, FaBook, FaTasks, FaChartBar } from "react-icons/fa";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../lib/supabaseClient";
import MoodCalendar from "../../components/MoodCalendar";
<<<<<<< Updated upstream
import { useDarkMode } from "../../components/DarkModeContext";
=======
import { useRouter } from "next/router";
>>>>>>> Stashed changes

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(true);
  type UserProfile = { first_name: string; id: string };
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
<<<<<<< Updated upstream
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const { darkMode } = useDarkMode();
=======
>>>>>>> Stashed changes

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
    setStreak(5);
    setEntriesThisMonth(12);
    setMostCommonMood("😊");
    setWeeklyCount(3);
    setQuote(
      motivationalQuotes[
        Math.floor(Math.random() * motivationalQuotes.length)
      ]
    );

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

<<<<<<< Updated upstream
  // Placeholder data for demo
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const calendar = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    emoji: '😊',
  }));

=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      <div className={`flex min-h-screen ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className={`flex-1 p-6 md:p-10 min-h-screen transition-all duration-300 ${collapsed ? 'ml-0' : 'ml-64'}`}>
          <div className="max-w-7xl mx-auto">
            {/* Welcome Card */}
            <div className="rounded-3xl bg-white/60 dark:bg-[#23234a] shadow-lg p-8 mb-8 backdrop-blur-md border border-white/30 dark:border-[#23234a]">
              <h2 className="text-2xl md:text-3xl font-bold text-[#A09ABC] mb-2">Welcome back, User!</h2>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-[#6C63A6] text-lg">How are you feeling today?</div>
                <div className="flex items-center gap-4">
                  <span className="bg-[#B6A6CA] text-white rounded-full px-4 py-1 text-sm font-semibold shadow">🔥 4 day streak</span>
                  <span className="bg-[#A09ABC] text-white rounded-full px-4 py-1 text-sm font-semibold shadow">😊 Happy</span>
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
                      {['S','M','T','W','T','F','S'][i]}
                    </div>
                  ))}
                  {calendar.map(({ day, emoji }) => (
                    <div key={day} className="text-2xl text-center cursor-pointer select-none">
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
              {/* Right Cards Grid */}
              <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Today's Mood */}
                <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 flex flex-col items-center justify-center backdrop-blur-md border border-white/30 dark:border-[#23234a]">
                  <div className="text-[#A09ABC] text-lg font-semibold mb-2">Today's Mood</div>
                  <div className="text-4xl mb-4">😊</div>
                  <button className="px-6 py-2 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">Update Mood</button>
                </div>
                {/* Mood Consistency */}
                <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 flex flex-col items-center justify-center backdrop-blur-md border border-white/30 dark:border-[#23234a]">
                  <div className="text-[#A09ABC] text-lg font-semibold mb-2">Mood Consistency</div>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#A09ABC] to-[#B6A6CA] flex items-center justify-center mb-4">
                    <span className="text-white text-2xl font-bold">80%</span>
                  </div>
                  <button className="px-6 py-2 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">View Trends</button>
                </div>
                {/* Quick Entry */}
                <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 flex flex-col items-center justify-center backdrop-blur-md border border-white/30 dark:border-[#23234a]">
                  <div className="text-[#A09ABC] text-lg font-semibold mb-2">Quick Entry</div>
                  <div className="text-[#6C63A6] text-sm mb-4">Tap below to create a new journal entry</div>
                  <button className="px-6 py-2 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">+ New Entry</button>
                </div>
                {/* Recent Activity */}
                <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 flex flex-col backdrop-blur-md border border-white/30 dark:border-[#23234a]">
                  <div className="text-[#A09ABC] text-lg font-semibold mb-2">Recent Activity</div>
                  <ul className="text-[#6C63A6] text-sm space-y-2">
                    <li className="flex items-center gap-2"><span>✔️</span>Logged mood: <span className="font-semibold">Happy</span> <span className="ml-auto text-[#A09ABC]/70">Today, 8:30 AM</span></li>
                    <li className="flex items-center gap-2"><span>📝</span>Created journal entry <span className="ml-auto text-[#A09ABC]/70">Yesterday</span></li>
                    <li className="flex items-center gap-2"><span>✅</span>Completed task <span className="ml-auto text-[#A09ABC]/70">2 days ago</span></li>
                  </ul>
                </div>
              </div>
=======
      <div className="flex min-h-screen bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <main
          className={`flex-1 p-10 bg-transparent min-h-screen transition-all duration-300 ${
            collapsed ? "ml-16" : "ml-64"
          }`}
        >
          <div
            className="rounded-2xl mb-8 p-8 bg-[#E1D8E9] border border-[#D5CFE1] shadow-lg flex flex-col md:flex-row md:items-center md:justify-between"
            style={{ boxShadow: "0 4px 24px #D5CFE1" }}
          >
            <div>
              <h2
                className="text-4xl font-extrabold text-[#A09ABC] mb-1 tracking-wide"
                style={{ fontFamily: "serif", letterSpacing: 1 }}
              >
                Welcome back,{" "}
                <span className="text-[#B6A6CA]">{user?.first_name}</span>!
              </h2>
              <p className="text-[#6C63A6] text-lg font-medium mt-2">
                How are you feeling today?
              </p>
              <div className="mt-3 flex gap-4 items-center">
                <span className="bg-[#B6A6CA] text-white rounded-full px-4 py-1 text-sm font-semibold shadow">
                  🔥 {isNewUser ? 0 : streak} day streak
                </span>
                <span className="bg-[#D5CFE1] text-[#A09ABC] rounded-full px-4 py-1 text-sm font-semibold shadow">
                  Entries this month: {isNewUser ? 0 : entriesThisMonth}
                </span>
                <span className="bg-[#E1D8E9] text-[#A09ABC] rounded-full px-4 py-1 text-sm font-semibold shadow">
                  Most common mood: {isNewUser ? "—" : mostCommonMood}
                </span>
              </div>
              <div className="mt-4 text-[#B6A6CA] italic text-base">
                "{isNewUser ? "Start your first entry today!" : quote}"
              </div>
              <div className="mt-4 w-full max-w-xs">
                <div className="flex justify-between text-xs text-[#A09ABC] font-semibold mb-1">
                  <span>Weekly Goal</span>
                  <span>
                    {isNewUser ? 0 : weeklyCount}/{weeklyGoal}
                  </span>
                </div>
                <div className="w-full h-3 bg-[#D5CFE1] rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        isNewUser ? 0 : Math.min((weeklyCount / weeklyGoal) * 100, 100)
                      }%`,
                      background: "#A09ABC",
                    }}
                    className="h-3 rounded-full transition-all duration-500"
                  ></div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="64" height="64" rx="16" fill="#B6A6CA" />
                <path d="M20 24h24v16H20z" fill="#E1D8E9" />
                <path d="M24 28h16v8H24z" fill="#A09ABC" />
              </svg>
            </div>
          </div>

          {/* Confetti Canvas */}
          {showConfetti && (
            <div
              id="confetti-canvas"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 9999,
              }}
            />
          )}

          {/* Mood Calendar */}
          <div className="mb-10">
            <div
              className="text-xl font-bold text-[#A09ABC] mb-4"
              style={{ fontFamily: "serif", letterSpacing: 1 }}
            >
              Mood Calendar
            </div>
            <MoodCalendar />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Today's Mood */}
            <div className="rounded-2xl shadow-xl p-6 flex flex-col items-center bg-gradient-to-br from-[#B6A6CA]/80 to-[#E1D8E9]/80 border border-white/40">
              <div className="flex items-center gap-2 text-lg font-semibold mb-2 text-[#6C63A6]">
                <FaSmile className="text-2xl text-[#A09ABC]" /> Today's Mood
              </div>
              <div className="text-4xl mb-4">😊</div>
              <button
                onClick={handleUpdateMood}
                className="bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white px-5 py-2 rounded-lg font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition"
              >
                Update Mood
              </button>
            </div>

            {/* Mood Consistency */}
            <div className="rounded-2xl shadow-xl p-6 flex flex-col items-center bg-gradient-to-br from-[#E1D8E9]/80 to-[#B6A6CA]/80 border border-white/40">
              <div className="flex items-center gap-2 text-lg font-semibold mb-2 text-[#6C63A6]">
                <FaChartBar className="text-2xl text-[#A09ABC]" /> Mood Consistency
              </div>
              <div className="w-20 h-20 mb-4">
                <svg viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="#ede9fe" />
                  <path
                    d="M20 2 a18 18 0 1 1 0 36"
                    stroke="#a78bfa"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>
              </div>
              <button
                onClick={handleViewTrends}
                className="bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white px-5 py-2 rounded-lg font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition"
              >
                View Trends
              </button>
            </div>

            {/* Quick Entry */}
            <div className="rounded-2xl shadow-xl p-6 flex flex-col items-center bg-gradient-to-br from-[#B6A6CA]/80 to-[#E1D8E9]/80 border border-white/40">
              <div className="flex items-center gap-2 text-lg font-semibold mb-2 text-[#6C63A6]">
                <FaBook className="text-2xl text-[#A09ABC]" /> Quick Entry
              </div>
              <p className="text-[#6C63A6] mb-4 text-center">
                Tap below to create a new journal entry
              </p>
              <button
                onClick={handleNewEntry}
                className="bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white px-5 py-2 rounded-lg font-bold shadow flex items-center gap-2 hover:from-[#B6A6CA] hover:to-[#A09ABC] transition"
              >
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
                  Logged mood: <span className="font-semibold">Happy</span>
                  <span className="ml-auto text-[#A09ABC]/70">Today, 8:30 AM</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#A09ABC]">📝</span>
                  Created journal entry
                  <span className="ml-auto text-[#A09ABC]/70">Yesterday</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#A09ABC]">✅</span>
                  Completed task
                  <span className="ml-auto text-[#A09ABC]/70">2 days ago</span>
                </li>
              </ul>
>>>>>>> Stashed changes
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
