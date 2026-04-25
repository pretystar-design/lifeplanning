from flask import Blueprint, request, jsonify
from app import db
from app.models import FinancialGoal, InvestmentPlan, InvestmentRisk
from app.utils.auth import token_required
from datetime import datetime, date
import math

bp = Blueprint('finance', __name__, url_prefix='/api/finance/advisor')

# 资产配置模板
PORTFOLIO_TEMPLATES = {
    'conservative': {  # 保守型
        'stocks': 20,
        'bonds': 70,
        'funds': 0,
        'cash': 10
    },
    'steady': {  # 稳健型
        'stocks': 35,
        'bonds': 50,
        'funds': 10,
        'cash': 5
    },
    'balanced': {  # 平衡型
        'stocks': 40,
        'bonds': 35,
        'funds': 20,
        'cash': 5
    },
    'aggressive': {  # 进取型
        'stocks': 50,
        'bonds': 20,
        'funds': 25,
        'cash': 5
    },
    'very_aggressive': {  # 激进型
        'stocks': 60,
        'bonds': 10,
        'funds': 25,
        'cash': 5
    }
}

# 各资产预期收益率
ASSET_RETURNS = {
    'stocks': 0.10,    # 股票 10%
    'bonds': 0.04,     # 债券 4%
    'funds': 0.08,     # 基金 8%
    'cash': 0.02       # 现金 2%
}

# 风险类型定义
RISK_DEFINITIONS = {
    'market': {
        'name': '市场风险',
        'description': '股市波动、利率变化导致的投资损失',
        'probability': 0.6,
        'impact': 0.4,
        'mitigation': '通过资产配置分散风险，保持投资组合多样化'
    },
    'liquidity': {
        'name': '流动性风险',
        'description': '资产变现难度增加，无法及时赎回',
        'probability': 0.2,
        'impact': 0.3,
        'mitigation': '保持足够的现金储备，避免投资封闭期较长的产品'
    },
    'inflation': {
        'name': '通胀风险',
        'description': '购买力下降，实际收益被侵蚀',
        'probability': 0.7,
        'impact': 0.3,
        'mitigation': '配置一定比例的权益类资产，追求超过通胀的收益'
    },
    'timing': {
        'name': '时间风险',
        'description': '投资周期不足，可能无法达到预期收益',
        'probability': 0.3,
        'impact': 0.5,
        'mitigation': '尽早开始投资，坚持长期投资理念'
    },
    'product': {
        'name': '产品风险',
        'description': '具体投资产品的信用风险或运营风险',
        'probability': 0.1,
        'impact': 0.4,
        'mitigation': '选择资质良好的投资机构，分散投资多个产品'
    }
}


def calculate_expected_return(risk_tolerance):
    """根据风险偏好计算预期收益率"""
    template = PORTFOLIO_TEMPLATES.get(risk_tolerance, PORTFOLIO_TEMPLATES['balanced'])
    total_return = 0
    for asset, percentage in template.items():
        total_return += (percentage / 100) * ASSET_RETURNS.get(asset, 0)
    return round(total_return * 100, 2)


def calculate_future_value(current_amount, monthly_investment, annual_rate, months):
    """计算未来值（考虑复利和每月定投）"""
    if months <= 0:
        return current_amount
    
    monthly_rate = annual_rate / 12
    
    if monthly_rate == 0:
        return current_amount + monthly_investment * months
    
    # 一次性投资部分
    fv_pv = current_amount * math.pow(1 + monthly_rate, months)
    
    # 每月定投部分
    fv_pmt = monthly_investment * ((math.pow(1 + monthly_rate, months) - 1) / monthly_rate)
    
    return round(fv_pv + fv_pmt, 2)


