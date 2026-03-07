"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  HiClipboardList,
  HiOfficeBuilding,
  HiSpeakerphone,
  HiShieldCheck,
  HiLightningBolt,
  HiUserGroup,
  HiCheck,
  HiArrowRight,
} from "react-icons/hi";
export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace("/dashboard");
  }, [loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HostelOps</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-100/40 rounded-full blur-3xl -mt-96" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-28 sm:pb-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
              <HiLightningBolt className="w-4 h-4" />
              Streamline your hostel operations
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Hostel management{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                made effortless
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              A complete platform for students, wardens, and administrators to manage complaints,
              rooms, notices, and more — all in one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200"
              >
                Get Started Free
                <HiArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "100%", label: "Free to Use" },
              { value: "4", label: "User Roles" },
              { value: "Real-time", label: "Status Tracking" },
              { value: "Secure", label: "Login & Data Protection" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need to manage your hostel
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From filing complaints to managing rooms, HostelOps covers every aspect of hostel life
              with a clean, intuitive interface.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: HiClipboardList,
                title: "Complaint Management",
                desc: "Students and wardens can file, track, and resolve complaints with full status history. Filter by category, status, and search across all complaints.",
                color: "bg-indigo-100 text-indigo-600",
              },
              {
                icon: HiOfficeBuilding,
                title: "Room Management",
                desc: "Wardens and admins can manage hostel rooms, track occupancy, and assign students — keeping everything organized in one dashboard.",
                color: "bg-green-100 text-green-600",
              },
              {
                icon: HiSpeakerphone,
                title: "Notice Board",
                desc: "Post and view important hostel announcements. Wardens can create notices that are instantly visible to all residents.",
                color: "bg-yellow-100 text-yellow-600",
              },
              {
                icon: HiUserGroup,
                title: "Role-Based Access",
                desc: "Four distinct roles — Student, Worker, Warden, and Admin — each with tailored dashboards and permissions for their responsibilities.",
                color: "bg-purple-100 text-purple-600",
              },
              {
                icon: HiShieldCheck,
                title: "Secure Login",
                desc: "Your data stays safe with secure login. Sign in with your email and password, or use your Google account for quick access.",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: HiLightningBolt,
                title: "Worker Assignment",
                desc: "Wardens can assign maintenance workers to complaints, track progress in real-time, and ensure issues are resolved promptly.",
                color: "bg-red-100 text-red-600",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-gray-300 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color} mb-5`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get started in minutes with a simple, intuitive workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Create an Account",
                desc: "Sign up with your email or Google account. Your hostel admin will assign your role and room.",
              },
              {
                step: "02",
                title: "File or Manage Complaints",
                desc: "Students file complaints by category. Wardens review, assign workers, and update statuses in real-time.",
              },
              {
                step: "03",
                title: "Track & Resolve",
                desc: "Follow every complaint from creation to resolution with a complete history trail and email notifications.",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-lg font-bold">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Breakdown Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Built for every role in your hostel
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Each user gets a personalized experience based on their responsibilities.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                role: "Student",
                color: "border-blue-200 bg-blue-50",
                tagColor: "bg-blue-100 text-blue-700",
                features: [
                  "File complaints with images",
                  "Track complaint status",
                  "View hostel notices",
                  "Manage personal profile",
                ],
              },
              {
                role: "Worker",
                color: "border-green-200 bg-green-50",
                tagColor: "bg-green-100 text-green-700",
                features: [
                  "View assigned complaints",
                  "Update work progress",
                  "See task dashboard",
                  "Track complaint history",
                ],
              },
              {
                role: "Warden",
                color: "border-yellow-200 bg-yellow-50",
                tagColor: "bg-yellow-100 text-yellow-700",
                features: [
                  "File & manage complaints",
                  "Assign workers to issues",
                  "Post hostel notices",
                  "Manage rooms & students",
                ],
              },
              {
                role: "Admin",
                color: "border-purple-200 bg-purple-50",
                tagColor: "bg-purple-100 text-purple-700",
                features: [
                  "Full system dashboard",
                  "Manage all user roles",
                  "View platform statistics",
                  "Complete oversight & control",
                ],
              },
            ].map((r) => (
              <div key={r.role} className={`rounded-2xl border-2 ${r.color} p-6`}>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${r.tagColor}`}>
                  {r.role}
                </span>
                <ul className="mt-5 space-y-3">
                  {r.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <HiCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl px-8 py-16 sm:px-16 sm:py-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to simplify hostel management?
            </h2>
            <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
              Join HostelOps today and experience a streamlined approach to managing complaints,
              rooms, and notices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
              >
                Create Free Account
                <HiArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-500/20 text-white border border-indigo-400/30 rounded-xl font-semibold hover:bg-indigo-500/30 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
