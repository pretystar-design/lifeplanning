import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { financeAPI } from '../api';
import Navbar from '../components/Navbar';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title);

const COLORS = ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#6f42c1'];

function FinancePlanDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [goal, setGoal] = useState(null);
  const [plan, setPlan] = useState(null);
  const [risks, setRisks] = useState({});
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const goalRes = await financeAPI.getGoal(id);
      setGoal(goalRes.data.goal);

      const risksRes = await financeAPI.getRisks(id);
      setRisks(risksRes.data);

      try {
        const planRes = await financeAPI.getPlan(id);
        setPlan(planRes.data.plan);
        setSimulation(planRes.data.simulation);
      } catch (e) {
        setPlan(null);
        setSimulation(null);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      const res = await financeAPI.generatePlan(id);
      setPlan(res.data.plan);
      setSimulation(res.data.simulation);
      
      const risksRes = await financeAPI.getRisks(id);
      setRisks(risksRes.data);
    } catch (error) {
      alert('生成方案失败');
    } finally {
      setGenerating(false);
    }
  };

  const getPieData = () => {
    if (!plan?.portfolio_allocation) return null;
    const labels = [];
    const data = [];
    const backgroundColor = [];
    
    Object.entries(plan.portfolio_allocation)
      .filter(([_, value]) => value > 0)
      .forEach(([name, value], index) => {
        labels.push(name === 'stocks' ? '股票' : name === 'bonds' ? '债券' : name === 'funds' ? '基金' : '现金');
        data.push(value);
        backgroundColor.push(COLORS[index % COLORS.length]);
      });

    return {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderWidth: 0
      }]
    };
  };

  const getBarData = () => {
    if (!risks.risk_matrix?.length) return null;
    return {
      labels: risks.risk_matrix.map(r => r.name),
      datasets: [
        {
          label: '发生概率',
          data: risks.risk_matrix.map(r => r.probability),
          backgroundColor: '#0d6efd'
        },
        {
          label: '影响程度',
          data: risks.risk_matrix.map(r => r.impact),
          backgroundColor: '#dc3545'
        }
      ]
    };
  };

  const getLineData = () => {
    if (!simulation?.data_points) return null;
    return {
      labels: simulation.data_points.map(d => `第${d.year}年`),
      datasets: [
        {
          label: '预期资产',
          data: simulation.data_points.map(d => d.value),
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          fill: true,
          tension: 0.3
        },
        ...(goal?.target_amount ? [{
          label: '目标金额',
          data: simulation.data_points.map(() => goal.target_amount),
          borderColor: '#198754',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }] : [])
      ]
    };
  };

  const getRiskLevelBadge = (level) => {
    const badges = {
      low: 'bg-success',
      medium: 'bg-warning text-dark',
      high: 'bg-danger'
    };
    return badges[level] || 'bg-secondary';
  };

  const getRiskLevelLabel = (level) => {
    const labels = {
      low: '低风险',
      medium: '中等风险',
      high: '高风险'
    };
    return labels[level] || level;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0
    }).format(value);
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

  if (!goal) {
    return (
      <div className="min-vh-100 bg-light">
        <Navbar />
        <div className="container py-4">
          <div className="alert alert-danger">目标不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-1">
                <li className="breadcrumb-item">
                  <Link to="/finance" className="text-decoration-none">理财顾问</Link>
                </li>
                <li className="breadcrumb-item active">投资方案</li>
              </ol>
            </nav>
            <h4 className="mb-0">
              <i className="bi bi-graph-up me-2 text-primary"></i>
              {goal.name}
            </h4>
          </div>
          <div className="d-flex gap-2">
            <Link to={`/finance/${id}/edit`} className="btn btn-outline-secondary">
              <i className="bi bi-pencil me-2"></i>
              编辑目标
            </Link>
            {!plan && (
              <button
                className="btn btn-primary"
                onClick={handleGeneratePlan}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    AI生成中...
                  </>
                ) : (
                  <>
                    <i className="bi bi-robot me-2"></i>
                    AI生成投资方案
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Goal Summary */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <small className="text-muted d-block">目标金额</small>
                <h4 className="mb-0 text-primary">{formatCurrency(goal.target_amount)}</h4>
              </div>
              <div className="col-md-3">
                <small className="text-muted d-block">当前金额</small>
                <h4 className="mb-0">{formatCurrency(goal.current_amount)}</h4>
              </div>
              <div className="col-md-3">
                <small className="text-muted d-block">每月定投</small>
                <h4 className="mb-0">{formatCurrency(goal.monthly_investment)}</h4>
              </div>
              <div className="col-md-3">
                <small className="text-muted d-block">目标进度</small>
                <div className="d-flex align-items-center">
                  <h4 className="mb-0 me-2">{goal.progress}%</h4>
                  <div className="progress flex-grow-1" style={{ height: '8px', maxWidth: '100px' }}>
                    <div
                      className="progress-bar bg-primary"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-pie-chart me-2"></i>
              方案总览
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'simulation' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulation')}
              disabled={!simulation}
            >
              <i className="bi bi-graph-up me-2"></i>
              收益模拟
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'risks' ? 'active' : ''}`}
              onClick={() => setActiveTab('risks')}
            >
              <i className="bi bi-shield-exclamation me-2"></i>
              风险评估
            </button>
          </li>
        </ul>

        {!plan && activeTab !== 'risks' && (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <i className="bi bi-robot fs-1 text-muted mb-3 d-block"></i>
              <h5 className="text-muted">尚未生成投资方案</h5>
              <p className="text-muted mb-3">点击下方按钮，让AI根据您的目标和风险偏好生成专属投资方案</p>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleGeneratePlan}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    AI分析中...
                  </>
                ) : (
                  <>
                    <i className="bi bi-stars me-2"></i>
                    立即生成投资方案
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {plan && activeTab === 'overview' && (
          <div className="row">
            {/* Portfolio Allocation */}
            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0">
                    <i className="bi bi-pie-chart me-2 text-primary"></i>
                    资产配置建议
                  </h5>
                </div>
                <div className="card-body">
                  <div style={{ height: '300px', position: 'relative' }}>
                    {getPieData() && <Pie data={getPieData()} options={{ maintainAspectRatio: false }} />}
                  </div>
                  <div className="mt-3">
                    {Object.entries(plan.portfolio_allocation || {})
                      .filter(([_, v]) => v > 0)
                      .map(([key, value], index) => (
                        <div key={key} className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <span
                              className="badge me-2"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            >
                              {key === 'stocks' ? '股票' : key === 'bonds' ? '债券' : key === 'funds' ? '基金' : '现金'}
                            </span>
                          </div>
                          <span className="fw-bold">{value}%</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Summary */}
            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0">
                    <i className="bi bi-info-circle me-2 text-primary"></i>
                    方案概要
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted">预期年化收益率</td>
                        <td className="text-end">
                          <span className="text-success fw-bold fs-5">{plan.expected_return}%</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">预期最终金额</td>
                        <td className="text-end">
                          <span className="text-primary fw-bold fs-5">
                            {formatCurrency(plan.expected_final_amount)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">风险等级</td>
                        <td className="text-end">
                          <span className={`badge ${getRiskLevelBadge(plan.risk_level)}`}>
                            {getRiskLevelLabel(plan.risk_level)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">投资周期</td>
                        <td className="text-end">
                          {simulation?.months || 12} 个月
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">方案生成</td>
                        <td className="text-end">
                          {plan.generated_by_ai ? (
                            <span className="badge bg-primary">
                              <i className="bi bi-robot me-1"></i>
                              AI生成
                            </span>
                          ) : (
                            <span className="badge bg-secondary">手动配置</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {plan.expected_final_amount >= goal.target_amount ? (
                    <div className="alert alert-success mb-0">
                      <i className="bi bi-check-circle me-2"></i>
                      按照此方案执行，有望达成目标！
                    </div>
                  ) : (
                    <div className="alert alert-warning mb-0">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      当前配置可能无法达成目标，建议调整投资金额或延长投资周期
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {simulation && activeTab === 'simulation' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2 text-primary"></i>
                收益增长曲线
              </h5>
            </div>
            <div className="card-body">
              <div style={{ height: '400px', position: 'relative' }}>
                {getLineData() && (
                  <Line
                    data={getLineData()}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
                          }
                        }
                      },
                      scales: {
                        y: {
                          ticks: {
                            callback: (value) => `¥${(value / 10000).toFixed(0)}万`
                          }
                        }
                      }
                    }}
                  />
                )}
              </div>

              <div className="row mt-4">
                <div className="col-md-4">
                  <div className="text-center p-3 bg-light rounded">
                    <div className="text-muted small">初始投资</div>
                    <div className="fs-4 fw-bold">{formatCurrency(simulation.initial_amount)}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                    <div className="text-muted small">预期最终金额</div>
                    <div className="fs-4 fw-bold text-primary">
                      {formatCurrency(simulation.expected_final_amount)}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <div className="text-muted small">预期收益</div>
                    <div className="fs-4 fw-bold text-success">
                      +{formatCurrency(simulation.expected_final_amount - simulation.initial_amount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="row">
            {/* Risk Overview */}
            <div className="col-lg-4 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0">
                    <i className="bi bi-speedometer me-2 text-primary"></i>
                    综合风险评分
                  </h5>
                </div>
                <div className="card-body text-center">
                  <div
                    className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '150px',
                      height: '150px',
                      backgroundColor: risks.risk_level === 'high' ? '#dc354520' : risks.risk_level === 'medium' ? '#ffc10720' : '#19875420'
                    }}
                  >
                    <div>
                      <div className="fs-1 fw-bold">
                        {risks.overall_risk_score || 0}
                      </div>
                      <small className="text-muted">风险指数</small>
                    </div>
                  </div>
                  <span className={`badge ${getRiskLevelBadge(risks.risk_level)} fs-6`}>
                    {getRiskLevelLabel(risks.risk_level)}
                  </span>
                  <p className="text-muted mt-3 mb-0">
                    {risks.risk_level === 'high' && '当前投资方案风险较高，建议降低风险偏好或分散投资'}
                    {risks.risk_level === 'medium' && '风险适中，建议定期检视并适时调整'}
                    {risks.risk_level === 'low' && '风险较低，适合追求稳健收益的投资者'}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Matrix */}
            <div className="col-lg-8 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0">
                    <i className="bi bi-bar-chart me-2 text-primary"></i>
                    风险矩阵
                  </h5>
                </div>
                <div className="card-body">
                  <div style={{ height: '300px', position: 'relative' }}>
                    {getBarData() && (
                      <Bar
                        data={getBarData()}
                        options={{
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.dataset.label}: ${context.raw.toFixed(1)}%`
                              }
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Details */}
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0">
                    <i className="bi bi-list-check me-2 text-primary"></i>
                    风险详情与应对策略
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {risks.risks?.map(risk => (
                      <div key={risk.id} className="col-md-6 mb-3">
                        <div className="card h-100 border">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="mb-0">{risk.risk_name}</h6>
                              <span className={`badge ${getRiskLevelBadge(risk.risk_level)}`}>
                                {getRiskLevelLabel(risk.risk_level)}
                              </span>
                            </div>
                            <div className="row mb-2">
                              <div className="col-6">
                                <small className="text-muted d-block">发生概率</small>
                                <div className="progress" style={{ height: '6px' }}>
                                  <div
                                    className="progress-bar bg-primary"
                                    style={{ width: `${(risk.risk_probability || 0) * 100}%` }}
                                  ></div>
                                </div>
                                <small>{(risk.risk_probability || 0) * 100}%</small>
                              </div>
                              <div className="col-6">
                                <small className="text-muted d-block">影响程度</small>
                                <div className="progress" style={{ height: '6px' }}>
                                  <div
                                    className="progress-bar bg-danger"
                                    style={{ width: `${(risk.risk_impact || 0) * 100}%` }}
                                  ></div>
                                </div>
                                <small>{(risk.risk_impact || 0) * 100}%</small>
                              </div>
                            </div>
                            <div className="alert alert-info py-2 mb-0">
                              <i className="bi bi-lightbulb me-2"></i>
                              <small>{risk.mitigation_strategy}</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regenerate Button */}
        {plan && (
          <div className="mt-4 text-center">
            <button
              className="btn btn-outline-primary"
              onClick={handleGeneratePlan}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  重新生成中...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-repeat me-2"></i>
                  重新生成方案
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancePlanDetailPage;
