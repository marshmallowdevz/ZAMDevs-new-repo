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

const moodAdvice: { [emoji: string]: string } = {
  "😄": "Keep spreading your happiness! Maybe share a compliment with someone today.",
  "🙂": "Enjoy your day! Try doing something creative.",
  "😐": "Try a short walk or listen to your favorite music.",
  "😔": "Take a deep breath. Write down three things you're grateful for.",
  "😢": "It's okay to feel sad. Call or message a friend you trust.",
  "😡": "Try some deep breathing or take a break outside.",
  "😱": "Pause and do a 5-minute mindfulness exercise.",
  "😴": "Rest is important. Take a short nap if you can.",
  "🤩": "Channel your excitement into a fun project!",
  "😇": "Do a random act of kindness today.",
  "😂": "Share a funny story or meme with a friend.",
  "🥲": "Reflect on your feelings in a journal.",
  "😏": "Stay confident, but check in with someone close to you.",
  "😬": "Remember, awkward moments pass. Treat yourself kindly.",
  "😭": "Let it out. Maybe write about your feelings or talk to someone.",
  "😤": "Use your energy for a quick workout or creative task.",
  "😳": "Be gentle with yourself. Everyone makes mistakes.",
  "🥳": "Celebrate your achievements, big or small!",
  "😎": "Keep being awesome! Help someone out today.",
  "🥺": "Reach out if you need support. You're not alone.",
};

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState("");
  const [showAdvice, setShowAdvice] = useState(false);
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

  // Change this variable to switch between horizontal and vertical layouts
  const layoutDirection = "flex-col gap-8"; // use "flex-row gap-12" for horizontal
  const isVertical = layoutDirection === "flex-col gap-8";

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
    await supabase.from("moods").insert([{ user_id: user.id, emoji: selectedMood, created_at: new Date().toISOString() }]);
    setShowAdvice(true);
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
          <div className="max-w-7xl mx-auto">
            <h2 className={`text-4xl font-bold mb-10 ${darkMode ? 'text-[#A09ABC]' : 'text-[#A09ABC]'}`}>🌈 Mood Tracker</h2>
            <div className="w-full flex justify-center items-stretch">
              <div className={`w-full flex ${layoutDirection} bg-white/80 dark:bg-[#23234a] rounded-3xl shadow-lg border border-white/30 dark:border-[#23234a] p-4 md:p-12 max-h-screen overflow-auto`}>
                {/* Emoji Picker (left) */}
                <div className="flex flex-col flex-1 justify-between">
                  <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>How are you feeling today?</h3>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col gap-6 w-full">
                      {moods.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex gap-8 justify-center">
                          {row.map((mood) => (
                            <button
                              key={mood}
                              onClick={() => setSelectedMood(mood)}
                              className={`w-20 h-20 text-4xl rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 font-bold text-center shadow-md ${
                                selectedMood === mood 
                                  ? 'bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white' 
                                  : darkMode ? 'bg-[#23234a] text-[#A09ABC] hover:bg-[#23234a]/80' : 'bg-white text-[#6C63A6] hover:bg-white'
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
                    className="px-10 py-5 mt-10 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white text-2xl font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Mood
                  </button>
                  {/* Show advice/task only after saving mood */}
                  {showAdvice && (
                    <div className="mt-8 text-xl font-semibold text-center text-[#6C63A6] dark:text-[#A09ABC]">
                      {moodAdvice[moodData[0]?.emoji] || "Thank you for sharing your mood. Take care of yourself today!"}
                    </div>
                  )}
                </div>
                {/* Mood History (right) */}
                <div className={`flex flex-col flex-1 ${isVertical ? "mt-8" : "ml-12"}`}>
                  <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>Mood History</h3>
                  <div className="flex-1 flex flex-col justify-start">
                    {moodData.length === 0 ? (
                      <div className={`text-center py-16 text-xl ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>No moods logged yet.</div>
                    ) : (
                      <ul className="space-y-6 overflow-y-auto max-h-[400px] pr-2">
                        {moodData.map((mood) => (
                          <li key={mood.id} className={`${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-white text-[#6C63A6]'} rounded-xl p-6 flex justify-between items-center text-xl shadow-md`}>
                            <span className="text-3xl">{mood.emoji}</span>
                            <span className="text-lg">{new Date(mood.created_at).toLocaleString()}</span>
                            <button
                              onClick={() => deleteMood(mood.id)}
                              className="text-red-500 hover:text-red-700 text-lg font-bold"
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
          </div>
        </main>
      </div>
    </>
  );
}
