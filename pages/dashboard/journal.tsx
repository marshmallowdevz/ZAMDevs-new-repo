// journal.tsx
import { useEffect, useState, useContext } from "react";
import { supabase } from "../../lib/supabaseClient";
import Sidebar from "../../components/Sidebar";
import Head from "next/head";
import { TransitionContext } from "../_app";

type JournalEntry = {
  id: string;
  content: string;
  public: boolean;
  user_id: string;
  created_at: string;
};

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const { showContent } = useContext(TransitionContext);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return;

    const { data } = await supabase
      .from("journal")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setEntries(data || []);
    setLoading(false);
  }

  async function addEntry() {
    if (!newEntry.trim()) return;
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();
    if (sessionError || !user) return;

    const { data, error } = await supabase
      .from("journal")
      .insert([
        {
          content: newEntry,
          public: isPublic,
          user_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting journal entry:", error);
      return;
    }

    if (data && data.length > 0) {
      setEntries([data[0], ...entries]);
      setNewEntry("");
      setIsPublic(false);
    }
  }

  async function deleteEntry(id: string) {
    await supabase.from("journal").delete().eq("id", id);
    setEntries(entries.filter((entry) => entry.id !== id));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#A09ABC]" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Journal - Reflectly</title>
        <meta name="description" content="Your personal journal entries" />
      </Head>
      <div className="flex min-h-screen bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main
          className={`flex-1 p-10 bg-transparent min-h-screen transition-all duration-300 ${collapsed ? "ml-0" : "ml-64"}`}
        >
          <div
            className={`max-w-3xl mx-auto transition-all duration-700 ${showContent ? "opacity-100" : "opacity-0"}`}
          >
            <h2 className="text-3xl font-bold text-[#A09ABC] mb-6">📔 My Journal</h2>
            <div className="mb-8 bg-white/60 p-6 rounded-xl shadow backdrop-blur-md border border-white/30">
              <textarea
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder="Write your thoughts here..."
                className="w-full p-3 rounded-lg bg-white/70 text-[#6C63A6] focus:outline-none focus:ring-2 focus:ring-[#A09ABC] mb-3"
                rows={4}
              />
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="public-toggle"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-[#A09ABC] bg-white/70 border-[#A09ABC] rounded focus:ring-[#A09ABC] focus:ring-2"
                />
                <label htmlFor="public-toggle" className="text-[#6C63A6] font-medium">
                  🌍 Share this entry publicly
                </label>
              </div>
              <button
                onClick={addEntry}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition-all duration-300"
              >
                ➕ Add Entry
              </button>
            </div>
            {entries.length === 0 ? (
              <div className="text-[#6C63A6] text-center bg-white/60 p-8 rounded-xl backdrop-blur-md border border-white/30">
                No entries yet. Start writing above! ✍️
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white/70 rounded-xl p-6 shadow border border-white/30 backdrop-blur-md"
                  >
                    <div className="flex justify-between items-center text-sm text-[#A09ABC] mb-3">
                      <div className="flex items-center gap-2">
                        <span>{new Date(entry.created_at).toLocaleString()}</span>
                        {entry.public && (
                          <span className="bg-[#A09ABC] text-white px-2 py-1 rounded-full text-xs">
                            🌍 Public
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                    <div className="text-[#6C63A6] whitespace-pre-wrap leading-relaxed">
                      {entry.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
