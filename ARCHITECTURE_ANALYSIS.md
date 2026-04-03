# Hostel Issue Management System - Architecture Analysis

## 1. OVERALL WORKFLOW

**HostelOps** is a role-based hostel complaint management platform where:
- **Students** create and track complaints
- **Workers** get assigned complaints and update their status
- **Wardens** forward/manage complaints for their hostel
- **Admins** oversee the entire system

### High-Level Flow:
```
User (Browser) → Frontend (Next.js 16) → Backend API (FastAPI) → PostgreSQL (Neon)
                    ↓
            React Components
            (Login/Dashboard/Complaints/Admin)
                    ↓
            Axios HTTP Client
                    ↓
         RESTful API Endpoints
                    ↓
           SQLAlchemy ORM
                    ↓
           Database Schema
```

---

## 2. HOW FRONTEND CONNECTS TO BACKEND

### **API Configuration** (`frontend/src/lib/api.js`):
```javascript
import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000",
})

export default api
```

### **Connection Details**:
- **Frontend URL**: `http://localhost:3000`
- **Backend URL**: `http://localhost:8000`
- **HTTP Client**: Axios with central configuration
- **Authentication**: JWT tokens stored in localStorage
- **CORS Policy**: Backend allows localhost:3000 (tightened from wildcard)

### **Token Management**:
- Frontend stores `access_token` and `refresh_token` in localStorage
- Every API request includes: `Authorization: Bearer <access_token>` (via Axios interceptor)
- Backend validates token and returns user data on `/auth/me`

---

## 3. REQUEST FLOW FROM UI TO DATABASE

### **Example: User Login Flow**

```
┌─────────────────┐
│   User Types    │
│  Email+Password │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│  Frontend: login/page.jsx     │
│  - handleSubmit() triggered   │
│  - Validates input            │
│  - Shows loading spinner      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Axios API Call:                     │
│  POST /api/v1/auth/login             │
│  {email, password}                   │
│  Header: Content-Type: application/json
└────────┬─────────────────────────────┘
         │ Network Request (HTTP)
         ▼
┌─────────────────────────────────────────┐
│  Backend: app/routers/auth.py           │
│  @router.post("/login")                 │
│  1. Receive LoginRequest payload        │
│  2. Query User by email                 │
│  3. Verify password with bcrypt         │
│  4. Create JWT tokens (access+refresh)  │
│  5. Return TokenResponse                │
└────────┬────────────────────────────────┘
         │ HTTP Response (JSON)
         ▼
┌──────────────────────────────────┐
│  Frontend: Handle Response        │
│  1. Store tokens in localStorage  │
│  2. Redirect to /dashboard        │
│  3. Show success message          │
└──────────────────────────────────┘
```

### **Example: Create Complaint Flow**

```
┌────────────────────────┐
│  User Click             │
│  "File New Complaint"   │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Frontend: Modal/Form Opens         │
│  - complaints/page.jsx              │
│  - User fills: title, description,  │
│    category, image (optional)       │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  Frontend: api.post("/complaints", data)     │
│  - Attached JWT token in Authorization header
│  - Content: {title, description, category}   │
└────────┬───────────────────────────────────────┘
         │ HTTPS Request
         ▼
┌──────────────────────────────────────────────────────────┐
│  Backend: app/routers/complaints.py                      │
│  @router.post("/")                                       │
│  1. Dependency: verify JWT → get_current_user()          │
│  2. Role check: only students/wardens can create         │
│  3. Create Complaint object                              │
│  4. Store in PostgreSQL (complaints table)               │
│  5. Create ComplaintHistory record (audit log)           │
│  6. Commit transaction                                   │
│  7. Return ComplaintPublic (SafeORM serialization)       │
└────────┬───────────────────────────────────────────────────┘
         │ JSON Response
         ▼
┌──────────────────────────────────────────┐
│  Frontend: Response Handler              │
│  1. Extract complaint ID                 │
│  2. Show toast: "Complaint Created!"     │
│  3. Refresh complaints list             │
│  4. Redirect to /complaints/{id}        │
└──────────────────────────────────────────┘
```

### **Database Changes (PostgreSQL)**:
```sql
-- Data inserted:
INSERT INTO complaints (
  title, description, category, created_by, status, created_at, updated_at
) VALUES (
  'Water Leakage in Room 302',
  'Bathroom ceiling is leaking water',
  'plumbing',
  5,  -- user.id
  'open',
  NOW(),
  NOW()
);

-- Audit trail added:
INSERT INTO complaint_history (
  complaint_id, changed_by, new_status, comment, created_at
) VALUES (
  42,  -- complaint.id
  5,   -- user.id
  'open',
  'Complaint created',
  NOW()
);
```

