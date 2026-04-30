"""
AI理财顾问对话路由
"""
from flask import Blueprint, request, jsonify, Response
from app import db
from app.models import AdvisorConversation, AdvisorMessage, FinancialGoal, User
from app.utils.auth import token_required
from app.services.advisor_service import chat_with_advisor, chat_with_advisor_stream
from flask import stream_with_context
import json

bp = Blueprint('advisor', __name__, url_prefix='/api/finance/advisor')


# ============ 对话会话管理 API ============

@bp.route('/conversations', methods=['GET'])
@token_required
def get_conversations():
    """获取用户所有对话列表"""
    conversations = AdvisorConversation.query.filter_by(
        user_id=request.user_id
    ).order_by(AdvisorConversation.updated_at.desc()).all()
    
    return jsonify({
        'conversations': [c.to_dict() for c in conversations]
    }), 200


@bp.route('/conversations', methods=['POST'])
@token_required
def create_conversation():
    """创建新对话"""
    data = request.get_json() or {}
    
    conversation = AdvisorConversation(
        user_id=request.user_id,
        title=data.get('title', '新对话')
    )
    
    db.session.add(conversation)
    db.session.commit()
    
    return jsonify({
        'message': '对话创建成功',
        'conversation': conversation.to_dict()
    }), 201


@bp.route('/conversations/<int:conversation_id>', methods=['GET'])
@token_required
def get_conversation(conversation_id):
    """获取单个对话详情"""
    conversation = AdvisorConversation.query.get(conversation_id)
    
    if not conversation:
        return jsonify({'error': '对话不存在'}), 404
    
    if conversation.user_id != request.user_id:
        return jsonify({'error': '无权访问'}), 403
    
    return jsonify({
        'conversation': conversation.to_dict()
    }), 200


@bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
@token_required
def delete_conversation(conversation_id):
    """删除对话"""
    conversation = AdvisorConversation.query.get(conversation_id)
    
    if not conversation:
        return jsonify({'error': '对话不存在'}), 404
    
    if conversation.user_id != request.user_id:
        return jsonify({'error': '无权访问'}), 403
    
    db.session.delete(conversation)
    db.session.commit()
    
    return jsonify({'message': '对话删除成功'}), 200


@bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
@token_required
def get_messages(conversation_id):
    """获取某个对话的所有消息"""
    conversation = AdvisorConversation.query.get(conversation_id)
    
    if not conversation:
        return jsonify({'error': '对话不存在'}), 404
    
    if conversation.user_id != request.user_id:
        return jsonify({'error': '无权访问'}), 403
    
    messages = AdvisorMessage.query.filter_by(
        conversation_id=conversation_id
    ).order_by(AdvisorMessage.created_at.asc()).all()
    
    return jsonify({
        'messages': [m.to_dict() for m in messages]
    }), 200


# ============ 对话聊天 API ============

@bp.route('/chat', methods=['POST'])
@token_required
def chat():
    """
    发送消息并获取AI回复（非流式）
    
    请求体: { "message": "...", "conversation_id": 可选 }
    """
    data = request.get_json()
    
    if not data or not data.get('message'):
        return jsonify({'error': '消息内容不能为空'}), 400
    
    user_message = data['message'].strip()
    conversation_id = data.get('conversation_id')
    
    if not user_message:
        return jsonify({'error': '消息内容不能为空'}), 400
    
    # 获取或创建对话
    if conversation_id:
        conversation = AdvisorConversation.query.get(conversation_id)
        if not conversation or conversation.user_id != request.user_id:
            return jsonify({'error': '对话不存在或无权访问'}), 404
    else:
        # 创建新对话
        conversation = AdvisorConversation(
            user_id=request.user_id,
            title=user_message[:50] + '...' if len(user_message) > 50 else user_message
        )
        db.session.add(conversation)
        db.session.commit()
    
    # 保存用户消息
    user_msg = AdvisorMessage(
        conversation_id=conversation.id,
        role='user',
        content=user_message
    )
    db.session.add(user_msg)
    
    # 更新对话标题（如果是新对话的第一条消息）
    if conversation.title.startswith('新对话') and conversation.message_count == 0:
        conversation.title = user_message[:50] + '...' if len(user_message) > 50 else user_message
    
    db.session.commit()
    
    # 获取历史消息用于上下文
    history_messages = AdvisorMessage.query.filter_by(
        conversation_id=conversation.id
    ).order_by(AdvisorMessage.created_at.asc()).all()
    
    messages_for_llm = [
        {"role": m.role, "content": m.content}
        for m in history_messages[:-1]  # 不包含刚添加的用户消息
    ]
    messages_for_llm.append({"role": "user", "content": user_message})
    
    # 调用LLM生成回复
    result = chat_with_advisor(request.user_id, messages_for_llm, conversation.id)
    
    # 保存AI回复
    assistant_msg = AdvisorMessage(
        conversation_id=conversation.id,
        role='assistant',
        content=result['content']
    )
    db.session.add(assistant_msg)
    conversation.updated_at = db.func.now()
    db.session.commit()
    
    return jsonify({
        'conversation_id': conversation.id,
        'conversation': conversation.to_dict(),
        'message': assistant_msg.to_dict()
    }), 200


