## 1. Project Setup

- [ ] 1.1 Initialize monorepo structure with backend/ and frontend/ directories
- [ ] 1.2 Create backend requirements.txt with Flask, SQLAlchemy, psycopg2, redis, PyJWT, bcrypt, flask-cors, python-dotenv
- [ ] 1.3 Create Flask app structure (app/__init__.py, config.py, run.py)
- [ ] 1.4 Set up database models with SQLAlchemy (Base, engine, session)
- [ ] 1.5 Configure PostgreSQL connection via environment variables
- [ ] 1.6 Set up Redis connection for session caching
- [ ] 1.7 Create Flask route blueprints for api/v1 endpoints
- [ ] 1.8 Initialize React + Vite frontend project with package.json
- [ ] 1.9 Install frontend dependencies (react, react-dom, react-router-dom, bootstrap, axios, chart.js, react-chartjs-2)
- [ ] 1.10 Configure Vite for proxy to backend API
- [ ] 1.11 Set up GitHub Actions CI/CD workflow for backend and frontend

## 2. Backend - Authentication (user-auth)

- [ ] 2.1 Create User model (id, email, password_hash, name, role, created_at)
- [ ] 2.2 Create RoleType enum (individual, family_admin)
- [ ] 2.3 Implement password hashing utility with bcrypt
- [ ] 2.4 Implement JWT access token generation (15min expiry)
- [ ] 2.5 Implement JWT refresh token generation (7 day expiry)
- [ ] 2.6 Implement /api/v1/auth/register POST endpoint with validation
- [ ] 2.7 Implement /api/v1/auth/login POST endpoint returning tokens in httpOnly cookie
- [ ] 2.8 Implement /api/v1/auth/refresh POST endpoint
- [ ] 2.9 Implement /api/v1/auth/profile GET endpoint (authenticated)
- [ ] 2.10 Implement /api/v1/auth/profile PUT endpoint (authenticated)
- [ ] 2.11 Add auth middleware to protect routes with JWT validation
- [ ] 2.12 Write unit tests for auth endpoints

## 3. Backend - Goals (goal-management)

- [ ] 3.1 Create Goal model (id, user_id, title, description, category, status, target_date, created_at)
- [ ] 3.2 Create GoalCategoryType enum (financial, health, career, personal)
- [ ] 3.3 Create GoalStatusType enum (not_started, in_progress, completed)
- [ ] 3.4 Create Milestone model (id, goal_id, title, target_date, completed)
- [ ] 3.5 Create ProgressEntry model (id, goal_id, user_id, notes, value, created_at)
- [ ] 3.6 Implement /api/v1/goals GET endpoint (list with filters)
- [ ] 3.7 Implement /api/v1/goals POST endpoint (create goal)
- [ ] 3.8 Implement /api/v1/goals/{id} GET endpoint (single goal)
- [ ] 3.9 Implement /api/v1/goals/{id} PUT endpoint (update goal)
- [ ] 3.10 Implement /api/v1/goals/{id} DELETE endpoint
- [ ] 3.11 Implement /api/v1/goals/{id}/milestones GET endpoint
- [ ] 3.12 Implement /api/v1/goals/{id}/milestones POST endpoint
- [ ] 3.13 Implement /api/v1/goals/{id}/progress GET endpoint
- [ ] 3.14 Implement /api/v1/goals/{id}/progress POST endpoint
- [ ] 3.15 Add ownership validation (403 on unauthorized access)
- [ ] 3.16 Write unit tests for goal endpoints

## 4. Backend - Habits (habit-tracking)

- [ ] 4.1 Create Habit model (id, user_id, name, frequency, current_streak, longest_streak, created_at)
- [ ] 4.2 Create HabitFrequencyType enum (daily, weekly)
- [ ] 4.3 Create HabitCompletion model (id, habit_id, user_id, completed_date, created_at)
- [ ] 4.4 Implement /api/v1/habits GET endpoint (list with streaks)
- [ ] 4.5 Implement /api/v1/habits POST endpoint (create habit)
- [ ] 4.6 Implement /api/v1/habits/{id} GET endpoint (single habit)
- [ ] 4.7 Implement /api/v1/habits/{id} DELETE endpoint
- [ ] 4.8 Implement /api/v1/habits/{id}/complete POST endpoint
- [ ] 4.9 Implement /api/v1/habits/{id}/history GET endpoint
- [ ] 4.10 Implement streak calculation logic on completion
- [ ] 4.11 Add period uniqueness constraint (one completion per habit per day/week)
- [ ] 4.12 Write unit tests for habit endpoints

## 5. Backend - Budgets (financial-budgeting)

