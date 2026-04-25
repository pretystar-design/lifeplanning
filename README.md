# LifePlanning

A comprehensive personal life planning and goal tracking application with habit tracking, financial budgeting, immigration advisory, and AI-powered financial advisory features.

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python run.py
```

Backend will run on http://localhost:5000

### Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend will run on http://localhost:3000

### Default Test Credentials
- Email: test@example.com
- Password: password123

## Features

### Core Features

#### 1. User Authentication
- User Registration & Login (JWT Authentication)
- Profile Management
- Secure password hashing with bcrypt

#### 2. Goal Management
- Create, Read, Update, Delete goals
- Goal categorization (Financial, Health, Career, Personal)
- Progress tracking with percentage completion
- Milestone management for sub-tasks
- Progress logging with notes

#### 3. Habit Tracking
- Create daily or weekly habits
- Streak tracking (current and longest)
- One-click completion marking
- 30-day calendar history view
- Completion rate statistics

#### 4. Financial Budgeting
- Create budgets with date ranges
- Category management (e.g., Food, Transport, Entertainment)
- Expense tracking per category
- Visual spending breakdown (pie charts)
- Budget vs. actual spending comparison
- Over/under budget indicators

#### 5. Dashboard
- Overview statistics for all features
- Goals progress charts
- Habit streak summary
- Budget status overview
- Quick action buttons

#### 6. Immigration Advisory (移民顾问)
- Create immigration goals with target country, type, and budget
- Generate comprehensive immigration plans automatically
- Detailed risk assessment with mitigation suggestions
- Support for multiple countries:
  - 加拿大 (Canada) - Express Entry
  - 美国 (USA) - EB-1A, EB-2, EB-3
  - 澳大利亚 (Australia) - 189, 190, 491
  - 新西兰 (New Zealand) - Skilled Migrant
  - 英国 (UK) - Innovator Founder
  - 葡萄牙/西班牙/希腊 (Portugal/Spain/Greece) - Golden Visa
- Application process timeline visualization
- Document checklist with tracking
- Risk matrix visualization (High/Medium/Low)

#### 7. AI Finance Advisor (AI理财顾问)
- **理财目标管理**
  - 支持多种目标类型：退休养老、子女教育、购房首付、婚嫁储备、旅游基金、应急基金、财务自由等
  - 自定义目标金额、目标日期和每月定投金额
  - 实时进度追踪
- **AI智能投资方案生成**
  - 基于风险偏好的资产配置建议（股票、债券、基金、现金）
  - 五种风险等级模板：保守型、稳健型、平衡型、进取型、激进型
  - 自动计算预期收益率和预期最终金额
- **投资收益模拟**
  - 复利计算模型
  - 可视化收益增长曲线
  - 可调节参数的模拟测试
- **风险评估**
  - 五维风险分析：市场风险、流动性风险、通胀风险、时间风险、产品风险
  - 综合风险评分
  - 个性化风险缓解建议
- **市场洞察**
  - 各类资产的市场趋势分析
  - 投资建议提示

### API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update profile

#### Goals
- `GET /api/v1/goals` - List goals (supports `?category=` and `?status=` filters)
- `POST /api/v1/goals` - Create goal
- `GET /api/v1/goals/:id` - Get goal details
- `PUT /api/v1/goals/:id` - Update goal
- `DELETE /api/v1/goals/:id` - Delete goal
- `GET /api/v1/goals/:id/milestones` - List milestones
- `POST /api/v1/goals/:id/milestones` - Create milestone
- `PUT /api/v1/goals/:id/milestones/:milestoneId` - Update milestone
- `GET /api/v1/goals/:id/progress` - Get progress history
- `POST /api/v1/goals/:id/progress` - Log progress

#### Habits
- `GET /api/v1/habits` - List all habits (with today's completion status)
- `POST /api/v1/habits` - Create habit
- `GET /api/v1/habits/:id` - Get habit details
- `PUT /api/v1/habits/:id` - Update habit
- `DELETE /api/v1/habits/:id` - Delete habit
- `POST /api/v1/habits/:id/complete` - Mark habit complete
- `POST /api/v1/habits/:id/uncomplete` - Remove today's completion
- `GET /api/v1/habits/:id/history` - Get completion history

#### Budgets
- `GET /api/v1/budgets` - List all budgets
- `POST /api/v1/budgets` - Create budget
- `GET /api/v1/budgets/:id` - Get budget details
- `PUT /api/v1/budgets/:id` - Update budget
- `DELETE /api/v1/budgets/:id` - Delete budget
- `GET /api/v1/budgets/:id/categories` - List categories
- `POST /api/v1/budgets/:id/categories` - Add category
- `PUT /api/v1/budgets/:id/categories/:categoryId` - Update category
- `DELETE /api/v1/budgets/:id/categories/:categoryId` - Delete category
- `GET /api/v1/budgets/:id/expenses` - List expenses
- `POST /api/v1/budgets/:id/expenses` - Add expense
- `DELETE /api/v1/budgets/:id/expenses/:expenseId` - Delete expense
- `GET /api/v1/budgets/:id/summary` - Get budget summary

#### Immigration Advisory
- `GET /api/v1/immigration/goals` - List immigration goals
- `POST /api/v1/immigration/goals` - Create immigration goal
- `GET /api/v1/immigration/goals/:id` - Get immigration goal details
- `PUT /api/v1/immigration/goals/:id` - Update immigration goal
- `DELETE /api/v1/immigration/goals/:id` - Delete immigration goal
- `POST /api/v1/immigration/goals/:id/generate-plan` - Generate immigration plan
- `GET /api/v1/immigration/goals/:id/plan` - Get immigration plan
- `GET /api/v1/immigration/goals/:id/risks` - Get risk assessment
- `POST /api/v1/immigration/goals/:id/risks` - Update risk assessment
- `GET /api/v1/immigration/templates` - Get all immigration templates

#### AI Finance Advisor
- `GET /api/v1/finance/advisor/options` - Get goal types and risk tolerance options
- `GET /api/v1/finance/advisor/goals` - List financial goals (supports `?status=` and `?goal_type=` filters)
- `POST /api/v1/finance/advisor/goals` - Create financial goal
- `GET /api/v1/finance/advisor/goals/:id` - Get financial goal details
- `PUT /api/v1/finance/advisor/goals/:id` - Update financial goal
- `DELETE /api/v1/finance/advisor/goals/:id` - Delete financial goal
- `POST /api/v1/finance/advisor/goals/:id/generate-plan` - AI generate investment plan
- `GET /api/v1/finance/advisor/goals/:id/plan` - Get investment plan
- `POST /api/v1/finance/advisor/goals/:id/simulate` - Run investment simulation
- `GET /api/v1/finance/advisor/goals/:id/risks` - Get risk assessment
- `GET /api/v1/finance/advisor/market-insights` - Get market insights

#### Dashboard
- `GET /api/v1/dashboard` - Get dashboard statistics

## Tech Stack

### Backend
- Python 3.9+
- Flask 3.0
- Flask-SQLAlchemy
- SQLite (Database)
- PyJWT (Authentication)
- bcrypt (Password Hashing)
- Flask-CORS

### Frontend
- React 18
- Vite
- React Router
- Bootstrap 5
- Chart.js
- React-ChartJS-2
- Axios

## Project Structure

```
lifeplanning/
├── backend/
│   ├── app/
│   │   ├── __init__.py       # Flask app factory
│   │   ├── models.py          # SQLAlchemy models (including Immigration models)
│   │   ├── config.py          # Configuration
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py        # Authentication routes
│   │       ├── goals.py       # Goals routes
│   │       ├── habits.py      # Habits routes
│   │       ├── budgets.py     # Budgets routes
│   │       ├── dashboard.py   # Dashboard routes
│   │       └── immigration.py # Immigration advisory routes
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── auth.py        # Auth utilities
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js       # API client (including immigration API)
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── GoalsPage.jsx
│   │   │   ├── GoalDetailPage.jsx
│   │   │   ├── HabitsPage.jsx
│   │   │   ├── HabitDetailPage.jsx
│   │   │   ├── BudgetsPage.jsx
│   │   │   ├── BudgetDetailPage.jsx
│   │   │   ├── ImmigrationPage.jsx
│   │   │   ├── ImmigrationFormPage.jsx
│   │   │   └── ImmigrationPlanDetailPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```

## Immigration Advisory Feature

### Supported Countries and Programs

| Country | Program | Type |
|---------|---------|------|
| 🇨🇦 Canada | Express Entry | Skilled Immigration |
| 🇺🇸 USA | EB-1A/EB-2/EB-3 | Employment-Based |
| 🇦🇺 Australia | 189/190/491 | Skilled Migration |
| 🇳🇿 New Zealand | Skilled Migrant | Skilled Immigration |
| 🇬🇧 UK | Innovator Founder | Business Immigration |
| 🇵🇹🇪🇸🇬🇷 EU | Golden Visa | Investment Immigration |

### Risk Types

- **政策风险 (Policy Risk)**: Changes in immigration policies
- **资金风险 (Financial Risk)**: Insufficient funds for application and settlement
- **时间风险 (Timeline Risk)**: Long processing times and queue waiting
- **材料风险 (Documents Risk)**: Incomplete or non-compliant documentation
- **语言风险 (Language Risk)**: Language proficiency requirements not met

### Test Flow

1. Create immigration goal → `/immigration/new`
2. Generate plan → Click "生成方案" button
3. View plan details → `/immigration/:id/plan`
4. Review risk assessment → Switch to "风险评估" tab
