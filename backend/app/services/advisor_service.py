"""
AI理财顾问服务 - LLM集成模块
"""
import os
from flask import current_app
from openai import OpenAI


def get_openai_client():
    """获取OpenAI客户端"""
    api_key = current_app.config.get('LLM_API_KEY')
    base_url = current_app.config.get('LLM_BASE_URL', 'https://api.openai.com/v1')
    
    if not api_key:
        return None
    
    return OpenAI(api_key=api_key, base_url=base_url)


def build_system_prompt(user_id, user_context=None):
    """
    构建系统提示词，包含用户的理财目标、预算、习惯等上下文信息
    
    Args:
        user_id: 用户ID
        user_context: 额外的用户上下文信息（可选）
    
    Returns:
        str: 构建好的系统提示词
    """
    from app.models import User, FinancialGoal, InvestmentPlan, Budget
    
    try:
        user = User.query.get(user_id)
        if not user:
            user_name = "用户"
            financial_goals = []
            budgets = []
        else:
            user_name = user.name
            financial_goals = FinancialGoal.query.filter_by(user_id=user_id, status='active').all()
            budgets = Budget.query.filter_by(user_id=user_id).all()
        
        # 构建用户上下文摘要
        goals_summary = ""
        if financial_goals:
            goals_summary = "\n用户当前的理财目标：\n"
            for goal in financial_goals:
                risk_labels = {
                    'conservative': '保守型',
                    'steady': '稳健型',
                    'balanced': '平衡型',
                    'aggressive': '进取型',
                    'very_aggressive': '激进型'
                }
                goal_type_labels = {
                    'retirement': '退休养老',
                    'education': '子女教育',
                    'housing': '购房首付',
                    'wedding': '婚嫁储备',
                    'travel': '旅游基金',
                    'emergency': '应急基金',
                    'freedom': '财务自由',
                    'other': '其他目标'
                }
                goals_summary += f"- {goal.name}（{goal_type_labels.get(goal.goal_type, goal.goal_type)}）\n"
                goals_summary += f"  目标金额：¥{goal.target_amount:,.0f}，当前金额：¥{goal.current_amount:,.0f}\n"
                goals_summary += f"  每月定投：¥{goal.monthly_investment:,.0f}，风险偏好：{risk_labels.get(goal.risk_tolerance, goal.risk_tolerance)}\n"
                if goal.target_date:
                    goals_summary += f"  目标日期：{goal.target_date}\n"
        
        # 预算摘要
        budget_summary = ""
        if budgets:
            budget_summary = "\n用户的预算情况：\n"
            for budget in budgets[:3]:  # 只取前3个
                budget_summary += f"- {budget.name}：预算¥{budget.total_amount:,.0f}\n"
        
        # 额外上下文
        extra_context = ""
        if user_context:
            extra_context = f"\n当前对话上下文：{user_context}\n"
        
        system_prompt = f"""你是「理财规划师小慧」，一位专业、亲切的AI理财顾问，帮助用户实现财务目标。

## 关于你
- 你是LifePlanning应用的智能理财顾问
- 你擅长投资分析、风险评估、资产配置和财务规划
- 你用通俗易懂的语言解释金融概念，避免过度使用专业术语
- 你的风格专业但亲切，像朋友一样与用户交流

## 回复规范
1. **专业可靠**：提供基于数据的分析和建议
2. **通俗易懂**：用生活化的例子解释复杂概念
3. **实用导向**：给出具体可操作的建议
4. **因人而异**：根据用户的具体情况提供个性化建议
5. **温和提醒**：在适当时候提醒风险，但不制造焦虑

## 安全边界
- ⚠️ 声明你不是持牌投资顾问，建议仅供参考
- ⚠️ 对于重大财务决策，建议咨询专业金融顾问
- ⚠️ 不预测具体股票或基金的短期价格
- ⚠️ 不保证任何投资回报

## 用户信息
你好，{user_name}！{goals_summary}{budget_summary}{extra_context}
请根据以上信息提供个性化的理财建议。

开始对话吧！有什么关于理财的问题都可以问我～"""

        return system_prompt
        
    except Exception as e:
        # 如果获取用户信息失败，返回基础提示词
        return """你是「理财规划师小慧」，一位专业、亲切的AI理财顾问。

你是LifePlanning应用的智能理财顾问，帮助用户实现财务目标。你擅长投资分析、风险评估、资产配置和财务规划。

回复规范：
1. 专业可靠：提供基于数据的分析和建议
2. 通俗易懂：用生活化的例子解释复杂概念
3. 实用导向：给出具体可操作的建议

安全边界：
- 声明你不是持牌投资顾问，建议仅供参考
- 对于重大财务决策，建议咨询专业金融顾问
- 不预测具体股票或基金的短期价格
- 不保证任何投资回报

请友好地与用户开始对话！"""


