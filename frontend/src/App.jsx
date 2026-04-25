import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';
import HabitsPage from './pages/HabitsPage';
import HabitDetailPage from './pages/HabitDetailPage';
import BudgetsPage from './pages/BudgetsPage';
import BudgetDetailPage from './pages/BudgetDetailPage';
import ImmigrationPage from './pages/ImmigrationPage';
import ImmigrationFormPage from './pages/ImmigrationFormPage';
import ImmigrationPlanDetailPage from './pages/ImmigrationPlanDetailPage';
import FinancePage from './pages/FinancePage';
import FinanceGoalFormPage from './pages/FinanceGoalFormPage';
import FinancePlanDetailPage from './pages/FinancePlanDetailPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/goals" element={
            <ProtectedRoute>
              <GoalsPage />
            </ProtectedRoute>
          } />
          <Route path="/goals/:id" element={
            <ProtectedRoute>
              <GoalDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/habits" element={
            <ProtectedRoute>
              <HabitsPage />
            </ProtectedRoute>
          } />
          <Route path="/habits/:id" element={
            <ProtectedRoute>
              <HabitDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/budgets" element={
            <ProtectedRoute>
              <BudgetsPage />
            </ProtectedRoute>
          } />
          <Route path="/budgets/:id" element={
            <ProtectedRoute>
              <BudgetDetailPage />
            </ProtectedRoute>
          } />
          {/* Immigration Routes */}
          <Route path="/immigration" element={
            <ProtectedRoute>
              <ImmigrationPage />
            </ProtectedRoute>
          } />
          <Route path="/immigration/new" element={
            <ProtectedRoute>
              <ImmigrationFormPage />
            </ProtectedRoute>
          } />
          <Route path="/immigration/:id/edit" element={
            <ProtectedRoute>
              <ImmigrationFormPage />
            </ProtectedRoute>
          } />
          <Route path="/immigration/:id/plan" element={
            <ProtectedRoute>
              <ImmigrationPlanDetailPage />
            </ProtectedRoute>
          } />
          {/* Finance Advisor Routes */}
          <Route path="/finance" element={
            <ProtectedRoute>
              <FinancePage />
            </ProtectedRoute>
          } />
          <Route path="/finance/new" element={
            <ProtectedRoute>
              <FinanceGoalFormPage />
            </ProtectedRoute>
          } />
          <Route path="/finance/:id/edit" element={
            <ProtectedRoute>
              <FinanceGoalFormPage />
            </ProtectedRoute>
          } />
          <Route path="/finance/:id/plan" element={
            <ProtectedRoute>
              <FinancePlanDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