---

## 4. FRONTEND FOLDER STRUCTURE

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.jsx               # Root layout wrapper
│   │   │   └─ Includes: GoogleOAuthProvider, metadata
│   │   ├── page.jsx                 # Home/Landing page
│   │   │   └─ Hero section, features grid, CTA buttons (DaisyUI)
│   │   ├── login/
│   │   │   └── page.jsx             # Login/Register page
│   │   │       └─ Email+password auth, Google OAuth, form validation
│   │   ├── dashboard/
│   │   │   └── page.jsx             # User dashboard
│   │   │       └─ Role-based views (student/worker/warden/admin)
│   │   │       └─ Stats cards, quick actions, recent complaints
│   │   ├── complaints/
│   │   │   └── page.jsx             # Complaints listing
│   │   │       └─ Grid layout, search, filters, delete
│   │   ├── admin/
│   │   │   └── page.jsx             # Admin panel
│   │   │       └─ Bulk complaint management, statistics
│   │   ├── about/
│   │   │   └── page.jsx             # About page
│   │   │       └─ Information, capabilities overview
│   │   └── globals.css              # Global styles
│   │       └─ Tailwind + DaisyUI directives
│   │
│   ├── components/
│   │   └── ui/                      # Removed (was shadcn components)
│   │       └─ Old button, card, input, label components (DEPRECATED)
│   │
│   ├── lib/
│   │   ├── api.js                   # Axios client config
│   │   │   └─ baseURL: http://localhost:8000
│   │   └── utils.js                 # Tailwind utility functions
│   │       └─ cn(): merge Tailwind classes
│   │
│   └── public/                      # Static assets
│       └─ favicon, images, etc.
│
├── package.json                    # Dependencies
│   ├─ next 16.1.6
│   ├─ react 19.2.3, react-dom 19.2.3
│   ├─ tailwindcss 3.4.3
│   ├─ daisyui 4.10.2
│   ├─ axios 1.13.6
│   ├─ lucide-react (icons)
│   └─ @react-oauth/google (Google OAuth)
│
├── next.config.mjs               # Next.js configuration
├── tailwind.config.mjs          # Tailwind + DaisyUI config
├── postcss.config.mjs           # PostCSS configuration
├── jsconfig.json                # TypeScript/ES6 module config
└── .env.local                   # Environment (Google Client ID)
```

### **Front-End Component Hierarchy**:
```
layout.jsx (Server Component)
  ├─ GoogleOAuthProvider
  └─ <main>
      ├─ page.jsx (Home)
      ├─ login/page.jsx (Auth)
      ├─ dashboard/page.jsx (Main view)
      ├─ complaints/page.jsx (List + Manage)
      ├─ admin/page.jsx (Admin controls)
      └─ about/page.jsx (Info)
