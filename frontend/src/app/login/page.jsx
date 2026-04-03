"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { GoogleLogin } from "@react-oauth/google"
import { Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react"

export default function AuthPage() {
  const router = useRouter()

  const [mode, setMode] = useState("login")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
        res = await axios.post("http://127.0.0.1:8000/api/v1/auth/login", {
          email,
          password,
        })
      } else {
        res = await axios.post("http://127.0.0.1:8000/api/v1/auth/register", {
          username,
          email,
          password,
        })
      }

      const { access_token, refresh_token } = res.data
      localStorage.setItem("access_token", access_token)
      if (refresh_token) {
        localStorage.setItem("refresh_token", refresh_token)
      }
      
      setSuccess(mode === "login" ? "Welcome back!" : "Account created!")
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError("")
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/v1/auth/google",
        {
          id_token: credentialResponse.credential
        }
      )
      const { access_token, refresh_token } = res.data
      localStorage.setItem("access_token", access_token)
      if (refresh_token) {
        localStorage.setItem("refresh_token", refresh_token)
      }
      setSuccess("Login successful!")
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.detail || "Google login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-base-100 p-4">
      <div className="card w-full max-w-md bg-base-200 shadow-xl">
        <div className="card-body">
          {/* Header */}
          <h2 className="card-title text-center justify-center text-2xl font-bold">
            HostelOps
          </h2>
          <p className="text-center text-sm opacity-70">
            {mode === "login" ? "Login to manage hostel complaints" : "Create your account"}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {/* Username Field (Register Only) */}
            {mode === "register" && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Username</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                  <input
                    type="text"
                    placeholder="Your name"
                    className="input input-bordered w-full pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Email</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type="email"
                  placeholder="student@iitj.ac.in"
                  className="input input-bordered w-full pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Password</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type="password"
                  placeholder="Enter password"
                  className="input input-bordered w-full pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-error shadow-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="alert alert-success shadow-lg">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : mode === "login" ? (
                "Login"
              ) : (
                "Register"
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center text-sm mt-4">
            {mode === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="link link-primary font-semibold"
                  onClick={() => {
                    setMode("register")
                    setError("")
                    setSuccess("")
                  }}
                >
                  Register
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  className="link link-primary font-semibold"
                  onClick={() => {
                    setMode("login")
                    setError("")
                    setSuccess("")
                  }}
                >
                  Login
                </button>
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="divider text-xs opacity-50">OR</div>

          {/* Google OAuth */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google login failed")}
              size="large"
              theme="outline"
            />
          </div>
        </div>
      </div>
    </div>
  )
}