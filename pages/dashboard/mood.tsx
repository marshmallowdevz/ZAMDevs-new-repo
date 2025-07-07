import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Sidebar from "../../components/Sidebar";
import Head from "next/head";
import { useRouter } from "next/router";
import { useDarkMode } from "../../components/DarkModeContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const moods = ["😀", "🙂", "😐", "😕", "😢"];

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState("");
  type Mood = {
    id: string;
    emoji: string;
    created_at: string;
    user_id?: string;
  };
  
  const [moodData, setMoodData] = useState<Mood[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const router = useRouter();
  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchMoodData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMoodData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    const { data } = await supabase
      .from("moods")
      .select("id, emoji, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setMoodData(data || []);
    setLoading(false);
  }

  async function submitMood() {
    if (!selectedMood) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    await supabase.from("moods").insert([{ user_id: user.id, emoji: selectedMood }]);
    setSelectedMood("");
    fetchMoodData();
  }

  async function deleteMood(id: string) {
    await supabase.from("moods").delete().eq("id", id);
    setMoodData(moodData.filter((m) => m.id !== id));
  }

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
        <title>Mood Tracker - Reflectly</title>
        <meta name="description" content="Track your daily moods" />
      </Head>
      <div className={`flex min-h-screen ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className={`flex-1 p-10 min-h-screen transition-all duration-300 ${collapsed ? 'ml-0' : 'ml-64'}`}>
          <div className="max-w-4xl mx-auto">
            <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-[#A09ABC]' : 'text-[#A09ABC]'}`}>🌈 Mood Tracker</h2>
            <div className={`${darkMode ? 'bg-[#23234a]' : 'bg-white/60'} p-6 rounded-xl shadow backdrop-blur-md border ${darkMode ? 'border-[#23234a]' : 'border-white/30'} mb-8`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>How are you feeling today?</h3>
                  <div className="flex gap-3 text-2xl">
                    {moods.map((mood) => (
                      <button
                        key={mood}
                        onClick={() => setSelectedMood(mood)}
                        className={`px-4 py-2 rounded-full transition-all duration-300 hover:scale-110 ${
                          selectedMood === mood 
                            ? 'bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white shadow-lg' 
                            : darkMode ? 'bg-[#23234a] text-[#A09ABC] hover:bg-[#23234a]/80' : 'bg-white/80 text-[#6C63A6] hover:bg-white'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={submitMood}
                  disabled={!selectedMood}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Mood
                </button>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-[#23234a]' : 'bg-white/70'} rounded-xl p-6 shadow border ${darkMode ? 'border-[#23234a]' : 'border-white/30'} backdrop-blur-md mb-8`}>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>Mood History</h3>
              {moodData.length === 0 ? (
                <div className={`text-center py-4 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>
                  No moods logged yet.
                </div>
              ) : (
                <ul className="space-y-2">
                  {moodData.map((mood) => (
                    <li key={mood.id} className={`${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-white/80 text-[#6C63A6]'} rounded-lg p-3 flex justify-between items-center`}>
                      <span className="text-xl">{mood.emoji}</span>
                      <span className="text-sm">{new Date(mood.created_at).toLocaleString()}</span>
                      <button
                        onClick={() => deleteMood(mood.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        🗑️ Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`${darkMode ? 'bg-[#23234a]' : 'bg-white/70'} rounded-xl p-6 shadow border ${darkMode ? 'border-[#23234a]' : 'border-white/30'} backdrop-blur-md`}>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>Mood Trends</h3>
              {moodData.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>
                  No mood data yet. Start tracking your moods above! 📊
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={moodData.reduce((acc, mood) => {
                      const date = new Date(mood.created_at).toLocaleDateString();
                      const found = acc.find((d) => d.date === date);
                      if (found) {
                        found.moods += 1;
                      } else {
                        acc.push({ date, moods: 1 });
                      }
                      return acc;
                    }, [] as { date: string; moods: number }[])}
                  >
                    <XAxis dataKey="date" stroke="#A09ABC" />
                    <YAxis stroke="#A09ABC" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: darkMode ? '#23234a' : 'rgba(255, 255, 255, 0.9)',
                        border: `1px solid ${darkMode ? '#A09ABC' : 'rgba(160, 154, 188, 0.3)'}`,
                        borderRadius: '8px',
                        color: darkMode ? '#A09ABC' : '#6C63A6'
                      }}
                    />
                    <Bar dataKey="moods" fill="#A09ABC" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
