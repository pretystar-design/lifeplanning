import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { goalsAPI } from '../api';

function GoalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', target_date: '' });
  const [progressForm, setProgressForm] = useState({ notes: '', value: 10 });

  useEffect(() => {
    loadGoal();
  }, [id]);

  const loadGoal = async () => {
    try {
      const response = await goalsAPI.getOne(id);
      setGoal(response.data.goal);
    } catch (err) {
      alert('Failed to load goal');
      navigate('/goals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      await goalsAPI.createMilestone(id, milestoneForm);
      setShowMilestoneModal(false);
      setMilestoneForm({ title: '', target_date: '' });
      loadGoal();
    } catch (err) {
      alert('Failed to add milestone');
    }
  };

  const handleToggleMilestone = async (milestoneId, completed) => {
    try {
      await goalsAPI.updateMilestone(id, milestoneId, { completed: !completed });
      loadGoal();
    } catch (err) {
      alert('Failed to update milestone');
    }
  };

  const handleLogProgress = async (e) => {
    e.preventDefault();
    try {
      await goalsAPI.logProgress(id, progressForm);
      setShowProgressModal(false);
      setProgressForm({ notes: '', value: 10 });
      loadGoal();
    } catch (err) {
      alert('Failed to log progress');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await goalsAPI.update(id, { status: newStatus });
      loadGoal();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!goal) return null;

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/goals')}>
          ← Back to Goals
        </button>

        <div className="card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <span className={`badge goal-category-badge category-${goal.category} mb-2`}>
                {goal.category}
              </span>
              <h2>{goal.title}</h2>
              {goal.description && <p className="text-muted">{goal.description}</p>}
            </div>
            <select
              className="form-select form-select-sm w-auto"
              value={goal.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="mt-4">
            <div className="d-flex justify-content-between mb-2">
              <span className="fw-bold">Progress</span>
              <span className="fw-bold">{goal.progress}%</span>
            </div>
            <div className="progress" style={{ height: '20px' }}>
              <div 
                className="progress-bar bg-success" 
                style={{ width: `${goal.progress}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-4">
            <button className="btn btn-primary" onClick={() => setShowProgressModal(true)}>
              + Log Progress
            </button>
          </div>
        </div>

        <div className="card p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>🏁 Milestones</h4>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setShowMilestoneModal(true)}>
              + Add Milestone
            </button>
          </div>

          {goal.milestones?.length === 0 ? (
            <p className="text-muted">No milestones yet. Add one to track your progress!</p>
          ) : (
            <div className="list-group">
              {goal.milestones?.map(milestone => (
                <div key={milestone.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={milestone.completed}
                      onChange={() => handleToggleMilestone(milestone.id, milestone.completed)}
                    />
                    <label className={`form-check-label ${milestone.completed ? 'text-decoration-line-through text-muted' : ''}`}>
                      {milestone.title}
                    </label>
                    {milestone.target_date && (
                      <small className="d-block text-muted ms-4">Target: {milestone.target_date}</small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showMilestoneModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Milestone</h5>
                  <button type="button" className="btn-close" onClick={() => setShowMilestoneModal(false)}></button>
                </div>
                <form onSubmit={handleAddMilestone}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={milestoneForm.title}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Target Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={milestoneForm.target_date}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, target_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowMilestoneModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Add</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showProgressModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Log Progress</h5>
                  <button type="button" className="btn-close" onClick={() => setShowProgressModal(false)}></button>
                </div>
                <form onSubmit={handleLogProgress}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Progress (%) *</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="100"
                        value={progressForm.value}
                        onChange={(e) => setProgressForm({ ...progressForm, value: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={progressForm.notes}
                        onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowProgressModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-success">Log Progress</button>
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

export default GoalDetailPage;
