import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { financeAPI } from '../api';
import Navbar from '../components/Navbar';

function FinanceGoalFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    goal_type: 'other',
    target_amount: '',
    current_amount: '0',
    target_date: '',
    risk_tolerance: 'balanced',
    monthly_investment: '0',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const optionsRes = await financeAPI.getOptions();
      setOptions(optionsRes.data);

      if (isEdit) {
        const goalRes = await financeAPI.getGoal(id);
        const goal = goalRes.data.goal;
        setFormData({
          name: goal.name || '',
          goal_type: goal.goal_type || 'other',
          target_amount: goal.target_amount?.toString() || '',
          current_amount: goal.current_amount?.toString() || '0',
          target_date: goal.target_date || '',
          risk_tolerance: goal.risk_tolerance || 'balanced',
          monthly_investment: goal.monthly_investment?.toString() || '0',
          notes: goal.notes || ''
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('请输入目标名称');
      return;
    }

    if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
      alert('请输入有效的目标金额');
      return;
    }

    try {
      setSubmitting(true);
      const submitData = {
        name: formData.name,
        goal_type: formData.goal_type,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
        target_date: formData.target_date || null,
        risk_tolerance: formData.risk_tolerance,
        monthly_investment: parseFloat(formData.monthly_investment) || 0,
        notes: formData.notes
      };

      if (isEdit) {
        await financeAPI.updateGoal(id, submitData);
        alert('更新成功');
      } else {
        const res = await financeAPI.createGoal(submitData);
        alert('创建成功');
        navigate(`/finance/${res.data.goal.id}/plan`);
        return;
      }

      navigate('/finance');
    } catch (error) {
      alert(error.response?.data?.error || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedRisk = () => {
    return options.risk_tolerances?.find(t => t.value === formData.risk_tolerance);
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
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h4 className="mb-0">
                  <i className="bi bi-bullseye me-2 text-primary"></i>
                  {isEdit ? '编辑理财目标' : '创建理财目标'}
                </h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {/* Goal Name */}
                  <div className="mb-4">
                    <label className="form-label fw-medium">
                      目标名称 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="例如：退休养老计划"
                      required
                    />
                  </div>

                  {/* Goal Type */}
                  <div className="mb-4">
                    <label className="form-label fw-medium">
                      目标类型 <span className="text-danger">*</span>
                    </label>
                    <div className="row g-2">
                      {options.goal_types?.map(type => (
                        <div key={type.value} className="col-auto">
                          <button
                            type="button"
                            className={`btn ${formData.goal_type === type.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setFormData(prev => ({ ...prev, goal_type: type.value }))}
                          >
                            <span className="me-1">{type.icon}</span>
                            {type.label}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        目标金额 (¥) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="target_amount"
                        value={formData.target_amount}
                        onChange={handleChange}
                        placeholder="例如：1000000"
                        min="1"
                        required
                      />
                      <small className="text-muted">这是您想要达成的目标金额</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        当前已有金额 (¥)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="current_amount"
                        value={formData.current_amount}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                      />
                      <small className="text-muted">目前已积累的资金</small>
                    </div>
                  </div>

                  {/* Target Date and Monthly Investment */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        目标日期
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        name="target_date"
                        value={formData.target_date}
                        onChange={handleChange}
                      />
                      <small className="text-muted">预计达成目标的日期</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        每月定投金额 (¥)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="monthly_investment"
                        value={formData.monthly_investment}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                      />
                      <small className="text-muted">每月计划投入的金额</small>
                    </div>
                  </div>

                  {/* Risk Tolerance */}
                  <div className="mb-4">
                    <label className="form-label fw-medium">
                      风险偏好 <span className="text-danger">*</span>
                    </label>
                    <div className="row g-3">
                      {options.risk_tolerances?.map(risk => (
                        <div key={risk.value} className="col-md-6">
                          <div
                            className={`card cursor-pointer ${formData.risk_tolerance === risk.value ? 'border-primary' : 'border-secondary'}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setFormData(prev => ({ ...prev, risk_tolerance: risk.value }))}
                          >
                            <div className="card-body py-2">
                              <div className="form-check">
                                <input
                                  type="radio"
                                  className="form-check-input"
                                  id={`risk-${risk.value}`}
                                  name="risk_radio"
                                  checked={formData.risk_tolerance === risk.value}
                                  onChange={() => setFormData(prev => ({ ...prev, risk_tolerance: risk.value }))}
                                />
                                <label
                                  className="form-check-label w-100"
                                  htmlFor={`risk-${risk.value}`}
                                >
                                  <div className="fw-medium">{risk.label}</div>
                                  <small className="text-muted">{risk.description}</small>
                                  <div className="mt-1">
                                    <span className="badge bg-secondary">{risk.expected_return}</span>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {getSelectedRisk() && (
                      <div className="alert alert-info mt-3 mb-0">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>{getSelectedRisk().label}</strong>：{getSelectedRisk().description}
                        预期年化收益率：{getSelectedRisk().expected_return}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="mb-4">
                    <label className="form-label fw-medium">
                      备注说明
                    </label>
                    <textarea
                      className="form-control"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="可以添加任何相关的补充说明..."
                    ></textarea>
                  </div>

                  {/* Buttons */}
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          保存中...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          {isEdit ? '保存修改' : '创建目标并生成方案'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => navigate('/finance')}
                    >
                      取消
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinanceGoalFormPage;
