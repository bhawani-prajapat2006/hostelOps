# HostelOps Frontend 🏨

**HostelOps** is a streamlined, role-based management portal designed for the **IIT Jodhpur** campus ecosystem. It automates and organizes the lifecycle of hostel-related complaints, providing tailored interfaces for students, wardens, maintenance workers, and administrators.

Repository:
https://github.com/bhawani-prajapat2006/hostelOps.git

---

# 🚀 Tech Stack

| Layer      | Technology              |
| ---------- | ----------------------- |
| Framework  | Next.js 16 (App Router) |
| Library    | React 19                |
| Styling    | Tailwind CSS 4          |
| UI Library | Shadcn UI (Radix UI)    |
| Animation  | Framer Motion           |
| Icons      | Lucide React            |
| API Client | Axios                   |

---

# 🛠 Installation & Setup

## 1️⃣ Clone the Repository

### Linux / macOS

```
git clone https://github.com/bhawani-prajapat2006/hostelOps.git
cd hostelOps/frontend
```

### Windows (PowerShell / CMD)

```
git clone https://github.com/bhawani-prajapat2006/hostelOps.git
cd hostelOps\frontend
```

---

## 2️⃣ Install Dependencies

### Linux / macOS

```
npm install
```

### Windows

```
npm install
```

*(same command for Windows)*

---

## 3️⃣ Run Development Server

### Linux / macOS

```
npm run dev
```

### Windows

```
npm run dev
```

Open in browser:

```
http://localhost:3000
```

---

# 📁 Project Structure

```
frontend/
│
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── dashboard/      # Main dashboard
│   │   ├── complaints/     # Complaint system
│   │   ├── admin/          # Admin controls
│   │   ├── login/          # Authentication
│   │   ├── layout.js       # Global providers
│   │   └── globals.css     # Tailwind styles
│   │
│   ├── components/
│   │   ├── ui/             # Shadcn UI components
│   │   ├── theme-provider.js
│   │   └── theme-toggle.js
│   │
│   ├── lib/                # Utilities (Axios config)
│   └── hooks/              # Custom hooks
│
├── public/                 # Static assets
├── jsconfig.json           # Path aliases
├── components.json         # Shadcn config
└── package.json
```

---

# 🧩 Using Shadcn Components

Add components:

```
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

Components will appear in:

```
src/components/ui/
```

You can modify Tailwind styles directly.

---

# ⚠️ Troubleshooting

## 1️⃣ Module Not Found

Example error:

```
Module not found: Can't resolve '@/components/ui/button'
```

Fix:

```
rm -rf .next
npm run dev
```

Windows:

```
rmdir /s /q .next
npm run dev
```

Also check `jsconfig.json`:

```
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

---

## 2️⃣ Hydration Error (Next.js)

Example error:

```
Hydration failed because the server rendered HTML didn't match the client
```

Fix by using mounted state:

```
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) return null
```

Used in theme toggle and dashboard.

---

## 3️⃣ NPM / Node Not Recognized (Windows)

If you see:

```
'npm' is not recognized as an internal command
```

Install Node.js from:

```
https://nodejs.org
```

Then restart the terminal.

---

## 4️⃣ Turbopack Cache Error

If Next.js crashes:

Linux/macOS

```
rm -rf .next node_modules
npm install
npm run dev
```

Windows

```
rmdir /s /q .next
rmdir /s /q node_modules
npm install
npm run dev
```

---

# 👨‍💻 Maintainer

Mayuri Pujari
B.Tech Engineering Science
IIT Jodhpur

---

# 🏛 Project

IIT Jodhpur Hostel Issue Management System