- [ ] 5.1 Create Budget model (id, user_id, name, total_amount, start_date, end_date, created_at)
- [ ] 5.2 Create BudgetCategory model (id, budget_id, name, allocated_amount, remaining_amount)
- [ ] 5.3 Create Expense model (id, category_id, user_id, amount, description, date, created_at)
- [ ] 5.4 Implement /api/v1/budgets GET endpoint (list)
- [ ] 5.5 Implement /api/v1/budgets POST endpoint (create budget)
- [ ] 5.6 Implement /api/v1/budgets/{id} GET endpoint (single budget)
- [ ] 5.7 Implement /api/v1/budgets/{id} DELETE endpoint
- [ ] 5.8 Implement /api/v1/budgets/{id}/categories POST endpoint
- [ ] 5.9 Implement /api/v1/budgets/{id}/expenses POST endpoint
- [ ] 5.10 Implement budget summary aggregation query (allocated vs spent per category)
- [ ] 5.11 Add validation for expense amount deduction from category remaining
- [ ] 5.12 Write unit tests for budget endpoints

## 6. Backend - Dashboard (progress-dashboard)

- [ ] 6.1 Create /api/v1/dashboard GET endpoint (aggregated view)
- [ ] 6.2 Implement goal progress summary query (counts by category and status)
- [ ] 6.3 Implement recent progress entries query (last 3 per goal)
- [ ] 6.4 Implement habit streak summary query (streak leaders, completion rate)
- [ ] 6.5 Implement budget status summary query (total budgeted, spent, overspend warnings)
- [ ] 6.6 Implement key metrics calculation (completion %, active streaks, budget utilization)
- [ ] 6.7 Write unit tests for dashboard endpoint

## 7. Frontend - Core Setup

- [ ] 7.1 Configure React Router with /, /login, /register, /dashboard, /goals, /habits, /budgets routes
- [ ] 7.2 Create AuthContext for authentication state (user, tokens, login, logout)
- [ ] 7.3 Implement axios instance with auth token interceptor
- [ ] 7.4 Create ProtectedRoute component for authenticated routes
- [ ] 7.5 Create Navbar component with navigation links and logout
- [ ] 7.6 Add Bootstrap CSS import and custom theme variables
- [ ] 7.7 Create Layout component wrapping pages with Navbar

## 8. Frontend - Auth Pages

- [ ] 8.1 Create RegisterPage with email/password form and validation
- [ ] 8.2 Create LoginPage with email/password form
- [ ] 8.3 Create ProfilePage displaying user info with edit capability
- [ ] 8.4 Add error handling and display for auth failures
- [ ] 8.5 Redirect to dashboard on successful login/register

## 9. Frontend - Goals UI

- [ ] 9.1 Create GoalsListPage displaying goals with category badges and progress bars
- [ ] 9.2 Implement goal filter by category and status
- [ ] 9.3 Create GoalFormModal for create/edit goal
- [ ] 9.4 Create MilestoneList component within goal detail
- [ ] 9.5 Create ProgressLogForm for logging goal progress
- [ ] 9.6 Create GoalDetailPage with milestones and progress history
- [ ] 9.7 Display progress percentage and visual indicators

## 10. Frontend - Habits UI

- [ ] 10.1 Create HabitsListPage displaying habits with streak flames/badges
- [ ] 10.2 Create HabitFormModal for create/edit habit
- [ ] 10.3 Create HabitCheckInButton with completion animation
- [ ] 10.4 Display current streak and longest streak per habit
- [ ] 10.5 Create HabitHistoryPage with calendar view of completions
- [ ] 10.6 Add visual feedback for completing habits (confetti, sound)

## 11. Frontend - Budgets UI

- [ ] 11.1 Create BudgetsListPage displaying budgets with spending progress
- [ ] 11.2 Create BudgetFormModal for create/edit budget
- [ ] 11.3 Create BudgetDetailPage showing categories with allocated/spent/remaining
- [ ] 11.4 Create CategoryFormModal for adding budget categories
- [ ] 11.5 Create ExpenseFormModal for logging expenses
- [ ] 11.6 Display budget vs actual spending with progress bars and warnings

## 12. Frontend - Dashboard

- [ ] 12.1 Create DashboardPage layout with summary cards
- [ ] 12.2 Create GoalProgressWidget with category breakdown chart
- [ ] 12.3 Create HabitStreakWidget with streak leaders and weekly rate
- [ ] 12.4 Create BudgetStatusWidget with spending overview
- [ ] 12.5 Integrate Chart.js for pie/bar charts (goal categories, spending)
- [ ] 12.6 Create KeyMetricsCards showing overall completion % and active streaks
- [ ] 12.7 Add empty state with "get started" encouragement for new users
- [ ] 12.8 Implement auto-refresh on returning to dashboard

## 13. Integration & Polish

- [ ] 13.1 Connect all frontend pages to backend API endpoints
- [ ] 13.2 Add loading states and skeleton loaders
- [ ] 13.3 Add error handling with user-friendly messages
- [ ] 13.4 Ensure responsive design on mobile and tablet
- [ ] 13.5 Test all user flows end-to-end
- [ ] 13.6 Verify WCAG 2.1 AA accessibility compliance
- [ ] 13.7 Run frontend build and verify no errors
- [ ] 13.8 Verify backend tests pass