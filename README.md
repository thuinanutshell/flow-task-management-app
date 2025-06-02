# Task Management App

Spark is a task management app that looks like a Kanban board built with Flask (Python) for the backend and React (JavaScript) for the frontend. It helps you organize your tasks into lists and keep track of tasks that are completed

## Interface (v0.0)

<img width="1218" alt="Screenshot 2025-05-31 at 10 37 41 AM" src="https://github.com/user-attachments/assets/c327d726-42c1-422b-be50-f8dc29ab09cc" />


## Backend
### Database Design
- SQLite is used for the database, with migrations set up to update any schema changes (Flask-Migrate)
- Session management is used for authentication (Flask-Login)
- REST APIs are used to facilitate communication between the backend and the frontend
### APIs

## Frontend
- Material-UI for reusable components
- `useContext` hook is used to pass down the info of the authenticated user

## Bugs Documentation & What I've Tried to Fix Them (Ongoing)
- Database:
  - Changes in the database schema. Migrate is the way to go because we do not need to remove all the data when the schema is updated (and this should be the best practice in production). However, when building a small-medium application like this, you might encounter the error where, after you perform the migration, the database is not updated or is affected by the old one. In this case, you can work around by creating a script called `reset_db.py` to reset the schema.
  - Circular import and custom base: SQLAlchemy is trying to map the User model class more than once.
- Application Factory: Not sure why when I tried to designed the backend as the application factory (using `create_app`) instead of running the app directly, the communication between the frontend and the backend did not work (the user could sign up - 201, then logged in - 200, then got redirected to the login page again - 302 without their lists being fetched properly). I tried a different approach, like checking the context, changing the CORS to make it less strict. Still no hope for a full day. Until I tried to run the app directly on a different port 5001, it worked. Still figuring out the reason why.

## Further Questions
- How do apps like Trello scale their task management system? How to write production-ready code for such an application?
- As a user, what do I think is a great task management tool?

## Next Steps
- Write tests for the backend using `pytest`
- I want to try JWT authentication and compare the trade-offs between session management and JWT
- Deploy the project on Vercel (frontend) and Render (backend)
- Maybe use another database like MySQL instead of SQLite
