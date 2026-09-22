import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);

      const token = response.data.token;

      localStorage.setItem("token", token);

      navigate("/dashboard");
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-8 sm:px-6">
      {/* Background decoration */}
      <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />

      {/* Main card */}
      <div className="relative flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        {/* Login section */}
        <div className="w-full px-6 py-10 sm:px-10 md:w-[52%] md:px-12 lg:px-14">
          {/* Logo */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/")}
              className="text-xl font-bold tracking-tight text-slate-950"
            >
              Team<span className="text-indigo-600">Flow</span>
            </button>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to continue managing your TeamFlow workspace.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Register */}
          <p className="mt-7 text-center text-sm text-slate-500">
            Don't have a TeamFlow account?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Right visual panel */}
        <div className="relative hidden overflow-hidden md:flex md:w-[48%]">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600" />

          {/* Geometric shapes */}
          <div className="absolute -right-20 -top-20 h-72 w-72 rotate-12 rounded-[3rem] bg-white/10" />
          <div className="absolute -left-20 top-24 h-64 w-64 -rotate-12 rounded-[3rem] bg-purple-300/10" />
          <div className="absolute bottom-[-100px] right-[-40px] h-80 w-80 rotate-45 bg-blue-400/20" />

          {/* Triangle-style shapes */}
          <div className="absolute right-0 top-0 h-0 w-0 border-b-[170px] border-l-[170px] border-b-transparent border-l-white/10" />

          <div className="absolute bottom-0 left-0 h-0 w-0 border-r-[190px] border-t-[190px] border-r-transparent border-t-white/10" />

          {/* Decorative circles */}
          <div className="absolute right-12 top-20 h-3 w-3 rounded-full bg-white/30" />
          <div className="absolute right-24 top-28 h-2 w-2 rounded-full bg-white/20" />
          <div className="absolute bottom-20 left-12 h-4 w-4 rounded-full bg-white/20" />

          {/* Content */}
          <div className="relative z-10 flex min-h-[520px] w-full flex-col justify-between p-10 text-white">
            <div className="flex justify-end">
              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
                Project Management
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-indigo-100">
                Welcome to TeamFlow
              </p>

              <h2 className="max-w-sm text-4xl font-bold leading-tight tracking-tight">
                Manage projects.
                <br />
                Build together.
              </h2>

              <p className="mt-5 max-w-sm text-sm leading-6 text-indigo-100">
                Organize projects, manage tasks, collaborate with your team, and
                keep everything in one workspace.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-indigo-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Your workspace, all in one place.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
