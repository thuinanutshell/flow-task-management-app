# Flow - Your Ultimate Task Management App
- [Tech Stack](#tech-stack)
- [Problem Statement](#problem-statement)
- [Features](#features)
- [Backend](#backend)
- [Frontend](#frontend)

## Tech Stack
### Client
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Mantine](https://img.shields.io/badge/Mantine-339AF0?style=for-the-badge&logo=mantine&logoColor=white)

At first, I wanted to use Shadcn UI for the pre-built components, but because it is built with TypeScript, I had some trouble setting it up and keeping things compatible. As a result, I decided to use a library more compatible with React-Vite and JavaScript;

### Server
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![Gemini API](https://img.shields.io/badge/Gemini%20API-4285F4?style=for-the-badge&logo=google&logoColor=white)

Given the scope of the project (which is small-medium size), I decided to use a lightweight framework like Flask and a serverless database like SQLite. I am most comfortable with Python, so I chose it as the language for the backend. When the project scales, I'm considering using a more scalable database like PostgreSQL and the FastAPI framework.

## Problem Statement
We generate data every day - the data that helps us understand our behaviors and challenges better. I find the available task management tool lacking in the data collection and experimentation aspect. My goal with Flow is to address some problems I encounter when it comes to managing tasks or productivity. Because I believe it is such a waste not to make use of our daily data to become better.
- **Poor time estimation** of how long a task would take (either overestimating easy tasks or underestimating difficult tasks)
- **Lack of an analytics space** to extract the patterns based on past data (planned vs actual duration to complete a task, the mental state when doing the task, and the detailed reflection after completing the task)
- **Lack of a tool to experiment** with different techniques or methods to confirm whether a change in behavior is effective or not.

## Features
- CRUD Operations: Users can create, read, update, and delete projects, categories, lists, and tasks.
- Analytics: Users can retrieve data to see statistics about their completion rate, estimation accuracy, etc., by category and by project.
- Experiments: Users can set up experiments to apply to certain types of tasks and measure the impact.
<img width="1215" alt="Screenshot 2025-06-20 at 8 19 08 PM" src="https://github.com/user-attachments/assets/571e8a11-5e10-4a78-a565-3115ec4f3e8a" />

## Backend

### Folder Structure (Application Factory Pattern)
The backend is structured using the Application Factory Pattern, with the API layer (defining the routes) and services layer (defining the business logic and how to interact with the database tables)
```
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── categories.py
│   │   ├── lists.py
│   │   ├── projects.py
│   │   └── tasks.py
│   │   └── analytics.py
│   │   └── experiments.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── analytics.py
│   │   ├── base.py
│   │   ├── experiment.py
│   │   ├── project.py
│   │   ├── task.py
│   │   └── user.py
│   ├── services/
│   │   └── auth_service.py
│   │   └── project_service.py
│   │   └── category_service.py
│   │   └── task_service.py
│   │   └── analytics_service.py
│   │   └── experiment_service.py
│   ├── utils/
│   ├── __init__.py
│   └── config.py
├── migrations/
├── requirements.txt
├── reset_db.py
└── run.py
```

### Database Design

### REST APIs
#### Authentication Endpoints
| Endpoint | Method | Description |
|----------|----------|----------|
| `/auth/register`| POST     | Register new user     |
| `/auth/login`   | POST     | Log in existing user    |
| `/auth/oauth/google`| POST    | Sign up or Log in with Google   |
| `/auth/logout`   | POST     | Log out an authenticated user     |
| `/auth/profile`   | GET   | Retrieve user's profile    |
| `/auth/update`   | PATCH    | Partially update user's profile     |
| `/auth/delete`   | DELETE    | Delete user's profile     |

#### Category Endpoints
| Endpoint | Method | Description |
|----------|----------|----------|
| `/category/`| POST     | Add a new category     |
| `/category/`   | GET     | Retrieve all categories for the current user   |
| `/category/<int:category_id>`   | PATCH    | Partially update a category     |
| `/category/<int:category_id>` | DELETE    | Delete a category     |
| `/category/<int:category_id>/tasks` | DELETE    | Get all tasks that belong to a specific category|
| `/category/options` | GET    | Get a list of categories (dropdowns) |

#### Project Endpoints
| Endpoint | Method | Description |
|----------|----------|----------|
| `/project/`| POST     | Add a new project     |
| `/project/`   | GET     | Retrieve all projects for the current user   |
| `/project/<int:project_id>`   | GET    | Retrieve a project with all its lists     |
| `/project/<int:project_id>/summary` | GET    | Get a project summary statistics without detailed information|
| `/project/<int:project_id>` | PATCH    | Partially update a project     |
| `/project/<int:project_id>` | DELETE    | Delete a specific project |

#### List Endpoints
| Endpoint | Method | Description |
|----------|----------|----------|
| `/list/<int:project_id>`| POST     | Create a new list inside a project     |
| `/list/<int:list_id>`   | GET     | Get a specific list with all its tasks   |
| `/list/<int:list_id>`   | PATCH    | Partially update a specific list     |
| `/list/<int:list_id>` | DELETE    | Delete a specific list     |
| `/list/<int:list_id>/summary` | GET    | Retrieve a list summary without full task details |

#### Task Endpoints
| Endpoint | Method | Description |
|----------|----------|----------|
| `/task/`| POST     | Add a new task     |
|`/task/create-options` | GET    | Get options needed for task creation |
| `/task/<int:task_id>`   | GET     | Retrieve a specific task by ID   |
| `/task/<int:task_id>`   | PATCH    | Partially update a task     |
| `/task/<int:task_id>` | DELETE    | Delete a task     |
| `/task/<int:task_id>/timer/work` | POST    | Start timer for new task OR resume timer for paused task|
| `/task/<int:task_id>/timer/pause` | POST   | Pause active timer |
| `/task/<int:task_id>/timer/complete` | POST    | Complete timer and mark task as done |
| `/task/<int:task_id>/timer/status` | GET    | Get current timer status for a task |
|`/task/<int:task_id>/timer/expired` | GET    | Check if timer has expired and needs user action |
|`/task/<int:task_id>/timer/poll` | GET    | Lightweight endpoint for frontend polling |

## Frontend

### User Flow
![user_flow](https://github.com/user-attachments/assets/fef0b9b2-2719-4bcc-a50d-313e31de66c9)


### Folder Structure
```
frontend/
├── node_modules/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx
│   │   │   └── Sidebar.jsx
│   │   └── ui/
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── TimerContext.jsx
│   ├── features/
│   │   ├── categories/
│   │   │   ├── CategoryCard.jsx
│   │   │   ├── CreateCategoryModal.jsx
│   │   │   └── EditCategoryModal.jsx
│   │   ├── lists/
│   │   │   ├── CreateListModal.jsx
│   │   │   ├── GetListFromProjectsModal.jsx
│   │   │   └── ListCard.jsx
│   │   ├── projects/
│   │   │   ├── CreateProjectModal.jsx
│   │   │   ├── EditProjectModal.jsx
│   │   │   ├── ProjectCard.jsx
│   │   │   └── ProjectDetailView.jsx
│   │   └── tasks/
│   │       └── AddTaskModal.jsx
│   ├── hooks/
│   │   ├── useCategories.js
│   │   ├── useProjects.js
│   │   ├── useTasks.js
│   │   └── useWorkspaceLists.js
│   ├── pages/
│   │   ├── Analytics.jsx
│   │   ├── Calendar.jsx
│   │   ├── Categories.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Experiments.jsx
│   │   ├── Login.jsx
│   │   ├── Profile.jsx
│   │   └── Projects.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── lists.js
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── theme.js
```

### Services/Hooks



























