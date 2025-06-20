# Flow - Your Ultimate Task Management App

## Problem Statement
We generate data every day - the data that helps us understand our behaviors and challenges better. I find the available task management tool lacking in the data collection and experimentation aspect. My goal with Flow is to address some problems I encounter when it comes to managing tasks or productivity. Because I believe it is such a waste not to make use of our daily data to become better.
- Poor time estimation of how long a task would take (either overestimating easy tasks or underestimating difficult tasks)
- Lack of an analytics space to extract the patterns based on past data (planned vs actual duration to complete a task, the mental state when doing the task, and the detailed reflection after completing the task)
- Lack of a tool to experiment with different techniques or methods to confirm whether a change in behavior is effective or not.

## Features
<img width="1215" alt="Screenshot 2025-06-20 at 8 19 08 PM" src="https://github.com/user-attachments/assets/571e8a11-5e10-4a78-a565-3115ec4f3e8a" />

### CRUD Operations
Users can create, read, update, and delete projects, categories, lists, and tasks.

### Analytics
Users can retrieve data to see statistics about their completion rate, estimation accuracy, etc., by category and by project.

### Experiments
Users can set up experiments to apply to certain types of tasks and measure the impact.

## Backend
Tech Stack: Flask, Python, SQLite

### Folder Structure
```
backend/
├── app/
│   ├── api/
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

## Frontend

Tech Stack: React-Vite, Mantine, JavaScript

### User Flow

### Folder Structure

### Services/Hooks
