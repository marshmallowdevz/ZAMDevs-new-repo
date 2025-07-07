import Head from "next/head";
import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../lib/supabaseClient";
import { useDarkMode } from "../../components/DarkModeContext";
import { useRouter } from "next/router";

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(true);
  type UserProfile = { first_name: string; id: string };
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { darkMode } = useDarkMode();

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
        <main className={`flex-1 p-6 md:p-10 min-h-screen transition-all duration-300 ${collapsed ? 'ml-0' : 'ml-64'}`}>
          <div className="max-w-7xl mx-auto">
            {/* Welcome Card */}
            <div className="rounded-3xl bg-white/60 dark:bg-[#23234a] shadow-lg p-8 mb-8 backdrop-blur-md border border-white/30 dark:border-[#23234a]">
              <h2 className="text-2xl md:text-3xl font-bold text-[#A09ABC] mb-2">Welcome back, {user?.first_name || 'User'}!</h2>
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
                      {["S","M","T","W","T","F","S"][i]}
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
                  <div className="text-[#A09ABC] text-lg font-semibold mb-2">Today&apos;s Mood</div>
                  <div className="text-4xl mb-4">😊</div>
                  <button onClick={handleUpdateMood} className="px-6 py-2 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition">Update Mood</button>
                </div>
                {/* Mood Consistency */}
                <div className="rounded-2xl bg-white/60 dark:bg-[#23234a] shadow p-6 flex flex-col items-center justify-center backdrop-blur-md border border-white/30 dark:border-[#23234a]">
                  <div className="text-[#A09ABC] text-lg font-semibold mb-2">Mood Consistency</div>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#A09ABC] to-[#B6A6CA] flex items-center justify-center mb-4">
                    <span className="text-white text-2xl font-bold">80%</span>
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
                    <li className="flex items-center gap-2"><span>✔️</span>Logged mood: <span className="font-semibold">Happy</span> <span className="ml-auto text-[#A09ABC]/70">Today, 8:30 AM</span></li>
                    <li className="flex items-center gap-2"><span>📝</span>Created journal entry <span className="ml-auto text-[#A09ABC]/70">Yesterday</span></li>
                    <li className="flex items-center gap-2"><span>✅</span>Completed task <span className="ml-auto text-[#A09ABC]/70">2 days ago</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}