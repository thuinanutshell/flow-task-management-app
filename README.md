# Flow - Your Ultimate Task Management App
## Table of Contents

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

Given the scope of the project (which is small-medium size), I decided to use a lightweight framework like Flask and a serverless database like SQLite. I am most comfortable with Python, so I chose it as the language for the backend. When the project scales, I'm considering using a more scalable database like PostgreSQL and the FastAPI framework.

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

### User Flow

### Folder Structure

### Services/Hooks
