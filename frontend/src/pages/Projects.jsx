import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Projects() {
  const navigate = useNavigate();

  const [organization, setOrganization] = useState(null);
  const [projects, setProjects] = useState([]);

  const [showCreate, setShowCreate] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Mobile sidebar
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const organizationResponse = await api.get("/organizations");

      const organizations = organizationResponse.data.organizations;

      if (organizations.length === 0) {
        setProjects([]);
        return;
      }

      const currentOrganization = organizations[0];

      setOrganization(currentOrganization);

      const projectsResponse = await api.get(
        `/organizations/${currentOrganization.id}/projects`,
      );

      setProjects(projectsResponse.data.projects || []);
    } catch (error) {
      console.error("Projects error:", error);

      setError(error.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      await api.post(`/organizations/${organization.id}/projects`, {
        name: formData.name,
        description: formData.description,
      });

      setFormData({
        name: "",
        description: "",
      });

      setShowCreate(false);

      await loadProjects();
    } catch (error) {
      console.error("Create project error:", error);

      setError(error.response?.data?.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">
        <div className="text-sm text-slate-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
              aria-label="Open navigation"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path d="M4 6h16" strokeLinecap="round" />
                <path d="M4 12h16" strokeLinecap="round" />
                <path d="M4 18h16" strokeLinecap="round" />
              </svg>
            </button>

            {/* Logo */}
            <button
              onClick={() => navigate("/dashboard")}
              className="text-xl font-bold tracking-tight text-blue-600"
            >
              TeamFlow
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 transition hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-16 z-50 w-64 border-r border-slate-200 bg-white p-4 transition-transform duration-200 md:z-20 md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile sidebar header */}
        <div className="mb-4 flex items-center justify-between md:hidden">
          <span className="text-lg font-bold text-slate-900">TeamFlow</span>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-1">
          {/* Dashboard */}
          <button
            onClick={() => handleNavigation("/dashboard")}
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Dashboard
          </button>

          {/* Projects */}
          <button
            onClick={() => handleNavigation("/projects")}
            className="flex w-full items-center rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-900"
          >
            Projects
          </button>

          {/* Members */}
          <button
            onClick={() => handleNavigation("/members")}
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Members
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="ml-0 pt-16 md:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          {/* Heading */}
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-indigo-600">
                {organization?.name}
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Projects
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage and organize your team's projects.
              </p>
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 sm:w-auto"
            >
              + New project
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Projects */}
          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
              <h2 className="text-lg font-semibold text-slate-900">
                No projects yet
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Create your first project to get started.
              </p>

              <button
                onClick={() => setShowCreate(true)}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Create project
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                      {project.name?.charAt(0).toUpperCase()}
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                      Active
                    </span>
                  </div>

                  <h2 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-indigo-600">
                    {project.name}
                  </h2>

                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                    {project.description || "No description available."}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400">
                      Project #{project.id}
                    </span>

                    <span className="text-sm font-medium text-indigo-600">
                      Open →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="my-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Create new project
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a project to your workspace.
              </p>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Project name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. TeamFlow Development"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what this project is about..."
                  rows="4"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
