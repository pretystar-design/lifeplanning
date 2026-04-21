import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { habitsAPI } from '../api';

function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', frequency: 'daily' });
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const response = await habitsAPI.getAll();
      setHabits(response.data.habits);
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    try {
      await habitsAPI.create(newHabit);
      setShowModal(false);
      setNewHabit({ name: '', frequency: 'daily' });
      loadHabits();
    } catch (err) {
      console.error('Failed to create habit:', err);
    }
  };

  const handleComplete = async (habitId) => {
    setCompleting(habitId);
    try {
      await habitsAPI.complete(habitId);
      loadHabits();
    } catch (err) {
      console.error('Failed to complete habit:', err);
    } finally {
      setCompleting(null);
    }
  };

  const handleDelete = async (habitId) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return;
    try {
      await habitsAPI.delete(habitId);
      loadHabits();
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  const getStreakColor = (streak) => {
    if (streak >= 30) return 'success';
    if (streak >= 7) return 'info';
    if (streak >= 3) return 'warning';
    return 'secondary';
  };

  const getFrequencyIcon = (frequency) => {
    return frequency === 'daily' ? '📅' : '📆';
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
          <h1>🎯 Habit Tracker</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg me-2"></i>
            New Habit
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="card p-5 text-center">
            <div className="mb-3">
              <span style={{ fontSize: '4rem' }}>🌱</span>
            </div>
            <h3>No habits yet</h3>
            <p className="text-muted">Start building good habits by creating your first one!</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {habits.map(habit => (
              <div key={habit.id} className="col-md-6 col-lg-4">
                <div className={`card h-100 ${habit.completed_today ? 'border-success' : ''}`}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="card-title mb-1">{habit.name}</h5>
                        <small className="text-muted">
                          {getFrequencyIcon(habit.frequency)} {habit.frequency}
                        </small>
                      </div>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <Link className="dropdown-item" to={`/habits/${habit.id}`}>
                              <i className="bi bi-calendar3 me-2"></i>
                              View History
                            </Link>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button className="dropdown-item text-danger" onClick={() => handleDelete(habit.id)}>
                              <i className="bi bi-trash me-2"></i>
                              Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="row text-center mb-3">
                      <div className="col-6">
                        <div className={`badge bg-${getStreakColor(habit.current_streak)} p-2`}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{habit.current_streak}</div>
                          <small>Current</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="badge bg-dark p-2">
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{habit.longest_streak}</div>
                          <small>Best</small>
                        </div>
                      </div>
                    </div>

                    {habit.completed_today ? (
                      <div className="d-grid">
                        <button className="btn btn-success" disabled>
                          <i className="bi bi-check-circle me-2"></i>
                          Completed Today!
                        </button>
                      </div>
                    ) : (
                      <div className="d-grid">
                        <button
                          className="btn btn-outline-success"
                          onClick={() => handleComplete(habit.id)}
                          disabled={completing === habit.id}
                        >
                          {completing === habit.id ? (
                            <span className="spinner-border spinner-border-sm me-2"></span>
                          ) : (
                            <i className="bi bi-check2 me-2"></i>
                          )}
                          Mark Complete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Habit Modal */}
        {showModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create New Habit</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleCreateHabit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Habit Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Morning Exercise"
                        value={newHabit.name}
                        onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Frequency</label>
                      <select
                        className="form-select"
                        value={newHabit.frequency}
                        onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value })}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Create Habit
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

export default HabitsPage;
