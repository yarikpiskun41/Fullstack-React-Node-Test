import React, {useState, useEffect} from "react";
import axios, {AxiosError} from "axios";
import "./App.css";
import AddForm from "./components/forms/add.form.tsx";
import EditForm from "./components/forms/edit.form.tsx";
import {TaskType} from "./types/task.type.ts";
import {toast} from "react-toastify";
import {User} from "./types/user.type.ts";
import LoginForm from "./components/forms/login.form.tsx";
import RegisterForm from "./components/forms/register.form.tsx";

const API_URL = import.meta.env.VITE_API_URL;
const statuses = [
  {value: "backlog", label: "Backlog"},
  {value: "in-progress", label: "In Progress"},
  {value: "closed", label: "Closed"}
];

type ModalType = "add" | "edit" | "delete" | "login" | "register";


const App: React.FC = () => {

  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [task, setTask] = useState<TaskType>({title: "", description: "", status: ""});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<string[]>([]);

  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refreshToken"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (accessToken && refreshToken) {
      const user = JSON.parse(atob(accessToken.split(" ")[1].split(".")[1]));
      setUser(user);
    }
  }, []);

  useEffect(() => {
    if (accessToken && refreshToken) {
      fetchTasks();
    }
  }, [accessToken]);

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

  const apiRequest = async (method: string, url: string, data?: any) => {
    let token = accessToken;
    if (user?.exp && user.exp * 1000 < Date.now()) {
      console.log("Token expired, refreshing...");
      const newToken = await refreshAccessToken();
      if (newToken) {
        token = newToken;
      }
    }
    try {
      const response = await axios({
        method,
        url: `${API_URL}${url}`,
        data,
        headers: {Authorization: `${token}`},
      });
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return axios({
            method,
            url: `${API_URL}${url}`,
            data,
            headers: {Authorization: `${newToken}`},
          });
        }
      }
      throw axiosError;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {refreshToken});
      const newAccessToken = response.data.data.accessToken;
      setAccessToken(newAccessToken);
      localStorage.setItem("accessToken", newAccessToken);
      return newAccessToken;
    } catch (error) {
      handleLogout();
      toast.error("Session expired. Please log in again.");
      return null;
    }
  };


  const fetchTasks = async () => {
    try {
      const response = await apiRequest("get", "/tasks");
      setTasks(response.data.data || []);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || "Failed to fetch tasks.");
    }
  };

  const validateAuthForm = (): boolean => {
    const newErrors = [...errors];
    if (!username.trim()) newErrors.push("Username is required");
    if (username.length < 3 || username.length > 40) newErrors.push("Username must be 3-40 characters");

    if (!password.trim()) newErrors.push("Password is required");
    else if (password.length < 6) newErrors.push("Password must be at least 6 characters");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const initUser = ({accessToken, refreshToken}: { accessToken: string; refreshToken: string }) => {
    const user = JSON.parse(atob(accessToken.split(" ")[1].split(".")[1]));
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setUser(user);
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAuthForm()) return;

    try {
      const response = await axios.post(`${API_URL}/auth/sign-up`, {username, password});
      const {accessToken, refreshToken} = response.data.data;
      initUser({accessToken, refreshToken});
      toast.success("Registration successful!");
      closeModal();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || "Failed to register.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAuthForm()) return;

    try {
      const response = await axios.post(`${API_URL}/auth/sign-in`, {username, password});
      const {accessToken, refreshToken} = response.data.data;
      initUser({accessToken, refreshToken});
      toast.success(`Logged in successful!`);
      closeModal();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || "Failed to log in.");
    }
  };

  const handleLogout = () => {
    axios
      .post(`${API_URL}/auth/sign-out`, {refreshToken})
      .then(() => {
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        setTasks([]);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        toast.success("Logged out successfully!");
      })
      .catch(() => toast.error("Error logging out"));
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

  const openModal = (type: ModalType, task?: TaskType) => {
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
    setUsername("");
    setPassword("");
    resetForm();
  };

  const validateForm = (): boolean => {
    let newErrors = [...errors];
    if (!task.title.trim()) {
      newErrors?.push("Title is required");
    } else {
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
        const response = await apiRequest("POST", `${API_URL}/tasks`, {
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
      const response = await apiRequest("PUT", `/tasks/${task.id}`, {
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
      await apiRequest("DELETE", `/tasks/${task.id}`);
      setTasks(tasks.filter((currentTask) => currentTask.id !== task.id));
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
        {user ? (
          <div className="user-actions">
            <span>Welcome, {user.username}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-actions">
            <button onClick={() => openModal("login")}>Login</button>
            <button onClick={() => openModal("register")}>Register</button>
          </div>
        )}
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
          <button className="add-btn" onClick={() => openModal("add")}>
            + Add Task
          </button>
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
            {
              modalType === "login" && (
                <>
                  <h2>Login</h2>
                  <LoginForm loginHandle={handleLogin} setUsername={setUsername} setPassword={setPassword}
                             closeModal={closeModal} username={username} password={password}/>
                </>
              )
            }
            {
              modalType === "register" && (
                <>
                  <h2>Register</h2>
                  <RegisterForm registerHandle={handleRegister} setUsername={setUsername} setPassword={setPassword}
                                closeModal={closeModal} username={username} password={password}/>
                </>
              )
            }
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