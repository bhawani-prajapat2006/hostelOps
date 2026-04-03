"use client"

import Link from "next/link"
import { MessageSquare, LayoutDashboard, ShieldCheck, Building2 } from "lucide-react"

export default function Home() {
  const features = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Instant Complaints",
      description: "Report issues in seconds. Add details and get real-time updates."
    },
    {
      icon: <LayoutDashboard className="w-8 h-8" />,
      title: "Admin Transparency",
      description: "Directly connect with the hostel office. No more running around."
    },
    {
      icon: <ShieldCheck className="w-8 h-8" />,
      title: "Verified Access",
      description: "Secure login with institutional credentials ensures only IITJ residents."
    }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      {/* Header */}
      <header className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <div className="btn btn-ghost text-xl normal-case font-bold">
            <Building2 className="w-6 h-6" />
            HostelOps
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Hostel Living,
          <span className="text-primary block">Re-engineered.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10">
          The official management system for IIT Jodhpur hostels. 
          Streamline complaints, track resolutions, and manage your room effortlessly.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link href="/login">
            <button className="btn btn-primary btn-lg">Get Started</button>
          </Link>
          <Link href="/about">
            <button className="btn btn-outline btn-lg">Learn More</button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {features.map((feature, idx) => (
            <div key={idx} className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="text-primary mb-4">{feature.icon}</div>
                <h2 className="card-title">{feature.title}</h2>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-base-200 p-6 text-center text-sm opacity-70">
        © 2026 IIT Jodhpur • Built for Hostel Excellence
      </footer>
    </div>
  )
}