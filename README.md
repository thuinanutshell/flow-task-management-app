
# Flow - Your Ultimate Task Management App
- [Tech Stack](#tech-stack)
- [Problem Statement](#problem-statement)
- [Features](#features)
- [Backend](#backend)
- [Frontend](#frontend)
- [Under Development](#under-development)
- [Usage Guide](#usage-guide)
- [Key Learnings](#key-learnings)

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

Given the scope of the project (which is [small-medium size](https://sqlite.org/features.html)), I decided to use a lightweight framework like Flask and a serverless database like SQLite. I am most comfortable with Python, so I chose it as the language for the backend. When the project scales, I'm considering using a more scalable database like PostgreSQL and the FastAPI framework.


https://github.com/user-attachments/assets/bd11a8d9-e4c6-4d4e-8509-350ef678074a



## Problem Statement
We generate data every day - the data that helps us understand our behaviors and challenges better. I find the available task management tool lacking in the data collection and experimentation aspect. My goal with Flow is to address some problems I encounter when it comes to managing tasks or productivity. Because I believe it is such a waste not to make use of our daily data to become better.
- **Poor time estimation** of how long a task would take (either overestimating easy tasks or underestimating difficult tasks)
- **Lack of an analytics space** to extract the patterns based on past data (planned vs actual duration to complete a task, the mental state when doing the task, and the detailed reflection after completing the task)
- **Lack of a tool to experiment** with different techniques or methods to confirm whether a change in behavior is effective or not.

## Features
- CRUD Operations: Users can create, read, update, and delete projects, categories, lists, and tasks.
- Analytics: Users can retrieve data to see statistics about their completion rate, estimation accuracy, etc., by category and by project.
- Experiments: Users can set up experiments to apply to certain types of tasks and measure the impact.





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
![Editor _ Mermaid Chart-2025-06-21-021004](https://github.com/user-attachments/assets/e7ae84d6-0ab4-4367-b5c9-388221bfb518)

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
![crud_user_flow](https://github.com/user-attachments/assets/bb467c9d-79b4-470d-ba24-52bfb8937b1c)


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

## Under Development
- Analytics dashboard to show statistics about total completed tasks, accuracy estimation rate, time spent on different types of tasks, and AI-powered insights generation
- Experiments that allow users to conduct productivity-related experiments, such as time estimation multiplier, and practice to improve mental state.

## Usage Guide
1. Clone this GitHub repo:
```
git clone https://github.com/thuinanutshell/flow-task-management-app
```
2. Create a virtual environment in the root directory (not inside the backend or the frontend)
```
python3 -m venv .venv
```
3. Activate the virtual environment
```
. .venv/bin/activate
```
4. Change to the backend folder & Install all the requirements
```
cd backend
pip install -r requirements.txt
```
5. Create an environment variable file
```
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
SECRET_KEY = "super-secret-key"
JWT_SECRET_KEY = "super-secret-key"
```
6. Run the backend
7. Open another terminal and change to the frontend directory
```
cd frontend
```
8. Run the frontend
```
npm install
npm run dev
```

## Key Learnings
- Having clear user stories and user flow is so important that I couldn't emphasize it enough, even more so now that we have AI assistants. At some point, I myself wasn't so sure about the timer user flow, and I made a mistake by asking AI to suggest the code structure I could follow. But then, I took a step back and asked myself: Was the way I explained the flow clear enough? And do I really understand it? Then I chose the traditional way, using a pen and paper to draw out the interactions on the frontend. As a result, I could explain the context much better to the LLM and decided on a solution that was way simpler. Specifically, I was faced with two design options:
  - To create a separate table to store the time sessions - basically, when a user starts a timer, that counts as a session - this idea came from the fact that there are two buttons on the frontend - start and resume, which I thought might need two separate logics for the endpoints.
  - To create a logic in the Tasks table for continuous updates, like cumulatively adding more time when the user resumes the timer again. I decided to go with the second one because it is easy to understand, and it turned out that the Start and Resume buttons can use the same endpoint since the key idea is to **keep adding the time the user has worked**






















