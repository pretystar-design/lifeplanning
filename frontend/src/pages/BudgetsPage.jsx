import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { budgetsAPI } from '../api';

function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newBudget, setNewBudget] = useState({
    name: '',
    total_amount: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const response = await budgetsAPI.getAll();
      setBudgets(response.data.budgets);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      await budgetsAPI.create({
        ...newBudget,
        total_amount: parseFloat(newBudget.total_amount) || 0
      });
      setShowModal(false);
      setNewBudget({ name: '', total_amount: '', start_date: '', end_date: '' });
      loadBudgets();
    } catch (err) {
      console.error('Failed to create budget:', err);
    }
  };

  const handleDelete = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await budgetsAPI.delete(budgetId);
      loadBudgets();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  };

  const getProgressColor = (spent, total) => {
    const percentage = (spent / total) * 100;
    if (percentage >= 100) return 'bg-danger';
    if (percentage >= 80) return 'bg-warning';
    return 'bg-success';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Ongoing';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>💰 Budget Management</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg me-2"></i>
            New Budget
          </button>
        </div>

        {budgets.length === 0 ? (
          <div className="card p-5 text-center">
            <div className="mb-3">
              <span style={{ fontSize: '4rem' }}>📊</span>
            </div>
            <h3>No budgets yet</h3>
            <p className="text-muted">Create a budget to start tracking your expenses!</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create Your First Budget
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {budgets.map(budget => {
              const spent = budget.total_spent || 0;
              const total = budget.total_amount || 0;
              const percentage = total > 0 ? Math.round((spent / total) * 100) : 0;
              const remaining = total - spent;

              return (
                <div key={budget.id} className="col-md-6 col-lg-4">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">{budget.name}</h5>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <Link className="dropdown-item" to={`/budgets/${budget.id}`}>
                              <i className="bi bi-eye me-2"></i>
                              View Details
                            </Link>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button className="dropdown-item text-danger" onClick={() => handleDelete(budget.id)}>
                              <i className="bi bi-trash me-2"></i>
                              Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="text-center mb-3">
                        <div className="d-flex justify-content-center align-items-center gap-2">
                          <span className="h4 mb-0">${spent.toFixed(2)}</span>
                          <span className="text-muted">/ ${total.toFixed(2)}</span>
                        </div>
                        <small className="text-muted">
                          {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
                        </small>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small>{percentage}% used</small>
                          <small className={remaining < 0 ? 'text-danger' : 'text-success'}>
                            {remaining < 0 ? 'Over by' : 'Left'}: ${Math.abs(remaining).toFixed(2)}
                          </small>
                        </div>
                        <div className="progress" style={{ height: '10px' }}>
                          <div
                            className={`progress-bar ${getProgressColor(spent, total)}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {budget.categories && budget.categories.length > 0 ? (
                        <div>
                          <small className="text-muted">Categories:</small>
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {budget.categories.map(cat => (
                              <span key={cat.id} className="badge bg-secondary">
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <small className="text-muted">No categories yet</small>
                      )}
                    </div>
                    <div className="card-footer bg-transparent">
                      <Link to={`/budgets/${budget.id}`} className="btn btn-outline-primary btn-sm w-100">
                        <i className="bi bi-arrow-right me-2"></i>
                        Manage Budget
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Budget Modal */}
        {showModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create New Budget</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleCreateBudget}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Budget Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Monthly Budget"
                        value={newBudget.name}
                        onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Total Amount ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g., 3000"
                        min="0"
                        step="0.01"
                        value={newBudget.total_amount}
                        onChange={(e) => setNewBudget({ ...newBudget, total_amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="row">
                      <div className="col-6 mb-3">
                        <label className="form-label">Start Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newBudget.start_date}
                          onChange={(e) => setNewBudget({ ...newBudget, start_date: e.target.value })}
                        />
                      </div>
                      <div className="col-6 mb-3">
                        <label className="form-label">End Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newBudget.end_date}
                          onChange={(e) => setNewBudget({ ...newBudget, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Create Budget
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BudgetsPage;