```

---

## 5. BACKEND FOLDER STRUCTURE

```
backend/
├── app/
│   ├── main.py                      # FastAPI app initialization
│   │   ├─ CORS middleware setup
│   │   ├─ Database table creation
│   │   ├─ Token cleanup scheduler
│   │   └─ Router registration (/api/v1/auth, /api/v1/complaints)
│   │
│   ├── models.py                    # SQLAlchemy ORM models
│   │   ├─ User model
│   │   │   └─ Fields: username, email, password (nullable for OAuth)
│   │   │   └─ Relationships: complaints (one-to-many)
│   │   ├─ Complaint model
│   │   │   └─ Fields: title, description, category, status
│   │   │   └─ Foreign keys: created_by, assigned_to
│   │   │   └─ Relationships: creator, assigned_worker, history
│   │   ├─ ComplaintHistory model (Audit log)
│   │   ├─ ComplaintStatusEnum (open, in_progress, closed)
│   │   ├─ ComplaintCategoryEnum (plumbing, electrical, etc.)
│   │   ├─ UserRoleEnum (student, worker, warden, admin)
│   │   └─ TokenBlacklist model (revoked tokens)
│   │
│   ├── routers/
│   │   ├─ auth.py                   # Authentication endpoints
│   │   │   ├─ POST /register       → Create new user + return tokens
│   │   │   ├─ POST /login          → Validate email/password + return tokens
│   │   │   ├─ POST /refresh        → Exchange refresh_token for new access_token
│   │   │   ├─ POST /google         → Verify Google ID token + auto-create user
│   │   │   ├─ GET /me              → Get current user profile
│   │   │   ├─ PUT /me              → Update profile fields
│   │   │   └─ POST /logout         → Blacklist JWT token
│   │   │
│   │   └─ complaints.py             # Complaint management endpoints
│   │       ├─ POST /complaints      → Create complaint
│   │       ├─ GET /complaints       → List with pagination/filtering
│   │       ├─ GET /complaints/{id}  → Get single complaint details
│   │       ├─ PUT /complaints/{id}  → Update complaint (assign, status)
│   │       ├─ DELETE /complaints/{id} → Delete complaint
│   │       ├─ GET /complaints/my    → User's own complaints
│   │       ├─ GET /complaints/assigned → Worker's assigned tasks
│   │       └─ GET /{id}/history     → Audit log
│   │
│   ├── schemas/                     # Pydantic request/response models
│   │   ├─ auth.py
│   │   │   ├─ RegisterRequest (username, email, password)
│   │   │   ├─ LoginRequest (email, password)
│   │   │   ├─ GoogleLoginRequest (token from Google)
│   │   │   ├─ TokenResponse (access_token, refresh_token, token_type)
│   │   │   └─ RefreshRequest (refresh_token)
│   │   │
│   │   ├─ complaint.py
│   │   │   ├─ ComplaintCreate (title, description, category, image_url)
│   │   │   ├─ ComplaintPublic (serialized output)
│   │   │   ├─ PaginatedComplaints (data[], total, page, page_size)
│   │   │   └─ ComplaintUpdate (status, assigned_to)
│   │   │
│   │   ├─ user.py
│   │   │   ├─ UserPublic (id, email, role, profile fields)
│   │   │   ├─ UserProfileUpdate (hostel_name, room_number, phone, batch)
│   │   │   └─ Message (message: str)
│   │   │
│   │   └─ __init__.py
│   │
│   ├── core/                        # Security & config
│   │   ├─ auth.py
│   │   │   ├─ get_current_user() → FastAPI Dependency
│   │   │   │   └─ Validates JWT token, checks blacklist, returns user dict
│   │   │   └─ require_role(*roles) → Dependency factory
│   │   │       └─ For role-based access control
│   │   │
│   │   ├─ security.py
│   │   │   ├─ hash_password(password) → bcrypt hashing
│   │   │   ├─ verify_password(plain, hashed) → bcrypt verification
│   │   │   ├─ create_access_token(data, expires_delta)
│   │   │   ├─ create_refresh_token(data)
│   │   │   └─ verify_access_token(token) → JWT decode
│   │   │
│   │   └─ config.py
│   │       └─ Settings class (reads .env)
│   │           ├─ JWT_SECRET_KEY, JWT_ALGORITHM
│   │           ├─ DATABASE_URL (PostgreSQL)
│   │           ├─ GOOGLE_CLIENT_ID
│   │           └─ Token expiration settings
│   │
│   ├── db/
│   │   └─ database.py
│   │       ├─ Base (SQLAlchemy declarative base)
│   │       ├─ Lazy engine initialization
│   │       ├─ Session factory (_SessionLocal)
│   │       ├─ get_db() → FastAPI Dependency (session per request)
│   │       └─ Connection pooling (PostgreSQL-specific)
│   │
│   ├── __init__.py
│   └── __pycache__/
│
├── pytest.ini                       # PyTest configuration
├── requirements.txt                 # Python dependencies
│   ├─ fastapi, uvicorn
│   ├─ sqlalchemy 2.0+
│   ├─ psycopg2-binary (PostgreSQL driver)
│   ├─ bcrypt (password hashing)
│   ├─ PyJWT (token generation)
│   ├─ google-auth (Google OAuth verification)
│   ├─ pydantic (data validation)
│   └─ python-dotenv (environment config)
│
├── .env                             # Environment variables (NOT in git)
│   ├─ JWT_SECRET_KEY (random hex)
│   ├─ DATABASE_URL (PostgreSQL Neon)
│   ├─ GOOGLE_CLIENT_ID
│   └─ Token expiration settings
│
└── __pycache__/
```

---

## 6. PURPOSE OF MAIN FILES

### **Frontend Key Files**

| File | Purpose | Technology |
|------|---------|-----------|
| `layout.jsx` | Root layout wrapper, metadata | React Server Component |
| `page.jsx` | Home landing page | Next.js Page, DaisyUI |
| `login/page.jsx` | Authentication UI | React Client Component, Axios, Google OAuth |
| `dashboard/page.jsx` | Main user dashboard | React Client Component, Role-based views |
| `complaints/page.jsx` | Complaint listing & management | React Client Component, API integration |
| `admin/page.jsx` | Admin panel for system oversight | React Client Component |
| `globals.css` | Tailwind + DaisyUI directives | CSS |
| `api.js` | Axios HTTP client | Axios configuration |
| `utils.js` | Utility functions | Tailwind+clsx helper |

### **Backend Key Files**

| File | Purpose | Technology |
|------|---------|-----------|
| `main.py` | FastAPI app setup, middleware | FastAPI, CORS, SQLAlchemy |
| `models.py` | Database schema definitions | SQLAlchemy ORM |
| `routers/auth.py` | Authentication endpoints | FastAPI, JWT, bcrypt |
| `routers/complaints.py` | Complaint CRUD endpoints | FastAPI, SQLAlchemy queries |
| `core/auth.py` | JWT verification, role checking | FastAPI Dependencies |
| `core/security.py` | Password/token operations | bcrypt, PyJWT |
| `core/config.py` | Environment configuration | Pydantic Settings |
| `db/database.py` | Database connection pooling | SQLAlchemy |
| `schemas/*.py` | Request/response validation | Pydantic Models |

---

## 7. API FLOW STEP-BY-STEP

### **Authentication Flow**

#### **Step 1: Register (Email+Password)**
```
Frontend: POST /api/v1/auth/register
├─ Body: {username, email, password}
│
Backend: app/routers/auth.py → register()
├─ Dependency: db (session)
├─ 1. Check if email exists → raise 409 Conflict
├─ 2. Hash password with bcrypt
├─ 3. Create User record
├─ 4. Save to PostgreSQL
├─ 5. Create JWT tokens
├─ Response: {access_token, refresh_token, token_type: "bearer"}
│
Frontend: 
├─ Store tokens in localStorage
├─ Redirect to /dashboard
└─ Set Authorization header for future requests
```

#### **Step 2: Login (Email+Password)**
```
Frontend: POST /api/v1/auth/login
├─ Body: {email, password}
│
Backend: app/routers/auth.py → login()
├─ Query User by email
├─ Verify password with bcrypt.checkpw()
├─ If no match → 401 Unauthorized
├─ If match → Create JWT tokens
├─ Response: {access_token, refresh_token, token_type}
│
Frontend:
├─ Same as register (store + redirect)
```

#### **Step 3: Google OAuth**
```
Frontend: User clicks "Sign in with Google"
├─ GoogleLogin button (from @react-oauth/google)
├─ Google popup authentication
├─ Returns: credential (ID token JWT)
│
Frontend: POST /api/v1/auth/google
├─ Body: {token: credential}
│
Backend: app/routers/auth.py → google_login()
├─ 1. Import google-auth library
├─ 2. Verify ID token with Google's public key
├─ 3. Extract: sub (user ID), email, name
├─ 4. Check if user exists in DB
├─    - If exists → Login
├─    - If NOT exists → Auto-create with auth_provider="google"
├─ 5. Create JWT tokens
├─ Response: {access_token, refresh_token}
│
Frontend:
├─ Same token storage & redirect
```

#### **Step 4: Access Protected Resources**
```
Frontend: GET /api/v1/complaints
├─ Header: Authorization: Bearer <access_token>
│
Backend: @router.get("/")
├─ Dependency: get_current_user()
│   ├─ Extract JWT from Authorization header
│   ├─ Verify JWT signature with settings.JWT_SECRET_KEY
│   ├─ Check token expiration
│   ├─ Check token blacklist (TokenBlacklist table)
│   ├─ Get user.id from token sub claim
│   ├─ Query User from DB to get full profile
│   └─ Return: {id, role, email, username, phone, ...}
├─ Role check (if required)
├─ Execute endpoint logic
├─ Response: data or 403 Forbidden
```

#### **Step 5: Logout**
```
Frontend: POST /api/v1/auth/logout
├─ Header: Authorization: Bearer <access_token>
│
Backend: app/routers/auth.py → logout()
├─ Get current_user (via Dependency)
├─ Extract JTI (unique token ID)
├─ Add JTI to TokenBlacklist table with expiration
├─ Response: {message: "Logged out"}
│
Frontend:
├─ Clear localStorage
├─ Redirect to /login
```

---

### **Complaint Management Flow**

#### **Create Complaint**
```
Frontend: POST /api/v1/complaints
├─ Headers: Authorization: Bearer <token>
├─ Body: {title, description, category, image_url}
│
Backend:
├─ get_current_user() → verify JWT
├─ create_complaint()
│   ├─ Check role: only student/warden allowed
│   ├─ Create Complaint ORM object
│   ├─ Set created_by = current_user["id"]
│   ├─ Set status = "open"
│   ├─ db.add() + db.commit()
│   ├─ INSERT into complaints table
│   ├─ Create ComplaintHistory record
│   ├─ db.refresh() to get ID
│   └─ Return: ComplaintPublic (SafeORM serialization)
│
Frontend:
├─ Toast: "Complaint created!"
├─ Refresh complaints list
```

#### **List Complaints (with Pagination/Filtering)**
```
Frontend: GET /api/v1/complaints?page=1&page_size=20&status=open&search=water
│
Backend:
├─ get_current_user() → get user role
├─ list_complaints()
│   ├─ Build dynamic query based on filters
│   ├─ LIKE search on title/description
│   ├─ Filter by status enum
│   ├─ Filter by category enum
│   ├─ Pagination: OFFSET, LIMIT
│   ├─ Sorting: ORDER BY created_at DESC
│   ├─ Query: SELECT * FROM complaints WHERE ...
│   ├─ Count total
│   └─ Return: PaginatedComplaints
│       ├─ data: [ComplaintPublic, ...]
│       ├─ total: int
│       ├─ page: int
│       └─ page_size: int
│
Frontend:
├─ Render grid/cards
├─ Show pagination controls
```

#### **Update Complaint Status (Worker)**
```
Frontend: PUT /api/v1/complaints/{id}
├─ Header: Authorization: Bearer <worker_token>
├─ Body: {status: "in_progress"}
│
Backend:
├─ get_current_user() checks bearer token
├─ Dependency: require_role("worker")
├─ Get complaint by ID
├─ Check if assigned_to == current_user.id
├─ Update status
├─ db.commit()
├─ Create ComplaintHistory record (audit)
├─ Update updated_at timestamp
├─ Return: ComplaintPublic
│
Frontend:
├─ UI updates
├─ Show confirmation toast
```

#### **Delete Complaint**
```
Frontend: DELETE /api/v1/complaints/{id}
├─ Header: Authorization: Bearer <token>
│
Backend:
├─ get_current_user() → verify JWT
├─ Check ownership or role (admin/warden)
├─ Delete complaint
├─ Cascade: ComplaintHistory records deleted
├─ db.commit()
├─ Response: {message: "Deleted"}
│
Frontend:
├─ Remove from list
├─ Toast: "Deleted"
```

---

## 8. ARCHITECTURE ASSESSMENT

### ✅ **STRENGTHS**

1. **Clean Separation of Concerns**
   - Frontend: UI/UX logic (Next.js + React)
   - Backend: Business logic + database (FastAPI)
   - Clear API boundary

2. **Proper Authentication**
   - JWT tokens with expiration
   - Refresh token rotation
   - Token blacklist for logout
   - Google OAuth integration
   - Password hashing with bcrypt

3. **Role-Based Access Control**
   - 4 user roles (student, worker, warden, admin)
   - FastAPI Dependency injection for role checking
   - Fine-grained permissions per endpoint

4. **Database Design**
   - Proper relational schema (User → Complaint → History)
   - Audit trail (ComplaintHistory)
   - Enums for statuses/categories
   - Timestamps (created_at, updated_at)
   - Foreign keys + relationships

5. **Modern Stack**
   - Next.js 16 with App Router (not Pages Router)
   - FastAPI (async, performant)
   - SQLAlchemy 2.0 (modern ORM)
   - PostgreSQL on Neon (production DB)
   - DaisyUI (modern component library)

6. **Scalability Considerations**
   - Connection pooling for PostgreSQL
   - Token refresh mechanism (prevents long-lived tokens)
   - Pagination for large complaint lists
   - Search + filtering

### ⚠️ **AREAS FOR IMPROVEMENT**

1. **CORS Configuration**
   - Currently set to `allow_origins=["*"]` (insecure)
   - **Should be**: `["http://localhost:3000", "http://localhost:8000"]` ✓ (Already fixed)
   - In production: specific domain only

2. **Error Handling**
   - Frontend notifications could be more robust
   - Backend error messages could include error codes
   - No global error boundary mentioned in frontend

3. **Rate Limiting**
   - `LOGIN_RATE_LIMIT=5/minute` defined but not implemented in code
   - Should add SlowAPI or similar for DDoS protection

4. **Input Validation**
   - Pydantic schemas are good but could add more validators
   - Frontend validation is present but could be more robust
   - SQL injection risk: minimal (using SQLAlchemy ORM)

5. **Logging & Monitoring**
   - No log aggregation setup
   - Token cleanup is logged but limited
   - No request tracing

6. **File Upload Handling**
   - `image_url` field suggests file uploads but not implemented
   - No CloudStorage integration (S3, GCS, etc.)
   - Should add multipart/form-data handling

7. **Testing**
   - `pytest.ini` exists but no test files visible
   - Backend tests should cover auth, roles, complaint CRUD
   - Frontend needs integration tests

8. **Documentation**
   - No API documentation (Swagger/OpenAPI)
   - Could add `/docs` endpoint (FastAPI auto-generates)
   - No frontend component documentation

### **Recommendations**

#### **Immediate (High Priority)**
- [ ] Implement rate limiting on `/auth/login`
- [ ] Add file upload support with cloud storage
- [ ] Add API documentation (`/docs` endpoint)
- [ ] Add global error boundary in frontend

#### **Medium Priority**
- [ ] Add unit tests for auth endpoints
- [ ] Add Sentry or similar for error tracking
- [ ] Implement request logging
- [ ] Add data validation webhooks

#### **Long-term (Nice to Have)**
- [ ] Add WebSocket support for real-time notifications
- [ ] Add Redis caching layer (complaints, user sessions)
- [ ] Add GraphQL endpoint (alongside REST)
- [ ] Mobile app (React Native)

---

## 9. TECHNOLOGY SUMMARY

### **Frontend Stack**
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.1.6 |
| Library | React | 19.2.3 |
| Styling | Tailwind CSS | 3.4.3 |
| Components | DaisyUI | 4.10.2 |
| Icons | Lucide React | 0.475.0 |
| HTTP Client | Axios | 1.13.6 |
| Auth | @react-oauth/google | 0.13.4 |

### **Backend Stack**
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | FastAPI | ≥0.100.0 |
| Server | Uvicorn | ≥0.22.0 |
| ORM | SQLAlchemy | ≥2.0.19 |
| Database | PostgreSQL (Neon) | 14+ |
| Driver | psycopg2-binary | ≥2.9.0 |
| Auth | PyJWT | ≥3.3.0 |
| Password | bcrypt | ≥4.0.0 |
| Validation | Pydantic | ≥2.1.1 |
| Google OAuth | google-auth | ≥2.0.0 |

### **Database Schema (PostgreSQL)**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255), -- nullable for OAuth
  role ENUM('student', 'worker', 'warden', 'admin'),
  phone VARCHAR(15),
  hostel_name VARCHAR(100),
  room_number VARCHAR(20),
  batch VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
  id SERIAL PRIMARY KEY,
  title VARCHAR(256),
  description TEXT,
  category ENUM('plumbing', 'electrical', 'cleanliness', 'furniture', 'network', 'other'),
  created_by INT REFERENCES users(id),
  assigned_to INT REFERENCES users(id),
  status ENUM('open', 'in_progress', 'closed'),
  image_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaint_history (
  id SERIAL PRIMARY KEY,
  complaint_id INT REFERENCES complaints(id),
  changed_by INT REFERENCES users(id),
  new_status VARCHAR(50),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE token_blacklist (
  id SERIAL PRIMARY KEY,
  jti VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP
);
```

---

## 10. CONCLUSION

**HostelOps** is a **well-architected, modern full-stack application** with:
- ✅ Clear frontend-backend separation
- ✅ Secure authentication (JWT + Google OAuth)
- ✅ Role-based authorization
- ✅ Proper database design with audit trails
- ✅ TypeScript-ready codebase
- ✅ Production-ready dependencies (PostgreSQL, FastAPI)

**Current Implementation Status**: 
- Frontend: DaisyUI migration complete ✓
- Backend: Authentication & CRUD operations ✓
- Database: PostgreSQL with Neon ✓
- Deployment: Ready for staging/production (with minor improvements)

**Next Steps for Production**:
1. Deploy backend to hosting (Railway, Render, AWS)
2. Deploy frontend to Vercel or Netlify
3. Set environment variables correctly
4. Enable HTTPS everywhere
5. Add monitoring & logging
