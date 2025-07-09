// 📄 /pages/dashboard/analytics.tsx

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Sidebar from "../../components/Sidebar";
import Head from "next/head";
import { useRouter } from "next/router";
import { useDarkMode } from "../../components/DarkModeContext";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";

export default function Analytics() {
  const [moodData, setMoodData] = useState<{ date: string; moods: number }[]>([]);
  const [journalData, setJournalData] = useState<{ date: string; entries: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const router = useRouter();
  const { darkMode } = useDarkMode();

  // Generate random stars for dark mode decoration
  const generateStars = () => {
    const stars = [];
    for (let i = 0; i < 18; i++) {
      stars.push({
        id: i,
        top: Math.random() * 90 + 2, // avoid edges
        left: Math.random() * 90 + 2,
        size: Math.random() * 10 + 8, // 8-18px
        opacity: Math.random() * 0.4 + 0.6,
        blur: Math.random() > 0.5 ? 8 : 0,
        animationDelay: Math.random() * 3
      });
    }
    return stars;
  };
  const [stars] = useState(generateStars());

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }
      // Fetch moods
      const { data: moods } = await supabase
        .from("moods")
        .select("created_at")
        .eq("user_id", session.user.id);
      const moodGrouped = moods?.reduce((acc, entry) => {
        const date = new Date(entry.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const moodChart = Object.entries(moodGrouped || {}).map(([date, moods]) => ({ date, moods }));
      setMoodData(moodChart);
      // Fetch journal entries
      const { data: journals } = await supabase
        .from("journal")
        .select("created_at")
        .eq("user_id", session.user.id);
      const journalGrouped = journals?.reduce((acc, entry) => {
        const date = new Date(entry.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const journalChart = Object.entries(journalGrouped || {}).map(([date, entries]) => ({ date, entries }));
      setJournalData(journalChart);
      setLoading(false);
    }
    fetchData();
  }, [router]);

  // Merge data by date for combined chart
  const allDates = Array.from(new Set([
    ...moodData.map(d => d.date),
    ...journalData.map(d => d.date)
  ])).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const combinedData = allDates.map(date => ({
    date,
    moods: moodData.find(d => d.date === date)?.moods || 0,
    entries: journalData.find(d => d.date === date)?.entries || 0
  }));

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
        <title>Analytics Dashboard - Reflectly</title>
        <meta name="description" content="Mood and Journal Analytics" />
      </Head>
      <div className={`flex min-h-screen ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`} style={{ position: 'relative' }}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        {/* Scattered starfield for dark mode */}
        {darkMode && stars.map(star => (
          <div
            key={star.id}
            className="star-glow"
            style={{
              position: 'absolute',
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              filter: `drop-shadow(0 0 ${star.blur}px #fffbe9) drop-shadow(0 0 24px #A09ABC)` + (star.blur ? ' blur(1px)' : ''),
              zIndex: 0,
              animation: `starTwinkle ${3 + star.animationDelay}s infinite alternate ease-in-out`,
              pointerEvents: 'none',
            }}
          >
            {starSVG('#fff', '#A09ABC')}
          </div>
        ))}
        <main className={`flex-1 p-4 md:p-10 min-h-screen transition-all duration-300 ${collapsed ? 'ml-0' : 'ml-64'}`}>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-6xl">
              <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-[#A09ABC]' : 'text-[#A09ABC]'}`}>📊 Analytics Dashboard</h2>
              {/* Main Chart Card */}
              <div className={`bg-white/60 dark:bg-[#23234a] rounded-3xl shadow-lg border border-white/30 dark:border-[#23234a] p-8 mb-10`}>
                <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>Mood Trends & Journal Analytics</h3>
                {combinedData.length === 0 ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>No data yet. Start tracking your moods and journals! 📈</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={combinedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="lightPurple" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#B6A6CA" stopOpacity={0.7} />
                          <stop offset="100%" stopColor="#E1D8E9" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="darkPurple" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6C3483" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#23234a" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#A09ABC" tick={{ fontSize: 14 }} />
                      <YAxis stroke="#A09ABC" allowDecimals={false} tick={{ fontSize: 14 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: '1px solid #B6A6CA',
                          borderRadius: '8px',
                          color: '#6C63A6',
                          fontWeight: 600
                        }}
                        formatter={(value) => (typeof value === 'number' ? Math.round(value) : value)}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area
                        type="monotone"
                        dataKey="moods"
                        stroke="#B6A6CA"
                        fill="url(#lightPurple)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#B6A6CA' }}
                        activeDot={{ r: 7, fill: '#B6A6CA' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="entries"
                        stroke="#6C3483"
                        fill="url(#darkPurple)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#6C3483' }}
                        activeDot={{ r: 7, fill: '#6C3483' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <style jsx global>{`
        .star-glow {
          filter: drop-shadow(0 0 24px #fffbe9) drop-shadow(0 0 48px #A09ABC);
          opacity: 0.85;
          animation: starTwinkle 5s infinite alternate ease-in-out;
        }
        @keyframes starTwinkle {
          0% { transform: translateY(0) scale(1); opacity: 0.85; }
          50% { transform: translateY(-12px) scale(1.05); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 0.85; }
        }
      `}</style>
    </>
  );
}

function starSVG(color1: string, color2: string) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 16px #fffbe9) blur(0.5px)' }}>
      <defs>
        <radialGradient id="starGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor={color1} stopOpacity="1" />
          <stop offset="100%" stopColor={color2} stopOpacity="0.7" />
        </radialGradient>
      </defs>
      {/* 5-pointed star */}
      <path 
        d="M50 10 L61 35 L88 35 L68 55 L78 82 L50 65 L22 82 L32 55 L12 35 L39 35 Z" 
        fill="url(#starGradient)" 
        stroke={color2} 
        strokeWidth="2"
      />
      {/* Inner glow */}
      <circle cx="50" cy="50" r="15" fill={color1} opacity="0.3" />
    </svg>
  );
}
