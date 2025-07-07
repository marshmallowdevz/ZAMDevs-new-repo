import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";
import Sidebar from "../../components/Sidebar";
import Head from "next/head";
import Modal from '../../components/Modal';
import { useDarkMode } from "../../components/DarkModeContext";

type JournalEntry = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  public?: boolean;
  title?: string;
};

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [emojiModalOpen, setEmojiModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const router = useRouter();
  const moodOptions = ["😊", "😌", "😥", "🥰", "😪"];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const { darkMode } = useDarkMode();

  const emojiCategories = [
    { name: 'Smileys', emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😷','🤒','🤕','🤢','🤮','🥴','😇','🥳'] },
    { name: 'Animals', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿️','🦔'] },
    { name: 'Food', emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🫔','🥙','🧆','🥚','🍳','🥘','🍲','🫕','🥣','🥗','🍿','🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦪','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🫖','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🫗','🥤','🧋','🧃','🧉','🧊','🥢','🍽️','🍴','🥄'] },
    { name: 'Activities', emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🥅','🏒','🏑','🏏','🥍','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛷','⛸️','🥌','🛼','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸','🛎️','🧳','⌛','⏳','⌚','⏰','⏱️','⏲️','🕰️','🌡️','🗺️','🧭','🎃','🎄','🎆','🎇','🧨','✨','🎈','🎉','🎊','🎋','🎍','🎎','🎏','🎐','🎑','🧧','🎀','🎁','🎗️','🎟️','🎫','🎖️','🏆','🏅','🥇','🥈','🥉','⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🥅','🏒','🏑','🏏','🥍','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛷','⛸️','🥌','🛼'] },
    { name: 'Objects', emojis: ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🧯','🛢️','💸','💵','💴','💶','💷','💰','💳','🧾','💎','⚖️','🔧','🔨','⚒️','🛠️','⛏️','🔩','⚙️','🗜️','⚗️','🧪','🧫','🧬','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🚪','🛏️','🛋️','🪑','🚽','🚿','🛁','🪒','🧴','🧷','🧹','🧺','🧻','🧼','🪣','🧽','🧯','🛒','🚬','⚰️','🪦','⚱️','🏺','🕳️','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️','🧱','🏘️','🏚️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩️','🕋','⛲','⛺','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉','♨️','🎠','🎡','🎢','💈','🎪','🛤️','🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉','🚊','🚋','🚌','🚍','🚎','🚐','🚑','🚒','🚓','🚔','🚕','🚖','🚗','🚘','🚙','🚚','🚛','🚜','🏎️','🏍️','🛵','🦽','🦼','🛺','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','🛢️','⛽','🚨','🚥','🚦','🛑','🚧','⚓','⛵','🛶','🚤','🛥️','🛳️','⛴️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸'] },
    { name: 'Symbols', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅺','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','��','🔞','📵','🚭','❗','❓','❕','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆓','🆕','🆚','🈁','🈂️'] }
  ];
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(emojiCategories[0].name);

  useEffect(() => {
    async function fetchEntries() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }
      const { data } = await supabase
        .from("journal")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setEntries(data || []);
      setLoading(false);
    }
    fetchEntries();
  }, [router]);

  const openEditEntryModal = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntry(entry.content);
    setEntryTitle(entry.title || "");
    setIsPublic(!!entry.public);
    setModalOpen(true);
  };

  const saveEntry = async () => {
    if (newEntry.trim() === "") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (editingEntry) {
      // Update existing entry
      const { data, error } = await supabase
        .from("journal")
        .update({ content: newEntry, public: isPublic })
        .eq("id", editingEntry.id)
        .select();
      if (!error && data) {
        setEntries(entries.map(e => e.id === editingEntry.id ? { ...e, content: newEntry, public: isPublic } : e));
        setEditingEntry(null);
        setNewEntry("");
        setEntryTitle("");
        setIsPublic(true);
        setModalOpen(false);
      }
    } else {
      // Add new entry
      const { data, error } = await supabase
        .from("journal")
        .insert([{ content: newEntry, user_id: session.user.id, public: isPublic }])
        .select();
      if (!error && data) {
        setEntries([data[0], ...entries]);
        setNewEntry("");
        setEntryTitle("");
        setIsPublic(true);
        setModalOpen(false);
      }
    }
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("journal").delete().eq("id", id);
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  const insertEmoji = (emoji: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = newEntry.slice(0, start);
    const after = newEntry.slice(end);
    setNewEntry(before + emoji + after);
    setEmojiModalOpen(false);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 0);
  };

  // Handle textarea change with undo/redo stack
  const handleEntryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUndoStack(prev => [...prev, newEntry]);
    setRedoStack([]);
    setNewEntry(e.target.value);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack(r => [...r, newEntry]);
    setNewEntry(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack(u => [...u, newEntry]);
    setNewEntry(next);
  };

  // Switch style for public/private
  const switchContainer = {
    display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8
  };
  const switchLabel = {
    color: '#6C63A6', fontWeight: 500, fontSize: 16
  };
  const switchOuter = {
    width: 44, height: 24, borderRadius: 12, background: isPublic ? 'linear-gradient(90deg, #A09ABC 0%, #B6A6CA 100%)' : '#e5e7eb', position: 'relative' as 'relative', cursor: 'pointer', transition: 'background 0.3s', display: 'inline-block', verticalAlign: 'middle'
  };
  const switchInner = {
    position: 'absolute' as 'absolute', top: 2, left: isPublic ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px #D5CFE1', transition: 'left 0.3s'
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
        <title>Journal - Reflectly</title>
        <meta name="description" content="Your personal journal entries" />
      </Head>
      <div className={`flex min-h-screen ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className={`flex-1 p-10 min-h-screen transition-all duration-300 ${collapsed ? 'ml-0' : 'ml-64'}`}>
          <div className="max-w-3xl mx-auto">
            <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-[#A09ABC]' : 'text-[#A09ABC]'}`}>📔 My Journal</h2>
            {/* Add Entry Button */}
            <div className="mb-8 flex justify-end">
              <button
                onClick={() => setModalOpen(true)}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition-all duration-300"
              >
                ➕ Add Entry
              </button>
            </div>
            {/* Add/Edit Entry Modal */}
            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingEntry(null); }} title={editingEntry ? "Edit Journal Entry" : "New Journal Entry"}>
              <input
                type="text"
                placeholder="Entry Title"
                value={entryTitle}
                onChange={e => setEntryTitle(e.target.value)}
                style={{ width: '100%', borderRadius: 8, padding: 12, border: '1px solid #D5CFE1', color: darkMode ? '#A09ABC' : '#6C63A6', marginBottom: 12, fontSize: 16, background: darkMode ? '#23234a' : '#f8f6fa' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <input
                  type="date"
                  value={entryDate}
                  onChange={e => setEntryDate(e.target.value)}
                  style={{ borderRadius: 6, border: '1px solid #D5CFE1', padding: '8px 12px', color: darkMode ? '#A09ABC' : '#6C63A6', background: darkMode ? '#23234a' : '#f8f6fa', fontSize: 15 }}
                />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                  {moodOptions.map(mood => (
                    <span
                      key={mood}
                      style={{ fontSize: 28, cursor: 'pointer', filter: selectedMood === mood ? 'drop-shadow(0 0 4px #7c3aed)' : 'none', opacity: selectedMood === mood ? 1 : 0.6 }}
                      onClick={() => setSelectedMood(mood)}
                    >
                      {mood}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <button style={{ background: '#A09ABC', color: '#fff', border: 'none', borderRadius: 6, padding: 8, fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>A</button>
                <button
                  style={{ background: darkMode ? '#23234a' : '#f8f6fa', color: '#A09ABC', border: 'none', borderRadius: 6, padding: 8, fontSize: 18, cursor: 'pointer' }}
                  onClick={() => setEmojiModalOpen(true)}
                  type="button"
                >😊</button>
                <button style={{ background: darkMode ? '#23234a' : '#f8f6fa', color: '#A09ABC', border: 'none', borderRadius: 6, padding: 8, fontSize: 18, cursor: 'pointer' }}>📝</button>
                <button
                  style={{ background: darkMode ? '#23234a' : '#f8f6fa', color: '#A09ABC', border: 'none', borderRadius: 6, padding: 8, fontSize: 18, cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer', opacity: undoStack.length === 0 ? 0.5 : 1 }}
                  onClick={handleUndo}
                  type="button"
                  disabled={undoStack.length === 0}
                >↺</button>
                <button
                  style={{ background: darkMode ? '#23234a' : '#f8f6fa', color: '#A09ABC', border: 'none', borderRadius: 6, padding: 8, fontSize: 18, cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer', opacity: redoStack.length === 0 ? 0.5 : 1 }}
                  onClick={handleRedo}
                  type="button"
                  disabled={redoStack.length === 0}
                >↻</button>
              </div>
              <textarea
                ref={textareaRef}
                value={newEntry}
                onChange={handleEntryChange}
                placeholder="Write your thoughts here..."
                rows={5}
                style={{ width: '100%', borderRadius: 8, padding: 12, border: '1px solid #D5CFE1', color: darkMode ? '#A09ABC' : '#6C63A6', marginBottom: 16, resize: 'none', fontSize: 16, background: darkMode ? '#23234a' : '#f8f6fa' }}
              />
              <div style={switchContainer}>
                <span style={{ ...switchLabel, color: darkMode ? '#A09ABC' : '#6C63A6' }}>{isPublic ? '🌍 Public' : '🔒 Private'}</span>
                <div style={{ ...switchOuter, background: isPublic ? 'linear-gradient(90deg, #A09ABC 0%, #B6A6CA 100%)' : (darkMode ? '#23234a' : '#e5e7eb') }} onClick={() => setIsPublic(v => !v)}>
                  <div style={switchInner}></div>
                </div>
              </div>
              <button
                onClick={saveEntry}
                style={{ width: '100%', padding: '10px 0', borderRadius: 8, background: 'linear-gradient(90deg, #A09ABC 0%, #B6A6CA 100%)', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', boxShadow: '0 2px 8px #D5CFE1', cursor: 'pointer' }}
              >
                {editingEntry ? 'Save Changes' : 'Save Entry'}
              </button>
            </Modal>
            {entries.length === 0 ? (
              <div className={`${darkMode ? 'text-[#A09ABC] bg-[#23234a]' : 'text-[#6C63A6] bg-white/60'} text-center p-8 rounded-xl backdrop-blur-md border ${darkMode ? 'border-[#23234a]' : 'border-white/30'}`}>
                No entries yet. Start writing above! ✍️
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry, idx) => (
                  <div key={entry.id} className={`${darkMode ? 'bg-[#23234a] text-[#A09ABC] border-[#23234a]' : 'bg-white/70 text-[#6C63A6] border-white/30'} rounded-xl p-6 shadow border backdrop-blur-md relative`}>
                    <div className="flex justify-between items-center mb-3">
                      <div style={{ fontWeight: 700, fontSize: 20, color: darkMode ? '#A09ABC' : '#7c3aed' }}>
                        {entry.title && entry.title.trim() !== '' ? entry.title : `Entry #${entries.length - idx}`}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{new Date(entry.created_at).toLocaleString()}</span>
                        {entry.public && <span className="bg-[#A09ABC] text-white px-2 py-1 rounded-full text-xs">🌍 Public</span>}
                        {!entry.public && <span className="bg-gray-300 text-[#6C63A6] px-2 py-1 rounded-full text-xs">🔒 Private</span>}
                        <button
                          onClick={() => openEditEntryModal(entry)}
                          className="text-blue-500 hover:text-blue-700 transition-colors ml-2"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {entry.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      {/* Emoji Picker Modal rendered as a sibling, not a child of the main modal */}
      <Modal isOpen={emojiModalOpen} onClose={() => setEmojiModalOpen(false)} title="Pick an Emoji" style={{ minWidth: 400, maxWidth: 500, background: darkMode ? '#23234a' : undefined }} noBlur={true}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {emojiCategories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setActiveEmojiCategory(cat.name)}
              style={{
                background: activeEmojiCategory === cat.name ? '#A09ABC' : (darkMode ? '#23234a' : '#f8f6fa'),
                color: activeEmojiCategory === cat.name ? '#fff' : '#A09ABC',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: activeEmojiCategory === cat.name ? '0 2px 8px #D5CFE1' : 'none',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {emojiCategories.find(cat => cat.name === activeEmojiCategory)?.emojis.map(emoji => (
            <span
              key={emoji}
              style={{ fontSize: 28, cursor: 'pointer' }}
              onClick={() => insertEmoji(emoji)}
            >
              {emoji}
            </span>
          ))}
        </div>
      </Modal>
    </>
  );
}