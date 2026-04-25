import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { immigrationAPI } from '../api';

const RISK_COLORS = {
  high: 'text-danger fw-bold',
  medium: 'text-warning fw-bold',
  low: 'text-success fw-bold'
};

const RISK_ICONS = {
  high: 'bi-exclamation-triangle-fill',
  medium: 'bi-exclamation-circle-fill',
  low: 'bi-check-circle-fill'
};

const RISK_LABELS = {
  policy: '政策风险',
  financial: '资金风险',
  timeline: '时间风险',
  documents: '材料风险',
  language: '语言风险',
  other: '其他风险'
};

function ImmigrationPlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [plan, setPlan] = useState(null);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [goalRes, planRes, risksRes] = await Promise.all([
        immigrationAPI.getGoal(id),
        immigrationAPI.getPlan(id).catch(() => ({ data: { plan: null } })),
        immigrationAPI.getRisks(id).catch(() => ({ data: { risks: [] } }))
      ]);
      setGoal(goalRes.data.goal);
      setPlan(planRes.data.plan);
      setRisks(risksRes.data.risks);
    } catch (err) {
      console.error('Failed to load data:', err);
      alert('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const response = await immigrationAPI.generatePlan(id);
      setPlan(response.data.plan);
      setRisks(response.data.risks);
      alert('方案生成成功！');
    } catch (err) {
      alert('方案生成失败');
    } finally {
      setGenerating(false);
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

  if (!goal) {
    return (
      <div>
        <Navbar />
        <div className="page-container">
          <div className="alert alert-danger">目标不存在</div>
          <button className="btn btn-primary" onClick={() => navigate('/immigration')}>
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="page-container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/immigration">移民顾问</Link>
                </li>
                <li className="breadcrumb-item active">
                  {goal.target_country} - {goal.immigration_type}
                </li>
              </ol>
            </nav>
            <h2 className="mb-1">
              {goal.target_country} {goal.immigration_type}
            </h2>
            <span className="text-muted">
              目标日期: {goal.target_date || '未设置'} | 预算: ¥{goal.budget?.toLocaleString() || '未设置'}
            </span>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate(`/immigration/${id}/edit`)}
            >
              <i className="bi bi-pencil me-2"></i>
              编辑目标
            </button>
            <button 
              className="btn btn-success"
              onClick={handleGeneratePlan}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  生成中...
                </>
              ) : (
                <>
                  <i className="bi bi-magic me-2"></i>
                  {plan ? '重新生成方案' : '生成方案'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-house me-2"></i>概览
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'process' ? 'active' : ''}`}
              onClick={() => setActiveTab('process')}
            >
              <i className="bi bi-list-check me-2"></i>申请流程
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <i className="bi bi-file-earmark-text me-2"></i>材料清单
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'risks' ? 'active' : ''}`}
              onClick={() => setActiveTab('risks')}
            >
              <i className="bi bi-shield-exclamation me-2"></i>风险评估
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="row g-4">
            {/* 没有方案时显示提示 */}
            {!plan ? (
              <div className="col-12">
                <div className="alert alert-info text-center py-5">
                  <div className="display-3 mb-3">📋</div>
                  <h4>尚未生成移民方案</h4>
                  <p className="text-muted">点击上方"生成方案"按钮获取详细的申请流程和材料清单</p>
                  <button className="btn btn-success btn-lg" onClick={handleGeneratePlan}>
                    立即生成方案
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 方案名称和基本信息 */}
                <div className="col-lg-8">
                  <div className="card shadow-sm mb-4">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">
                        <i className="bi bi-file-earmarkrichtext me-2"></i>
                        {plan.plan_data.template_name}
                      </h5>
                    </div>
                    <div className="card-body">
                      <p className="text-muted">{plan.plan_data.notes}</p>
                      
                      {/* 申请条件 */}
                      <h6 className="fw-bold mt-4">
                        <i className="bi bi-clipboard-check me-2 text-primary"></i>
                        申请条件
                      </h6>
                      <ul className="list-group list-group-flush mb-4">
                        {plan.plan_data.eligibility.map((item, idx) => (
                          <li key={idx} className="list-group-item">
                            <i className="bi bi-check2 me-2 text-success"></i>
                            {item}
                          </li>
                        ))}
                      </ul>

                      {/* 费用估算 */}
                      <h6 className="fw-bold">
                        <i className="bi bi-currency-dollar me-2 text-success"></i>
                        费用估算
                      </h6>
                      <table className="table table-sm">
                        <tbody>
                          {Object.entries(plan.plan_data.fees).map(([key, value]) => (
                            <tr key={key}>
                              <td className="fw-bold">{key}</td>
                              <td className="text-end">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 侧边栏 */}
                <div className="col-lg-4">
                  {/* 时间线 */}
                  <div className="card shadow-sm mb-4">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0">
                        <i className="bi bi-clock me-2"></i>
                        预计时间线
                      </h6>
                    </div>
                    <div className="card-body text-center">
                      <div className="display-4 text-primary">{plan.plan_data.timeline}</div>
                      <p className="text-muted mt-2 mb-0">从申请到获批的总周期</p>
                    </div>
                  </div>

                  {/* 风险概览 */}
                  <div className="card shadow-sm">
                    <div className="card-header bg-warning text-dark">
                      <h6 className="mb-0">
                        <i className="bi bi-graph-up me-2"></i>
                        风险概览
                      </h6>
                    </div>
                    <div className="card-body">
                      {risks.length > 0 ? (
                        <div className="list-group list-group-flush">
                          {risks.map((risk, idx) => (
                            <div key={idx} className="list-group-item px-0">
                              <div className="d-flex justify-content-between align-items-center">
                                <span>{RISK_LABELS[risk.risk_type] || risk.risk_type}</span>
                                <span className={RISK_COLORS[risk.risk_level]}>
                                  <i className={`bi ${RISK_ICONS[risk.risk_level]} me-1`}></i>
                                  {risk.risk_level === 'high' ? '高' : risk.risk_level === 'medium' ? '中' : '低'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted text-center mb-0">暂无风险数据</p>
                      )}
                      <button 
                        className="btn btn-sm btn-outline-warning w-100 mt-3"
                        onClick={() => setActiveTab('risks')}
                      >
                        查看详细分析
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'process' && (
          <div className="row">
            <div className="col-lg-12">
              <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-list-check me-2"></i>
                    申请流程步骤
                  </h5>
                </div>
                <div className="card-body">
                  {!plan ? (
                    <div className="alert alert-info">请先生成方案</div>
                  ) : (
                    <div className="row">
                      {plan.plan_data.process.map((step, idx) => (
                        <div key={idx} className="col-md-6 mb-4">
                          <div className="d-flex">
                            <div className="flex-shrink-0">
                              <div 
                                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '40px', height: '40px' }}
                              >
                                {step.step}
                              </div>
                              {idx < plan.plan_data.process.length - 1 && (
                                <div 
                                  className="border-start border-2 border-primary ms-4 mt-2"
                                  style={{ height: '100%', minHeight: '60px' }}
                                ></div>
                              )}
                            </div>
                            <div className="ms-3">
                              <h6 className="fw-bold mb-1">{step.title}</h6>
                              <span className="badge bg-info mb-2">{step.duration}</span>
                              <p className="text-muted mb-0 small">{step.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="row">
            <div className="col-lg-12">
              <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    所需材料清单
                  </h5>
                </div>
                <div className="card-body">
                  {!plan ? (
                    <div className="alert alert-info">请先生成方案</div>
                  ) : (
                    <div className="row">
                      {plan.plan_data.documents.map((doc, idx) => (
                        <div key={idx} className="col-md-6 col-lg-4 mb-2">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id={`doc-${idx}`}
                            />
                            <label 
                              className="form-check-label" 
                              htmlFor={`doc-${idx}`}
                            >
                              {doc}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card-footer text-muted">
                  <i className="bi bi-info-circle me-2"></i>
                  勾选已准备的材料，方便跟踪进度
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="row g-4">
            {/* 风险矩阵 */}
            <div className="col-lg-8">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-warning text-dark">
                  <h5 className="mb-0">
                    <i className="bi bi-shield-exclamation me-2"></i>
                    风险评估详情
                  </h5>
                </div>
                <div className="card-body">
                  {risks.length === 0 ? (
                    <div className="alert alert-info">请先生成方案以获取风险评估</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>风险类型</th>
                            <th>风险等级</th>
                            <th>风险描述</th>
                            <th>缓解建议</th>
                          </tr>
                        </thead>
                        <tbody>
                          {risks.map((risk, idx) => (
                            <tr key={idx}>
                              <td>
                                <span className="badge bg-secondary">
                                  {RISK_LABELS[risk.risk_type] || risk.risk_type}
                                </span>
                              </td>
                              <td>
                                <span className={RISK_COLORS[risk.risk_level]}>
                                  <i className={`bi ${RISK_ICONS[risk.risk_level]} me-1`}></i>
                                  {risk.risk_level === 'high' ? '高' : 
                                   risk.risk_level === 'medium' ? '中' : '低'}
                                </span>
                              </td>
                              <td>{risk.risk_description}</td>
                              <td className="text-success small">{risk.mitigation_suggestion}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 风险可视化 */}
            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-header bg-warning text-dark">
                  <h6 className="mb-0">
                    <i className="bi bi-pie-chart me-2"></i>
                    风险分布
                  </h6>
                </div>
                <div className="card-body">
                  {risks.length === 0 ? (
                    <p className="text-muted text-center">暂无数据</p>
                  ) : (
                    <div className="risk-chart">
                      {['high', 'medium', 'low'].map(level => {
                        const count = risks.filter(r => r.risk_level === level).length;
                        const colors = {
                          high: '#dc3545',
                          medium: '#ffc107',
                          low: '#28a745'
                        };
                        return (
                          <div key={level} className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span>
                                {level === 'high' ? '高风险' : level === 'medium' ? '中风险' : '低风险'}
                              </span>
                              <span className="fw-bold">{count}项</span>
                            </div>
                            <div className="progress" style={{ height: '20px' }}>
                              <div 
                                className="progress-bar"
                                role="progressbar"
                                style={{ 
                                  width: `${(count / risks.length) * 100}%`,
                                  backgroundColor: colors[level]
                                }}
                              >
                                {count > 0 && count}
                              </div>
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
        )}
      </div>
    </div>
  );
}

export default ImmigrationPlanDetailPage;
