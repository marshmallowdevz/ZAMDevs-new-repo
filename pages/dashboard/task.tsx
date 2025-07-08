import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Sidebar from "../../components/Sidebar";
import { useDarkMode } from "../../components/DarkModeContext";
import { FaCog, FaPlus, FaUserCircle } from "react-icons/fa";
import Head from "next/head";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const STATUS_COLUMNS = [
  { key: "todo", label: "To Do", color: "bg-[#E5C6F7]", card: "bg-[#F3E6FF]" }, // Light Purple
  { key: "inprogress", label: "In Progress", color: "bg-[#E0C6F7]", card: "bg-[#F6E9FF]" }, // Light Violet
  { key: "done", label: "Done", color: "bg-[#BE93D4]", card: "bg-[#F6E9FF]" }, // Light Periwinkle
];

export default function TaskPage() {
  const { darkMode } = useDarkMode();
  const [collapsed, setCollapsed] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newStatus, setNewStatus] = useState("todo");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusWarning, setStatusWarning] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setError(null);
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return;
    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError("Failed to fetch tasks: " + fetchError.message);
      return;
    }
    setTasks(data || []);
    // Check if status column exists
    if (data && data.length > 0 && data[0].status === undefined) {
      setStatusWarning(true);
    } else {
      setStatusWarning(false);
    }
  }

  async function addTask() {
    setError(null);
    if (!newTask.trim()) return;
    setAdding(true);
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
      setError("Not authenticated");
      setAdding(false);
      return;
    }
    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert([{ description: newTask, completed: false, user_id: session.user.id, status: newStatus }])
      .select();
    if (insertError) {
      setError("Failed to add task: " + insertError.message);
      setAdding(false);
      return;
    }
    if (data) {
      setTasks([data[0], ...tasks]);
      setNewTask("");
      setNewStatus("todo");
    }
    setAdding(false);
  }

  async function updateTaskStatus(id: string, status: string) {
    setError(null);
    const { error: updateError } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (updateError) {
      setError("Failed to update task status: " + updateError.message);
    }
    fetchTasks();
  }

  async function toggleTask(id: string, completed: boolean) {
    setError(null);
    const { error: toggleError } = await supabase.from("tasks").update({ completed: !completed }).eq("id", id);
    if (toggleError) {
      setError("Failed to toggle task: " + toggleError.message);
    }
    fetchTasks();
  }

  async function deleteTask(id: string) {
    setError(null);
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);
    if (deleteError) {
      setError("Failed to delete task: " + deleteError.message);
    }
    setTasks(tasks.filter(task => task.id !== id));
  }

  // Drag and drop handler
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const sourceCol = result.source.droppableId;
    const destCol = result.destination.droppableId;
    if (sourceCol !== destCol) {
      const taskId = result.draggableId;
      // Optimistically update UI
      const prevTasks = [...tasks];
      setTasks(tasks.map(task =>
        String(task.id) === taskId ? { ...task, status: destCol } : task
      ));
      // Update backend
      const { error: updateError } = await supabase.from("tasks").update({ status: destCol }).eq("id", taskId);
      if (updateError) {
        setError("Failed to update task status: " + updateError.message);
        setTasks(prevTasks); // revert UI
      }
    }
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gradient-to-br from-[#E1D8E9] via-[#D5CFE1] to-[#B6A6CA]'}`}>
      <Head>
        <title>Task Manager | Reflectly</title>
      </Head>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`flex-1 p-8 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className={`text-3xl font-bold ${darkMode ? 'text-[#A09ABC]' : 'text-[#A09ABC]'}`}>📝 Task Manager</h2>
        </div>
        {statusWarning && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-300">
            <b>Warning:</b> Your tasks table is missing the <code>status</code> column. Please add a <code>status</code> (text) column in Supabase for Kanban to work.
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 border border-red-300">
            <b>Error:</b> {error}
          </div>
        )}
        {/* Add Task */}
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-white/70 text-[#6C63A6]'} focus:outline-none focus:ring-2 focus:ring-[#A09ABC]`}
          />
          <select
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            className={`px-3 py-2 rounded-lg ${darkMode ? 'bg-[#23234a] text-[#A09ABC]' : 'bg-white/70 text-[#6C63A6]'} border border-[#A09ABC]/30`}
          >
            {STATUS_COLUMNS.map(col => (
              <option key={col.key} value={col.key}>{col.label}</option>
            ))}
          </select>
          <button
            onClick={addTask}
            disabled={adding || !newTask.trim()}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold shadow transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#A09ABC]/30
              ${adding || !newTask.trim() ? 'opacity-60 cursor-not-allowed' : ''}
              bg-gradient-to-r from-[#A09ABC] via-[#B6A6CA] to-[#D5CFE1] text-white hover:from-[#B6A6CA] hover:to-[#A09ABC] animate-pulse`}
          >
            <FaPlus /> Add
          </button>
        </div>
        {/* Kanban Board with Drag and Drop */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto w-full">
            {STATUS_COLUMNS.map((col, colIdx) => (
              <Droppable droppableId={col.key} key={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-2xl p-4 shadow-xl min-h-[300px] flex flex-col transition-all duration-300
                      ${darkMode ? 'bg-[#23234a]' : col.color}
                      ${snapshot.isDraggingOver ? 'ring-4 ring-[#A09ABC]/40 scale-105' : ''}
                      ${colIdx === 0 && collapsed ? 'pl-8' : ''}`}
                  >
                    <div className={`flex items-center gap-2 mb-4 text-lg font-bold ${darkMode ? 'text-[#A09ABC]' : 'text-white'}`}>{col.label}</div>
                    <div className="space-y-4 flex-1">
                      {tasks.filter(task => (task.status || "todo") === col.key).length === 0 && (
                        <div className={`text-center italic ${darkMode ? 'text-[#A09ABC]' : 'text-white/80'}`}>No tasks</div>
                      )}
                      {tasks.filter(task => (task.status || "todo") === col.key).map((task, idx) => (
                        <Draggable draggableId={String(task.id)} index={idx} key={task.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`rounded-xl p-6 shadow border flex items-center transition-all duration-200 w-full min-h-[70px] text-lg ${darkMode ? '' : `${col.card} border-white/30 text-[#6C63A6]`} ${snapshot.isDragging ? 'ring-4 ring-[#A09ABC]/40 scale-105' : ''}`}
                            >
                              <span className="flex items-center gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => toggleTask(task.id, task.completed)}
                                  className="h-5 w-5 text-[#A09ABC] accent-[#A09ABC]"
                                />
                                <span className={`font-semibold ${task.completed ? 'line-through opacity-60' : ''}`}>{task.description}</span>
                              </span>
                              <div className="flex items-center gap-3 ml-auto">
                                <span className={`text-base px-4 py-1 rounded-full ${col.key === 'done' ? 'bg-green-200 text-green-700' : col.key === 'inprogress' ? 'bg-blue-200 text-blue-700' : 'bg-[#A09ABC]/20 text-[#A09ABC]'}`}>{col.label}</span>
                                <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:scale-110 transition-transform text-xl" title="Delete Task">🗑️</button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}