def generate_simulation_data(current_amount, monthly_investment, annual_rate, months):
    """生成收益模拟数据"""
    data_points = []
    step = max(1, months // 12)
    for m in range(0, months + 1, step):
        value = calculate_future_value(current_amount, monthly_investment, annual_rate, m)
        data_points.append({
            'month': m,
            'year': round(m / 12, 1),
            'value': round(value, 2)
        })
    return data_points


def get_risk_level(risk_tolerance):
    """根据风险偏好返回风险等级"""
    mapping = {
        'conservative': 'low',
        'steady': 'low',
        'balanced': 'medium',
        'aggressive': 'high',
        'very_aggressive': 'high'
    }
    return mapping.get(risk_tolerance, 'medium')


# ============ 理财目标 API ============

@bp.route('/goals', methods=['GET'])
@token_required
def get_goals():
    """获取所有理财目标"""
    status = request.args.get('status')
    goal_type = request.args.get('goal_type')
    
    query = FinancialGoal.query.filter_by(user_id=request.user_id)
    
    if status:
        query = query.filter_by(status=status)
    if goal_type:
        query = query.filter_by(goal_type=goal_type)
    
    goals = query.order_by(FinancialGoal.created_at.desc()).all()
    
    # 汇总统计
    total_target = sum(g.target_amount for g in goals)
    total_current = sum(g.current_amount for g in goals)
    
    return jsonify({
        'goals': [g.to_dict() for g in goals],
        'summary': {
            'total_goals': len(goals),
            'total_target_amount': total_target,
            'total_current_amount': total_current,
            'overall_progress': round((total_current / total_target * 100) if total_target > 0 else 0, 2)
        }
    }), 200


@bp.route('/goals', methods=['POST'])
@token_required
def create_goal():
    """创建理财目标"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': '请求数据不能为空'}), 400
    if not data.get('name'):
        return jsonify({'error': '目标名称不能为空'}), 400
    if not data.get('target_amount') or data['target_amount'] <= 0:
        return jsonify({'error': '目标金额必须大于0'}), 400
    
    goal = FinancialGoal(
        user_id=request.user_id,
        goal_type=data.get('goal_type', 'other'),
        name=data['name'],
        target_amount=data['target_amount'],
        current_amount=data.get('current_amount', 0),
        target_date=datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data.get('target_date') else None,
        risk_tolerance=data.get('risk_tolerance', 'balanced'),
        monthly_investment=data.get('monthly_investment', 0),
        notes=data.get('notes', ''),
        status='active'
    )
    
    db.session.add(goal)
    db.session.commit()
    
    return jsonify({
        'message': '理财目标创建成功',
        'goal': goal.to_dict()
    }), 201


@bp.route('/goals/<int:goal_id>', methods=['GET'])
@token_required
def get_goal(goal_id):
    """获取单个理财目标详情"""
    goal = FinancialGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': '目标不存在'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': '无权访问'}), 403
    
    return jsonify({'goal': goal.to_dict()}), 200


@bp.route('/goals/<int:goal_id>', methods=['PUT'])
@token_required
def update_goal(goal_id):
    """更新理财目标"""
    goal = FinancialGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': '目标不存在'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': '无权访问'}), 403
    
    data = request.get_json()
    
    if data.get('name'):
        goal.name = data['name']
    if data.get('goal_type'):
        goal.goal_type = data['goal_type']
    if data.get('target_amount') is not None:
        goal.target_amount = data['target_amount']
    if data.get('current_amount') is not None:
        goal.current_amount = data['current_amount']
    if data.get('target_date'):
        goal.target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date()
    if data.get('risk_tolerance'):
        goal.risk_tolerance = data['risk_tolerance']
    if data.get('monthly_investment') is not None:
        goal.monthly_investment = data['monthly_investment']
    if data.get('notes') is not None:
        goal.notes = data['notes']
    if data.get('status'):
        goal.status = data['status']
    
    db.session.commit()
    
    return jsonify({
        'message': '理财目标更新成功',
        'goal': goal.to_dict()
    }), 200


@bp.route('/goals/<int:goal_id>', methods=['DELETE'])
@token_required
def delete_goal(goal_id):
    """删除理财目标"""
    goal = FinancialGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': '目标不存在'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': '无权访问'}), 403
    
    db.session.delete(goal)
    db.session.commit()
    
    return jsonify({'message': '理财目标删除成功'}), 200


# ============ AI生成投资方案 API ============

@bp.route('/goals/<int:goal_id>/generate-plan', methods=['POST'])
@token_required
def generate_plan(goal_id):
    """AI生成投资方案"""
    goal = FinancialGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': '目标不存在'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': '无权访问'}), 403
    
    # 获取或创建投资方案
    plan = goal.investment_plan
    if not plan:
        plan = InvestmentPlan(goal_id=goal_id)
        db.session.add(plan)
    
    # 计算投资周期（月）
    months = 12
    if goal.target_date:
        delta = goal.target_date - date.today()
        months = max(1, int(delta.days / 30))
    
    # 获取资产配置模板
    portfolio = PORTFOLIO_TEMPLATES.get(goal.risk_tolerance, PORTFOLIO_TEMPLATES['balanced'])
    
    # 计算预期收益率
    expected_return = calculate_expected_return(goal.risk_tolerance)
    
    # 计算预期最终金额
    expected_final = calculate_future_value(
        goal.current_amount,
        goal.monthly_investment,
        expected_return / 100,
        months
    )
    
    # 更新方案
    plan.portfolio_allocation = portfolio
    plan.expected_return = expected_return
    plan.expected_final_amount = expected_final
    plan.risk_level = get_risk_level(goal.risk_tolerance)
    plan.generated_by_ai = True
    
    # 生成风险评估 - 先删除旧的风险评估
    InvestmentRisk.query.filter_by(goal_id=goal_id).delete()
    
    # 根据风险偏好调整风险概率
    risk_adjustments = {
        'conservative': 0.6,
        'steady': 0.75,
        'balanced': 1.0,
        'aggressive': 1.3,
        'very_aggressive': 1.5
    }
    adjustment = risk_adjustments.get(goal.risk_tolerance, 1.0)
    
    for risk_type, risk_def in RISK_DEFINITIONS.items():
        risk = InvestmentRisk(
            goal_id=goal_id,
            risk_type=risk_type,
            risk_name=risk_def['name'],
            risk_probability=round(min(1.0, risk_def['probability'] * adjustment), 2),
            risk_impact=risk_def['impact'],
            risk_level='high' if risk_def['probability'] * adjustment > 0.7 else 'medium' if risk_def['probability'] * adjustment > 0.4 else 'low',
            mitigation_strategy=risk_def['mitigation']
        )
        db.session.add(risk)
    
    db.session.commit()
    
    return jsonify({
        'message': '投资方案生成成功',
        'plan': plan.to_dict(),
        'simulation': {
            'months': months,
            'expected_return': expected_return,
            'expected_final_amount': expected_final,
            'data_points': generate_simulation_data(
                goal.current_amount,
                goal.monthly_investment,
                expected_return / 100,
                months
            )
        }
    }), 200


@bp.route('/goals/<int:goal_id>/plan', methods=['GET'])
@token_required
def get_plan(goal_id):
    """获取投资方案"""
    goal = FinancialGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': '目标不存在'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': '无权访问'}), 403
    
    plan = goal.investment_plan
    
    if not plan:
        return jsonify({'error': '暂无投资方案，请先生成'}), 404
    
    # 计算投资周期（月）
    months = 12
    if goal.target_date:
        delta = goal.target_date - date.today()
        months = max(1, int(delta.days / 30))
    
    return jsonify({
        'plan': plan.to_dict(),
        'simulation': {
            'months': months,
            'expected_return': plan.expected_return,
            'expected_final_amount': plan.expected_final_amount,
            'data_points': generate_simulation_data(
                goal.current_amount,
                goal.monthly_investment,
                plan.expected_return / 100,
                months
            )
        }
    }), 200


# ============ 投资收益模拟 API ============

@bp.route('/goals/<int:goal_id>/simulate', methods=['POST'])
@token_required
def simulate(goal_id):
    """投资收益模拟计算"""
    goal = FinancialGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': '目标不存在'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': '无权访问'}), 403
    
    data = request.get_json() or {}
    
    # 模拟参数
    test_current = data.get('current_amount', goal.current_amount)
    test_monthly = data.get('monthly_investment', goal.monthly_investment)
    test_return = data.get('expected_return', calculate_expected_return(goal.risk_tolerance))
    test_months = data.get('months')
    
    # 如果没有指定月份，根据目标日期计算
    if not test_months and goal.target_date:
        delta = goal.target_date - date.today()
        test_months = max(1, int(delta.days / 30))
    else:
        test_months = test_months or 12
    
    # 计算预期最终金额
    expected_final = calculate_future_value(
        test_current,
        test_monthly,
        test_return / 100,
        test_months
    )
    
    # 生成模拟数据
    data_points = generate_simulation_data(test_current, test_monthly, test_return / 100, test_months)
    
    return jsonify({
        'simulation': {
            'initial_amount': test_current,
            'monthly_investment': test_monthly,
            'expected_return': test_return,
            'investment_period_months': test_months,
            'expected_final_amount': expected_final,
            'data_points': data_points
        }
    }), 200


# ============ 风险评估 API ============

@bp.route('/goals/<int:goal_id>/risks', methods=['GET'])
@token_required
def get_risks(goal_id):
    """获取风险评估"""
    goal = FinancialGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': '目标不存在'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': '无权访问'}), 403
    
    risks = InvestmentRisk.query.filter_by(goal_id=goal_id).all()
    
    # 计算综合风险评分
    overall_risk_score = 0
    if risks:
        weighted_sum = sum(r.risk_probability * r.risk_impact for r in risks)
        overall_risk_score = round(min(100, weighted_sum * 100), 2)
    
    # 风险矩阵
    risk_matrix = []
    for risk in risks:
        risk_matrix.append({
            'id': risk.id,
            'type': risk.risk_type,
            'name': risk.risk_name,
            'probability': risk.risk_probability * 100,
            'impact': risk.risk_impact * 100,
            'level': risk.risk_level,
            'mitigation': risk.mitigation_strategy
        })
    
    return jsonify({
        'risks': [r.to_dict() for r in risks],
        'risk_matrix': risk_matrix,
        'overall_risk_score': overall_risk_score,
        'risk_level': 'high' if overall_risk_score > 50 else 'medium' if overall_risk_score > 25 else 'low'
    }), 200


# ============ 市场洞察 API ============

@bp.route('/market-insights', methods=['GET'])
@token_required
def market_insights():
    """获取市场洞察（模拟数据）"""
    insights = {
        'stocks': {
            'current_trend': '震荡上行',
            'outlook': '建议适度配置',
            'historical_return': '10%',
            'volatility': '中等'
        },
        'bonds': {
            'current_trend': '收益率企稳',
            'outlook': '建议保持配置',
            'historical_return': '4%',
            'volatility': '低'
        },
        'funds': {
            'current_trend': '分化明显',
            'outlook': '建议精选优质基金',
            'historical_return': '8%',
            'volatility': '中等'
        },
        'cash': {
            'current_trend': '利率平稳',
            'outlook': '流动性管理必备',
            'historical_return': '2%',
            'volatility': '极低'
        },
        'tips': [
            '建议定期检视投资组合，根据市场变化适时调整',
            '分散投资可以有效降低非系统性风险',
            '长期坚持定投有助于平滑市场波动的影响',
            '应急基金建议保持3-6个月支出水平'
        ]
    }
    
    return jsonify({'insights': insights}), 200


# ============ 目标类型和风险偏好选项 ============

@bp.route('/options', methods=['GET'])
@token_required
def get_options():
    """获取理财目标类型和风险偏好选项"""
    return jsonify({
        'goal_types': [
            {'value': 'retirement', 'label': '退休养老', 'icon': '🏖️'},
            {'value': 'education', 'label': '子女教育', 'icon': '🎓'},
            {'value': 'housing', 'label': '购房首付', 'icon': '🏠'},
            {'value': 'wedding', 'label': '婚嫁储备', 'icon': '💒'},
            {'value': 'travel', 'label': '旅游基金', 'icon': '✈️'},
            {'value': 'emergency', 'label': '应急基金', 'icon': '🛡️'},
            {'value': 'freedom', 'label': '财务自由', 'icon': '💰'},
            {'value': 'other', 'label': '其他目标', 'icon': '🎯'}
        ],
        'risk_tolerances': [
            {'value': 'conservative', 'label': '保守型', 'description': '追求稳定收益，回避风险', 'expected_return': '3-5%'},
            {'value': 'steady', 'label': '稳健型', 'description': '在控制风险的前提下追求收益', 'expected_return': '5-7%'},
            {'value': 'balanced', 'label': '平衡型', 'description': '风险与收益平衡', 'expected_return': '7-10%'},
            {'value': 'aggressive', 'label': '进取型', 'description': '追求较高收益，能承受较大波动', 'expected_return': '10-15%'},
            {'value': 'very_aggressive', 'label': '激进型', 'description': '追求最大化收益，接受高波动', 'expected_return': '15%+'}
        ]
    }), 200
