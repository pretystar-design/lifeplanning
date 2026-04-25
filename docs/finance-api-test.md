# AI理财顾问 API 测试示例

## 基础信息
- 基础URL: `/api/v1/finance/advisor`
- 认证方式: JWT Bearer Token
- 所有请求需要先登录获取token

## 测试前准备

### 1. 登录获取Token
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

响应示例：
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### 2. 设置环境变量
```bash
export TOKEN="your_jwt_token_here"
```

---

## API测试示例

### 获取选项列表（目标类型、风险偏好）

```bash
curl -X GET http://localhost:5000/api/v1/finance/advisor/options \
  -H "Authorization: Bearer $TOKEN"
```

响应示例：
```json
{
  "goal_types": [
    {"value": "retirement", "label": "退休养老", "icon": "🏖️"},
    {"value": "education", "label": "子女教育", "icon": "🎓"},
    {"value": "housing", "label": "购房首付", "icon": "🏠"},
    {"value": "wedding", "label": "婚嫁储备", "icon": "💒"},
    {"value": "travel", "label": "旅游基金", "icon": "✈️"},
    {"value": "emergency", "label": "应急基金", "icon": "🛡️"},
    {"value": "freedom", "label": "财务自由", "icon": "💰"},
    {"value": "other", "label": "其他目标", "icon": "🎯"}
  ],
  "risk_tolerances": [
    {"value": "conservative", "label": "保守型", "description": "追求稳定收益，回避风险", "expected_return": "3-5%"},
    {"value": "steady", "label": "稳健型", "description": "在控制风险的前提下追求收益", "expected_return": "5-7%"},
    {"value": "balanced", "label": "平衡型", "description": "风险与收益平衡", "expected_return": "7-10%"},
    {"value": "aggressive", "label": "进取型", "description": "追求较高收益，能承受较大波动", "expected_return": "10-15%"},
    {"value": "very_aggressive", "label": "激进型", "description": "追求最大化收益，接受高波动", "expected_return": "15%+"}
  ]
}
```

---

### 创建理财目标

```bash
curl -X POST http://localhost:5000/api/v1/finance/advisor/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "退休养老计划",
    "goal_type": "retirement",
    "target_amount": 1000000,
    "current_amount": 100000,
    "target_date": "2035-12-31",
    "risk_tolerance": "balanced",
    "monthly_investment": 5000,
    "notes": "希望60岁退休，保持现有生活水平"
  }'
```

响应示例：
```json
{
  "message": "理财目标创建成功",
  "goal": {
    "id": 1,
    "user_id": 1,
    "goal_type": "retirement",
    "name": "退休养老计划",
    "target_amount": 1000000.0,
    "current_amount": 100000.0,
    "target_date": "2035-12-31",
    "risk_tolerance": "balanced",
    "monthly_investment": 5000.0,
    "notes": "希望60岁退休，保持现有生活水平",
    "status": "active",
    "progress": 10.0,
    "created_at": "2025-01-01T10:00:00",
    "updated_at": "2025-01-01T10:00:00"
  }
}
```

---

### 获取理财目标列表

```bash
curl -X GET http://localhost:5000/api/v1/finance/advisor/goals \
  -H "Authorization: Bearer $TOKEN"
```

按类型筛选：
```bash
curl -X GET "http://localhost:5000/api/v1/finance/advisor/goals?goal_type=retirement" \
  -H "Authorization: Bearer $TOKEN"
```

响应示例：
```json
{
  "goals": [...],
  "summary": {
    "total_goals": 3,
    "total_target_amount": 2500000,
    "total_current_amount": 350000,
    "overall_progress": 14.0
  }
}
```

---

### 获取单个理财目标

```bash
curl -X GET http://localhost:5000/api/v1/finance/advisor/goals/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 更新理财目标

```bash
curl -X PUT http://localhost:5000/api/v1/finance/advisor/goals/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_amount": 150000,
    "monthly_investment": 6000
  }'
```

---

### 删除理财目标

```bash
curl -X DELETE http://localhost:5000/api/v1/finance/advisor/goals/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### AI生成投资方案

```bash
curl -X POST http://localhost:5000/api/v1/finance/advisor/goals/1/generate-plan \
  -H "Authorization: Bearer $TOKEN"
```

响应示例：
```json
{
  "message": "投资方案生成成功",
  "plan": {
    "id": 1,
    "goal_id": 1,
    "portfolio_allocation": {
      "stocks": 40,
      "bonds": 35,
      "funds": 20,
      "cash": 5
    },
    "expected_return": 7.4,
    "expected_final_amount": 1234567.89,
    "risk_level": "medium",
    "generated_by_ai": true,
    "generated_at": "2025-01-01T10:30:00",
    "updated_at": "2025-01-01T10:30:00"
  },
  "simulation": {
    "months": 132,
    "expected_return": 7.4,
    "expected_final_amount": 1234567.89,
    "data_points": [
      {"month": 0, "year": 0, "value": 100000.0},
      {"month": 12, "year": 1, "value": 165432.0},
      {"month": 24, "year": 2, "value": 237845.0},
      ...
    ]
  }
}
```

