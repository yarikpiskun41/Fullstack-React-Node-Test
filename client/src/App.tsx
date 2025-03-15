import React, {useState, useEffect} from "react";
import axios from "axios";
import "./App.css";
import AddForm from "./components/forms/add.form.tsx";
import EditForm from "./components/forms/edit.form.tsx";
import {TaskType} from "./types/task.type.ts";
import {toast} from "react-toastify";

const API_URL = "http://localhost:5000/api/tasks";
const statuses = [
  {value: "backlog", label: "Backlog"},
  {value: "in-progress", label: "In Progress"},
  {value: "closed", label: "Closed"}
];


const App: React.FC = () => {


  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [modalType, setModalType] = useState<"add" | "edit" | "delete" | null>(null);
  const [task, setTask] = useState<TaskType>({title: "", description: "", status: ""});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const newErrors = [...errors];
    if (newErrors?.length) {
      while (newErrors.length) {
        toast.error(newErrors.pop());
      }
      setErrors([]);
    }

  }, [errors]);


  const toggleDescription = (taskId: number, event: React.MouseEvent) => {
    event.currentTarget.scrollTo(0, 0);
    setExpandedDescriptions((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };


  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_URL);
      setTasks(response.data.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };


  const onTaskChange = <K extends keyof TaskType>({field, fieldValue}: { field: K; fieldValue: TaskType[K] }) => {
    if (!task) setTask({} as TaskType);
    setTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]:
        fieldValue,
      }
    });
  }

  const openModal = (type: "add" | "edit" | "delete", task?: TaskType) => {
    setModalType(type);
    if (type === "add") {
      resetForm();
    }
    if (type === "edit" && task) {
      setTask(task);
    }
    if (type === "delete" && task) {
      setTask(task);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setTask({title: "", description: "", status: ""});
    resetForm();
  };

  const validateForm = (): boolean => {
    let newErrors = [...errors];
    if (!task.title.trim()) {
      newErrors?.push("Title is required");
    }
    else {
      if (task.title.length < 2) {
        newErrors?.push("Title must be at least 2 characters long");

      }
      if (task.title.length > 255) {
        newErrors?.push("Title cannot exceed 255 characters");
      }
    }



    if (!statuses.find(s => s.value === task.status)) {
      newErrors?.push("Invalid status");
    }

    setErrors(newErrors);
    return !newErrors || !newErrors?.length;
  };

  const addTask = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (!validateForm()) return;
        const response = await axios.post(API_URL, {
          title: task?.title,
          description: task?.description,
          status: task?.status
        });
        setTasks([...tasks, response.data.data]);
        closeModal();
      } catch (error) {
        console.error("Error adding task:", error);
      }
    }
  ;

  const updateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!validateForm()) return;
      const response = await axios.put(`${API_URL}/${task.id}`, {
        title: task.title,
        description: task.description,
        status: task.status,
      });


      setTasks(tasks.map((currentTask) => (currentTask.id === task.id ? response.data.data : currentTask)));
      closeModal();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async () => {
    if (!task) return;
    try {
      await axios.delete(`${API_URL}/${task.id}`);
      setTasks(tasks.filter((task) => task.id !== task.id));
      closeModal();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const resetForm = () => {
    setTask({
      title: "",
      description: "",
      status: "backlog",
    })
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Manager</h1>
        <button className="add-btn" onClick={() => openModal("add")}>
          + Add Task
        </button>
      </header>

      <main className="task-container">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Statuses</option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <p className="no-tasks">No tasks found. Adjust your search or add a new task!</p>
        ) : (
          <div className="task-grid">
            {filteredTasks.map((task) => (
              <div key={task.id} className={`task-card ${task.status}`}>
                <h3>{task.title}</h3>
                {task.description && (
                  <>
                    <div
                      className={`description ${expandedDescriptions[task.id || -1] ? "expanded" : ""}`}
                      onClick={(e) => task.description && toggleDescription(task.id || -1, e)}
                    >
                      {task.description || "No description"}
                    </div>
                  </>
                )}
                <span className="status-badge">{task.status}</span>
                <div className="task-actions">
                  <button onClick={() => openModal("edit", task)}>Edit</button>
                  <button onClick={() => openModal("delete", task)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalType && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {modalType === "add" && (
              <>
                <h2>Add New Task</h2>
                <AddForm addTask={addTask} setTask={onTaskChange} closeModal={closeModal} task={task}
                         statuses={statuses}/>
              </>
            )}

            {
              modalType === "edit" && task && (
                <>
                  <h2>Edit Task</h2>
                  <EditForm editTask={updateTask} setTask={onTaskChange} closeModal={closeModal} task={task}
                            statuses={statuses}/>
                </>
              )}

            {modalType === "delete" && task && (
              <>
                <h2>Delete Task</h2>
                <p>Are you sure you want to delete "{task.title}"?</p>
                <div className="modal-actions">
                  <button className="delete-confirm" onClick={deleteTask}>
                    Yes, Delete
                  </button>
                  <button onClick={closeModal}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;