// pages/settings/index.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Sidebar from "../../components/Sidebar";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  FaMoon, FaPalette, FaGlobe, FaBell,
  FaLock, FaInfoCircle, FaQuestionCircle,
} from "react-icons/fa";
import { useDarkMode } from "../../components/DarkModeContext";

export default function Settings() {
  const [collapsed, setCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);
  const { darkMode, setDarkMode } = useDarkMode();

  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push("/auth/login");
        return;
      }
      setLoading(false);
    }
    fetchUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const preferences = [
    { icon: <FaPalette />, label: "Appearance" },
    { icon: <FaGlobe />, label: "Language", note: "English" },
    { icon: <FaBell />, label: "Notifications" },
    { icon: <FaLock />, label: "Privacy" },
    { icon: <FaLock />, label: "Security" },
    { icon: <FaQuestionCircle />, label: "Help" },
    { icon: <FaInfoCircle />, label: "About" },
  ];

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#A09ABC]" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Settings - Reflectly</title>
      </Head>
      <div className={`flex min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className={`flex-1 p-6 transition-all duration-300 ${collapsed ? 'ml-0' : 'ml-64'}`}>
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-center text-[#A09ABC] mb-4">Settings</h2>

            {/* Dark Mode Toggle */}
            <div className={`${darkMode ? 'bg-[#23234a]' : 'bg-white/80'} rounded-2xl shadow p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[#6C63A6] font-medium">
                  <FaMoon className="text-xl" />
                  Dark Mode
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-14 h-7 flex items-center rounded-full p-1 duration-300 ease-in-out ${darkMode ? 'bg-[#A09ABC]' : 'bg-gray-300'}`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${darkMode ? 'translate-x-7' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Preferences List */}
            <div className={`${darkMode ? 'bg-[#23234a]' : 'bg-white/80'} rounded-2xl shadow p-4 space-y-4`}>
              {preferences.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-[#D5CFE1] pb-3">
                  <div className="flex items-center gap-4 text-[#6C63A6]">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="text-[#A09ABC] text-sm">{item.note || '›'}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Link href="/settings/password">
                <button
                  className={`w-full px-6 py-3 rounded-full ${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-white text-[#6C63A6]'} font-semibold shadow hover:bg-[#f0edf6] transition-all duration-300 border border-[#A09ABC]/20`}
                >
                  🔒 Change Password
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition-all duration-300"
              >
                🚪 Log Out
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
