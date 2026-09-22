import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function getInitials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Project() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [organization, setOrganization] = useState(null);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);

  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [showAssignees, setShowAssignees] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    assigned_to: "",
  });

  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [addingComment, setAddingComment] = useState({});

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [askingAI, setAskingAI] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const [projectSummary, setProjectSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [showAITaskGenerator, setShowAITaskGenerator] = useState(false);
  const [aiTaskRequirement, setAiTaskRequirement] = useState("");
  const [generatingAITasks, setGeneratingAITasks] = useState(false);
  const [generatedAITasks, setGeneratedAITasks] = useState([]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError("");

      // Get organizations
      const organizationResponse = await api.get("/organizations");

      const organizations = organizationResponse.data.organizations || [];

      if (organizations.length === 0) {
        setError("No organization found.");
        return;
      }

      const currentOrganization = organizations[0];

      setOrganization(currentOrganization);

      // Get project
      const projectResponse = await api.get(
        `/organizations/${currentOrganization.id}/projects/${projectId}`,
      );

      setProject(projectResponse.data.project);

      // Get tasks
      const tasksResponse = await api.get(`/projects/${projectId}/tasks`);

      setTasks(tasksResponse.data.tasks || []);

      // Get organization members
      const membersResponse = await api.get(
        `/organizations/${currentOrganization.id}/members`,
      );

      setMembers(membersResponse.data.members || []);
    } catch (error) {
      console.error("Project error:", error);

      setError(error.response?.data?.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const filteredMembers = useMemo(() => {
    const search = assigneeSearch.toLowerCase().trim();

    if (!search) {
      return members;
    }

    return members.filter(
      (member) =>
        member.name?.toLowerCase().includes(search) ||
        member.email?.toLowerCase().includes(search),
    );
  }, [members, assigneeSearch]);

  const selectedAssignee = members.find(
    (member) =>
      Number(member.user_id || member.id) === Number(formData.assigned_to),
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "MEDIUM",
      assigned_to: "",
    });

    setAssigneeSearch("");
    setShowAssignees(false);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      await api.post(`/projects/${projectId}/tasks`, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      });

      resetForm();
      setShowCreate(false);

      await loadProject();
    } catch (error) {
      console.error("Create task error:", error);

      setError(error.response?.data?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const openEditTask = (task) => {
    setSelectedTask(task);

    setFormData({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "MEDIUM",
      assigned_to: task.assigned_to || "",
    });

    const assignedMember = members.find(
      (member) =>
        Number(member.user_id || member.id) === Number(task.assigned_to),
    );

    setAssigneeSearch(assignedMember?.name || "");

    setShowEdit(true);
  };

  const handleEditTask = async (e) => {
    e.preventDefault();

    if (!selectedTask || !formData.title.trim()) {
      return;
    }

    try {
      setEditing(true);
      setError("");

      await api.patch(`/projects/${projectId}/tasks/${selectedTask.id}`, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      });

      resetForm();
      setShowEdit(false);
      setSelectedTask(null);

      await loadProject();
    } catch (error) {
      console.error("Edit task error:", error);

      setError(error.response?.data?.message || "Failed to update task");
    } finally {
      setEditing(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      setError("");

      await api.patch(`/projects/${projectId}/tasks/${taskId}`, {
        status,
      });

      await loadProject();
    } catch (error) {
      console.error("Status update error:", error);

      setError(error.response?.data?.message || "Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`/projects/${projectId}/tasks/${taskId}`);

      await loadProject();
    } catch (error) {
      console.error("Delete task error:", error);

      setError(error.response?.data?.message || "Failed to delete task");
    }
  };

  const selectAssignee = (member) => {
    const memberId = member.user_id || member.id;

    setFormData({
      ...formData,
      assigned_to: memberId,
    });

    setAssigneeSearch(member.name);
    setShowAssignees(false);
  };

  const clearAssignee = () => {
    setFormData({
      ...formData,
      assigned_to: "",
    });

    setAssigneeSearch("");
  };

  const loadComments = async (taskId) => {
    try {
      setLoadingComments((prev) => ({
        ...prev,
        [taskId]: true,
      }));

      const response = await api.get(`/tasks/${taskId}/comments`);

      setComments((prev) => ({
        ...prev,
        [taskId]: response.data.comments || [],
      }));
    } catch (error) {
      console.error("Load comments error:", error);

      setError(error.response?.data?.message || "Failed to load comments");
    } finally {
      setLoadingComments((prev) => ({
        ...prev,
        [taskId]: false,
      }));
    }
  };

  const handleGenerateSummary = async () => {
    try {
      setLoadingSummary(true);
      setProjectSummary("");

      const response = await api.post(`/ai/projects/${projectId}/summary`);

      setProjectSummary(
        response.data.summary ||
          response.data.answer ||
          response.data.response ||
          "",
      );

      setShowSummary(true);
    } catch (error) {
      console.error("Project summary error:", error);

      setProjectSummary(
        error.response?.data?.message || "Failed to generate project summary.",
      );

      setShowSummary(true);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleGenerateAITasks = async () => {
    if (!aiTaskRequirement.trim()) return;

    try {
      setGeneratingAITasks(true);
      setGeneratedAITasks([]);

      const response = await api.post(
        `/ai/projects/${projectId}/generate-tasks`,
        {
          requirement: aiTaskRequirement,
        },
      );

      setGeneratedAITasks(response.data.tasks || []);
    } catch (error) {
      console.error("AI task generation error:", error);

      alert(error.response?.data?.message || "Failed to generate tasks.");
    } finally {
      setGeneratingAITasks(false);
    }
  };

  const handleApproveAITasks = async () => {
    if (generatedAITasks.length === 0) return;

    try {
      setGeneratingAITasks(true);

      const response = await api.post(
        `/ai/projects/${projectId}/create-generated-tasks`,
        {
          tasks: generatedAITasks,
        },
      );

      console.log("Created AI tasks:", response.data);

      // Clear generated tasks
      setGeneratedAITasks([]);

      // Clear requirement
      setAiTaskRequirement("");

      // Close modal
      setShowAITaskGenerator(false);

      // Refresh the page so the new tasks appear
      window.location.reload();
    } catch (error) {
      console.error("Approve AI tasks error:", error);

      alert(error.response?.data?.message || "Failed to create tasks.");
    } finally {
      setGeneratingAITasks(false);
    }
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;

    try {
      setAskingAI(true);
      setAiAnswer("");

      const response = await api.post(`/ai/projects/${projectId}/ask`, {
        question: aiQuestion,
      });

      setAiAnswer(
        response.data.answer ||
          response.data.response ||
          JSON.stringify(response.data),
      );
    } catch (error) {
      console.error("Ask AI error:", error);

      setAiAnswer(
        error.response?.data?.message || "Failed to get response from AI.",
      );
    } finally {
      setAskingAI(false);
    }
  };

  const handleAddComment = async (taskId) => {
    const content = commentText[taskId]?.trim();

    if (!content) {
      return;
    }

    try {
      setAddingComment((prev) => ({
        ...prev,
        [taskId]: true,
      }));

      await api.post(`/tasks/${taskId}/comments`, {
        content,
      });

      setCommentText((prev) => ({
        ...prev,
        [taskId]: "",
      }));

      await loadComments(taskId);
    } catch (error) {
      console.error("Add comment error:", error);

      setError(error.response?.data?.message || "Failed to add comment");
    } finally {
      setAddingComment((prev) => ({
        ...prev,
        [taskId]: false,
      }));
    }
  };

  const handleDeleteComment = async (taskId, commentId) => {
    const confirmed = window.confirm("Delete this comment?");

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`);

      await loadComments(taskId);
    } catch (error) {
      console.error("Delete comment error:", error);

      setError(error.response?.data?.message || "Failed to delete comment");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Loading project...</div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-red-500">{error}</p>

          <button
            onClick={() => navigate("/projects")}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center justify-between px-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xl font-bold tracking-tight"
          >
            TeamFlow
          </button>

          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 transition hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed bottom-0 left-0 top-16 hidden w-64 border-r border-slate-200 bg-white p-4 md:block">
        <nav className="space-y-1">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex w-full rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate("/projects")}
            className="flex w-full rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-900"
          >
            Projects
          </button>

          <button
            onClick={() => navigate("/members")}
            className="flex w-full rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Members
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="ml-0 pt-16 md:ml-64">
        <div className="mx-auto max-w-7xl p-6 md:p-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/projects")}
              className="text-slate-400 transition hover:text-slate-900"
            >
              Projects
            </button>

            <span className="text-slate-300">/</span>

            <span className="font-medium text-slate-700">{project.name}</span>
          </div>

          {/* Project header */}
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <p className="mb-2 text-sm font-medium text-indigo-600">
                  {organization?.name}
                </p>

                <h1 className="text-3xl font-bold tracking-tight">
                  {project.name}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {project.description || "No project description available."}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAiAnswer("");
                    setShowAI(true);
                  }}
                  className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  ✨ Ask AI
                </button>

                <button
                  onClick={handleGenerateSummary}
                  disabled={loadingSummary}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingSummary ? "Generating..." : "📊 Summary"}
                </button>

                <button
                  onClick={() => setShowCreate(true)}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  + New task
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Task statistics */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Total tasks</p>

              <p className="mt-2 text-2xl font-bold">{tasks.length}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Todo</p>

              <p className="mt-2 text-2xl font-bold">
                {tasks.filter((task) => task.status === "TODO").length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">In progress</p>

              <p className="mt-2 text-2xl font-bold">
                {tasks.filter((task) => task.status === "IN_PROGRESS").length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Completed</p>

              <p className="mt-2 text-2xl font-bold">
                {tasks.filter((task) => task.status === "DONE").length}
              </p>
            </div>
          </div>

          {/* Tasks */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="font-semibold">Tasks</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tasks belonging to this project.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {tasks.length}
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-slate-500">No tasks yet.</p>

                <button
                  onClick={() => {
                    resetForm();
                    setShowCreate(true);
                  }}
                  className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Create first task
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tasks.map((task) => {
                  const assignedMember = members.find(
                    (member) =>
                      Number(member.user_id || member.id) ===
                      Number(task.assigned_to),
                  );

                  return (
                    <div
                      key={task.id}
                      className="px-6 py-5 transition hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900">
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {task.description}
                            </p>
                          )}

                          {assignedMember && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                                {getInitials(assignedMember.name)}
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-slate-700">
                                  {assignedMember.name}
                                </p>

                                <p className="text-[11px] text-slate-400">
                                  Assignee
                                </p>
                              </div>
                            </div>
                          )}

                          {!assignedMember && (
                            <p className="mt-3 text-xs text-slate-400">
                              Unassigned
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task.id, e.target.value)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none"
                          >
                            <option value="TODO">Todo</option>

                            <option value="IN_PROGRESS">In Progress</option>

                            <option value="DONE">Done</option>
                          </select>

                          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                            {task.priority}
                          </span>

                          <button
                            onClick={() => openEditTask(task)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-700">
                            Comments
                          </h4>

                          <button
                            onClick={() => loadComments(task.id)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            {comments[task.id] ? "Refresh" : "Load comments"}
                          </button>
                        </div>

                        {loadingComments[task.id] ? (
                          <p className="text-xs text-slate-400">
                            Loading comments...
                          </p>
                        ) : comments[task.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {comments[task.id].map((comment) => (
                              <div
                                key={comment.id}
                                className="rounded-xl bg-slate-50 p-4"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                                      {getInitials(comment.user_name)}
                                    </div>

                                    <div>
                                      <p className="text-xs font-semibold text-slate-800">
                                        {comment.user_name}
                                      </p>

                                      <p className="mt-1 text-sm leading-6 text-slate-600">
                                        {comment.content}
                                      </p>

                                      {comment.created_at && (
                                        <p className="mt-1 text-[10px] text-slate-400">
                                          {new Date(
                                            comment.created_at,
                                          ).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() =>
                                      handleDeleteComment(task.id, comment.id)
                                    }
                                    className="text-xs font-medium text-slate-400 hover:text-red-500"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : comments[task.id] ? (
                          <p className="text-xs text-slate-400">
                            No comments yet.
                          </p>
                        ) : null}

                        <div className="mt-4 flex gap-2">
                          <input
                            type="text"
                            value={commentText[task.id] || ""}
                            onChange={(e) =>
                              setCommentText((prev) => ({
                                ...prev,
                                [task.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddComment(task.id);
                              }
                            }}
                            placeholder="Write a comment..."
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          />

                          <button
                            onClick={() => handleAddComment(task.id)}
                            disabled={
                              addingComment[task.id] ||
                              !commentText[task.id]?.trim()
                            }
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {addingComment[task.id] ? "Adding..." : "Add"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* AI Assistant Modal */}
      {showAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  ✨ AI Assistant
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Ask anything about this project.
                </p>
              </div>

              <button
                onClick={() => setShowAI(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAskAI();
                  }
                }}
                placeholder="e.g. What tasks are still pending?"
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowAI(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAskAI}
                  disabled={askingAI || !aiQuestion.trim()}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {askingAI ? "Thinking..." : "Ask AI"}
                </button>
              </div>

              {/* Answer */}
              {aiAnswer && (
                <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    AI Response
                  </p>

                  <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {aiAnswer.split(/(\*\*.*?\*\*)/g).map((part, index) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                          <strong
                            key={index}
                            className="font-semibold text-slate-900"
                          >
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }

                      return <span key={index}>{part}</span>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  📊 Project Summary
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  AI-generated overview of your project's current state.
                </p>
              </div>

              <button
                onClick={() => setShowSummary(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Summary */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {loadingSummary ? (
                <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
                  Generating project summary...
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {projectSummary
                      .split(/(\*\*.*?\*\*)/g)
                      .map((part, index) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return (
                            <strong
                              key={index}
                              className="font-semibold text-slate-900"
                            >
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }

                        return <span key={index}>{part}</span>;
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setShowSummary(false)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreate || showEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-bold">
                {showEdit ? "Edit task" : "Create new task"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {showEdit
                  ? "Update task details and assignment."
                  : "Add a task to this project."}
              </p>
            </div>

            <form
              onSubmit={showEdit ? handleEditTask : handleCreateTask}
              className="space-y-5 p-6"
            >
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Task title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Build authentication API"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the task..."
                  rows="3"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Priority
                </label>

                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="LOW">Low</option>

                  <option value="MEDIUM">Medium</option>

                  <option value="HIGH">High</option>
                </select>
              </div>

              {/* Assignee */}
              <div className="relative">
                <label className="mb-2 block text-sm font-medium">
                  Assignee
                </label>

                <input
                  type="text"
                  value={assigneeSearch}
                  onChange={(e) => {
                    setAssigneeSearch(e.target.value);

                    setFormData({
                      ...formData,
                      assigned_to: "",
                    });

                    setShowAssignees(true);
                  }}
                  onFocus={() => setShowAssignees(true)}
                  placeholder="Search team member..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                {/* Assignee dropdown */}
                {showAssignees && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {filteredMembers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No members found.
                      </div>
                    ) : (
                      filteredMembers.map((member) => {
                        const memberId = member.user_id || member.id;

                        return (
                          <button
                            type="button"
                            key={memberId}
                            onClick={() => selectAssignee(member)}
                            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                              {getInitials(member.name)}
                            </div>

                            <div>
                              <p className="text-sm font-semibold">
                                {member.name}
                              </p>

                              <p className="text-xs text-slate-500">
                                {member.email}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Selected assignee */}
                {selectedAssignee && (
                  <button
                    type="button"
                    onClick={clearAssignee}
                    className="mt-2 text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    Remove assignee
                  </button>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setShowEdit(false);
                    setSelectedTask(null);
                    resetForm();
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating || editing}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating || editing
                    ? "Saving..."
                    : showEdit
                      ? "Save changes"
                      : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Project;
