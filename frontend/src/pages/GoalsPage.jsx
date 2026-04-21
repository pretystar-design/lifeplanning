import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { goalsAPI } from '../api';

const CATEGORIES = ['financial', 'health', 'career', 'personal'];
const STATUSES = ['not_started', 'in_progress', 'completed'];

function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    target_date: ''
  });

  useEffect(() => {
    loadGoals();
  }, [filterCategory, filterStatus]);

  const loadGoals = async () => {
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      const response = await goalsAPI.getAll(params);
      setGoals(response.data.goals);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await goalsAPI.update(editingGoal.id, formData);
      } else {
        await goalsAPI.create(formData);
      }
      setShowModal(false);
      setEditingGoal(null);
      setFormData({ title: '', description: '', category: 'personal', target_date: '' });
      loadGoals();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save goal');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      target_date: goal.target_date || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await goalsAPI.delete(goalId);
      loadGoals();
    } catch (err) {
      alert('Failed to delete goal');
    }
  };

  const openCreateModal = () => {
    setEditingGoal(null);
    setFormData({ title: '', description: '', category: 'personal', target_date: '' });
    setShowModal(true);
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>🎯 My Goals</h1>
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Create Goal
          </button>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <select 
              className="form-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <select 
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : goals.length === 0 ? (
          <div className="card p-5 text-center">
            <h3 className="text-muted">No goals found</h3>
            <p>Create your first goal to get started!</p>
            <button className="btn btn-primary" onClick={openCreateModal}>Create Goal</button>
          </div>
        ) : (
          <div className="row g-4">
            {goals.map(goal => (
              <div key={goal.id} className="col-md-6 col-lg-4">
                <div className="card goal-card h-100" onClick={() => navigate(`/goals/${goal.id}`)}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className={`badge goal-category-badge category-${goal.category}`}>
                        {goal.category}
                      </span>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary" onClick={(e) => { e.stopPropagation(); handleEdit(goal); }}>Edit</button>
                        <button className="btn btn-outline-danger" onClick={(e) => { e.stopPropagation(); handleDelete(goal.id); }}>Delete</button>
                      </div>
                    </div>
                    <h5 className="card-title">{goal.title}</h5>
                    {goal.description && <p className="card-text text-muted small">{goal.description}</p>}
                    <div className="mt-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Progress</span>
                        <span className="fw-bold">{goal.progress}%</span>
                      </div>
                      <div className="progress">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    {goal.milestones?.length > 0 && (
                      <div className="mt-3">
                        <small className="text-muted">🏁 {goal.milestones.length} milestones</small>
                      </div>
                    )}
                  </div>
                  <div className="card-footer bg-transparent">
                    <small className="text-muted">
                      Status: <span className={`text-${goal.status === 'completed' ? 'success' : goal.status === 'in_progress' ? 'info' : 'warning'}`}>
                        {goal.status.replace('_', ' ')}
                      </span>
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editingGoal ? 'Edit Goal' : 'Create Goal'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Target Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.target_date}
                        onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{editingGoal ? 'Save Changes' : 'Create'}</button>
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

export default GoalsPage;
