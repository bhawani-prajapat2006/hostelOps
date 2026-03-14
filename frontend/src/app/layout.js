import "./globals.css"
import { Lato } from "next/font/google"
import { ThemeProvider } from "@/components/ui/theme-provider"
import { Toaster } from "sonner" 
// Ensure the filename is theme-toggle.js in your components/ui folder
import { ThemeToggle } from "@/components/ui/theme-toggle"

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-lato",
})

export const metadata = {
  title: "HostelOps | IIT Jodhpur",
  description: "Next-gen Hostel Issue Management System",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lato.className} antialiased transition-colors duration-300 relative`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Fixed Positioning for Top-Right Corner */}
          <div className="fixed top-6 right-6 z-50">
            <ThemeToggle />
          </div>

          <main>
            {children}
          </main>
          
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}