# TeamFlow

TeamFlow is a full-stack **Project Management SaaS** designed to help teams organize organizations, projects, tasks, comments, and AI-powered project workflows from a single platform.

## 🚀 Features

* 🔐 User registration and login
* 🔑 JWT-based authentication
* 🏢 Organization management
* 👥 Organization members and roles
* 📁 Project management
* ✅ Task management
* 💬 Task comments
* 🛡️ Role-based access control (RBAC)
* 📊 AI project status summaries
* 🧪 Unit and API testing
* 🐘 PostgreSQL database
* 🐳 Docker-based PostgreSQL setup
* ⚡ RESTful backend APIs
* 💻 React frontend

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* Axios
* React Router
* CSS / Tailwind CSS

### Backend

* Node.js
* Express.js
* PostgreSQL
* JWT
* REST APIs
* Middleware-based authorization

### AI

* Groq API
* Groq SDK
* AI-powered task generation
* AI-powered project summaries

### Development Tools

* Git & GitHub
* Docker
* Postman
* VS Code
* Nodemon

---

## 📂 Project Structure

```text
TeamFlow/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── server.js
│   │
│   ├── .env
│   ├── package.json
│   └── Docker configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/TeamFlow.git
cd TeamFlow
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend` directory.

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=teamflow
DB_USER=teamflow
DB_PASSWORD=your_database_password

JWT_SECRET=your_jwt_secret

GROQ_API_KEY=your_groq_api_key
AI_MODEL=your_groq_model
```

### 4. Start PostgreSQL with Docker

From the project root:

```bash
docker compose up -d
```

Verify that the database container is running:

```bash
docker ps
```

### 5. Start the backend

```bash
cd backend
npm run dev
```

Backend:

```text
http://localhost:5000
```

### 6. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🔐 Demo Account

Use the following account to test the application:

**Email**

```text
aryan@example.com
```

**Password**

```text
password123
```

---

# 🧩 Core Modules

## Authentication

TeamFlow provides:

* User registration
* User login
* JWT authentication
* Protected routes
* Current-user information
* Authentication middleware

### Authentication Flow

```text
User
  ↓
Login
  ↓
Backend validates credentials
  ↓
JWT generated
  ↓
Frontend stores token
  ↓
Token sent with API requests
  ↓
Authentication middleware
  ↓
Protected resource
```

---

## 🏢 Organizations

Organizations allow users to create and manage teams.

Supported operations include:

* Create organization
* Get organization
* View members
* Add members
* Change member roles
* Remove members

Example roles:

```text
OWNER
ADMIN
MEMBER
```

---

## 📁 Projects

Projects belong to organizations.

Users can:

* Create projects
* View projects
* View individual projects
* Update projects
* Delete projects

Example:

```text
Organization
      ↓
   Project
      ↓
    Tasks
```

---

## ✅ Tasks

Tasks represent individual pieces of work inside a project.

Task functionality includes:

* Create task
* View tasks
* View individual task
* Update task
* Delete task
* Assign tasks
* Set task priority
* Track task status

Example task statuses:

```text
TODO
IN_PROGRESS
COMPLETED
```

Example priorities:

```text
LOW
MEDIUM
HIGH
```

---

## 💬 Comments

Team members can communicate directly through task comments.

Users can:

* Create comments
* View comments
* Delete comments

Example:

```text
Task
 ├── Comment
 ├── Comment
 └── Comment
```

---

# 🤖 AI Features

TeamFlow includes AI functionality to assist with project management.

---

## AI Project Summary

TeamFlow can analyze the current project context and generate a concise project status summary.

The AI uses information such as:

* Project details
* Tasks
* Task status
* Task priority
* Project progress

The generated summary helps users quickly understand the current state of a project.

---

# 🔌 API Modules

The backend is organized around RESTful API modules.

```text
/api/auth
/api/organizations
/api/projects
/api/tasks
/api/comments
/api/ai
```

### Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Organizations

```text
POST   /api/organizations
GET    /api/organizations/:orgId
GET    /api/organizations/:orgId/members
POST   /api/organizations/:orgId/members
PATCH  /api/organizations/:orgId/members/:userId
DELETE /api/organizations/:orgId/members/:userId
```

### Projects

```text
POST   /api/projects
GET    /api/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId
DELETE /api/projects/:projectId
```

### Tasks

```text
POST   /api/projects/:projectId/tasks
GET    /api/projects/:projectId/tasks
GET    /api/tasks/:taskId
PATCH  /api/tasks/:taskId
DELETE /api/tasks/:taskId
```

### Comments

```text
POST   /api/tasks/:taskId/comments
GET    /api/tasks/:taskId/comments
DELETE /api/comments/:commentId
```

### AI

```text
GET    /api/ai/project/:projectId/data
POST   /api/ai/tasks
POST   /api/ai/project/:projectId/summary
```

---

# 🧪 Testing

The project includes testing for important backend functionality.

Tests can cover:

* Authentication
* Organization permissions
* Project CRUD
* Task CRUD
* Comments
* Role-based access control
* AI services

Run tests with:

```bash
npm test
```

---

# 🔒 Security

TeamFlow uses several security mechanisms:

* JWT authentication
* Password hashing
* Protected routes
* Role-based authorization
* Request validation
* Environment variables for secrets
* Database access controls

Sensitive values such as API keys and JWT secrets should never be committed to Git.

---

# 🐳 Docker

PostgreSQL can be run using Docker.

```bash
docker compose up -d
```

Stop the containers:

```bash
docker compose down
```

View running containers:

```bash
docker ps
```

---

# 🔄 Application Workflow

```text
                ┌──────────────┐
                │     User     │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │     Login    │
                └──────┬───────┘
                       │ JWT
                       ▼
              ┌─────────────────┐
              │  Organization   │
              └────────┬────────┘
                       │
                       ▼
                ┌──────────────┐
                │    Project   │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │     Tasks    │
                └──────┬───────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
        ┌───────────┐     ┌───────────┐
        │ Comments  │     │ AI Tools  │
        └───────────┘     └───────────┘
```

---

# 🎯 Project Goals

TeamFlow was built to demonstrate practical full-stack development skills including:

* REST API development
* Authentication and authorization
* PostgreSQL database design
* Backend architecture
* React frontend development
* Role-based access control
* Docker
* API testing
* AI integration
* Full-stack application deployment

---

# 👨‍💻 Author

**Aryan **

Full-Stack / Backend Developer

Built with **React, Node.js, Express, PostgreSQL, Docker, and AI**.
