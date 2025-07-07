import { useEffect, useState, useContext } from "react";
import { supabase } from "../../lib/supabaseClient";
import { TransitionContext } from "../_app";

export default function TaskPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");
  const { showContent } = useContext(TransitionContext);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return;

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setTasks(data || []);
  }

  async function addTask() {
    if (!newTask.trim()) return;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return;

    const { data } = await supabase
      .from("tasks")
      .insert([{ description: newTask, completed: false, user_id: session.user.id }])
      .select();

    if (data) {
      setTasks([data[0], ...tasks]);
      setNewTask("");
    }
  }

  async function toggleTask(id: string, completed: boolean) {
    await supabase.from("tasks").update({ completed: !completed }).eq("id", id);
    fetchTasks();
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(tasks.filter(task => task.id !== id));
  }

  return (
    <div className={`max-w-3xl mx-auto p-6 min-h-screen transition-all duration-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      <h2 className="text-3xl font-bold text-[#A09ABC] mb-6">📝 Task Manager</h2>

      {/* Add Task */}
      <div className="mb-6 flex gap-4 items-center">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-2 rounded-lg bg-white/70 text-[#6C63A6] focus:outline-none focus:ring-2 focus:ring-[#A09ABC]"
        />
        <button
          onClick={addTask}
          className="px-5 py-2 rounded-full bg-gradient-to-r from-[#A09ABC] to-[#B6A6CA] text-white font-bold shadow hover:from-[#B6A6CA] hover:to-[#A09ABC] transition"
        >
          ➕ Add
        </button>
      </div>

      {/* Task List */}
      <ul className="space-y-3">
        {tasks.map(task => (
          <li key={task.id} className="flex items-center justify-between bg-white/60 p-4 rounded-xl shadow border border-white/30">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id, task.completed)}
                className="h-5 w-5 text-[#A09ABC]"
              />
              <span className={`text-[#6C63A6] ${task.completed ? 'line-through opacity-60' : ''}`}>
                {task.description}
              </span>
            </div>
            <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:underline">🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
