import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import Sidebar from "../../components/Sidebar";
import Head from "next/head";
import { TransitionContext } from "../_app";
import { useDarkMode } from "../../components/DarkModeContext";
import { v4 as uuidv4 } from 'uuid';
import { FaCamera } from 'react-icons/fa';

type JournalEntry = {
id: string;
created_at: string;
title?: string;
content?: string;
// Add other fields as needed from your journal table
[key: string]: unknown;
};

export default function Account() {
const [header, setHeader] = useState("/default-header.jpg");
const [avatar, setAvatar] = useState("/default-avatar.png");
const [name, setName] = useState("Your Name");
const [bio, setBio] = useState("Short bio goes here...");
const [email, setEmail] = useState("");
const [phone, setPhone] = useState("");
const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
const [userId, setUserId] = useState<string | null>(null);
const [collapsed, setCollapsed] = useState(false);
const [showText, setShowText] = useState(false);
const { showContent } = useContext(TransitionContext);
const [profileLoading, setProfileLoading] = useState(false);
const [profileSuccess, setProfileSuccess] = useState(false);
const { darkMode } = useDarkMode();
const [editMode, setEditMode] = useState(false);
const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
const [newHeaderFile, setNewHeaderFile] = useState<File | null>(null);
const [profileError, setProfileError] = useState<string | null>(null);

useEffect(() => {
setTimeout(() => setShowText(true), 100);
}, []);

// Fetch user info and profile images
useEffect(() => {
async function fetchProfile() {
const { data: { user } } = await supabase.auth.getUser();
if (user) {
setEmail(user.email || "");
setUserId(user.id);
// Fetch profile from your 'profiles' table
const { data: profile } = await supabase
.from("profiles")
.select("avatar_url, header_url, full_name, bio, phone")
.eq("id", user.id)
.single();
if (profile) {
setAvatar(profile.avatar_url || "/default-avatar.png");
setHeader(profile.header_url || "/default-header.jpg");
setName(profile.full_name || "Your Name");
setBio(profile.bio || "Short bio goes here...");
setPhone(profile.phone || "");
}
// Fetch journal entries
const { data: journals } = await supabase
.from("journal")
.select("*")
.eq("user_id", user.id)
.order("created_at", { ascending: false });
setJournalEntries(journals || []);
}
}
fetchProfile();
}, []);

async function handleProfileSave() {
if (!userId) return;
setProfileLoading(true);
setProfileError(null);
let avatarUrl = avatar;
let headerUrl = header;
// Upload avatar if changed
if (newAvatarFile) {
const { data, error } = await supabase.storage.from('avatars').upload(`${userId}/avatar-${uuidv4()}`, newAvatarFile, { upsert: true });
if (error) {
setProfileError('Failed to upload avatar: ' + error.message);
setProfileLoading(false);
return;
}
if (data) {
const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(data.path);
avatarUrl = publicUrl.publicUrl;
}
}
// Upload header if changed
if (newHeaderFile) {
const { data, error } = await supabase.storage.from('headers').upload(`${userId}/header-${uuidv4()}`, newHeaderFile, { upsert: true });
if (error) {
setProfileError('Failed to upload header: ' + error.message);
setProfileLoading(false);
return;
}
if (data) {
const { data: publicUrl } = supabase.storage.from('headers').getPublicUrl(data.path);
headerUrl = publicUrl.publicUrl;
}
}
const { error: updateError } = await supabase.from('profiles').update({
full_name: name,
bio,
phone,
avatar_url: avatarUrl,
header_url: headerUrl,
}).eq('id', userId);
if (updateError) {
setProfileError('Failed to update profile: ' + updateError.message);
setProfileLoading(false);
return;
}
setAvatar(avatarUrl);
setHeader(headerUrl);
setProfileLoading(false);
setProfileSuccess(true);
setEditMode(false);
setNewAvatarFile(null);
setNewHeaderFile(null);
setTimeout(() => setProfileSuccess(false), 3000);
}

function handleCancelEdit() {
setEditMode(false);
setNewAvatarFile(null);
setNewHeaderFile(null);
// Optionally, refetch profile to reset fields
}

return (
<div className={`relative min-h-screen w-full flex animate-gradient-bg overflow-hidden ${darkMode ? 'bg-[#1a1a2e]' : ''}`}>
<Head>
<title>Account | Reflectly</title>
</Head>
{/* Sidebar */}
<Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
{/* Animated Clouds */}
<div className="absolute left-0 top-24 w-1/2 z-10 animate-cloud-left pointer-events-none">
<svg width="320" height="80" viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="60" cy="60" rx="60" ry="20" fill="#D5CFE1" />
<ellipse cx="140" cy="50" rx="50" ry="18" fill="#E1D8E9" />
<ellipse cx="220" cy="65" rx="70" ry="22" fill="#B6A6CA" />
</svg>
</div>
<div className="absolute right-0 top-40 w-1/3 z-10 animate-cloud-right pointer-events-none">
<svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="50" cy="40" rx="50" ry="15" fill="#E1D8E9" />
<ellipse cx="120" cy="30" rx="40" ry="12" fill="#D5CFE1" />
</svg>
</div>
{/* Twinkling Stars */}
<div className="absolute left-1/3 top-1/4 text-[#fff] text-2xl opacity-80 z-0 animate-twinkle">✦</div>
<div className="absolute right-1/4 bottom-1/3 text-[#fff] text-xl opacity-60 z-0 animate-twinkle">✧</div>
<div className="absolute left-1/4 bottom-1/4 text-[#fff] text-lg opacity-40 z-0 animate-twinkle" style={{ animationDelay: "1s" }}>✦</div>
<div className="absolute left-1/2 top-1/6 text-[#fff] text-lg opacity-60 z-0 animate-twinkle" style={{ animationDelay: "2s" }}>✦</div>
{/* Main Content */}
<main className={`flex-1 ${collapsed ? 'mx-auto' : 'ml-64'} flex items-center justify-center p-6 min-h-screen`}>
<div className={`relative z-20 w-full max-w-2xl mx-auto px-0 py-0 ${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-white/10'} rounded-3xl shadow-2xl backdrop-blur-md transition-all duration-700 ${showText && showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
{/* Header Banner */}
<div className="relative h-56 w-full bg-gradient-to-r from-[#A09ABC]/40 to-[#B6A6CA]/40 rounded-t-3xl overflow-hidden flex items-center justify-center">
<Image
src={newHeaderFile ? URL.createObjectURL(newHeaderFile) : header}
alt="Header"
fill
style={{ objectFit: "cover" }}
className="rounded-t-3xl"
onError={(e) => (e.currentTarget.src = "/default-header.png")}
/>
{editMode && (
<label className="absolute top-4 right-6 flex items-center gap-2 cursor-pointer bg-white/80 hover:bg-white/90 px-4 py-2 rounded-full shadow transition-all">
<FaCamera className="text-[#A09ABC] text-lg" />
<span className="font-medium text-[#6C63A6] text-sm">Change Header</span>
<input
type="file"
accept="image/*"
className="hidden"
onChange={e => setNewHeaderFile(e.target.files?.[0] || null)}
/>
</label>
)}
{editMode && (
<div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none rounded-t-3xl" />
)}
{editMode && (
  <div className="absolute top-4 left-6 flex flex-col gap-2 z-20">
    <button
      type="button"
      className="bg-white/80 hover:bg-red-200 text-red-600 px-4 py-1 rounded-full shadow text-xs font-semibold transition-all"
      onClick={() => {
        setNewHeaderFile(null);
        setHeader('/default-header.jpg');
      }}
    >
      Remove Header
    </button>
  </div>
)}
</div>
{/* Profile Picture and Info Row */}
<div className="relative flex flex-row items-end justify-between px-8 -mt-16">
{/* Avatar */}
<div className="relative border-8 border-white rounded-full w-36 h-36 bg-white shadow flex items-center justify-center overflow-hidden">
<Image
src={newAvatarFile ? URL.createObjectURL(newAvatarFile) : avatar}
alt="Avatar"
width={144}
height={144}
style={{ objectFit: "cover" }}
onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
/>
{editMode && (
<label className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 cursor-pointer bg-white/90 hover:bg-white px-3 py-2 rounded-full shadow transition-all border border-[#A09ABC]/30">
<FaCamera className="text-[#A09ABC] text-base" />
<span className="font-medium text-[#6C63A6] text-xs">Change</span>
<input
type="file"
accept="image/*"
className="hidden"
onChange={e => setNewAvatarFile(e.target.files?.[0] || null)}
/>
</label>
)}
{editMode && (
<div className="absolute inset-0 bg-black/10 rounded-full pointer-events-none" />
)}
{editMode && (
  <button
    type="button"
    className="absolute top-2 right-2 bg-white/80 hover:bg-red-200 text-red-600 px-3 py-1 rounded-full shadow text-xs font-semibold transition-all z-20"
    onClick={() => {
      setNewAvatarFile(null);
      setAvatar('/default-avatar.png');
    }}
  >
    Remove
  </button>
)}
</div>
{/* Edit/Save/Cancel Buttons */}
<div className="mb-8 flex flex-col gap-2 items-end">
{profileSuccess && (
<div className="text-green-600 bg-white/80 border border-green-300 rounded-lg p-2 mb-2 text-center shadow">
Profile updated successfully!
</div>
)}
{profileError && (
<div className="text-red-600 bg-white/80 border border-red-300 rounded-lg p-2 mb-2 text-center shadow max-w-xs">
{profileError}
</div>
)}
{!editMode ? (
<button
onClick={() => setEditMode(true)}
className="px-8 py-3 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold text-lg shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#A09ABC]/30"
style={{ minWidth: 140 }}
>
Edit Profile
</button>
) : (
<div className="flex gap-2 mt-4">
<button
onClick={handleProfileSave}
className="px-8 py-3 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold text-lg shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#A09ABC]/30"
disabled={profileLoading}
style={{ minWidth: 140 }}
>
{profileLoading ? "Saving..." : "Save"}
</button>
<button
onClick={handleCancelEdit}
className="px-8 py-3 rounded-full bg-gray-200 text-[#6C63A6] font-bold text-lg shadow hover:bg-gray-300 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#A09ABC]/30"
disabled={profileLoading}
style={{ minWidth: 140 }}
>
Cancel
</button>
</div>
)}
</div>
</div>
{/* Profile Info */}
<div className="mt-6 flex flex-col items-center px-8">
{editMode ? (
<input
value={name}
onChange={e => setName(e.target.value)}
className={`text-2xl md:text-3xl font-serif font-bold bg-white/80 border border-[#A09ABC]/30 w-full text-center mb-2 ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'} drop-shadow focus:outline-none`}
/>
) : (
<input
value={name}
readOnly
className={`text-2xl md:text-3xl font-serif font-bold bg-transparent border-none w-full text-center mb-2 ${darkMode ? 'text-[#A09ABC]' : 'text-[#ede9fe]'} drop-shadow focus:outline-none`}
/>
)}
<div className={`mb-2 text-center text-lg font-semibold drop-shadow ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}>{email}</div>
{editMode ? (
<input
value={phone}
onChange={e => setPhone(e.target.value)}
className={`mb-2 text-center text-base font-medium bg-white/80 border border-[#A09ABC]/30 w-full focus:outline-none ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}
placeholder="Phone number"
/>
) : (
<input
value={phone}
readOnly
className={`mb-2 text-center text-base font-medium bg-transparent border-none w-full focus:outline-none ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}
placeholder="Phone number"
/>
)}
{editMode ? (
<textarea
value={bio}
onChange={e => setBio(e.target.value)}
className={`bg-white/80 border border-[#A09ABC]/30 w-full text-center mb-4 font-medium focus:outline-none ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}
rows={2}
/>
) : (
<textarea
value={bio}
readOnly
className={`bg-transparent border-none w-full text-center mb-4 font-medium focus:outline-none ${darkMode ? 'text-[#A09ABC]' : 'text-[#6C63A6]'}`}
rows={2}
/>
)}
</div>
{/* Journal Entries */}
<div className="mt-12">
            <h3 className={`text-xl md:text-2xl font-serif font-bold mb-4 drop-shadow mx-6 my-4 ${darkMode ? 'text-[#A09ABC]' : 'text-[#A09ABC]'}`}>Your Journal Entries</h3>
<div className="space-y-4">
{journalEntries.length === 0 && (
  <div>
    <div className={`${darkMode ? 'text-[#A09ABC]' : 'text-[#B6A6CA]'} text-center mx-6 my-4`}>No journal entries yet.</div>
  </div>
)}
{journalEntries.map((entry: JournalEntry) => (
<div key={entry.id} className={`${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-white/70 text-[#6C63A6]'} rounded-xl p-4 shadow flex flex-col border ${darkMode ? 'border-[#23234a]' : 'border-white/30'}`}>
<div className={`text-sm mb-1 ${darkMode ? 'text-[#B6A6CA]' : 'text-[#A09ABC]'}`}>
{new Date(entry.created_at).toLocaleString()}
</div>
<div className="font-semibold">{entry.title}</div>
<div>{entry.content}</div>
</div>
))}
</div>
</div>
</div>
</main>
</div>
);
}