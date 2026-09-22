import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    arrow: (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
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

    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    ),

    plus: (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),

    close: (
      <svg {...common}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    ),

    trash: (
      <svg {...common}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </svg>
    ),

    logout: (
      <svg {...common}>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Members() {
  const navigate = useNavigate();

  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("MEMBER");

  const [adding, setAdding] = useState(false);

  const [currentUserRole, setCurrentUserRole] = useState("");

  // Mobile sidebar
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const organizationResponse = await api.get("/organizations");

      const organizations = organizationResponse.data.organizations || [];

      if (organizations.length === 0) {
        setError("No organization found.");
        return;
      }

      const currentOrganization = organizations[0];

      setOrganization(currentOrganization);

      const membersResponse = await api.get(
        `/organizations/${currentOrganization.id}/members`,
      );

      const memberList = membersResponse.data.members || [];

      setMembers(memberList);

      const currentMember = memberList.find(
        (member) =>
          member.user_id === currentOrganization.created_by ||
          member.id === currentOrganization.created_by,
      );

      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }

      const usersResponse = await api.get(
        `/users?organizationId=${currentOrganization.id}`,
      );

      setUsers(usersResponse.data.users || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message || "Failed to load organization members.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return users.slice(0, 8);
    }

    return users
      .filter(
        (user) =>
          user.name.toLowerCase().includes(value) ||
          user.email.toLowerCase().includes(value),
      )
      .slice(0, 8);
  }, [users, search]);

  const handleAddMember = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      setAdding(true);
      setError("");

      await api.post(`/organizations/${organization.id}/members`, {
        email: selectedUser.email,
        role: selectedRole,
      });

      setShowAddModal(false);
      setSelectedUser(null);
      setSearch("");
      setSelectedRole("MEMBER");

      await loadMembers();
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Failed to add member.");
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.patch(
        `/organizations/${organization.id}/members/${userId}/role`,
        {
          role,
        },
      );

      await loadMembers();
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Failed to update member role.");
    }
  };

  const handleRemove = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/organizations/${organization.id}/members/${userId}`);

      await loadMembers();
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Failed to remove member.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileSidebarOpen(false);
  };

  const canManageMembers =
    currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
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

            <button
              onClick={() => navigate("/dashboard")}
              className="text-xl font-bold tracking-tight text-blue-600"
            >
              TeamFlow
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* User avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              A
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:px-3"
            >
              <Icon name="logout" size={17} />

              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
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
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="space-y-1">
          {/* Dashboard */}
          <button
            onClick={() => handleNavigation("/dashboard")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Dashboard
          </button>

          {/* Projects */}
          <button
            onClick={() => handleNavigation("/projects")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Projects
          </button>

          {/* Members */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-900"
          >
            <Icon name="users" size={18} />
            Members
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="pt-16 md:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:p-8">
          {/* Header */}
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-400">
                Workspace
              </p>

              <h1 className="text-3xl font-bold tracking-tight">Members</h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage people and permissions in your workspace.
              </p>
            </div>

            {canManageMembers && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:w-auto"
              >
                <Icon name="plus" size={18} />
                Add member
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Workspace */}
          {organization && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Workspace
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    {organization.name}
                  </h2>
                </div>

                <div className="w-fit rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </div>
              </div>
            </div>
          )}

          {/* Members table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
              <h2 className="font-semibold">Team members</h2>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No members found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {members.map((member) => {
                  const memberId = member.user_id || member.id;

                  return (
                    <div
                      key={memberId}
                      className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                          {getInitials(member.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{member.name}</h3>

                            {member.role === "OWNER" && (
                              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                Owner
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:justify-end">
                        {member.role === "OWNER" ? (
                          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                            Owner
                          </span>
                        ) : (
                          <>
                            {currentUserRole === "OWNER" && (
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  handleRoleChange(memberId, e.target.value)
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-slate-400"
                              >
                                <option value="MEMBER">Member</option>

                                <option value="ADMIN">Admin</option>
                              </select>
                            )}

                            {canManageMembers && (
                              <button
                                onClick={() => handleRemove(memberId)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Remove member"
                              >
                                <Icon name="trash" size={17} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-5 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-bold">Add member</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Search for an existing TeamFlow user.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUser(null);
                  setSearch("");
                }}
                className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              {/* Search */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Find user
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="search" size={18} />
                  </div>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSelectedUser(null);
                    }}
                    placeholder="Search by name or email..."
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* Selected user */}
              {selectedUser && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {getInitials(selectedUser.name)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {selectedUser.name}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setSearch("");
                    }}
                    className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* User results */}
              {!selectedUser && (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {filteredUsers.length === 0 ? (
                    <div className="p-5 text-center text-sm text-slate-500">
                      No available users found.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setSearch("");
                          }}
                          className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            {getInitials(user.name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {user.name}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {user.email}
                            </p>
                          </div>

                          <Icon name="arrow" size={16} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Role */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Role
                </label>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="MEMBER">Member</option>

                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUser(null);
                  setSearch("");
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={handleAddMember}
                disabled={!selectedUser || adding}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {adding ? "Adding..." : "Add member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;