---

### 获取投资方案

```bash
curl -X GET http://localhost:5000/api/v1/finance/advisor/goals/1/plan \
  -H "Authorization: Bearer $TOKEN"
```

---

### 投资收益模拟

```bash
curl -X POST http://localhost:5000/api/v1/finance/advisor/goals/1/simulate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_amount": 200000,
    "monthly_investment": 8000,
    "expected_return": 8.5,
    "months": 180
  }'
```

响应示例：
```json
{
  "simulation": {
    "initial_amount": 200000,
    "monthly_investment": 8000,
    "expected_return": 8.5,
    "investment_period_months": 180,
    "expected_final_amount": 3567890.12,
    "data_points": [
      {"month": 0, "year": 0, "value": 200000.0},
      {"month": 12, "year": 1, "value": 300123.0},
      ...
    ]
  }
}
```

---

### 获取风险评估

```bash
curl -X GET http://localhost:5000/api/v1/finance/advisor/goals/1/risks \
  -H "Authorization: Bearer $TOKEN"
```

响应示例：
```json
{
  "risks": [
    {
      "id": 1,
      "goal_id": 1,
      "risk_type": "market",
      "risk_name": "市场风险",
      "risk_probability": 0.6,
      "risk_impact": 0.4,
      "risk_level": "medium",
      "mitigation_strategy": "通过资产配置分散风险，保持投资组合多样化",
      "created_at": "2025-01-01T10:30:00"
    },
    ...
  ],
  "risk_matrix": [
    {"id": 1, "type": "market", "name": "市场风险", "probability": 60, "impact": 40, "level": "medium", "mitigation": "..."},
    ...
  ],
  "overall_risk_score": 35.5,
  "risk_level": "medium"
}
```

---

### 获取市场洞察

```bash
curl -X GET http://localhost:5000/api/v1/finance/advisor/market-insights \
  -H "Authorization: Bearer $TOKEN"
```

响应示例：
```json
{
  "insights": {
    "stocks": {
      "current_trend": "震荡上行",
      "outlook": "建议适度配置",
      "historical_return": "10%",
      "volatility": "中等"
    },
    "bonds": {
      "current_trend": "收益率企稳",
      "outlook": "建议保持配置",
      "historical_return": "4%",
      "volatility": "低"
    },
    "funds": {
      "current_trend": "分化明显",
      "outlook": "建议精选优质基金",
      "historical_return": "8%",
      "volatility": "中等"
    },
    "cash": {
      "current_trend": "利率平稳",
      "outlook": "流动性管理必备",
      "historical_return": "2%",
      "volatility": "极低"
    },
    "tips": [
      "建议定期检视投资组合，根据市场变化适时调整",
      "分散投资可以有效降低非系统性风险",
      "长期坚持定投有助于平滑市场波动的影响",
      "应急基金建议保持3-6个月支出水平"
    ]
  }
}
```

---

## 完整测试流程

### 1. 创建目标
```bash
# 创建退休计划
curl -X POST http://localhost:5000/api/v1/finance/advisor/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的退休计划",
    "goal_type": "retirement",
    "target_amount": 2000000,
    "current_amount": 200000,
    "target_date": "2040-01-01",
    "risk_tolerance": "balanced",
    "monthly_investment": 8000
  }'
```

### 2. 生成AI投资方案
```bash
# 假设返回的目标ID是1
curl -X POST http://localhost:5000/api/v1/finance/advisor/goals/1/generate-plan \
  -H "Authorization: Bearer $TOKEN"
```

### 3. 查看投资方案
```bash
curl -X GET http://localhost:5000/api/v1/finance/advisor/goals/1/plan \
  -H "Authorization: Bearer $TOKEN"
```

### 4. 查看风险评估
```bash
curl -X GET http://localhost:5000/api/v1/finance/advisor/goals/1/risks \
  -H "Authorization: Bearer $TOKEN"
```

---

## 资产配置模板

| 风险偏好 | 股票 | 债券 | 基金 | 现金 | 预期收益 |
|---------|------|------|------|------|----------|
| 保守型  | 20%  | 70%  | 0%   | 10%  | 3-5%    |
| 稳健型  | 35%  | 50%  | 10%  | 5%   | 5-7%    |
| 平衡型  | 40%  | 35%  | 20%  | 5%   | 7-10%   |
| 进取型  | 50%  | 20%  | 25%  | 5%   | 10-15%  |
| 激进型  | 60%  | 10%  | 25%  | 5%   | 15%+    |

---

## 预期收益率假设

| 资产类型 | 预期年化收益率 |
|---------|---------------|
| 股票    | 10%          |
| 债券    | 4%           |
| 基金    | 8%           |
| 现金    | 2%           |

> **注意**：以上收益率仅为示例参考，实际收益会受市场波动影响。投资有风险，决策需谨慎。
