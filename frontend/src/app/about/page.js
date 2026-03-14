"use client"

import { motion } from "framer-motion"
import { Info, Target, Users, ShieldCheck, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden p-6 md:p-12">
      {/* Decorative background blobs to match landing page */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      
      <div className="relative z-10 max-w-5xl mx-auto space-y-12">
        
        {/* Navigation */}
        <Link href="/">
          <Button variant="ghost" className="gap-2 hover:bg-primary/10 mb-8">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Button>
        </Link>

        {/* Hero Section */}
        <header className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl md:text-7xl font-black italic font-serif tracking-tighter"
          >
            About <span className="text-primary not-italic">HostelOps</span>
          </motion.h1>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            A comprehensive digital ecosystem designed for IIT Jodhpur to manage, 
            track, and resolve hostel maintenance issues with transparency and speed.
          </p>
        </header>

        {/* The "What is it" Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass border-border/50 h-full">
              <CardContent className="p-8 space-y-4">
                <Target className="w-10 h-10 text-primary" />
                <h3 className="text-2xl font-bold">The Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  HostelOps eliminates the traditional paper-based register system. 
                  Our goal is to ensure that no student complaint goes unnoticed and 
                  every maintenance task is assigned to the right professional instantly.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass border-border/50 h-full">
              <CardContent className="p-8 space-y-4">
                <Users className="w-10 h-10 text-primary" />
                <h3 className="text-2xl font-bold">Roles & Workflow</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <strong>Students:</strong> Raise and track issues.
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <strong>Wardens:</strong> Validate and assign workers.
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <strong>Workers:</strong> Update status and resolve tasks.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

        </div>

        {/* System Features Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="py-12 border-t border-border/50"
        >
          <h2 className="text-3xl font-bold mb-8">System Capabilities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureItem icon={<Info />} label="Live Tracking" />
            <FeatureItem icon={<ShieldCheck />} label="Secure Authentication" />
            <FeatureItem icon={<Target />} label="Automated Assignment" />
            <FeatureItem icon={<Users />} label="History Logging" />
          </div>
        </motion.section>

        <footer className="text-center py-12">
          <Link href="/login">
            <Button size="lg" className="rounded-full px-12 h-14 text-lg font-bold">
              Ready to start? Login Now
            </Button>
          </Link>
        </footer>
      </div>
    </div>
  )
}

function FeatureItem({ icon, label }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/20">
      <div className="text-primary">{icon}</div>
      <span className="font-medium">{label}</span>
    </div>
  )
}