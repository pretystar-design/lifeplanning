import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { immigrationAPI } from '../api';

const COUNTRIES = [
  '加拿大', '美国', '澳大利亚', '新西兰', '英国', '葡萄牙', '西班牙', '希腊'
];

const IMMIGRATION_TYPES = [
  { value: '技术移民', label: '技术移民', desc: '基于学历、工作经验、语言能力的移民方式' },
  { value: '投资移民', label: '投资移民', desc: '通过投资当地企业或房产获得居留权' },
  { value: '留学移民', label: '留学移民', desc: '先留学后移民，通过留学期间积累经验' },
  { value: '团聚移民', label: '团聚移民', desc: '家庭成员担保的移民方式' },
  { value: '创业移民', label: '创业移民', desc: '在当地创办企业并经营' }
];

const STATUS_OPTIONS = [
  { value: 'planning', label: '规划中', desc: '刚开始考虑移民' },
  { value: 'preparing', label: '准备中', desc: '正在准备语言考试、存款等材料' },
  { value: 'applying', label: '申请中', desc: '已提交移民申请' },
  { value: 'approved', label: '已获批', desc: '移民申请已批准' },
  { value: 'rejected', label: '被拒绝', desc: '移民申请被拒绝' }
];

function ImmigrationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    target_country: '加拿大',
    immigration_type: '技术移民',
    current_status: 'planning',
    target_date: '',
    budget: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [fetchingGoal, setFetchingGoal] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      loadGoal();
    }
  }, [id]);

  const loadGoal = async () => {
    try {
      const response = await immigrationAPI.getGoal(id);
      const goal = response.data.goal;
      setFormData({
        target_country: goal.target_country,
        immigration_type: goal.immigration_type,
        current_status: goal.current_status,
        target_date: goal.target_date || '',
        budget: goal.budget || '',
        notes: goal.notes || ''
      });
    } catch (err) {
      alert('加载目标失败');
      navigate('/immigration');
    } finally {
      setFetchingGoal(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : 0
      };

      if (isEditing) {
        await immigrationAPI.updateGoal(id, submitData);
        alert('更新成功！');
      } else {
        await immigrationAPI.createGoal(submitData);
        alert('创建成功！');
      }
      navigate('/immigration');
    } catch (err) {
      alert(err.response?.data?.error || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingGoal) {
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
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">
                  <i className="bi bi-globe me-2"></i>
                  {isEditing ? '编辑移民目标' : '创建移民目标'}
                </h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    {/* 目标国家 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        目标国家 <span className="text-danger">*</span>
                      </label>
                      <select
                        name="target_country"
                        className="form-select"
                        value={formData.target_country}
                        onChange={handleChange}
                        required
                      >
                        {COUNTRIES.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                      <div className="form-text">选择您计划移民的目标国家</div>
                    </div>

                    {/* 移民类型 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        移民类型 <span className="text-danger">*</span>
                      </label>
                      <select
                        name="immigration_type"
                        className="form-select"
                        value={formData.immigration_type}
                        onChange={handleChange}
                        required
                      >
                        {IMMIGRATION_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 当前状态 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">当前状态</label>
                      <select
                        name="current_status"
                        className="form-select"
                        value={formData.current_status}
                        onChange={handleChange}
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 目标日期 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">目标移民日期</label>
                      <input
                        type="date"
                        name="target_date"
                        className="form-control"
                        value={formData.target_date}
                        onChange={handleChange}
                      />
                      <div className="form-text">预计何时完成移民</div>
                    </div>

                    {/* 预算 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">预算（人民币）</label>
                      <div className="input-group">
                        <span className="input-group-text">¥</span>
                        <input
                          type="number"
                          name="budget"
                          className="form-control"
                          value={formData.budget}
                          onChange={handleChange}
                          min="0"
                          step="10000"
                          placeholder="请输入预算金额"
                        />
                      </div>
                      <div className="form-text">包括申请费、中介费、机票等总预算</div>
                    </div>

                    {/* 备注 */}
                    <div className="col-12">
                      <label className="form-label fw-bold">备注信息</label>
                      <textarea
                        name="notes"
                        className="form-control"
                        rows="3"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="其他需要记录的信息，如特殊考虑因素等"
                      />
                    </div>

                    {/* 提示信息 */}
                    <div className="col-12">
                      <div className="alert alert-warning mb-0">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        <strong>温馨提示：</strong>
                        创建目标后，您可以点击"生成方案"获取详细的申请流程和材料清单。
                      </div>
                    </div>

                    {/* 按钮 */}
                    <div className="col-12">
                      <hr />
                      <div className="d-flex gap-2">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              保存中...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-lg me-2"></i>
                              {isEditing ? '更新目标' : '创建目标'}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => navigate('/immigration')}
                        >
                          取消
                        </button>
                      </div>
                    </div>
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

export default ImmigrationFormPage;
