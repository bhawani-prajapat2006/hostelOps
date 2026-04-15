"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { GoogleLogin } from "@react-oauth/google"
import { Mail, Lock, User, AlertCircle, CheckCircle, Home } from "lucide-react"

const getApiErrorMessage = (err, fallback = "Authentication failed") => {
  const detail = err?.response?.data?.detail
  if (typeof detail === "string" && detail.trim()) return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    if (typeof first?.msg === "string") return first.msg
  }
  return fallback
}

const routeByRole = async (token, router) => {
  try {
    const meRes = await api.get("/api/v1/auth/me")

    const role = meRes.data?.role
    const status = meRes.data?.status

    // If pending approval, show waiting page
    if (status === "pending") {
      router.push("/auth/pending-approval")
      return
    }

    if (status === "inactive") {
      router.push("/login")
      return
    }

    if (role === "warden") {
      router.push("/dashboard/warden")
      return
    }
    if (role === "admin") {
      router.push("/dashboard/admin")
      return
    }
    if (role === "worker") {
      router.push("/dashboard/worker")
      return
    }

    router.push("/dashboard")
  } catch (err) {
    console.error("Failed to determine role for redirect:", err)
    router.push("/dashboard")
  }
}

export default function AuthPage() {
  const router = useRouter()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) return
    routeByRole(token, router)
  }, [])

  const [mode, setMode] = useState("login")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")  // Role selection for registration
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      let res
      if (mode === "login") {
        res = await api.post("/api/v1/auth/login", {
          email,
          password,
        })
      } else {
        res = await api.post("/api/v1/auth/register", {
          username,
          email,
          password,
          role,  // Include role in registration
        })
      }

      const { access_token, refresh_token } = res.data
      localStorage.setItem("access_token", access_token)
      if (refresh_token) {
        localStorage.setItem("refresh_token", refresh_token)
      }

      setSuccess(mode === "login" ? "Welcome back!" : "Account ready. Signing you in...")
      setTimeout(() => {
        routeByRole(access_token, router)
      }, 1000)
    } catch (err) {
      setError(getApiErrorMessage(err, "Authentication failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError("")
    try {
      const res = await api.post(
        "/api/v1/auth/google",
        {
          id_token: credentialResponse.credential
        }
      )
      const { access_token, refresh_token } = res.data
      const needsRoleSelection = Boolean(res.data?.needs_role_selection)
      localStorage.setItem("access_token", access_token)
      if (refresh_token) {
        localStorage.setItem("refresh_token", refresh_token)
      }
      setSuccess("Login successful!")
      setTimeout(() => {
        if (needsRoleSelection) {
          router.push("/auth/select-role")
          return
        }

        // Existing Google users should land directly on their role dashboard.
        routeByRole(access_token, router)
      }, 1000)
    } catch (err) {
      setError(getApiErrorMessage(err, "Google login failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
  <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
    <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-2xl p-8 pb-6 shadow-sm">

      {/* Logo */}
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
          <Home className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Header */}
      <h1 className="text-xl font-semibold text-center">HostelOps</h1>
      <p className="text-sm text-center opacity-50 mt-1 mb-6">
        {mode === "login"
          ? "Manage hostel complaints seamlessly"
          : "Create your account to get started"}
      </p>

      {/* Tab Toggle */}
      <div className="flex bg-base-200 rounded-lg p-1 gap-1 mb-6">
        <button
          type="button"
          onClick={() => { setMode("login"); setError(""); setSuccess("") }}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all
            ${mode === "login"
              ? "bg-base-100 border border-base-300 text-base-content shadow-sm"
              : "text-base-content/50 hover:text-base-content"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => { setMode("register"); setError(""); setSuccess("") }}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all
            ${mode === "register"
              ? "bg-base-100 border border-base-300 text-base-content shadow-sm"
              : "text-base-content/50 hover:text-base-content"}`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Register-only fields */}
        {mode === "register" && (
          <>
            {/* Username */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide opacity-50 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
                <input
                  type="text"
                  placeholder="Your name"
                  className="input input-bordered w-full pl-9 h-10 text-sm bg-base-200 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide opacity-50 mb-1.5">
                Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "student", icon: "🎓", hint: "Post complaints" },
                  { id: "worker",  icon: "🔧", hint: "Admin approval" },
                  { id: "warden", icon: "🏛️", hint: "Admin approval" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`p-2.5 rounded-lg border text-center transition-all
                      ${role === r.id
                        ? "border-blue-400 bg-blue-50 text-blue-700"
                        : "border-base-300 bg-base-200 hover:border-blue-300"}`}
                  >
                    <span className="text-lg block mb-1">{r.icon}</span>
                    <p className="text-xs font-medium capitalize">{r.id}</p>
                    <p className="text-[10px] opacity-50 mt-0.5">{r.hint}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Email */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide opacity-50 mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
            <input
              type="email"
              placeholder="student@iitj.ac.in"
              className="input input-bordered w-full pl-9 h-10 text-sm bg-base-200 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide opacity-50 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
            <input
              type="password"
              placeholder="Enter password"
              className="input input-bordered w-full pl-9 h-10 text-sm bg-base-200 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error text-sm py-2 px-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success text-sm py-2 px-3">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn w-full bg-blue-500 hover:bg-blue-600 text-white border-none mt-1 h-10 min-h-0 text-sm font-medium"
        >
          {loading
            ? <span className="loading loading-spinner loading-sm" />
            : mode === "login" ? "Login" : "Create account"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <hr className="flex-1 border-base-300" />
        <span className="text-xs opacity-40">or continue with</span>
        <hr className="flex-1 border-base-300" />
      </div>

      {/* Google */}
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Google Sign-In is blocked. Check OAuth origin config.")}
        />
      </div>

      {/* Toggle */}
      <p className="text-center text-sm opacity-50 mt-5">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          className="text-blue-500 font-medium hover:underline opacity-100"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess("") }}
        >
          {mode === "login" ? "Register" : "Login"}
        </button>
      </p>

    </div>
  </div>
)}
