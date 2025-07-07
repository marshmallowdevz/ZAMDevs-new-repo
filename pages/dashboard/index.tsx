import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { FaSmile, FaBook, FaTasks, FaChartBar } from "react-icons/fa";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";
import MoodCalendar from "../../components/MoodCalendar";
import { useDarkMode } from "../../components/DarkModeContext";

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      // Fetch user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      let firstName = '';
      if (profile && profile.full_name && profile.full_name.trim() !== '') {
        firstName = profile.full_name.split(' ')[0];
      }
      setUser({ first_name: firstName, id: user.id });
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  // For new users, show empty dashboard data
  const isNewUser = !user?.first_name;
  const [streak, setStreak] = useState(0);
  const [entriesThisMonth, setEntriesThisMonth] = useState(0);
  const [mostCommonMood, setMostCommonMood] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState(5);
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
    // Placeholder: fetch streak, entries, mood, weekly count
    setStreak(5); // Replace with real fetch
    setEntriesThisMonth(12);
    setMostCommonMood('😊');
    setWeeklyCount(3);
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    // Confetti for new streak milestone
    if (streak && streak % 7 === 0) {
      setShowConfetti(true);
      // Dynamically import canvas-confetti for SSR compatibility
      import('canvas-confetti').then((module) => {
        module.default({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      });
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [streak]);

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
        <meta name="description" content="Reflectly minimalist journaling dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={`flex min-h-screen ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`}>
        {/* Collapsible Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        
        {/* Main Content */}
        <main className={`flex-1 p-10 min-h-screen transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
          <div className={`rounded-2xl mb-8 p-8 ${darkMode ? 'bg-[#23234a] border-[#23234a]' : 'bg-[#E1D8E9] border-[#D5CFE1]'} border shadow-lg flex flex-col md:flex-row md:items-center md:justify-between`} style={{ boxShadow: darkMode ? '0 4px 24px #23234a' : '0 4px 24px #D5CFE1' }}>
            <div>
              <h2 className={`text-4xl font-extrabold mb-1 tracking-wide ${darkMode ? 'text-[#A09ABC]' : 'text-[#A09ABC]'}`} style={{ fontFamily: 'serif', letterSpacing: 1 }}>
                Welcome back, <span className={`${darkMode ? 'text-[#B6A6CA]' : 'text-[#B6A6CA]'}`}>{user?.first_name}</span>!
              </h2>
              <p className={`text-lg font-medium mt-2 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>How are you feeling today?</p>
              <div className="mt-3 flex gap-4 items-center">
                <span className={`rounded-full px-4 py-1 text-sm font-semibold shadow ${darkMode ? 'bg-[#A09ABC] text-white' : 'bg-[#B6A6CA] text-white'}`}>🔥 {isNewUser ? 0 : streak} day streak</span>
                <span className={`rounded-full px-4 py-1 text-sm font-semibold shadow ${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-[#D5CFE1] text-[#A09ABC]'}`}>Entries this month: {isNewUser ? 0 : entriesThisMonth}</span>
                <span className={`rounded-full px-4 py-1 text-sm font-semibold shadow ${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-[#E1D8E9] text-[#A09ABC]'}`}>Most common mood: {isNewUser ? '—' : mostCommonMood}</span>
              </div>
              <div className={`mt-4 italic text-base ${darkMode ? 'text-[#B6A6CA]' : 'text-[#B6A6CA]'}`}>"{isNewUser ? 'Start your first entry today!' : quote}"</div>
              <div className="mt-4 w-full max-w-xs">
                <div className={`flex justify-between text-xs font-semibold mb-1 ${darkMode ? 'text-[#A09ABC]' : 'text-[#A09ABC]'}`}>
                  <span>Weekly Goal</span>
                  <span>{isNewUser ? 0 : weeklyCount}/{weeklyGoal}</span>
                </div>
                <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-[#23234a]' : 'bg-[#D5CFE1]'}`}> 
                  <div style={{ width: `${isNewUser ? 0 : Math.min(weeklyCount / weeklyGoal * 100, 100)}%`, background: darkMode ? '#A09ABC' : '#A09ABC' }} className="h-3 rounded-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="64" height="64" rx="16" fill="#B6A6CA"/>
                <path d="M20 24h24v16H20z" fill="#E1D8E9"/>
                <path d="M24 28h16v8H24z" fill="#A09ABC"/>
              </svg>
            </div>
          </div>
          {showConfetti && <div id="confetti-canvas" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }} />}
          
          {/* Mood Calendar */}
          <div className="mb-10">
            <div className={`text-xl font-bold mb-4 ${darkMode ? 'text-[#A09ABC]' : 'text-[#A09ABC]'}`} style={{ fontFamily: 'serif', letterSpacing: 1 }}>Mood Calendar</div>
            <MoodCalendar />
          </div>
          
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Today's Mood */}
            <div className={`rounded-2xl shadow-xl p-6 flex flex-col items-center border border-white/40 ${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-gradient-to-br from-[#B6A6CA]/80 to-[#E1D8E9]/80'}`}>
              <div className={`flex items-center gap-2 text-lg font-semibold mb-2 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>
                <FaSmile className="text-2xl text-[#A09ABC]" /> Today's Mood
              </div>
              <div className="text-4xl mb-4">😊</div>
              <button className="bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white px-5 py-2 rounded-lg font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">Update Mood</button>
            </div>
            
            {/* Mood Consistency */}
            <div className={`rounded-2xl shadow-xl p-6 flex flex-col items-center border border-white/40 ${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-gradient-to-br from-[#E1D8E9]/80 to-[#B6A6CA]/80'}`}>
              <div className={`flex items-center gap-2 text-lg font-semibold mb-2 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>
                <FaChartBar className="text-2xl text-[#A09ABC]" /> Mood Consistency
              </div>
              <div className="w-20 h-20 mb-4">
                <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#ede9fe" /><path d="M20 2 a18 18 0 1 1 0 36" stroke="#a78bfa" strokeWidth="4" fill="none" /></svg>
              </div>
              <button className="bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white px-5 py-2 rounded-lg font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">View Trends</button>
            </div>
            
            {/* Quick Entry */}
            <div className={`rounded-2xl shadow-xl p-6 flex flex-col items-center border border-white/40 ${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-gradient-to-br from-[#B6A6CA]/80 to-[#E1D8E9]/80'}`}>
              <div className={`flex items-center gap-2 text-lg font-semibold mb-2 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>
                <FaBook className="text-2xl text-[#A09ABC]" /> Quick Entry
              </div>
              <p className={`mb-4 text-center ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>Tap below to create a new journal entry</p>
              <button className="bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white px-5 py-2 rounded-lg font-bold shadow flex items-center gap-2 hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">
                <span className="text-xl">+</span> New Entry
              </button>
            </div>
            
            {/* Recent Activity */}
            <div className={`rounded-2xl shadow-xl p-6 border border-white/40 ${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-gradient-to-br from-[#E1D8E9]/80 to-[#B6A6CA]/80'}`}>
              <div className={`flex items-center gap-2 text-lg font-semibold mb-2 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>
                <FaTasks className="text-2xl text-[#A09ABC]" /> Recent Activity
              </div>
              <ul className={`text-sm space-y-2 w-full ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>
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
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
