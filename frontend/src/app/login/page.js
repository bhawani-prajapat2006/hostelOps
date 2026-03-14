"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, User, Loader2, ShieldCheck } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function AuthPage() {
  const router = useRouter()

  // 1. Same logic as your provided code
  const [mode, setMode] = useState("login") // login or register
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

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

      // 2. Same routing and token storage
      const token = res.data.access_token
      localStorage.setItem("token", token)
      
      toast.success(mode === "login" ? "Welcome back!" : "Account created!")
      router.push("/dashboard")
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-6">
      {/* Decorative background elements for that "Best UI" feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px] z-10"
      >
        <Card className="glass border-border/50 shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                <ShieldCheck className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">
              HostelOps
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              {mode === "login" ? "Login to manage hostel complaints" : "Create your account"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === "register" && (
                  <motion.div
                    key="username"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10 bg-background/50 border-border/50"
                        placeholder="Your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    className="pl-10 bg-background/50 border-border/50"
                    placeholder="student@iitj.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    className="pl-10 bg-background/50 border-border/50"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  mode === "login" ? "Login" : "Register"
                )}
              </Button>

              <div className="text-center text-sm pt-4 border-t border-border/50 mt-4">
                {mode === "login" ? (
                  <p className="text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-primary font-bold hover:underline underline-offset-4"
                      onClick={() => setMode("register")}
                    >
                      Register
                    </button>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary font-bold hover:underline underline-offset-4"
                      onClick={() => setMode("login")}
                    >
                      Login
                    </button>
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}