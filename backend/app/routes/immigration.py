from flask import Blueprint, request, jsonify
from app import db
from app.models import ImmigrationGoal, ImmigrationPlan, ImmigrationRisk, User
from app.utils.auth import token_required
from datetime import datetime

bp = Blueprint('immigration', __name__, url_prefix='/api/v1/immigration')

# ==================== Immigration Templates ====================
IMMIGRATION_TEMPLATES = {
    'canada_express_entry': {
        'name': '加拿大快速通道 (Express Entry)',
        'country': '加拿大',
        'type': '技术移民',
        'eligibility': [
            '年龄25-35岁（最佳年龄段）',
            '英语水平CLB 7级以上（雅思G类4个6分）',
            '本科及以上学历',
            '一年以上全职工作经验',
            'Express Entry评分达到460分以上',
            '无犯罪记录',
            '无重大疾病',
            '充足的安置资金'
        ],
        'process': [
            {'step': 1, 'title': '自我评估', 'duration': '1-2周', 'description': '评估是否符合Express Entry基本要求'},
            {'step': 2, 'title': '准备语言考试', 'duration': '1-3月', 'description': '参加雅思G类或TEF法语考试'},
            {'step': 3, 'title': '学历认证', 'duration': '2-4周', 'description': '进行WES或类似机构学历认证'},
            {'step': 4, 'title': '创建Express Entry账户', 'duration': '1周', 'description': '在IRCC官网创建账号并提交profile'},
            {'step': 5, 'title': '等待邀请', 'duration': '1-12月', 'description': '等待联邦发出邀请函(ITA)'},
            {'step': 6, 'title': '提交完整申请', 'duration': '6月', 'description': '在60天内提交完整材料'},
            {'step': 7, 'title': '体检和无犯罪证明', 'duration': '2-4周', 'description': '完成体检和公证无犯罪记录'},
            {'step': 8, 'title': '获得PR批准', 'duration': '1-2月', 'description': '获得永久居民确认函'}
        ],
        'documents': [
            '有效护照',
            '雅思/TEF成绩单',
            '学历证书及成绩单',
            '学历认证报告(WES)',
            '工作证明信',
            '推荐信',
            '工资单/银行流水',
            '无犯罪记录证明',
            '体检报告',
            '照片(符合IRCC规格)',
            '家属证明文件'
        ],
        'timeline': '12-18个月',
        'fees': {
            '政府费用': '1325加元',
            '语言考试': '300加元',
            '学历认证': '200-300加元',
            '体检': '150-300加元',
            '无犯罪公证': '100-200加元',
            '翻译公证费': '500-2000加元',
            '总计': '约25000-35000加元'
        }
    },
    'usa_eb1': {
        'name': '美国EB-1A杰出人才移民',
        'country': '美国',
        'type': '职业移民',
        'eligibility': [
            '获得国际认可的奖项（如诺贝尔奖、奥斯卡奖等）',
            '专业协会会员资格（需要国际级会员）',
            '主流媒体报道',
            '担任评委或裁判',
            '原创性贡献',
            '发表学术文章',
            '作品展出',
            '高收入证明',
            '商业成功证明'
        ],
        'process': [
            {'step': 1, 'title': '材料准备', 'duration': '2-4月', 'description': '收集证明杰出能力的材料'},
            {'step': 2, 'title': 'I-140申请', 'duration': '1-2周', 'description': '向USCIS提交I-140表格'},
            {'step': 3, 'title': '优先日期确认', 'duration': '1天', 'description': '确认你的优先日期'},
            {'step': 4, 'title': '排期等待', 'duration': '1-3年', 'description': '等待签证名额可用（当前无排期）'},
            {'step': 5, 'title': '身份调整或领事处理', 'duration': '6-12月', 'description': '在美国调整身份或在国内领事馆处理'},
            {'step': 6, 'title': '面试', 'duration': '1-2月', 'description': '领事馆面试'},
            {'step': 7, 'title': '获得绿卡', 'duration': '1月', 'description': '签证批准，获得永久居民身份'}
        ],
        'documents': [
            '奖项证书',
            '媒体报道材料',
            '专业会员证书',
            '推荐信（至少3-5封）',
            '发表的文章/作品',
            '原创贡献证明',
            '展览/演出资料',
            '收入证明',
            '护照',
            '出生证明',
            '婚姻状况证明'
        ],
        'timeline': '12-24个月',
        'fees': {
            'I-140申请费': '700美元',
            '体检费': '200-500美元',
            '指纹费': '85美元',
            '领事处理费': '345美元',
            '绿卡制作费': '220美元',
            '律师费': '5000-20000美元',
            '总计': '约10000-30000美元'
        }
    },
    'australia_skilled': {
        'name': '澳大利亚独立技术移民 (189)',
        'country': '澳大利亚',
        'type': '技术移民',
        'eligibility': [
            '年龄45岁以下',
            '英语水平达到Competent (雅思4个6分)',
            '职业在MLTSSL清单上',
            '通过职业评估',
            'EOI评分达到65分以上',
            '无犯罪记录',
            '身体健康'
        ],
        'process': [
            {'step': 1, 'title': '职业评估', 'duration': '1-3月', 'description': '选择合适的评估机构进行职业评估'},
            {'step': 2, 'title': '英语考试', 'duration': '1-2月', 'description': '参加雅思或PTE考试'},
            {'step': 3, 'title': 'EOI打分', 'duration': '1周', 'description': '在SkillSelect系统提交EOI'},
            {'step': 4, 'title': '等待邀请', 'duration': '3-12月', 'description': '等待移民局发出邀请'},
            {'step': 5, 'title': '提交签证申请', 'duration': '2月', 'description': '在60天内提交完整材料'},
            {'step': 6, 'title': '体检和补料', 'duration': '1-3月', 'description': '完成体检，可能需要补充材料'},
            {'step': 7, 'title': '下签', 'duration': '1-2月', 'description': '签证批准'}
        ],
        'documents': [
            '护照',
            '雅思/PTE成绩单',
            '学历证书及成绩单',
            '职业评估函',
            '工作证明',
            '推荐信',
            '工资单',
            '护照尺寸照片',
            '无犯罪证明',
            '体检报告',
            '技能证书（如有）'
        ],
        'timeline': '10-18个月',
        'fees': {
            '签证申请费': '4115澳元',
            '英语考试': '330澳元',
            '职业评估': '500-1500澳元',
            '体检': '300-400澳元',
            '无犯罪公证': '200-500澳元',
            '翻译公证': '500-1500澳元',
            '总计': '约7000-12000澳元'
        }
    },
    'portugal_golden': {
        'name': '葡萄牙黄金签证',
        'country': '葡萄牙',
        'type': '投资移民',
        'eligibility': [
            '年满18周岁',
            '无犯罪记录',
            '购买50万欧元以上房产，或35万欧元以上翻新房产',
            '或投资35万欧元以上基金',
            '或创造10个就业岗位',
            '购买私人健康保险',
            '在葡萄牙开设银行账户'
        ],
        'process': [
            {'step': 1, 'title': '初步评估', 'duration': '1-2周', 'description': '评估是否符合投资要求'},
            {'step': 2, 'title': '办理申根签证', 'duration': '2-4周', 'description': '以旅游/商务目的入境葡萄牙'},
            {'step': 3, 'title': '开设银行账户', 'duration': '2-4周', 'description': '在葡萄牙开设银行账户'},
            {'step': 4, 'title': '进行投资', 'duration': '2-4周', 'description': '完成房产购买或基金投资'},
            {'step': 5, 'title': '准备申请材料', 'duration': '2-4周', 'description': '准备所有必要文件'},
            {'step': 6, 'title': '提交申请', 'duration': '1天', 'description': '在葡萄牙移民局提交申请'},
            {'step': 7, 'title': '采集生物信息', 'duration': '1天', 'description': '预约采集指纹和照片'},
            {'step': 8, 'title': '获得黄金签证', 'duration': '2-4月', 'description': '审批通过，获得居留许可'}
        ],
        'documents': [
            '有效护照',
            '无犯罪记录证明',
            '健康保险证明',
            '投资证明文件',
            '房产契约/基金证明',
            '银行资金证明',
            '葡萄牙税务号(NIF)',
            '葡萄牙银行账户',
            '照片(符合规格)',
            '申请表格'
        ],
        'timeline': '6-12个月',
        'fees': {
            '房产最低投资': '50万欧元（或35万翻新房产）',
            '基金管理费': '0.5-1%年费',
            '律师费': '5000-15000欧元',
            '政府申请费': '5334欧元',
            '健康保险': '500-1500欧元/年',
            '黄金签证续签费': '2666欧元/年',
            '总计': '约60-80万欧元（含投资）'
        }
    },
    'nz_skilled': {
        'name': '新西兰技术移民 (Skilled Migrant)',
        'country': '新西兰',
        'type': '技术移民',
        'eligibility': [
            '年龄55岁以下',
            '英语水平达到雅思6.5分',
            '有新西兰雇主担保，或160分以上',
            '符合健康和无犯罪要求',
            '学士学位或以上',
            '2年以上相关工作经验'
        ],
        'process': [
            {'step': 1, 'title': 'EOI打分', 'duration': '1周', 'description': '提交Expression of Interest，160分以上获邀'},
            {'step': 2, 'title': '获得邀请函', 'duration': '2-6周', 'description': '移民局发出ITA'},
            {'step': 3, 'title': '准备材料', 'duration': '4-6周', 'description': '准备完整的申请材料'},
            {'step': 4, 'title': '提交申请', 'duration': '1天', 'description': '提交技术移民申请'},
            {'step': 5, 'title': '等待审批', 'duration': '12-18月', 'description': '漫长的等待期'},
            {'step': 6, 'title': '批准并定居', 'duration': '1-2月', 'description': '获得居留签证，安排登陆'}
        ],
        'documents': [
            '护照',
            '雅思成绩单',
            '学历证书及认证',
            '工作证明',
            '工资单',
            '无犯罪记录证明',
            '体检报告',
            '照片',
            '技能证书'
        ],
        'timeline': '15-24个月',
        'fees': {
            'EOI申请费': '530NZD',
            '签证申请费': '3090NZD',
            '英语考试': '385NZD',
            '学历认证': '700-1000NZD',
            '体检': '250-400NZD',
            '总计': '约5500-7000NZD'
        }
    },
    'uk_innovator': {
        'name': '英国创新签证 (Innovator Founder)',
        'country': '英国',
        'type': '创业移民',
        'eligibility': [
            '年满18周岁',
            '英语水平B2级（雅思4个5.5分）或以上',
            '投资至少5万英镑于英国企业',
            '获得英国认可机构背书',
            '有足够的生活资金',
            '无犯罪记录',
            '肺结核检测证明'
        ],
        'process': [
            {'step': 1, 'title': '准备商业计划', 'duration': '2-4周', 'description': '准备详细的商业计划书'},
            {'step': 2, 'title': '申请背书', 'duration': '2-4周', 'description': '从英国认可机构获得背书信'},
            {'step': 3, 'title': '准备材料', 'duration': '2-4周', 'description': '准备所有申请材料'},
            {'step': 4, 'title': '提交申请', 'duration': '3周', 'description': '在英国移民局官网提交申请'},
            {'step': 5, 'title': '前往英国', 'duration': '1天', 'description': '获得签证后前往英国'},
            {'step': 6, 'title': '开展业务', 'duration': '3年', 'description': '在英国创立并运营企业'},
            {'step': 7, 'title': '申请永居', 'duration': '6-12月', 'description': '满足条件后申请永久居留'}
        ],
        'documents': [
            '有效护照',
            '商业计划书',
            '背书信',
            '投资资金证明',
            '英语水平证明',
            '生活资金证明',
            '无犯罪记录证明',
            '肺结核检测证明',
            '学历证明',
            '地址证明'
        ],
        'timeline': '3年（转永居）',
        'fees': {
            '背书申请费': '1000-5000英镑',
            '签证申请费': '1191英镑',
            '医疗附加费': '624英镑/年',
            '英语考试': '150英镑',
            '律师费': '3000-10000英镑',
            '生活资金': '1270英镑',
            '总计': '约10-20万英镑（含投资）'
        }
    }
}