@bp.route('/chat/stream', methods=['POST'])
@token_required
def chat_stream():
    """
    发送消息并获取AI回复（流式SSE）
    
    请求体: { "message": "...", "conversation_id": 可选 }
    """
    data = request.get_json()
    
    if not data or not data.get('message'):
        return jsonify({'error': '消息内容不能为空'}), 400
    
    user_message = data['message'].strip()
    conversation_id = data.get('conversation_id')
    
    if not user_message:
        return jsonify({'error': '消息内容不能为空'}), 400
    
    # 获取或创建对话
    if conversation_id:
        conversation = AdvisorConversation.query.get(conversation_id)
        if not conversation or conversation.user_id != request.user_id:
            return jsonify({'error': '对话不存在或无权访问'}), 404
    else:
        # 创建新对话
        conversation = AdvisorConversation(
            user_id=request.user_id,
            title=user_message[:50] + '...' if len(user_message) > 50 else user_message
        )
        db.session.add(conversation)
        db.session.commit()
    
    # 保存用户消息
    user_msg = AdvisorMessage(
        conversation_id=conversation.id,
        role='user',
        content=user_message
    )
    db.session.add(user_msg)
    
    # 更新对话标题
    if conversation.title.startswith('新对话') and conversation.message_count == 0:
        conversation.title = user_message[:50] + '...' if len(user_message) > 50 else user_message
    
    db.session.commit()
    
    # 获取历史消息用于上下文
    history_messages = AdvisorMessage.query.filter_by(
        conversation_id=conversation.id
    ).order_by(AdvisorMessage.created_at.asc()).all()
    
    messages_for_llm = [
        {"role": m.role, "content": m.content}
        for m in history_messages[:-1]
    ]
    messages_for_llm.append({"role": "user", "content": user_message})
    
    conversation_id_ref = conversation.id
    
    def generate():
        # 首先发送conversation_id
        yield f'data: {{"type": "conversation_id", "value": {conversation_id_ref}}}\n\n'
        
        # 流式调用LLM
        for chunk in chat_with_advisor_stream(request.user_id, messages_for_llm, conversation_id_ref):
            yield chunk
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )


@bp.route('/chat/stream-complete', methods=['POST'])
@token_required
def chat_stream_complete():
    """
    流式响应完成后，保存AI回复到数据库
    请求体: { "conversation_id": ..., "message": "..." }
    """
    data = request.get_json()
    
    if not data or not data.get('conversation_id') or not data.get('message'):
        return jsonify({'error': '参数不完整'}), 400
    
    conversation_id = data['conversation_id']
    message_content = data['message']
    
    conversation = AdvisorConversation.query.get(conversation_id)
    if not conversation or conversation.user_id != request.user_id:
        return jsonify({'error': '对话不存在或无权访问'}), 403
    
    # 保存AI回复
    assistant_msg = AdvisorMessage(
        conversation_id=conversation_id,
        role='assistant',
        content=message_content
    )
    db.session.add(assistant_msg)
    conversation.updated_at = db.func.now()
    db.session.commit()
    
    return jsonify({
        'message': assistant_msg.to_dict(),
        'conversation': conversation.to_dict()
    }), 200


# ============ 快捷问题 API ============

@bp.route('/quick-questions', methods=['GET'])
@token_required
def get_quick_questions():
    """获取快捷提问选项"""
    questions = [
        {
            'id': 1,
            'icon': '🎯',
            'title': '分析我的理财目标',
            'question': '请分析我当前的理财目标，给出优化建议'
        },
        {
            'id': 2,
            'icon': '📊',
            'title': '如何优化资产配置',
            'question': '如何优化我的资产配置比例？'
        },
        {
            'id': 3,
            'icon': '⚠️',
            'title': '风险评估建议',
            'question': '请评估我当前投资组合的风险，给出缓解建议'
        },
        {
            'id': 4,
            'icon': '💰',
            'title': '推荐定投策略',
            'question': '请推荐适合我的定投策略'
        }
    ]
    
    return jsonify({'quick_questions': questions}), 200


# ============ 用户上下文 API ============

@bp.route('/user-context', methods=['GET'])
@token_required
def get_user_context():
    """获取用户的理财上下文信息"""
    # 获取用户信息
    user = User.query.get(request.user_id)
    
    # 获取理财目标
    goals = FinancialGoal.query.filter_by(
        user_id=request.user_id,
        status='active'
    ).all()
    
    return jsonify({
        'user': user.to_dict() if user else None,
        'financial_goals': [g.to_dict() for g in goals],
        'total_target_amount': sum(g.target_amount for g in goals),
        'total_current_amount': sum(g.current_amount for g in goals)
    }), 200
