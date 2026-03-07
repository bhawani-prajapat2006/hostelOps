"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Footer() {
  const { isAuthenticated, hasRole } = useAuth();

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-lg font-bold text-white">HostelOps</span>
            </div>
            <p className="text-sm leading-relaxed">
              A complete hostel management platform for students, workers, wardens, and administrators.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {isAuthenticated ? "Navigation" : "Features"}
            </h3>
            <ul className="space-y-2.5">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link href="/dashboard" className="text-sm hover:text-white transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/complaints" className="text-sm hover:text-white transition-colors">
                      Complaints
                    </Link>
                  </li>
                  <li>
                    <Link href="/notices" className="text-sm hover:text-white transition-colors">
                      Notices
                    </Link>
                  </li>
                  {hasRole("admin", "warden") && (
                    <li>
                      <Link href="/rooms" className="text-sm hover:text-white transition-colors">
                        Rooms
                      </Link>
                    </li>
                  )}
                </>
              ) : (
                <>
                  <li className="text-sm">Complaint Tracking</li>
                  <li className="text-sm">Room Management</li>
                  <li className="text-sm">Notice Board</li>
                  <li className="text-sm">Worker Assignment</li>
                </>
              )}
            </ul>
          </div>

          {/* Account / Roles */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {isAuthenticated ? "Account" : "For Everyone"}
            </h3>
            <ul className="space-y-2.5">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link href="/profile" className="text-sm hover:text-white transition-colors">
                      My Profile
                    </Link>
                  </li>
                  <li>
                    <Link href="/complaints/my" className="text-sm hover:text-white transition-colors">
                      My Complaints
                    </Link>
                  </li>
                  {hasRole("admin") && (
                    <li>
                      <Link href="/admin" className="text-sm hover:text-white transition-colors">
                        Admin Panel
                      </Link>
                    </li>
                  )}
                </>
              ) : (
                <>
                  <li className="text-sm">Students</li>
                  <li className="text-sm">Workers</li>
                  <li className="text-sm">Wardens</li>
                  <li className="text-sm">Administrators</li>
                </>
              )}
            </ul>
          </div>

          {/* About / Get Started */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {isAuthenticated ? "About" : "Get Started"}
            </h3>
            <ul className="space-y-2.5">
              {isAuthenticated ? (
                <>
                  <li className="text-sm">Complaint Tracking</li>
                  <li className="text-sm">Room Management</li>
                  <li className="text-sm">Notice Board</li>
                  <li className="text-sm">Secure Login</li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="text-sm hover:text-white transition-colors">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="text-sm hover:text-white transition-colors">
                      Create Account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} HostelOps. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Hostel Management System &middot; Made with care
          </p>
        </div>
      </div>
    </footer>
  );
}
