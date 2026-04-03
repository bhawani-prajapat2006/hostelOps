"use client"

import { Info, Target, Users, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <header className="navbar bg-base-100 shadow-lg mb-8">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost normal-case text-xl">
            ← Back
          </Link>
        </div>
      </header>

      <main className="p-6 md:p-12 max-w-5xl mx-auto space-y-12">
        {/* Hero Section */}
        <section>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About <span className="text-primary">HostelOps</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
            A comprehensive digital ecosystem designed for IIT Jodhpur to manage, 
            track, and resolve hostel maintenance issues with transparency and speed.
          </p>
        </section>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <Target className="w-10 h-10 text-primary mb-4" />
              <h2 className="card-title">The Mission</h2>
              <p>
                HostelOps eliminates the traditional paper-based register system. 
                Our goal is to ensure that no student complaint goes unnoticed and 
                every maintenance task is assigned instantly.
              </p>
            </div>
          </div>

          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <Users className="w-10 h-10 text-primary mb-4" />
              <h2 className="card-title">Roles & Workflow</h2>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span><strong>Students:</strong> Raise and track issues</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span><strong>Wardens:</strong> Validate and assign workers</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span><strong>Workers:</strong> Update and resolve tasks</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <section className="py-12 border-t border-base-300">
          <h2 className="text-3xl font-bold mb-8">System Capabilities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-base-300 shadow-md">
              <div className="card-body items-center text-center">
                <Info className="w-8 h-8 text-primary mb-2" />
                <span className="font-semibold">Live Tracking</span>
              </div>
            </div>
            <div className="card bg-base-300 shadow-md">
              <div className="card-body items-center text-center">
                <ShieldCheck className="w-8 h-8 text-primary mb-2" />
                <span className="font-semibold">Secure Auth</span>
              </div>
            </div>
            <div className="card bg-base-300 shadow-md">
              <div className="card-body items-center text-center">
                <Target className="w-8 h-8 text-primary mb-2" />
                <span className="font-semibold">Auto Assign</span>
              </div>
            </div>
            <div className="card bg-base-300 shadow-md">
              <div className="card-body items-center text-center">
                <Users className="w-8 h-8 text-primary mb-2" />
                <span className="font-semibold">Logging</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <footer className="text-center py-12">
          <Link href="/login">
            <button className="btn btn-primary btn-lg">
              Ready to start? Login Now
            </button>
          </Link>
        </footer>
      </main>
    </div>
  )
}