"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import api from "@/lib/api"
import { getAccessToken, clearAuthTokens } from "@/lib/tokenStore"
import {
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  FileText,
  Settings,
  ChevronDown
} from "lucide-react"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      // Check if token exists before fetching
      const token = getAccessToken()
      if (!token) {
        setLoading(false)
        return
      }

      const res = await api.get("/api/v1/auth/me")
      setUser(res.data)
    } catch (err) {
      // If 401, clear tokens and redirect to login
      if (err.response?.status === 401) {
        clearAuthTokens()
        router.push("/login")
      }
      console.error("Failed to fetch user:", err)
    } finally {
      setLoading(false)
    }
  }

  // Hide navbar on login page - return early after all hooks
  if (pathname === "/login") {
    return null
  }

  const addToast = (message, type) => {
    const id = Date.now()
    const newToast = { id, message, type }
    setToasts(prev => [...prev, newToast])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const handleLogout = async () => {
    try {
      // Call logout endpoint to blacklist token
      await api.post("/api/v1/auth/logout")
      addToast("Logged out successfully!", "success")
    } catch (err) {
      console.error("Logout failed:", err)
      addToast("Logout failed!", "error")
    } finally {
      // Clear tokens regardless of API response
      clearAuthTokens()
      setTimeout(() => router.push("/login"), 1500)
    }
  }

  const getNavLinks = () => {
    if (!user) return []

    // Same links for all roles - dashboard auto-redirects based on role
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Complaints", href: "/complaints", icon: FileText },
    ]
  }

  if (loading) {
    return (
      <nav className="navbar bg-base-200 shadow-lg sticky top-0 z-40">
        <div className="flex-1">
          <span className="px-4 text-xl font-bold">HostelOps</span>
        </div>
      </nav>
    )
  }

  return (
    <>
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div key={toast.id} className={`alert alert-${toast.type === 'error' ? 'error' : 'success'} shadow-lg`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <nav className="navbar bg-base-200 shadow-lg sticky top-0 z-40">
      {/* Brand */}
      <div className="flex-1">
        <Link href="/dashboard" className="px-4 text-xl font-bold hover:opacity-80 transition">
          HostelOps
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-4 items-center flex-none">
        {getNavLinks().map(link => (
          <Link 
            key={link.href}
            href={link.href}
            className="btn btn-ghost btn-sm gap-2"
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}
      </div>

      {/* User Dropdown */}
      <div className="dropdown dropdown-end">
        <button 
          tabIndex={0}
          className="btn btn-ghost btn-circle avatar"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {loading ? (
            <div className="w-10 rounded-full bg-base-300 flex items-center justify-center">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          ) : user ? (
            <div className="w-10 rounded-full overflow-hidden bg-base-300">
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.username}&background=0D8ABC&color=fff`}
                alt={user?.username}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <ul 
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 border border-base-300"
          >
            <li className="menu-title">
              <span className="text-sm">{user?.username}</span>
              <span className="text-xs opacity-60">{user?.role}</span>
            </li>
            <li><hr className="my-1" /></li>
            <li>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                My Profile
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </li>
            <li><hr className="my-1" /></li>
            <li>
              <button 
                onClick={handleLogout}
                className="text-error flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="btn btn-ghost btn-circle"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-base-100 shadow-lg md:hidden">
          <div className="p-4 space-y-2">
            {getNavLinks().map(link => (
              <Link 
                key={link.href}
                href={link.href}
                className="btn btn-block btn-ghost justify-start gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <div className="divider my-2"></div>
            <Link 
              href="/profile"
              className="btn btn-block btn-ghost justify-start gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User className="w-4 h-4" />
              My Profile
            </Link>
            <button 
              onClick={() => {
                handleLogout()
                setMobileMenuOpen(false)
              }}
              className="btn btn-block btn-error justify-start gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
    </>
  )
}
