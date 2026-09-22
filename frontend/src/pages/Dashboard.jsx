import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    dashboard: (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),

    projects: (
      <svg {...common}>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10Z" />
      </svg>
    ),

    users: (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),

    check: (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    ),

    tasks: (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),

    arrow: (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    ),

    plus: (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),

    logout: (
      <svg {...common}>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </svg>
    ),

    chevron: (
      <svg {...common}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    ),
  };

  return icons[name];
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [showCreateOrganization, setShowCreateOrganization] = useState(false);

  const [organizationName, setOrganizationName] = useState("");

  const [creatingOrganization, setCreatingOrganization] = useState(false);
  const [organizationMenuOpen, setOrganizationMenuOpen] = useState(false);

  const navigate = useNavigate();

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const userResponse = await api.get("/auth/me");
      setUser(userResponse.data.user);

      const organizationResponse = await api.get("/organizations");
      const organizationList = organizationResponse.data.organizations || [];

      setOrganizations(organizationList);

      if (organizationList.length === 0) {
        setOrganization(null);
        setProjects([]);
        return;
      }

      const savedOrganizationId = Number(
        localStorage.getItem("teamflowOrganizationId"),
      );

      const savedOrganization = organizationList.find(
        (item) => item.id === savedOrganizationId,
      );

      const currentOrganization = savedOrganization || organizationList[0];

      setOrganization(currentOrganization);
      localStorage.setItem(
        "teamflowOrganizationId",
        String(currentOrganization.id),
      );

      const projectsResponse = await api.get(
        `/organizations/${currentOrganization.id}/projects`,
      );

      setProjects(projectsResponse.data.projects || []);
    } catch (error) {
      console.error("Dashboard error:", error);
      setError(error.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCreateOrganization = async (e) => {
    e.preventDefault();

    if (!organizationName.trim()) {
      return;
    }

    try {
      setCreatingOrganization(true);
      setError("");

      const response = await api.post("/organizations", {
        name: organizationName.trim(),
      });

      const createdOrganization = response.data.organization;

      if (createdOrganization?.id) {
        localStorage.setItem(
          "teamflowOrganizationId",
          String(createdOrganization.id),
        );
      }

      setOrganizationName("");
      setOrganizationMenuOpen(false);
      setShowCreateOrganization(false);

      await loadDashboard();
    } catch (error) {
      console.error("Create organization error:", error);

      setError(error.response?.data?.message || "Failed to create workspace");
    } finally {
      setCreatingOrganization(false);
    }
  };

  const handleSwitchOrganization = async (selectedOrganization) => {
    try {
      if (!selectedOrganization?.id) return;

      setOrganizationMenuOpen(false);
      setLoading(true);
      setError("");

      localStorage.setItem(
        "teamflowOrganizationId",
        String(selectedOrganization.id),
      );

      setOrganization(selectedOrganization);

      const projectsResponse = await api.get(
        `/organizations/${selectedOrganization.id}/projects`,
      );

      setProjects(projectsResponse.data.projects || []);
    } catch (error) {
      console.error("Switch organization error:", error);
      setError(error.response?.data?.message || "Failed to switch workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

          <p className="text-sm text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            !
          </div>

          <h2 className="text-lg font-semibold text-slate-900">
            Something went wrong
          </h2>

          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      {/* ================= TOP BAR ================= */}

      <header className="fixed inset-x-0 top-0 z-30 h-[72px] border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="flex h-full items-center justify-between px-5 lg:px-8">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="Open navigation"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-200">
                T
              </div>

              <span className="text-lg font-bold tracking-tight">TeamFlow</span>
            </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name}
              </p>

              <p className="text-xs text-slate-400">
                {organization?.role || "Member"}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {initials}
            </div>

            <button
              onClick={handleLogout}
              className="hidden rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:block"
              title="Logout"
            >
              <Icon name="logout" size={19} />
            </button>
          </div>
        </div>
      </header>

      {/* ================= MOBILE OVERLAY ================= */}

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`fixed bottom-0 left-0 top-[72px] z-50 w-[240px] border-r border-slate-200/80 bg-white transition-transform duration-200 lg:z-20 lg:block lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-4">
          {/* Mobile close */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="text-sm font-semibold text-slate-700">
              Navigation
            </span>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>

          {/* Workspace switcher */}
          <div className="relative mb-7 rounded-xl bg-slate-50 p-3">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </p>

            {organization ? (
              <>
                <button
                  type="button"
                  onClick={() => setOrganizationMenuOpen((open) => !open)}
                  className="mt-3 flex w-full items-center gap-3 rounded-lg p-1 text-left transition hover:bg-white"
                  aria-expanded={organizationMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-600">
                    {organization.name?.charAt(0)?.toUpperCase() || "W"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {organization.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {organization.role}
                    </p>
                  </div>

                  <span
                    className={`text-slate-500 transition-transform ${
                      organizationMenuOpen ? "rotate-180" : ""
                    }`}
                  >
                    <Icon name="chevron" size={15} />
                  </span>
                </button>

                {organizationMenuOpen && (
                  <div className="absolute left-3 right-3 top-[88px] z-[60] overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60">
                    <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Your workspaces
                    </p>

                    <div className="max-h-52 space-y-1 overflow-y-auto">
                      {organizations.map((item) => {
                        const isActive = item.id === organization.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSwitchOrganization(item)}
                            className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
                              isActive ? "bg-indigo-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                isActive
                                  ? "bg-indigo-100 text-indigo-600"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.name?.charAt(0)?.toUpperCase() || "W"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {item.role}
                              </p>
                            </div>

                            {isActive && (
                              <span className="text-xs font-bold text-indigo-600">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="my-2 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setOrganizationMenuOpen(false);
                        setOrganizationName("");
                        setShowCreateOrganization(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                        <Icon name="plus" size={16} />
                      </div>
                      Create new workspace
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => setShowCreateOrganization(true)}
                className="mt-3 flex w-full items-center gap-3 rounded-lg border border-dashed border-indigo-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Icon name="plus" size={17} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    Create workspace
                  </p>
                  <p className="text-xs text-slate-400">
                    Get started with TeamFlow
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </p>

            <nav className="space-y-1">
              {/* Dashboard */}
              <button
                onClick={() => handleNavigation("/dashboard")}
                className="flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700"
              >
                <Icon name="dashboard" size={18} />
                Dashboard
              </button>

              {/* Projects */}
              <button
                onClick={() => handleNavigation("/projects")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Icon name="projects" size={18} />
                Projects
              </button>

              {/* Members */}
              <button
                onClick={() => handleNavigation("/members")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Icon name="users" size={18} />
                Members
              </button>
            </nav>
          </div>

          {/* Bottom */}
          <div className="mt-auto border-t border-slate-100 pt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <Icon name="logout" size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="pt-[72px] lg:pl-[240px]">
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
          {/* Page heading */}
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-indigo-600">
                {organization?.name || "Welcome to TeamFlow"}
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Good afternoon, {user?.name?.split(" ")[0]}.
              </h1>

              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                {organization
                  ? "Here's an overview of your workspace."
                  : "Create your first workspace to start managing projects with your team."}
              </p>
            </div>

            <button
              onClick={() => {
                if (!organization) {
                  setShowCreateOrganization(true);
                  return;
                }

                navigate("/projects");
              }}
              className="flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <Icon name="plus" size={18} />
              {organization ? "New project" : "Create workspace"}
            </button>
          </div>

          {/* ================= STATS ================= */}

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {/* Projects */}
            <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {organization ? "Total projects" : "Workspace"}
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {organization ? projects.length : "—"}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon name="projects" size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                {organization
                  ? "Active projects in workspace"
                  : "Create a workspace to get started"}
              </p>
            </div>

            {/* Tasks */}
            <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total tasks
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {organization ? "—" : "—"}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Icon name="tasks" size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Task data coming with project view
              </p>
            </div>

            {/* Completed */}
            <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Completed
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    —
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon name="check" size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Completion metrics coming soon
              </p>
            </div>
          </div>

          {/* ================= PROJECTS ================= */}

          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  Your projects
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {organization
                    ? "Projects in your current workspace"
                    : "Create a workspace before creating projects"}
                </p>
              </div>
            </div>

            {!organization ? (
              <div className="rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm sm:p-12">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon name="plus" size={25} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Create your first workspace
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  You're all set with your TeamFlow account. Create a workspace
                  first, then you can create projects and invite your team.
                </p>

                <button
                  onClick={() => setShowCreateOrganization(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
                >
                  <Icon name="plus" size={17} />
                  Create workspace
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Icon name="projects" size={22} />
                </div>

                <h3 className="font-semibold text-slate-900">
                  No projects yet
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Create your first project to get started.
                </p>

                <button
                  onClick={() => navigate("/projects")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Icon name="plus" size={17} />
                  Create project
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <div
                    onClick={() => navigate(`/projects/${project.id}`)}
                    key={project.id}
                    className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                  >
                    {/* Card top */}
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-base font-bold text-indigo-600">
                        {project.name?.charAt(0).toUpperCase()}
                      </div>

                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>

                    {/* Content */}
                    <div className="mt-5">
                      <h3 className="text-lg font-bold tracking-tight text-slate-900 transition group-hover:text-indigo-600">
                        {project.name}
                      </h3>

                      <p className="mt-2 min-h-[42px] text-sm leading-6 text-slate-500">
                        {project.description || "No description available."}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Icon name="tasks" size={15} />
                        Project #{project.id}
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                        <Icon name="arrow" size={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ================= CREATE WORKSPACE MODAL ================= */}

      {showCreateOrganization && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!creatingOrganization) {
                setShowCreateOrganization(false);
              }
            }}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon name="users" size={21} />
                </div>

                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Create your workspace
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  A workspace is where you'll manage your projects and team.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!creatingOrganization) {
                    setShowCreateOrganization(false);
                  }
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrganization} className="mt-6">
              <label className="text-sm font-semibold text-slate-700">
                Workspace name
              </label>

              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. Aryan's Team"
                autoFocus
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />

              <p className="mt-2 text-xs text-slate-400">
                You will be the owner of this workspace.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!creatingOrganization) {
                      setShowCreateOrganization(false);
                    }
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  disabled={creatingOrganization}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingOrganization || !organizationName.trim()}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingOrganization ? "Creating..." : "Create workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
