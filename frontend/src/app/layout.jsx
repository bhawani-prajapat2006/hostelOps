import "./globals.css"
import { GoogleOAuthProvider } from "@react-oauth/google"

export const metadata = {
  title: "HostelOps | IIT Jodhpur",
  description: "Next-gen Hostel Issue Management System",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <head />
      <body className="antialiased">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
          <main>
            {children}
          </main>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}