# Task Management App

Spark is a task management app that looks like a Kanban board built with Flask (Python) for the backend and React (JavaScript) for the frontend. It helps you organize your tasks into lists and keep track of tasks that are completed


https://github.com/user-attachments/assets/2016bf4b-add3-4b31-9107-c2ec740aa3ef




## Backend
- **SQLite** is used for the database, with migrations set up to update any schema changes (Flask-Migrate). I chose SQLite because it is lightweight and requires no configuration, suitable for this project. However, as this project scales and is deployed into production, I will consider a different type of database, such as PostgreSQL or MySQL.
- **Session management** is used for authentication (Flask-Login). This type of auth stores user-specific data across requests, like login status, using cookies.
- **RESTful APIs** are used to facilitate communication between the backend and the frontend.
### Database Design
<img width="875" alt="Screenshot 2025-06-03 at 1 39 29 PM" src="https://github.com/user-attachments/assets/1c4d53c8-03bd-4022-8f4b-8017c8f813a5" />

### RESTful APIs
#### Authentication
| Method  | Route | Explanation |
| ------------- | ------------- | ------------- |
| POST | `/auth/register`  | Add a new user to the database  |
| POST  | `/auth/login`  | Retrieve an existing user from the database |
| POST | `/auth/logout` | Log out user from the session |

#### Lists
| Method  | Route | Explanation |
| ------------- | ------------- | ------------- |
| POST | `/lists/`  | Create a new list to the database  |
| GET  | `/lists/`  | Retrieve all lists for a user from the database  |
| PATCH | `/lists/<int:list_id>`  | Change the name of a specific list  |
| DELETE  | `/lists/<int:list_id>`  | Delete a specific list |

#### Tasks
| Method  | Route | Explanation |
| ------------- | ------------- | ------------- |
| POST | `/tasks/`  | Create a new task to the database  |
| PATCH | `/tasks/<int:list_id>`  | Change the name of a specific task  |
| DELETE  | `/tasks/<int:list_id>`  | Delete a specific task |

## Frontend
- Material-UI for reusable components
- `useContext` hook is used to pass down the info of the authenticated user
<img width="1216" alt="Screenshot 2025-06-03 at 2 39 44 PM" src="https://github.com/user-attachments/assets/b8595631-baf2-49e3-86d5-92a2b94ea825" />


## How to Run the App
1. Clone this GitHub repo
   ```bash
   git clone https://github.com/thuinanutshell/task-management-app
   ```
2. Create a `.env` file in the root directory and set `SQLALCHEMY_DATABASE_URI` and `SECRET_KEY`
3. Create a virtual environment before running the app
   ```bash
   python3 -m venv .venv
   . .venv/bin/activate
   ```
4. Run the app in the backend directory
   ```bash
   cd backend
   python3 app.py
   ```
5. Run the app in the frontend directory
   ```bash
   cd frontend
   npm start
   ```

## Bugs Documentation & What I've Tried to Fix Them (Ongoing)
- Database:
  - Changes in the database schema. Migrate is the way to go because we do not need to remove all the data when the schema is updated (and this should be the best practice in production). However, when building a small-medium application like this, you might encounter the error where, after you perform the migration, the database is not updated or is affected by the old one. In this case, you can work around by creating a script called `reset_db.py` to reset the schema.
  - Circular import and custom base: SQLAlchemy is trying to map the User model class more than once.
- Application Factory: Not sure why when I tried to designed the backend as the application factory (using `create_app`) instead of running the app directly, the communication between the frontend and the backend did not work (the user could sign up - 201, then logged in - 200, then got redirected to the login page again - 302 without their lists being fetched properly). I tried a different approach, like checking the context, changing the CORS to make it less strict. Still no hope for a full day. Until I tried to run the app directly on a different port 5001, it worked. Still figuring out the reason why.

## Further Questions
- How do apps like Trello scale their task management system? How to write production-ready code for such an application?
- As a user, what do I think is a great task management tool?

## Next Steps
- [ ] Write comprehensive test suites for the backend using `pytest`
- [ ] Employ JWT authentication and compare the trade-offs between session management and JWT
- [ ] Add a new feature for creating subtasks that belong to a parent task
- [ ] Add a  grid tracking for reflection of the feats of the day
- [ ] Add a weekly summary of tasks that have been done
- [ ] Add a drag and drop feature for tasks
- [ ] Improve the interface that I like instead of just using the built-in design of Material UI components
- [ ] Deploy the project on Vercel (frontend) and Render (backend)
