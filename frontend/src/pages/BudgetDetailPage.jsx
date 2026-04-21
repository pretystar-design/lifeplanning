import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import Navbar from '../components/Navbar';
import { budgetsAPI } from '../api';

ChartJS.register(ArcElement, Tooltip, Legend);

function BudgetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', allocated_amount: '' });
  const [newExpense, setNewExpense] = useState({ category_id: '', amount: '', description: '', date: '' });

  useEffect(() => {
    loadBudgetData();
  }, [id]);

  const loadBudgetData = async () => {
    try {
      const [budgetRes, summaryRes, expensesRes] = await Promise.all([
        budgetsAPI.getOne(id),
        budgetsAPI.getSummary(id),
        budgetsAPI.getExpenses(id)
      ]);
      setBudget(budgetRes.data.budget);
      setSummary(summaryRes.data);
      setExpenses(expensesRes.data.expenses);
    } catch (err) {
      console.error('Failed to load budget:', err);
      navigate('/budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await budgetsAPI.createCategory(id, {
        ...newCategory,
        allocated_amount: parseFloat(newCategory.allocated_amount) || 0
      });
      setShowCategoryModal(false);
      setNewCategory({ name: '', allocated_amount: '' });
      loadBudgetData();
    } catch (err) {
      console.error('Failed to create category:', err);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category and all its expenses?')) return;
    try {
      await budgetsAPI.deleteCategory(id, categoryId);
      loadBudgetData();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await budgetsAPI.createExpense(id, {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date || new Date().toISOString().split('T')[0]
      });
      setShowExpenseModal(false);
      setNewExpense({ category_id: '', amount: '', description: '', date: '' });
      loadBudgetData();
    } catch (err) {
      console.error('Failed to create expense:', err);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await budgetsAPI.deleteExpense(id, expenseId);
      loadBudgetData();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const getProgressColor = (spent, total) => {
    const percentage = (spent / total) * 100;
    if (percentage >= 100) return 'bg-danger';
    if (percentage >= 80) return 'bg-warning';
    return 'bg-success';
  };

  const getCategoryById = (categoryId) => {
    return budget?.categories?.find(c => c.id === categoryId);
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

  const chartData = {
    labels: summary?.categories?.map(c => c.name) || [],
    datasets: [{
      data: summary?.categories?.map(c => c.spent) || [],
      backgroundColor: ['#28a745', '#dc3545', '#007bff', '#ffc107', '#6c757d', '#17a2b8', '#6610f2'],
    }]
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/budgets">Budgets</Link></li>
            <li className="breadcrumb-item active">{budget?.name}</li>
          </ol>
        </nav>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card mb-4">
              <div className="card-body">
                <h4 className="mb-3">{budget?.name}</h4>
                <div className="text-center mb-4">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="h2 mb-0">${summary?.total_spent?.toFixed(2) || '0.00'}</span>
                    <span className="text-muted">/ ${summary?.total_allocated?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`badge ${summary?.total_remaining >= 0 ? 'bg-success' : 'bg-danger'} me-1`}>
                      {summary?.total_remaining >= 0 ? 'Under Budget' : 'Over Budget'}
                    </span>
                    <span className="badge bg-secondary">
                      {summary?.overall_percentage || 0}% Used
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="progress" style={{ height: '15px' }}>
                    <div
                      className={`progress-bar ${getProgressColor(summary?.total_spent || 0, summary?.total_allocated || 0)}`}
                      style={{ width: `${Math.min(summary?.overall_percentage || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-success flex-fill" onClick={() => setShowExpenseModal(true)}>
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Expense
                  </button>
                  <button className="btn btn-outline-primary flex-fill" onClick={() => setShowCategoryModal(true)}>
                    <i className="bi bi-folder-plus me-2"></i>
                    Add Category
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Spending by Category</h5>
                {summary?.categories?.length > 0 ? (
                  <div className="chart-container" style={{ height: '200px' }}>
                    <Pie data={chartData} options={{ maintainAspectRatio: false }} />
                  </div>
                ) : (
                  <p className="text-muted text-center">No categories yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Categories</h5>
              </div>
              <div className="card-body p-0">
                {summary?.categories?.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    No categories yet. Add one to start tracking expenses!
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Category</th>
                          <th className="text-end">Allocated</th>
                          <th className="text-end">Spent</th>
                          <th className="text-end">Remaining</th>
                          <th className="text-center">Progress</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary?.categories?.map(cat => (
                          <tr key={cat.id}>
                            <td>{cat.name}</td>
                            <td className="text-end">${cat.allocated.toFixed(2)}</td>
                            <td className="text-end">${cat.spent.toFixed(2)}</td>
                            <td className={`text-end ${cat.remaining < 0 ? 'text-danger' : 'text-success'}`}>
                              ${cat.remaining.toFixed(2)}
                            </td>
                            <td className="text-center" style={{ width: '150px' }}>
                              <div className="progress mb-1" style={{ height: '8px' }}>
                                <div
                                  className={`progress-bar ${getProgressColor(cat.spent, cat.allocated)}`}
                                  style={{ width: `${Math.min(cat.percentage_used, 100)}%` }}
                                ></div>
                              </div>
                              <small className="text-muted">{cat.percentage_used}%</small>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteCategory(cat.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Expenses</h5>
                <span className="badge bg-secondary">{expenses.length}</span>
              </div>
              <div className="card-body p-0">
                {expenses.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    No expenses recorded yet
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {expenses.map(expense => {
                      const category = getCategoryById(expense.category_id);
                      return (
                        <div key={expense.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">${expense.amount.toFixed(2)}</div>
                            <small className="text-muted">
                              {expense.description || 'No description'}
                              {category && <span className="ms-2 badge bg-secondary">{category.name}</span>}
                            </small>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <small className="text-muted">
                              {new Date(expense.date).toLocaleDateString()}
                            </small>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Category Modal */}
        {showCategoryModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Category</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCategoryModal(false)}></button>
                </div>
                <form onSubmit={handleCreateCategory}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Category Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Food, Transport, Entertainment"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Allocated Amount ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g., 500"
                        min="0"
                        step="0.01"
                        value={newCategory.allocated_amount}
                        onChange={(e) => setNewCategory({ ...newCategory, allocated_amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showExpenseModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Expense</h5>
                  <button type="button" className="btn-close" onClick={() => setShowExpenseModal(false)}></button>
                </div>
                <form onSubmit={handleCreateExpense}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={newExpense.category_id}
                        onChange={(e) => setNewExpense({ ...newExpense, category_id: e.target.value })}
                        required
                      >
                        <option value="">Select a category</option>
                        {budget?.categories?.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Amount ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g., 25.50"
                        min="0"
                        step="0.01"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Lunch at restaurant"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newExpense.date || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success">
                      Add Expense
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .chart-container {
          position: relative;
        }
      `}</style>
    </div>
  );
}

export default BudgetDetailPage;
