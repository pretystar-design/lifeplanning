import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { financeAPI } from '../api';
import Navbar from '../components/Navbar';

function FinancePage() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState({});
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [optionsRes, goalsRes] = await Promise.all([
        financeAPI.getOptions(),
        financeAPI.getGoals()
      ]);
      setOptions(optionsRes.data);
      setGoals(goalsRes.data.goals);
      setSummary(goalsRes.data.summary);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('确定要删除这个理财目标吗？')) {
      try {
        await financeAPI.deleteGoal(id);
        loadData();
      } catch (error) {
        alert('删除失败');
      }
    }
  };

  const filteredGoals = filterType
    ? goals.filter(g => g.goal_type === filterType)
    : goals;

  const getGoalTypeIcon = (type) => {
    const typeData = options.goal_types?.find(t => t.value === type);
    return typeData?.icon || '🎯';
  };

  const getRiskBadgeClass = (risk) => {
    const classes = {
      conservative: 'bg-success',
      steady: 'bg-info',
      balanced: 'bg-primary',
      aggressive: 'bg-warning',
      very_aggressive: 'bg-danger'
    };
    return classes[risk] || 'bg-secondary';
  };

  const getRiskLabel = (risk) => {
    const type = options.risk_tolerances?.find(t => t.value === risk);
    return type?.label || risk;
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light">
        <Navbar />
        <div className="container py-4">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">加载中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1">🎯 理财顾问</h2>
            <p className="text-muted mb-0">智能规划，稳健投资</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Link to="/finance/chat" className="btn btn-outline-primary">
              <i className="bi bi-robot me-2"></i>
              AI理财顾问
            </Link>
            <Link to="/finance/new" className="btn btn-primary">
              <i className="bi bi-plus-lg me-2"></i>
              创建理财目标
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                    <i className="bi bi-bullseye text-primary fs-4"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">理财目标</h6>
                    <h3 className="mb-0">{summary.total_goals || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                    <i className="bi bi-currency-dollar text-success fs-4"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">目标总额</h6>
                    <h3 className="mb-0">¥{summary.total_target_amount?.toLocaleString() || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                    <i className="bi bi-graph-up-arrow text-warning fs-4"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">整体进度</h6>
                    <h3 className="mb-0">{summary.overall_progress || 0}%</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex flex-wrap gap-2">
              <button
                className={`btn ${filterType === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilterType('')}
              >
                全部
              </button>
              {options.goal_types?.map(type => (
                <button
                  key={type.value}
                  className={`btn ${filterType === type.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterType(type.value)}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
              <h5 className="text-muted">暂无理财目标</h5>
              <p className="text-muted mb-3">创建您的第一个理财目标，开启智能投资之旅</p>
              <Link to="/finance/new" className="btn btn-primary me-2">
                <i className="bi bi-plus-lg me-2"></i>
                创建理财目标
              </Link>
              <Link to="/finance/chat" className="btn btn-outline-primary">
                <i className="bi bi-robot me-2"></i>
                AI理财顾问
              </Link>
            </div>
          </div>
        ) : (
          <div className="row">
            {filteredGoals.map(goal => (
              <div key={goal.id} className="col-lg-6 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <span className="fs-3 me-2">{getGoalTypeIcon(goal.goal_type)}</span>
                        <h5 className="d-inline mb-0">{goal.name}</h5>
                      </div>
                      <div className="dropdown">
                        <button
                          className="btn btn-link text-muted p-0"
                          data-bs-toggle="dropdown"
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <Link
                              className="dropdown-item"
                              to={`/finance/${goal.id}/edit`}
                            >
                              <i className="bi bi-pencil me-2"></i>
                              编辑
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to={`/finance/${goal.id}/plan`}
                            >
                              <i className="bi bi-clipboard-data me-2"></i>
                              查看方案
                            </Link>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button
                              className="dropdown-item text-danger"
                              onClick={(e) => handleDelete(goal.id, e)}
                            >
                              <i className="bi bi-trash me-2"></i>
                              删除
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted small">
                          ¥{goal.current_amount?.toLocaleString()} / ¥{goal.target_amount?.toLocaleString()}
                        </span>
                        <span className="text-primary fw-bold">{goal.progress}%</span>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <small className="text-muted d-block">目标日期</small>
                        <span className="fw-medium">{goal.target_date || '未设置'}</span>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">风险偏好</small>
                        <span className={`badge ${getRiskBadgeClass(goal.risk_tolerance)}`}>
                          {getRiskLabel(goal.risk_tolerance)}
                        </span>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">每月定投</small>
                        <span className="fw-medium">¥{goal.monthly_investment?.toLocaleString()}</span>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">状态</small>
                        <span className={`badge ${goal.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                          {goal.status === 'active' ? '进行中' : goal.status}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <Link
                        to={`/finance/${goal.id}/plan`}
                        className="btn btn-outline-primary btn-sm flex-grow-1"
                      >
                        <i className="bi bi-clipboard-data me-2"></i>
                        查看方案
                      </Link>
                      <Link
                        to="/finance/chat"
                        className="btn btn-primary btn-sm flex-grow-1"
                      >
                        <i className="bi bi-robot me-2"></i>
                        咨询AI
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancePage;
