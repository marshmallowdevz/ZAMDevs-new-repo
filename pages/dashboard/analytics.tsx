import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Sidebar from "../../components/Sidebar";
import Head from "next/head";
import { useRouter } from "next/router";
import { useDarkMode } from "../../components/DarkModeContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Analytics() {
  const [data, setData] = useState<{ date: string; entries: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const router = useRouter();
  const { darkMode } = useDarkMode();

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }
      const { data } = await supabase
        .from("moods")
        .select("created_at")
        .eq("user_id", session.user.id);

      const grouped = data?.reduce((acc, entry) => {
        const date = new Date(entry.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const chartData = Object.entries(grouped || {}).map(([date, count]) => ({ date, entries: count }));
      setData(chartData);
      setLoading(false);
    }
    fetchData();
  }, [router]);

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
        <title>Analytics - Reflectly</title>
        <meta name="description" content="View your mood analytics" />
      </Head>
      <div className={`flex min-h-screen ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className={`flex-1 p-10 min-h-screen transition-all duration-300 ${collapsed ? 'ml-0' : 'ml-64'}`}>
          <div className="max-w-5xl mx-auto">
            <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-[#A09ABC]' : 'text-[#A09ABC]'}`}>📊 Mood Analytics</h2>

            <div className={`${darkMode ? 'bg-[#23234a]' : 'bg-white/70'} rounded-xl p-6 shadow border ${darkMode ? 'border-[#23234a]' : 'border-white/30'} backdrop-blur-md`}>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>Mood Logs Over Time</h3>
              {data.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>
                  No mood data yet. Start tracking your moods to see analytics! 📈
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={data} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#23234a' : '#E1D8E9'} />
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
                    <Line 
                      type="monotone" 
                      dataKey="entries" 
                      stroke="#A09ABC" 
                      strokeWidth={3} 
                      dot={{ r: 5, fill: '#A09ABC' }}
                      activeDot={{ r: 8, fill: '#B6A6CA' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
