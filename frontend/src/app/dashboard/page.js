"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  PlusCircle,
  History,
  User,
  Settings,
  AlertCircle,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  ChevronRight,
  ArrowRightLeft,
  Wrench,
  ShieldCheck,
  UserPlus
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Dashboard() {
  // Mock User State - Change 'role' to 'warden', 'worker', or 'admin' to test views
  const [user] = useState({
    name: "Mayuri Pujari",
    role: "student", // options: student, warden, worker, admin
    avatar: "https://github.com/shadcn.png" 
  })

  const stats = [
    { label: "Active Complaints", value: "3", icon: AlertCircle, color: "text-amber-500" },
    { label: "Resolved This Month", value: "12", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Avg. Resolution Time", value: "24h", icon: Clock, color: "text-blue-500" },
  ]

  // Role-based navigation config
  const getRoleActions = () => {
    switch (user.role) {
      case "student":
        return [
          { label: "Post New Complaint", icon: PlusCircle, href: "/complaints/new" },
          { label: "My Profile", icon: User, href: "/profile" },
          { label: "Resolution Archive", icon: History, href: "/archive" },
        ]
      case "warden":
        return [
          { label: "Forward Complaints", icon: ArrowRightLeft, href: "/forward" },
          { label: "Pending Approvals", icon: ShieldCheck, href: "/approvals" },
          { label: "Hostel Overview", icon: Settings, href: "/management" },
        ]
      case "worker":
        return [
          { label: "Update Task Status", icon: Wrench, href: "/tasks" },
          { label: "My Assignments", icon: History, href: "/assignments" },
          { label: "Profile", icon: User, href: "/profile" },
        ]
      case "admin":
        return [
          { label: "System Controls", icon: Settings, href: "/admin/settings" },
          { label: "Manage Wardens", icon: UserPlus, href: "/admin/wardens" },
          { label: "Override Status", icon: ShieldCheck, href: "/admin/status" },
        ]
      default:
        return []
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 pt-28 space-y-8 max-w-7xl mx-auto">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-black tracking-tight font-serif text-glow">Dashboard</h1>
              <Badge className="bg-primary/10 text-primary border-primary/20 uppercase">
                {user.role}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 font-medium">Welcome back, {user.name}</p>
          </div>
        </div>
        
        {user.role === "student" && (
          <Link href="/complaints">
            <Button className="gap-2 h-11 px-6 shadow-xl shadow-primary/20 hover:scale-105 transition-all font-bold">
              <PlusCircle className="w-4 h-4" />
              File New Complaint
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black mt-1">{stat.value}</p>
                </div>
                <div className="p-3 rounded-2xl bg-background/50 shadow-inner">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">

        {/* Main Overview Card */}
        <Card className="lg:col-span-2 glass border-border/50 shadow-2xl group flex flex-col">
          <CardHeader className="bg-primary text-primary-foreground p-6 pb-6 space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <LayoutDashboard className="w-6 h-6" />
              {user.role === 'worker' ? 'Assigned Tasks' : 'Recent Complaints'}
            </CardTitle>
            <CardDescription className="text-primary-foreground/80 font-medium">
              {user.role === 'student' ? 'Your most recent issues.' : 'Overview of active hostel tickets.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 grow bg-card/30"> {/* Fixed flex-grow to grow */}
            <div className="divide-y divide-border/20">
              {[1, 2].map((i) => (
                <div key={i} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    <div>
                      <p className="font-bold text-sm">Electrical: Ceiling fan making noise in C-302</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium tracking-wide">
                        Status: Under Review • Filed 2h ago
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="font-bold hover:text-primary">
                    {user.role === 'worker' ? 'Update Status' : 'View Details'}
                  </Button>
                </div>
              ))}
            </div>
            <Link href="/complaints" className="group flex items-center justify-center p-8 text-[10px] font-black uppercase tracking-[0.2em] border-t border-border/0 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary">
              See All <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        {/* Side Menu */}
        <div className="flex flex-col gap-6">
          <Card className="glass border-border/50 flex flex-col grow"> {/* Fixed flex-grow to grow */}
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {getRoleActions().map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button variant="outline" className="w-full justify-start gap-3 h-12 font-bold border-border/50 hover:bg-primary/5 hover:text-primary transition-all">
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* IIT Jodhpur Notice Banner */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-4xl bg-zinc-950 text-white shadow-2xl relative overflow-hidden group border border-white/10" 
          > {/* Fixed rounded-[2rem] to rounded-4xl */}
            <div className="relative z-10">
              <Badge className="bg-primary/20 text-primary border-none mb-4 text-[10px] font-black tracking-widest">OFFICIAL NOTICE</Badge>
              <h3 className="font-black text-2xl gap-2 tracking-wider uppercase leading-none">H10 Network <br />Maintenance</h3>
              <p className="text-sm opacity-60 mt-3 leading-snug font-medium">
                Downtime expected tomorrow from 2 PM to 4 PM for router upgrades.
              </p>
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
          </motion.div>
        </div>

      </div>
    </div>
  )
}

function Badge({ children, className }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${className}`}>
      {children}
    </span>
  )
}