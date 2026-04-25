import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { immigrationAPI } from '../api';

const STATUS_COLORS = {
  planning: 'bg-secondary',
  preparing: 'bg-info',
  applying: 'bg-primary',
  approved: 'bg-success',
  rejected: 'bg-danger'
};

const STATUS_LABELS = {
  planning: '规划中',
  preparing: '准备中',
  applying: '申请中',
  approved: '已获批',
  rejected: '被拒绝'
};

const COUNTRY_FLAGS = {
  '加拿大': '🇨🇦',
  '美国': '🇺🇸',
  '澳大利亚': '🇦🇺',
  '新西兰': '🇳🇿',
  '英国': '🇬🇧',
  '葡萄牙': '🇵🇹',
  '西班牙': '🇪🇸',
  '希腊': '🇬🇷'
};

function ImmigrationPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadGoals();
  }, [filterStatus]);

  const loadGoals = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await immigrationAPI.getGoals(params);
      setGoals(response.data.goals);
    } catch (err) {
      console.error('Failed to load immigration goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (goalId, e) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个移民目标吗？')) return;
    try {
      await immigrationAPI.deleteGoal(goalId);
      loadGoals();
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleGeneratePlan = async (goalId, e) => {
    e.stopPropagation();
    try {
      const response = await immigrationAPI.generatePlan(goalId);
      alert('方案生成成功！');
      navigate(`/immigration/${goalId}/plan`);
    } catch (err) {
      alert('方案生成失败');
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="page-container">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>🌍 移民顾问</h1>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/immigration/new')}
          >
            <i className="bi bi-plus-lg me-2"></i>
            创建移民目标
          </button>
        </div>

        <div className="row mb-4">
          <div className="col-md-12">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              移民顾问功能帮助您规划和管理移民目标，生成详细的申请方案，并进行风险评估。
              支持加拿大、美国、澳大利亚、新西兰、英国、葡萄牙等热门移民国家。
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <select 
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="planning">规划中</option>
              <option value="preparing">准备中</option>
              <option value="applying">申请中</option>
              <option value="approved">已获批</option>
              <option value="rejected">被拒绝</option>
            </select>
          </div>
          <div className="col-md-8 text-end">
            <span className="text-muted">共 {goals.length} 个移民目标</span>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-5">
            <div className="display-1 mb-3">🌏</div>
            <h3>暂无移民目标</h3>
            <p className="text-muted">点击上方按钮创建您的第一个移民目标</p>
          </div>
        ) : (
          <div className="row g-3">
            {goals.map((goal) => (
              <div key={goal.id} className="col-md-6 col-lg-4">
                <div 
                  className="card h-100 shadow-sm immigration-card"
                  onClick={() => navigate(`/immigration/${goal.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <span className="fs-4">
                      {COUNTRY_FLAGS[goal.target_country] || '🌍'} {goal.target_country}
                    </span>
                    <span className={`badge ${STATUS_COLORS[goal.current_status] || 'bg-secondary'}`}>
                      {STATUS_LABELS[goal.current_status] || goal.current_status}
                    </span>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">{goal.immigration_type}</h5>
                    <div className="mb-2">
                      <small className="text-muted">目标日期：</small>
                      <span>{goal.target_date || '未设置'}</span>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">预算：</small>
                      <span className="fw-bold text-primary">
                        {goal.budget ? `¥${goal.budget.toLocaleString()}` : '未设置'}
                      </span>
                    </div>
                    {goal.notes && (
                      <p className="card-text text-muted small">{goal.notes}</p>
                    )}
                  </div>
                  <div className="card-footer bg-white">
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary flex-grow-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/immigration/${goal.id}/plan`);
                        }}
                      >
                        查看方案
                      </button>
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={(e) => handleGeneratePlan(goal.id, e)}
                      >
                        生成方案
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => handleDelete(goal.id, e)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .immigration-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .immigration-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
}

export default ImmigrationPage;
