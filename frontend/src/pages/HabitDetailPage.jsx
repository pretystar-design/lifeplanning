import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { habitsAPI } from '../api';

function HabitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState(null);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabitHistory();
  }, [id]);

  const loadHabitHistory = async () => {
    try {
      const response = await habitsAPI.getHistory(id);
      setHabit(response.data.habit);
      setCompletions(response.data.completions);
    } catch (err) {
      console.error('Failed to load habit:', err);
      navigate('/habits');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      await habitsAPI.complete(id);
      loadHabitHistory();
    } catch (err) {
      console.error('Failed to complete habit:', err);
    }
  };

  const getLast30Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const isCompleted = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return completions.some(c => c.completed_date === dateStr);
  };

  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
  };

  const getMonthLabel = (date, index) => {
    if (index === 0 || date.getDate() === 1) {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
    return '';
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

  const last30Days = getLast30Days();
  const completedCount = completions.length;
  const completionRate = Math.round((completedCount / 30) * 100);

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/habits">Habits</Link></li>
            <li className="breadcrumb-item active">{habit?.name}</li>
          </ol>
        </nav>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card mb-4">
              <div className="card-body text-center">
                <h2 className="mb-3">{habit?.name}</h2>
                <span className={`badge bg-${habit?.frequency === 'daily' ? 'primary' : 'info'} mb-3`}>
                  {habit?.frequency === 'daily' ? '📅 Daily' : '📆 Weekly'}
                </span>
                
                <div className="row g-2 mb-4">
                  <div className="col-6">
                    <div className="p-3 bg-success bg-opacity-10 rounded">
                      <div className="h3 mb-0 text-success">{habit?.current_streak}</div>
                      <small className="text-muted">Current Streak</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-dark bg-opacity-10 rounded">
                      <div className="h3 mb-0">{habit?.longest_streak}</div>
                      <small className="text-muted">Best Streak</small>
                    </div>
                  </div>
                </div>

                <div className="d-grid">
                  <button
                    className="btn btn-success btn-lg"
                    onClick={handleComplete}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Complete Today
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Statistics</h5>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Last 30 Days</span>
                    <span className="fw-bold">{completedCount}/30</span>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <span className="h4 text-success">{completionRate}%</span>
                  <br />
                  <small className="text-muted">Completion Rate</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-4">Last 30 Days Calendar</h5>
                <div className="calendar-grid">
                  {last30Days.map((date, index) => (
                    <div key={index} className="calendar-day">
                      <div className="calendar-month-label">
                        {getMonthLabel(date, index)}
                      </div>
                      <div className={`calendar-date ${isCompleted(date) ? 'completed' : ''}`}>
                        <span className="day-name">{getDayName(date)}</span>
                        <span className="day-number">{date.getDate()}</span>
                        {isCompleted(date) && <span className="check-mark">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 d-flex justify-content-center gap-4">
                  <span><span className="badge bg-success me-1">✓</span> Completed</span>
                  <span><span className="badge bg-light border me-1"></span> Not Completed</span>
                </div>
              </div>
            </div>

            <div className="card mt-4">
              <div className="card-body">
                <h5 className="card-title mb-3">Recent Completions</h5>
                {completions.length === 0 ? (
                  <p className="text-muted text-center">No completions yet</p>
                ) : (
                  <div className="list-group">
                    {completions.slice(0, 10).map(completion => (
                      <div key={completion.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>
                          <i className="bi bi-calendar-event me-2 text-success"></i>
                          {new Date(completion.completed_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="badge bg-success rounded-pill">✓</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 8px;
        }
        .calendar-day {
          text-align: center;
        }
        .calendar-month-label {
          height: 16px;
          font-size: 10px;
          color: #6c757d;
        }
        .calendar-date {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          position: relative;
          font-size: 12px;
        }
        .calendar-date.completed {
          background: #d1e7dd;
          border-color: #198754;
        }
        .day-name {
          font-size: 10px;
          color: #6c757d;
        }
        .day-number {
          font-weight: bold;
        }
        .check-mark {
          position: absolute;
          top: 2px;
          right: 2px;
          font-size: 10px;
          color: #198754;
        }
      `}</style>
    </div>
  );
}

export default HabitDetailPage;
