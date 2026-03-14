"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ShieldCheck, MessageSquare, LayoutDashboard, ChevronRight, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="bg-primary p-2 rounded-xl">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">HostelOps</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50 font-serif"
        >
          Hostel Living, <br />
          <span className="text-primary not-italic">Re-engineered.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          The official management system for IIT Jodhpur hostels. 
          Streamline complaints, track resolutions, and manage your room effortlessly.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/login">
            <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              Get Started <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>

          {/* Updated Learn More Routing */}
          <Link href="/about">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-border/50 backdrop-blur-sm hover:bg-primary/5">
              Learn More
            </Button>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full"
        >
          <FeatureCard 
            icon={<MessageSquare className="w-6 h-6 text-primary" />}
            title="Instant Complaints"
            description="Report issues in seconds. Add photos, set priority, and get real-time updates."
          />
          <FeatureCard 
            icon={<LayoutDashboard className="w-6 h-6 text-primary" />}
            title="Admin Transparency"
            description="Directly connect with the hostel office. No more running around for status updates."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-primary" />}
            title="Verified Access"
            description="Secure login with institutional credentials ensures only IITJ residents gain access."
          />
        </motion.div>
      </main>

      <footer className="absolute bottom-6 w-full text-center text-sm text-muted-foreground">
        © 2026 IIT Jodhpur • Built for Hostel Excellence
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="glass p-8 rounded-3xl text-left border-border/50 hover:border-primary/50 transition-colors group">
      <div className="mb-4 p-3 bg-background rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}