def chat_with_advisor(user_id, messages, conversation_id=None):
    """
    调用LLM生成回复
    
    Args:
        user_id: 用户ID
        messages: 消息列表，格式为 [{"role": "user"/"assistant", "content": "..."}]
        conversation_id: 对话ID（可选）
    
    Returns:
        dict: {"content": "回复内容", "finish_reason": "stop"/"length"}
    """
    client = get_openai_client()
    
    if not client:
        return {
            "content": "抱歉，AI顾问服务暂不可用。请联系管理员配置API密钥。",
            "finish_reason": "stop"
        }
    
    try:
        # 构建完整的消息列表
        system_prompt = build_system_prompt(user_id)
        
        full_messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # 添加历史消息（限制最近10条，避免上下文过长）
        history_messages = messages[-10:] if messages else []
        full_messages.extend(history_messages)
        
        # 调用LLM
        response = client.chat.completions.create(
            model=current_app.config.get('LLM_MODEL', 'gpt-3.5-turbo'),
            messages=full_messages,
            temperature=current_app.config.get('LLM_TEMPERATURE', 0.7),
            max_tokens=current_app.config.get('LLM_MAX_TOKENS', 2000)
        )
        
        choice = response.choices[0]
        return {
            "content": choice.message.content,
            "finish_reason": choice.finish_reason
        }
        
    except Exception as e:
        return {
            "content": f"抱歉，服务暂时遇到问题。请稍后再试。错误信息：{str(e)}",
            "finish_reason": "error"
        }


def chat_with_advisor_stream(user_id, messages, conversation_id=None):
    """
    调用LLM生成回复（流式）
    
    Args:
        user_id: 用户ID
        messages: 消息列表
        conversation_id: 对话ID（可选）
    
    Yields:
        str: SSE格式的数据块
    """
    client = get_openai_client()
    
    if not client:
        yield 'data: {"content": "抱歉，AI顾问服务暂不可用。请联系管理员配置API密钥。", "done": true}\n\n'
        return
    
    try:
        # 构建完整的消息列表
        system_prompt = build_system_prompt(user_id)
        
        full_messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # 添加历史消息
        history_messages = messages[-10:] if messages else []
        full_messages.extend(history_messages)
        
        # 流式调用LLM
        stream = client.chat.completions.create(
            model=current_app.config.get('LLM_MODEL', 'gpt-3.5-turbo'),
            messages=full_messages,
            temperature=current_app.config.get('LLM_TEMPERATURE', 0.7),
            max_tokens=current_app.config.get('LLM_MAX_TOKENS', 2000),
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                # SSE格式
                yield f'data: {{"content": {repr(content)[1:-1]}}}\n\n'
        
        # 发送完成信号
        yield 'data: {"done": true}\n\n'
        
    except Exception as e:
        yield f'data: {{"content": "抱歉，服务暂时遇到问题。请稍后再试。", "error": "{str(e)}", "done": true}}\n\n'
