import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Navbar from '../components/Navbar';
import { dashboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      setData(response.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const goalsData = data?.goals || {};
  const habitsData = data?.habits || {};
  const budgetsData = data?.budgets || {};

  const categoryChartData = {
    labels: Object.keys(goalsData.by_category || {}).map(c => c.charAt(0).toUpperCase() + c.slice(1)),
    datasets: [{
      data: Object.values(goalsData.by_category || {}),
      backgroundColor: ['#28a745', '#dc3545', '#007bff', '#6c757d', '#ffc107'],
    }]
  };

  const statusChartData = {
    labels: ['Not Started', 'In Progress', 'Completed'],
    datasets: [{
      label: 'Goals',
      data: [
        goalsData.by_status?.not_started || 0,
        goalsData.by_status?.in_progress || 0,
        goalsData.by_status?.completed || 0
      ],
      backgroundColor: ['#ffc107', '#17a2b8', '#28a745'],
    }]
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="mb-4">
          <h1 className="mb-2">{getGreeting()}, {user?.name}! 👋</h1>
          <p className="text-muted mb-0">Here's an overview of your life planning progress.</p>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body py-3">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <i className="bi bi-bullseye fs-3"></i>
                  </div>
                  <div>
                    <div className="h3 mb-0">{goalsData.total || 0}</div>
                    <small>Total Goals</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body py-3">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <i className="bi bi-check-circle fs-3"></i>
                  </div>
                  <div>
                    <div className="h3 mb-0">{goalsData.completed || 0}</div>
                    <small>Completed</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body py-3">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <i className="bi bi-lightning fs-3"></i>
                  </div>
                  <div>
                    <div className="h3 mb-0">{habitsData.total || 0}</div>
                    <small>Active Habits</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card bg-warning text-dark">
              <div className="card-body py-3">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <i className="bi bi-wallet2 fs-3"></i>
                  </div>
                  <div>
                    <div className="h3 mb-0">{budgetsData.total || 0}</div>
                    <small>Budgets</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Goals Overview */}
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">📊 Goals Overview</h5>
                <Link to="/goals" className="btn btn-sm btn-outline-primary">Manage Goals</Link>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="text-center mb-3">
                      <div className="h2 mb-0 text-success">{goalsData.completion_rate || 0}%</div>
                      <small className="text-muted">Completion Rate</small>
                    </div>
                    <div className="progress" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{ width: `${goalsData.completion_rate || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-center mb-3">
                      <div className="h2 mb-0 text-info">{goalsData.average_progress || 0}%</div>
                      <small className="text-muted">Avg Progress</small>
                    </div>
                    <div className="progress" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar bg-info" 
                        style={{ width: `${goalsData.average_progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="row g-3 mt-2">
                  <div className="col-4 text-center">
                    <div className="p-2 bg-light rounded">
                      <div className="h5 mb-0 text-warning">{goalsData.by_status?.not_started || 0}</div>
                      <small className="text-muted">Not Started</small>
                    </div>
                  </div>
                  <div className="col-4 text-center">
                    <div className="p-2 bg-light rounded">
                      <div className="h5 mb-0 text-info">{goalsData.by_status?.in_progress || 0}</div>
                      <small className="text-muted">In Progress</small>
                    </div>
                  </div>
                  <div className="col-4 text-center">
                    <div className="p-2 bg-light rounded">
                      <div className="h5 mb-0 text-success">{goalsData.by_status?.completed || 0}</div>
                      <small className="text-muted">Completed</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">Goals by Category</h6>
                  </div>
                  <div className="card-body d-flex align-items-center justify-content-center">
                    {Object.keys(goalsData.by_category || {}).length > 0 ? (
                      <div style={{ maxWidth: '200px', maxHeight: '200px' }}>
                        <Pie data={categoryChartData} />
                      </div>
                    ) : (
                      <p className="text-muted text-center mb-0">No goals yet</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">Goals by Status</h6>
                  </div>
                  <div className="card-body">
                    {goalsData.total > 0 ? (
                      <Bar data={statusChartData} options={{ indexAxis: 'y' }} />
                    ) : (
                      <p className="text-muted text-center mb-0">No goals yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Habits Quick View */}
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">🔥 Habit Streaks</h5>
                <Link to="/habits" className="btn btn-sm btn-outline-primary">View All</Link>
              </div>
              <div className="card-body">
                {habitsData.total > 0 ? (
                  <div className="text-center">
                    <div className="display-4 mb-2">{habitsData.with_streaks || 0}</div>
                    <p className="text-muted mb-0">habits with active streaks</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-muted mb-3">No habits tracking yet</p>
                    <Link to="/habits" className="btn btn-primary btn-sm">
                      Start Tracking Habits
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Budget Quick View */}
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">💰 Budget Status</h5>
                <Link to="/budgets" className="btn btn-sm btn-outline-primary">View All</Link>
              </div>
              <div className="card-body">
                {budgetsData.total > 0 ? (
                  <div className="text-center">
                    <div className="h2 mb-2">{budgetsData.total}</div>
                    <p className="text-muted mb-0">active budgets</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-muted mb-3">No budgets yet</p>
                    <Link to="/budgets" className="btn btn-primary btn-sm">
                      Create Budget
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Goals */}
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">🎯 Recent Goals</h5>
              </div>
              <div className="card-body p-0">
                {goalsData.recent?.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {goalsData.recent.map(goal => (
                      <Link key={goal.id} to={`/goals/${goal.id}`} className="list-group-item list-group-item-action">
                        <div className="d-flex w-100 justify-content-between align-items-center">
                          <h6 className="mb-1">{goal.title}</h6>
                          <span className={`badge goal-category-badge category-${goal.category}`}>
                            {goal.category}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="progress" style={{ height: '6px' }}>
                            <div 
                              className={`progress-bar ${
                                goal.status === 'completed' ? 'bg-success' : 
                                goal.status === 'in_progress' ? 'bg-info' : 'bg-secondary'
                              }`}
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                          <small className="text-muted">{goal.progress}% complete</small>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted mb-3">No goals yet</p>
                    <Link to="/goals" className="btn btn-primary btn-sm">
                      Create Your First Goal
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card bg-light">
              <div className="card-body">
                <h5 className="mb-3">Quick Actions</h5>
                <div className="row g-2">
                  <div className="col-md-3">
                    <Link to="/goals" className="btn btn-outline-primary w-100">
                      <i className="bi bi-plus-lg me-2"></i>
                      New Goal
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/habits" className="btn btn-outline-success w-100">
                      <i className="bi bi-plus-lg me-2"></i>
                      New Habit
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/budgets" className="btn btn-outline-warning w-100">
                      <i className="bi bi-plus-lg me-2"></i>
                      New Budget
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-outline-info w-100" onClick={loadDashboard}>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Refresh Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