def get_template_key(country, immigration_type):
    """根据国家和移民类型获取模板key"""
    country_map = {
        '加拿大': 'canada_express_entry',
        '美国': 'usa_eb1',
        '澳大利亚': 'australia_skilled',
        '葡萄牙': 'portugal_golden',
        '西班牙': 'portugal_golden',
        '希腊': 'portugal_golden',
        '新西兰': 'nz_skilled',
        '英国': 'uk_innovator'
    }
    return country_map.get(country, 'canada_express_entry')

def generate_plan_data(goal):
    """根据目标生成移民方案"""
    template_key = get_template_key(goal.target_country, goal.immigration_type)
    template = IMMIGRATION_TEMPLATES.get(template_key, IMMIGRATION_TEMPLATES['canada_express_entry'])
    
    plan_data = {
        'immigration_type': goal.immigration_type,
        'target_country': goal.target_country,
        'template_name': template['name'],
        'eligibility': template['eligibility'],
        'process': template['process'],
        'documents': template['documents'],
        'timeline': template['timeline'],
        'fees': template['fees'],
        'notes': f"本方案基于{goal.target_country}{goal.immigration_type}标准流程生成，实际费用和时间可能因个人情况有所差异。"
    }
    
    return plan_data

def generate_risks(goal):
    """根据目标生成风险评估"""
    risks = []
    
    # 政策风险
    risks.append({
        'risk_type': 'policy',
        'risk_level': 'medium',
        'risk_description': f'{goal.target_country}的移民政策可能随时调整，影响申请结果',
        'mitigation_suggestion': '建议密切关注移民局政策动态，提前准备好所有材料，以便在政策变化时快速调整策略'
    })
    
    # 时间风险
    risks.append({
        'risk_type': 'timeline',
        'risk_level': 'medium',
        'risk_description': '移民申请周期较长，可能受排期、审批速度等因素影响',
        'mitigation_suggestion': '制定灵活的时间计划，留有足够的缓冲时间，同时保持申请材料的实时更新'
    })
    
    # 材料风险
    risks.append({
        'risk_type': 'documents',
        'risk_level': 'low',
        'risk_description': '材料准备不完整或不符合要求可能导致申请被拒',
        'mitigation_suggestion': '提前了解所需材料清单，建议寻求专业顾问帮助审核材料'
    })
    
    # 资金风险
    if goal.budget and goal.budget < 30000:
        risks.append({
            'risk_type': 'financial',
            'risk_level': 'high',
            'risk_description': '预算可能不足以覆盖所有移民相关费用',
            'mitigation_suggestion': '建议增加预算储备，预留20%的额外费用以应对意外开支'
        })
    else:
        risks.append({
            'risk_type': 'financial',
            'risk_level': 'low',
            'risk_description': '预算充足，但仍需注意费用管理的风险',
            'mitigation_suggestion': '制定详细的费用预算表，分阶段支付各项费用'
        })
    
    # 语言风险
    risks.append({
        'risk_type': 'language',
        'risk_level': 'medium',
        'risk_description': '语言成绩不达标可能影响申请评分或直接被拒',
        'mitigation_suggestion': '提前准备语言考试，建议参加专业培训课程，目标分数应高于最低要求'
    })
    
    return risks


