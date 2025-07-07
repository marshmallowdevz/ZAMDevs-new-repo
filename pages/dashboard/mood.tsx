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

const moods = [
  ["😄", "🙂", "😐", "😔", "😢"],
  ["😡", "😱", "😴", "🤩", "😇"],
  ["😂", "🥲", "😏", "😬", "😭"],
  ["😤", "😳", "🥳", "😎", "🥺"]
];

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
            <div className="w-full flex justify-center">
              <div className={`w-full max-w-6xl min-h-[350px] flex flex-row gap-10 bg-white/60 dark:bg-[#23234a] rounded-3xl shadow-lg border border-white/30 dark:border-[#23234a] p-8`}>
                {/* Emoji Picker (left) */}
                <div className="flex-1 flex flex-col justify-between">
                  <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>How are you feeling today?</h3>
                  <div className="overflow-y-auto max-h-48 pr-2">
                    <div className="flex flex-col gap-4">
                      {moods.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex gap-4 text-3xl justify-center">
                          {row.map((mood) => (
                            <button
                              key={mood}
                              onClick={() => setSelectedMood(mood)}
                              className={`px-6 py-3 rounded-full text-2xl transition-all duration-300 hover:scale-110 ${
                                selectedMood === mood 
                                  ? 'bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white shadow-lg' 
                                  : darkMode ? 'bg-[#23234a] text-[#A09ABC] hover:bg-[#23234a]/80' : 'bg-white/80 text-[#6C63A6] hover:bg-white'
                              }`}
                            >
                              {mood}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={submitMood}
                    disabled={!selectedMood}
                    className="px-8 py-4 mt-8 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white text-lg font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Mood
                  </button>
                </div>
                {/* Mood History (right) */}
                <div className="flex-1 flex flex-col ml-8">
                  <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>Mood History</h3>
                  {moodData.length === 0 ? (
                    <div className={`text-center py-8 text-lg ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>No moods logged yet.</div>
                  ) : (
                    <ul className="space-y-4 overflow-y-auto max-h-48 pr-2">
                      {moodData.map((mood) => (
                        <li key={mood.id} className={`${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-white/80 text-[#6C63A6]'} rounded-lg p-4 flex justify-between items-center text-lg`}>
                          <span className="text-2xl">{mood.emoji}</span>
                          <span className="text-base">{new Date(mood.created_at).toLocaleString()}</span>
                          <button
                            onClick={() => deleteMood(mood.id)}
                            className="text-red-500 hover:text-red-700 text-base"
                          >
                            🗑️ Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
