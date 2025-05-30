# Task Management App

Spark is a task management app that looks like a Kanban board built with Flask (Python) for the backend and React (JavaScript) for the frontend. It helps you organize your tasks into lists and keep track of tasks that are completed

## Backend
- SQLite is used for the database, with migrations set up to update any schema changes (Flask-Migrate)
- Session management is used for authentication (Flask-Login)
- REST APIs are used to facilitate communication between the backend and the frontend

## Frontend
- `useContext` hook is used to pass down the info of the authenticated user

## Bugs Documentation & What I've Tried to Fix Them (Ongoing)
- Database:
  - Changes in the database schema. Migrate is the way to go because we do not need to remove all the data when the schema is updated (and this should be the best practice in production). However, when building a small-medium application like this, you might encounter the error where, after you perform the migration, the database is not updated or is affected by the old one. In this case, you can work around by creating a script called `reset_db.py` to reset the schema.
  - Circular import and custom base.
- Application Factory
- Connection between frontend and backend
- 302 Status Code

## Next Steps
- I want to try JWT authentication and compare the trade-offs between session management and JWT
- Deploy the project on Vercel (frontend) and Render (backend)
- Maybe use another database like MySQL instead of SQLite