# ==================== API Routes ====================

@bp.route('/goals', methods=['GET'])
@token_required
def get_goals():
    """获取用户所有移民目标"""
    status = request.args.get('status')
    
    query = ImmigrationGoal.query.filter_by(user_id=request.user_id)
    
    if status:
        query = query.filter_by(current_status=status)
    
    goals = query.order_by(ImmigrationGoal.created_at.desc()).all()
    
    return jsonify({'goals': [g.to_dict() for g in goals]}), 200


@bp.route('/goals', methods=['POST'])
@token_required
def create_goal():
    """创建移民目标"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    if not data.get('target_country'):
        return jsonify({'error': 'Target country is required'}), 400
    
    if not data.get('immigration_type'):
        return jsonify({'error': 'Immigration type is required'}), 400
    
    goal = ImmigrationGoal(
        user_id=request.user_id,
        target_country=data['target_country'],
        immigration_type=data['immigration_type'],
        current_status=data.get('current_status', 'planning'),
        target_date=datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data.get('target_date') else None,
        budget=float(data['budget']) if data.get('budget') else 0,
        notes=data.get('notes', '')
    )
    
    db.session.add(goal)
    db.session.commit()
    
    return jsonify({
        'message': 'Immigration goal created successfully',
        'goal': goal.to_dict()
    }), 201


@bp.route('/goals/<int:goal_id>', methods=['GET'])
@token_required
def get_goal(goal_id):
    """获取单个移民目标详情"""
    goal = ImmigrationGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify({'goal': goal.to_dict()}), 200


@bp.route('/goals/<int:goal_id>', methods=['PUT'])
@token_required
def update_goal(goal_id):
    """更新移民目标"""
    goal = ImmigrationGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if data.get('target_country'):
        goal.target_country = data['target_country']
    if data.get('immigration_type'):
        goal.immigration_type = data['immigration_type']
    if data.get('current_status'):
        goal.current_status = data['current_status']
    if data.get('target_date'):
        goal.target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date()
    if data.get('budget') is not None:
        goal.budget = float(data['budget'])
    if data.get('notes') is not None:
        goal.notes = data['notes']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Goal updated successfully',
        'goal': goal.to_dict()
    }), 200


@bp.route('/goals/<int:goal_id>', methods=['DELETE'])
@token_required
def delete_goal(goal_id):
    """删除移民目标"""
    goal = ImmigrationGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(goal)
    db.session.commit()
    
    return jsonify({'message': 'Goal deleted successfully'}), 200


@bp.route('/goals/<int:goal_id>/generate-plan', methods=['POST'])
@token_required
def generate_plan(goal_id):
    """生成移民方案"""
    goal = ImmigrationGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # 检查是否已有方案
    existing_plan = ImmigrationPlan.query.filter_by(goal_id=goal_id).first()
    
    # 生成方案数据
    plan_data = generate_plan_data(goal)
    
    if existing_plan:
        existing_plan.plan_data = plan_data
        existing_plan.updated_at = datetime.utcnow()
        plan = existing_plan
    else:
        plan = ImmigrationPlan(
            goal_id=goal_id,
            plan_data=plan_data
        )
        db.session.add(plan)
    
    # 生成风险评估
    risk_data = generate_risks(goal)
    
    # 删除旧的风险评估
    ImmigrationRisk.query.filter_by(goal_id=goal_id).delete()
    
    # 添加新的风险评估
    for risk in risk_data:
        new_risk = ImmigrationRisk(
            goal_id=goal_id,
            risk_type=risk['risk_type'],
            risk_level=risk['risk_level'],
            risk_description=risk['risk_description'],
            mitigation_suggestion=risk['mitigation_suggestion']
        )
        db.session.add(new_risk)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Plan generated successfully',
        'plan': plan.to_dict(),
        'risks': [r.to_dict() for r in ImmigrationRisk.query.filter_by(goal_id=goal_id).all()]
    }), 200


@bp.route('/goals/<int:goal_id>/plan', methods=['GET'])
@token_required
def get_plan(goal_id):
    """获取移民方案"""
    goal = ImmigrationGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    plan = ImmigrationPlan.query.filter_by(goal_id=goal_id).first()
    
    if not plan:
        return jsonify({'error': 'Plan not found. Please generate a plan first.'}), 404
    
    return jsonify({'plan': plan.to_dict()}), 200


@bp.route('/goals/<int:goal_id>/risks', methods=['GET'])
@token_required
def get_risks(goal_id):
    """获取风险评估"""
    goal = ImmigrationGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    risks = ImmigrationRisk.query.filter_by(goal_id=goal_id).all()
    
    return jsonify({'risks': [r.to_dict() for r in risks]}), 200


@bp.route('/goals/<int:goal_id>/risks', methods=['POST'])
@token_required
def update_risks(goal_id):
    """更新风险评估"""
    goal = ImmigrationGoal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('risks'):
        return jsonify({'error': 'Risks data is required'}), 400
    
    # 删除旧的风险评估
    ImmigrationRisk.query.filter_by(goal_id=goal_id).delete()
    
    # 添加新的风险评估
    for risk in data['risks']:
        new_risk = ImmigrationRisk(
            goal_id=goal_id,
            risk_type=risk['risk_type'],
            risk_level=risk['risk_level'],
            risk_description=risk['risk_description'],
            mitigation_suggestion=risk.get('mitigation_suggestion', '')
        )
        db.session.add(new_risk)
    
    db.session.commit()
    
    risks = ImmigrationRisk.query.filter_by(goal_id=goal_id).all()
    
    return jsonify({
        'message': 'Risks updated successfully',
        'risks': [r.to_dict() for r in risks]
    }), 200


@bp.route('/templates', methods=['GET'])
@token_required
def get_templates():
    """获取所有移民方案模板"""
    return jsonify({'templates': IMMIGRATION_TEMPLATES}), 200
